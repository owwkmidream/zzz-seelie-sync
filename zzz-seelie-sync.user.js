// ==UserScript==
// @name         ZZZ Seelie 数据同步
// @namespace    github.com/owwkmidream
// @version      2.2.5
// @author       owwkmidream
// @description  绝区零 Seelie 网站数据同步脚本
// @license      MIT
// @icon         https://zzz.seelie.me/img/logo.svg
// @homepageURL  https://github.com/owwkmidream/zzz-seelie-sync
// @supportURL   https://github.com/owwkmidream/zzz-seelie-sync/issues
// @downloadURL  https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.user.js
// @updateURL    https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.meta.js
// @match        https://zzz.seelie.me/*
// @require      https://fastly.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js
// @connect      act-api-takumi.mihoyo.com
// @connect      api-takumi-record.mihoyo.com
// @connect      public-data-api.mihoyo.com
// @connect      api-takumi.mihoyo.com
// @connect      passport-api.mihoyo.com
// @grant        GM.cookie
// @grant        GM.deleteValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// ==/UserScript==

(function (QRCode) {
  'use strict';

  function _interopNamespaceDefault(e) {
    const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
    if (e) {
      for (const k in e) {
        if (k !== 'default') {
          const d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: () => e[k]
          });
        }
      }
    }
    n.default = e;
    return Object.freeze(n);
  }

  const QRCode__namespace = /*#__PURE__*/_interopNamespaceDefault(QRCode);

  class Logger {
    prefix;
    timestamp;
    showLocation;
    colors;
    fileColorMap = /* @__PURE__ */ new Map();
    onceKeys = /* @__PURE__ */ new Set();
    constructor(options = {}) {
      this.prefix = options.prefix || "[zzz-seelie-sync]";
      this.timestamp = options.timestamp ?? true;
      this.showLocation = options.showLocation ?? true;
      this.colors = {
        log: "#333333",
        info: "#2196F3",
        warn: "#FF9800",
        error: "#F44336",
        debug: "#9C27B0",
        ...options.colors
      };
    }
    /**
     * 生成随机颜色
     */
    generateRandomColor() {
      const colors = [
        "#E91E63",
        "#9C27B0",
        "#673AB7",
        "#3F51B5",
        "#2196F3",
        "#03A9F4",
        "#00BCD4",
        "#009688",
        "#4CAF50",
        "#8BC34A",
        "#CDDC39",
        "#FFC107",
        "#FF9800",
        "#FF5722",
        "#795548",
        "#607D8B",
        "#E53935",
        "#D81B60",
        "#8E24AA",
        "#5E35B1"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
    /**
     * 获取文件颜色（为每个文件分配固定的随机颜色）
     */
    getFileColor(fileName) {
      if (!this.fileColorMap.has(fileName)) {
        this.fileColorMap.set(fileName, this.generateRandomColor());
      }
      return this.fileColorMap.get(fileName);
    }
    /**
     * 获取调用位置信息
     */
    getLocationInfo() {
      try {
        const stack = new Error().stack;
        if (!stack) return null;
        const lines = stack.split("\n");
        for (let i = 3; i < Math.min(lines.length, 8); i++) {
          const targetLine = lines[i];
          if (!targetLine) continue;
          if (targetLine.includes("Logger.") || targetLine.includes("formatMessage") || targetLine.includes("getLocationInfo")) {
            continue;
          }
          const patterns = [
            /at.*?\((.+):(\d+):(\d+)\)/,
            // Chrome with function name
            /at\s+(.+):(\d+):(\d+)/,
            // Chrome without function name
            /@(.+):(\d+):(\d+)/,
            // Firefox/Safari
            /(.+):(\d+):(\d+)$/
            // Fallback pattern
          ];
          for (const pattern of patterns) {
            const match = targetLine.match(pattern);
            if (match) {
              const fullPath = match[1];
              const lineNumber = parseInt(match[2], 10);
              const columnNumber = parseInt(match[3], 10);
              if (!fullPath || fullPath.includes("chrome-extension://") || fullPath.includes("moz-extension://")) {
                continue;
              }
              const fileName = fullPath.split("/").pop() || fullPath.split("\\").pop() || fullPath;
              if (fileName && !isNaN(lineNumber) && !isNaN(columnNumber)) {
                return {
                  fileName,
                  lineNumber,
                  columnNumber
                };
              }
            }
          }
        }
        return null;
      } catch {
        return null;
      }
    }
    formatMessage(level, color, ...args) {
      const timestamp = this.timestamp ? `[${(/* @__PURE__ */ new Date()).toLocaleTimeString()}]` : "";
      const location = this.showLocation ? this.getLocationInfo() : null;
      let prefix = `${timestamp} ${this.prefix} [${level.toUpperCase()}]`;
      let locationStr = "";
      let locationColor = "";
      if (location) {
        locationStr = ` [${location.fileName}:${location.lineNumber}]`;
        locationColor = this.getFileColor(location.fileName);
      }
      if (typeof window !== "undefined") {
        if (location) {
          return [
            `%c${prefix}%c${locationStr}`,
            `color: ${color}; font-weight: bold;`,
            `color: ${locationColor}; font-weight: bold; font-style: italic;`,
            ...args
          ];
        } else {
          return [
            `%c${prefix}`,
            `color: ${color}; font-weight: bold;`,
            ...args
          ];
        }
      }
      return [prefix + locationStr, ...args];
    }
    /**
     * 普通日志输出
     */
    log(...args) {
      console.log(...this.formatMessage("log", this.colors.log, ...args));
    }
    /**
     * 信息日志输出
     */
    info(...args) {
      console.info(...this.formatMessage("info", this.colors.info, ...args));
    }
    /**
     * 警告日志输出
     */
    warn(...args) {
      console.warn(...this.formatMessage("warn", this.colors.warn, ...args));
    }
    /**
     * 仅输出一次的警告日志
     */
    warnOnce(key, ...args) {
      if (this.onceKeys.has(key)) {
        return;
      }
      this.onceKeys.add(key);
      this.warn(...args);
    }
    /**
     * 错误日志输出
     */
    error(...args) {
      console.error(...this.formatMessage("error", this.colors.error, ...args));
    }
    /**
     * 调试日志输出 (仅在开发环境下输出)
     */
    debug(...args) {
    }
    /**
     * 表格输出
     */
    table(data, columns) {
      if (this.timestamp || this.prefix) {
        this.info("Table data:");
      }
      console.table(data, columns);
    }
    /**
     * 分组开始
     */
    group(label) {
      const formattedLabel = label ? this.formatMessage("group", this.colors.info, label)[2] : void 0;
      console.group(formattedLabel);
    }
    /**
     * 折叠分组开始
     */
    groupCollapsed(label) {
      const formattedLabel = label ? this.formatMessage("group", this.colors.info, label)[2] : void 0;
      console.groupCollapsed(formattedLabel);
    }
    /**
     * 分组结束
     */
    groupEnd() {
      console.groupEnd();
    }
    /**
     * 计时开始
     */
    time(label) {
      console.time(label);
    }
    /**
     * 计时结束
     */
    timeEnd(label) {
      console.timeEnd(label);
    }
    /**
     * 清空控制台
     */
    clear() {
      console.clear();
    }
    /**
     * 创建子 Logger 实例
     */
    createChild(childPrefix, options) {
      const childLogger = new Logger({
        prefix: `${this.prefix}:${childPrefix}`,
        timestamp: this.timestamp,
        showLocation: this.showLocation,
        colors: this.colors,
        ...options
      });
      childLogger.fileColorMap = this.fileColorMap;
      childLogger.onceKeys = this.onceKeys;
      return childLogger;
    }
  }
  const logger = new Logger({
    prefix: "[Seelie]",
    timestamp: true,
    showLocation: true,
    colors: {
      log: "#4CAF50",
      info: "#2196F3",
      warn: "#FF9800",
      error: "#F44336",
      debug: "#9C27B0"
    }
  });
  logger.log.bind(logger);
  logger.info.bind(logger);
  logger.warn.bind(logger);
  logger.error.bind(logger);
  let pendingHooks = [];
  let routerObserver = null;
  let isObserving = false;
  let missingVueAppLogged = false;
  let missingRouterLogged = false;
  function isVueRouter(value) {
    if (!value || typeof value !== "object") return false;
    const potentialRouter = value;
    return typeof potentialRouter.afterEach === "function" && typeof potentialRouter.beforeEach === "function" && typeof potentialRouter.push === "function";
  }
  function findVueRouter() {
    const appElement = document.querySelector("#app");
    if (!appElement?.__vue_app__) {
      if (!missingVueAppLogged) {
        logger.debug("🔍 未找到 Vue App 实例，可能还在加载中...");
        missingVueAppLogged = true;
      }
      return null;
    }
    missingVueAppLogged = false;
    logger.debug("🔍 查找 Vue Router 实例...");
    const router = appElement.__vue_app__.config?.globalProperties?.$router;
    if (router) {
      if (typeof router.afterEach === "function" && typeof router.beforeEach === "function" && typeof router.push === "function") {
        logger.info("✓ 从 __vue_app__.config.globalProperties.$router 找到 Router 实例");
        logger.debug("Router 实例:", router);
        missingRouterLogged = false;
        return router;
      }
    }
    const context = appElement.__vue_app__._context;
    if (context?.provides) {
      logger.debug("🔍 尝试从 provides 查找 Router...");
      const provides = context.provides;
      const symbols = Object.getOwnPropertySymbols(provides);
      for (const symbol of symbols) {
        const value = provides[symbol];
        if (isVueRouter(value)) {
          logger.info("✓ 从 provides 找到 Router 实例:", symbol.toString());
          logger.debug("Router 实例:", value);
          missingRouterLogged = false;
          return value;
        }
      }
    }
    if (!missingRouterLogged) {
      logger.debug("🔍 未找到 Vue Router 实例，可能还在初始化中...");
      missingRouterLogged = true;
    }
    return null;
  }
  function stopRouterObserver() {
    if (routerObserver) {
      routerObserver.disconnect();
      routerObserver = null;
    }
    isObserving = false;
  }
  function startRouterObserver() {
    const timeout = 3e3;
    if (isObserving || routerObserver) {
      return;
    }
    logger.debug("👀 启动 Vue Router 观察器...");
    isObserving = true;
    routerObserver = new MutationObserver(() => {
      const router = findVueRouter();
      if (router) {
        logger.info("✓ Vue Router 已加载，处理待注册的 Hook...");
        stopRouterObserver();
        processPendingHooks(router);
      }
    });
    routerObserver.observe(document.querySelector("#app"), {
      childList: false,
      subtree: false,
      attributes: true
    });
    setTimeout(() => {
      if (isObserving) {
        logger.warn("⚠️ Vue Router 观察器超时，停止观察");
        stopRouterObserver();
        processPendingHooks(null);
      }
    }, timeout);
  }
  function processPendingHooks(router) {
    logger.debug(`🔄 处理 ${pendingHooks.length} 个待注册的 Hook...`);
    const hooks = [...pendingHooks];
    pendingHooks = [];
    hooks.forEach(({ callback, options, unwatchRef }) => {
      if (router) {
        const { unwatch } = registerRouterHook(router, callback, options);
        unwatchRef.current = unwatch;
      } else {
        logger.warn("⚠️ Vue Router 未找到，Hook 注册失败");
        unwatchRef.current = () => {
        };
      }
    });
  }
  function registerRouterHook(router, callback, options) {
    const { delay = 100, immediate = false } = options;
    if (immediate) {
      setTimeout(() => {
        const currentRoute = router.currentRoute?.value || router.currentRoute;
        callback(currentRoute, null);
      }, delay);
    }
    const unwatch = router.afterEach((to, from) => {
      logger.debug("🔄 路由变化检测到:", from?.path, "->", to?.path);
      setTimeout(() => {
        callback(to, from);
      }, delay);
    });
    return {
      router,
      unwatch,
      getCurrentRoute: () => {
        const currentRoute = router.currentRoute?.value || router.currentRoute;
        return currentRoute;
      }
    };
  }
  function useRouterWatcher(callback, options = {}) {
    logger.debug("🚦 设置路由监听 Hook...");
    const router = findVueRouter();
    if (router) {
      logger.debug("✓ Vue Router 已存在，直接注册 Hook");
      const result = registerRouterHook(router, callback, options);
      return result;
    }
    logger.debug("⏳ Vue Router 未找到，设置延迟注册...");
    const unwatchRef = { current: null };
    pendingHooks.push({
      callback,
      options,
      unwatchRef
    });
    startRouterObserver();
    return {
      router: null,
      unwatch: () => {
        if (unwatchRef.current) {
          unwatchRef.current();
        }
      },
      getCurrentRoute: () => {
        const currentRouter = findVueRouter();
        if (currentRouter) {
          const currentRoute = currentRouter.currentRoute?.value || currentRouter.currentRoute;
          return currentRoute;
        }
        return void 0;
      }
    };
  }
  class ComponentInjector {
    component = null;
    config;
    factory;
    isCreating = false;
    createPromise = null;
    constructor(config, factory) {
      this.config = config;
      this.factory = factory;
    }
    /**
     * 检查组件是否已存在
     */
    checkExistence() {
      const targetContainer = document.querySelector(this.config.targetSelector);
      if (!targetContainer) return false;
      const componentElement = targetContainer.querySelector(this.config.componentSelector);
      return componentElement !== null;
    }
    /**
     * 检查创建条件
     */
    checkCondition() {
      const targetExists = document.querySelector(this.config.targetSelector) !== null;
      if (!targetExists) return false;
      if (this.config.condition && !this.config.condition()) {
        return false;
      }
      if (this.config.routePattern) {
        const currentPath = window.location.pathname;
        if (typeof this.config.routePattern === "string") {
          return currentPath.includes(this.config.routePattern);
        } else {
          return this.config.routePattern.test(currentPath);
        }
      }
      return true;
    }
    /**
     * 尝试创建组件
     */
    async tryCreate() {
      if (this.isCreating && this.createPromise) {
        logger.debug(`⏳ [${this.config.id}] 组件正在创建中，等待完成`);
        await this.createPromise;
        return;
      }
      if (!this.checkCondition()) {
        logger.debug(`🚫 [${this.config.id}] 条件不满足，跳过创建`);
        return;
      }
      if (this.checkExistence()) {
        logger.debug(`✅ [${this.config.id}] 组件已存在，跳过创建`);
        return;
      }
      this.createPromise = this.createComponent();
      await this.createPromise;
    }
    /**
     * 创建组件
     */
    async createComponent() {
      if (this.isCreating) {
        logger.debug(`⏳ [${this.config.id}] 组件已在创建中，跳过重复创建`);
        return;
      }
      this.isCreating = true;
      try {
        if (this.checkExistence()) {
          logger.debug(`✅ [${this.config.id}] 组件已存在，取消创建`);
          return;
        }
        this.destroyComponent();
        this.component = await this.factory();
        await this.component.init();
        logger.debug(`✅ [${this.config.id}] 组件创建成功`);
      } catch (error) {
        logger.error(`❌ [${this.config.id}] 创建组件失败:`, error);
        this.component = null;
      } finally {
        this.isCreating = false;
        this.createPromise = null;
      }
    }
    /**
     * 检查并重新创建组件
     */
    async checkAndRecreate() {
      if (this.isCreating) {
        logger.debug(`⏳ [${this.config.id}] 组件正在创建中，跳过检查`);
        return;
      }
      const shouldExist = this.checkCondition();
      const doesExist = this.checkExistence();
      if (shouldExist && !doesExist) {
        logger.debug(`🔧 [${this.config.id}] 组件缺失，重新创建组件`);
        await this.tryCreate();
      } else if (!shouldExist && doesExist) {
        logger.debug(`🗑️ [${this.config.id}] 条件不满足，销毁组件`);
        this.destroyComponent();
      }
    }
    /**
     * 销毁组件
     */
    destroyComponent() {
      if (this.isCreating && this.createPromise) {
        logger.debug(`⏳ [${this.config.id}] 等待创建完成后销毁`);
        this.createPromise.then(() => {
          if (this.component) {
            this.component.destroy();
            this.component = null;
            logger.debug(`🗑️ [${this.config.id}] 组件已销毁（延迟）`);
          }
        });
        return;
      }
      if (this.component) {
        this.component.destroy();
        this.component = null;
        logger.debug(`🗑️ [${this.config.id}] 组件已销毁`);
      }
    }
    /**
     * 刷新组件
     */
    async refreshComponent() {
      if (this.component && this.component.refresh) {
        await this.component.refresh();
        logger.debug(`🔄 [${this.config.id}] 组件已刷新`);
      }
    }
    /**
     * 处理路由变化
     */
    async handleRouteChange(_to, _from) {
      await this.checkAndRecreate();
    }
    /**
     * 处理 DOM 变化
     */
    async handleDOMChange(_mutations) {
      await this.checkAndRecreate();
    }
    /**
     * 清理资源
     */
    cleanup() {
      this.isCreating = false;
      this.createPromise = null;
      this.destroyComponent();
    }
    /**
     * 获取组件实例
     */
    getComponent() {
      return this.component;
    }
    /**
     * 检查组件是否存在
     */
    hasComponent() {
      return this.component !== null && this.checkExistence();
    }
    /**
     * 检查是否正在创建中
     */
    isCreatingComponent() {
      return this.isCreating;
    }
    /**
     * 获取配置
     */
    getConfig() {
      return this.config;
    }
  }
  class DOMInjectorManager {
    injectors = /* @__PURE__ */ new Map();
    domObserver = null;
    routerUnwatch = null;
    isInitialized = false;
    options;
    constructor(options = {}) {
      this.options = {
        observerConfig: {
          childList: true,
          subtree: true
        },
        enableGlobalRouterWatch: true,
        routerDelay: 100,
        ...options
      };
    }
    /**
     * 注册组件注入器
     */
    register(config, factory) {
      if (this.injectors.has(config.id)) {
        logger.warn(`⚠️ 注入器 [${config.id}] 已存在，将被覆盖`);
        this.unregister(config.id);
      }
      const injector = new ComponentInjector(config, factory);
      this.injectors.set(config.id, injector);
      logger.debug(`📝 注册组件注入器: [${config.id}]`);
      if (this.isInitialized) {
        injector.tryCreate();
      }
      return injector;
    }
    /**
     * 注销组件注入器
     */
    unregister(id) {
      const injector = this.injectors.get(id);
      if (injector) {
        injector.cleanup();
        this.injectors.delete(id);
        logger.debug(`🗑️ 注销组件注入器: [${id}]`);
        return true;
      }
      return false;
    }
    /**
     * 获取注入器
     */
    getInjector(id) {
      return this.injectors.get(id) || null;
    }
    /**
     * 初始化管理器
     */
    init() {
      if (this.isInitialized) {
        logger.warn("⚠️ DOM 注入管理器已经初始化");
        return;
      }
      logger.debug("🎯 初始化 DOM 注入管理器");
      if (this.options.enableGlobalRouterWatch) {
        this.setupGlobalRouterWatcher();
      }
      this.setupDOMObserver();
      this.createAllComponents();
      this.isInitialized = true;
    }
    /**
     * 设置全局路由监听
     */
    setupGlobalRouterWatcher() {
      const { unwatch } = useRouterWatcher(
        async (to, from) => {
          logger.debug("🔄 全局路由变化检测到:", from?.path, "->", to?.path);
          await this.handleGlobalRouteChange(to, from);
        },
        {
          delay: this.options.routerDelay,
          immediate: false
        }
      );
      this.routerUnwatch = unwatch;
      logger.debug("✅ 全局路由监听设置完成");
    }
    /**
     * 设置 DOM 观察器
     */
    setupDOMObserver() {
      let debounceTimer = null;
      let isProcessing = false;
      let pendingMutations = [];
      let lastDebugTime = 0;
      const debugLogInterval = 3e3;
      this.domObserver = new MutationObserver(async (mutations) => {
        pendingMutations.push(...mutations);
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(async () => {
          if (isProcessing) {
            logger.debug("🔍 DOM 变化处理中，跳过本次处理");
            return;
          }
          isProcessing = true;
          const currentMutations = [...pendingMutations];
          pendingMutations = [];
          try {
            const now = Date.now();
            if (now - lastDebugTime >= debugLogInterval) {
              lastDebugTime = now;
              logger.debug(`🔍 检测到 ${currentMutations.length} 个 DOM 变化，通知所有组件`);
            }
            await this.handleGlobalDOMChange(currentMutations);
          } finally {
            isProcessing = false;
            debounceTimer = null;
          }
        }, 100);
      });
      this.domObserver.observe(document.body, this.options.observerConfig);
      logger.debug("✅ DOM 观察器设置完成");
    }
    /**
     * 处理全局路由变化
     */
    async handleGlobalRouteChange(to, from) {
      const promises = Array.from(this.injectors.values()).map(
        (injector) => injector.handleRouteChange(to, from)
      );
      await Promise.allSettled(promises);
    }
    /**
     * 处理全局 DOM 变化
     */
    async handleGlobalDOMChange(mutations) {
      const promises = Array.from(this.injectors.values()).map(
        (injector) => injector.handleDOMChange(mutations)
      );
      await Promise.allSettled(promises);
    }
    /**
     * 创建所有组件
     */
    async createAllComponents() {
      const promises = Array.from(this.injectors.values()).map((injector) => injector.tryCreate());
      await Promise.allSettled(promises);
    }
    /**
     * 刷新所有组件
     */
    async refreshAllComponents() {
      const promises = Array.from(this.injectors.values()).map((injector) => injector.refreshComponent());
      await Promise.allSettled(promises);
    }
    /**
     * 刷新指定组件
     */
    async refreshComponent(id) {
      const injector = this.injectors.get(id);
      if (injector) {
        await injector.refreshComponent();
      }
    }
    /**
     * 销毁管理器
     */
    destroy() {
      logger.debug("🗑️ 销毁 DOM 注入管理器");
      for (const injector of this.injectors.values()) {
        injector.cleanup();
      }
      this.injectors.clear();
      if (this.routerUnwatch) {
        this.routerUnwatch();
        this.routerUnwatch = null;
      }
      if (this.domObserver) {
        this.domObserver.disconnect();
        this.domObserver = null;
      }
      this.isInitialized = false;
    }
    /**
     * 获取所有注入器 ID
     */
    getInjectorIds() {
      return Array.from(this.injectors.keys());
    }
    /**
     * 获取注入器数量
     */
    getInjectorCount() {
      return this.injectors.size;
    }
    /**
     * 检查是否已初始化
     */
    isInit() {
      return this.isInitialized;
    }
  }
  const domInjector = new DOMInjectorManager({
    enableGlobalRouterWatch: true,
    routerDelay: 200,
    observerConfig: {
      childList: true,
      subtree: true
    }
  });
  var _GM = /* @__PURE__ */ (() => typeof GM != "undefined" ? GM : void 0)();
  const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "TRACE", "OPTIONS", "CONNECT"];
  const RAW_RESPONSE_HEADERS = Symbol("gmFetchRawResponseHeaders");
  function normalizeMethod(method) {
    const upperMethod = method.toUpperCase();
    if (HTTP_METHODS.includes(upperMethod)) {
      return upperMethod;
    }
    throw new Error(`unsupported http method ${method}`);
  }
  function parseResponseHeaders(rawHeaders) {
    const headers = new Headers();
    for (const line of rawHeaders.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx <= 0) {
        continue;
      }
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (key) {
        headers.append(key, value);
      }
    }
    return headers;
  }
  function getRawResponseHeaders(response) {
    return response[RAW_RESPONSE_HEADERS] ?? "";
  }
  function getResponseHeaderLines(response, headerName) {
    const needle = `${headerName.toLowerCase()}:`;
    return getRawResponseHeaders(response).split(/\r?\n/).map((line) => line.trim()).filter((line) => line.toLowerCase().startsWith(needle)).map((line) => line.slice(needle.length).trim());
  }
  async function GM_fetch(input, init = {}) {
    const request2 = new Request(input, init);
    let data;
    if (init.body !== void 0) {
      data = await request2.text();
    }
    return await new Promise((resolve, reject) => {
      if (request2.signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const xhr = _GM.xmlHttpRequest({
        url: request2.url,
        method: normalizeMethod(request2.method.toUpperCase()),
        headers: Object.fromEntries(request2.headers.entries()),
        data,
        responseType: "blob",
        anonymous: init.anonymous,
        cookie: init.cookie,
        timeout: init.timeout,
        redirect: init.redirect,
        onload: (res) => {
          const responseHeaders = parseResponseHeaders(res.responseHeaders);
          const responseBody = res.response instanceof Blob ? res.response : new Blob([res.responseText ?? ""]);
          const response = new Response(responseBody, {
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders
          });
          Object.defineProperty(response, RAW_RESPONSE_HEADERS, {
            value: res.responseHeaders ?? "",
            enumerable: false,
            configurable: false,
            writable: false
          });
          resolve(response);
        },
        onabort: () => {
          reject(new DOMException("Aborted", "AbortError"));
        },
        ontimeout: () => {
          reject(new TypeError("Network request failed, timeout"));
        },
        onerror: (err) => {
          const reason = typeof err.error === "string" && err.error ? err.error : request2.url;
          reject(new TypeError(`Failed to fetch: ${reason}`));
        }
      });
      if (request2.signal) {
        const onAbort = () => {
          xhr.abort();
        };
        request2.signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }
  function buildCookieHeader(entries) {
    return entries.filter(([, value]) => Boolean(value)).map(([name, value]) => `${name}=${value}`).join("; ");
  }
  function buildCookieTokenHeader(accountId, cookieToken) {
    return buildCookieHeader([
      ["account_id", accountId],
      ["cookie_token", cookieToken]
    ]);
  }
  function parseSetCookieLine(line) {
    const firstPart = line.split(";", 1)[0]?.trim();
    if (!firstPart) {
      return null;
    }
    const separatorIndex = firstPart.indexOf("=");
    if (separatorIndex <= 0) {
      return null;
    }
    return {
      name: firstPart.slice(0, separatorIndex).trim(),
      value: firstPart.slice(separatorIndex + 1).trim()
    };
  }
  function buildStokenCookie(bundle) {
    return buildCookieHeader([
      ["mid", bundle.mid],
      ["stoken", bundle.stoken],
      ["stuid", bundle.stuid]
    ]);
  }
  function buildLTokenCookie(bundle) {
    return buildCookieHeader([
      ["ltoken", bundle.ltoken],
      ["ltuid", bundle.ltuid]
    ]);
  }
  function buildCookieTokenCookie(bundle) {
    return buildCookieTokenHeader(bundle.accountId, bundle.cookieToken);
  }
  function buildNapCookie(bundle) {
    return buildCookieHeader([
      ["e_nap_token", bundle.eNapToken]
    ]);
  }
  function getCookieValueFromSetCookieLines$1(setCookieLines, cookieName) {
    for (const line of setCookieLines) {
      const parsed = parseSetCookieLine(line);
      if (parsed?.name === cookieName) {
        return parsed.value;
      }
    }
    return null;
  }
  function getCookieValueFromResponse(response, cookieName) {
    return getCookieValueFromSetCookieLines$1(getResponseHeaderLines(response, "set-cookie"), cookieName);
  }
  const APP_VERSION = "2.102.1";
  const HYP_CONTAINER_VERSION = "1.3.3.182";
  const HOYO_LANGUAGE = "zh-cn";
  const DEVICE_FP_PLACEHOLDER = "0000000000000";
  const DEVICE_FP_TTL_MS = 3 * 24 * 60 * 60 * 1e3;
  const COOKIE_TOKEN_TTL_MS = 24 * 60 * 60 * 1e3;
  const PASSPORT_BASE_URL = "https://passport-api.mihoyo.com";
  const API_TAKUMI_BASE_URL = "https://api-takumi.mihoyo.com";
  const ACT_TAKUMI_BASE_URL = "https://act-api-takumi.mihoyo.com";
  const GAME_RECORD_BASE_URL = "https://api-takumi-record.mihoyo.com";
  const NAP_CULTIVATE_TOOL_URL = `${ACT_TAKUMI_BASE_URL}/event/nap_cultivate_tool`;
  const GAME_RECORD_URL = `${GAME_RECORD_BASE_URL}/event/game_record_zzz/api/zzz`;
  const DEVICE_FP_URL = "https://public-data-api.mihoyo.com/device-fp/api/getFp";
  const CREATE_QR_LOGIN_URL = `${PASSPORT_BASE_URL}/account/ma-cn-passport/app/createQRLogin`;
  const QUERY_QR_LOGIN_STATUS_URL = `${PASSPORT_BASE_URL}/account/ma-cn-passport/app/queryQRLoginStatus`;
  const COOKIE_TOKEN_URL = `${PASSPORT_BASE_URL}/account/auth/api/getCookieAccountInfoBySToken`;
  const LTOKEN_URL = `${PASSPORT_BASE_URL}/account/auth/api/getLTokenBySToken`;
  const VERIFY_COOKIE_TOKEN_URL = `${PASSPORT_BASE_URL}/account/ma-cn-session/web/verifyCookieToken`;
  const GAME_ROLE_BY_COOKIE_TOKEN_URL = `${PASSPORT_BASE_URL}/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn`;
  const NAP_LOGIN_INFO_URL = `${API_TAKUMI_BASE_URL}/common/badge/v1/login/info?game_biz=nap_cn&lang=${HOYO_LANGUAGE}`;
  const NAP_TOKEN_URL = `${API_TAKUMI_BASE_URL}/common/badge/v1/login/account`;
  const QR_USER_AGENT = `HYPContainer/${HYP_CONTAINER_VERSION}`;
  const ACCEPT_JSON = "application/json, text/plain, */*";
  const DEVICE_FP_ERROR_CODES = /* @__PURE__ */ new Set([1034, 5003, 10035, 10041, 10053]);
  function resolveHoyoAuthRoute(baseUrl, _endpoint) {
    if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
      return "nap_cultivate";
    }
    if (baseUrl === GAME_RECORD_URL) {
      return "zzz_note";
    }
    throw new Error(`未配置的 HoYo 鉴权路由: ${baseUrl}`);
  }
  const MINIMAL_AUTH_CONTRACTS = {
    createQRLogin: {
      endpoint: "passport-api/account/ma-cn-passport/app/createQRLogin",
      templateSource: "TeyvatGuide/current-repo QR",
      minimalCookies: [],
      minimalHeaders: ["x-rpc-app_id", "x-rpc-device_id", "x-rpc-device_fp"],
      refreshDependency: "none"
    },
    queryQRLoginStatus: {
      endpoint: "passport-api/account/ma-cn-passport/app/queryQRLoginStatus",
      templateSource: "TeyvatGuide/current-repo QR",
      minimalCookies: [],
      minimalHeaders: ["x-rpc-app_id", "x-rpc-device_id", "x-rpc-device_fp"],
      refreshDependency: "qr_ticket"
    },
    getCookieAccountInfoBySToken: {
      endpoint: "passport-api/account/auth/api/getCookieAccountInfoBySToken",
      templateSource: "current-repo X4 mobile",
      minimalCookies: ["mid", "stoken"],
      minimalHeaders: [],
      refreshDependency: "none"
    },
    getLTokenBySToken: {
      endpoint: "passport-api/account/auth/api/getLTokenBySToken",
      templateSource: "current-repo X4 mobile",
      minimalCookies: ["mid", "stoken"],
      minimalHeaders: [],
      refreshDependency: "none"
    },
    verifyCookieToken: {
      endpoint: "passport-api/account/ma-cn-session/web/verifyCookieToken",
      templateSource: "TeyvatGuide / QR script-managed session",
      minimalCookies: ["account_id", "cookie_token"],
      minimalHeaders: [],
      refreshDependency: "none"
    },
    getUserGameRolesByCookieToken: {
      endpoint: "passport-api/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn",
      templateSource: "TeyvatGuide / QR script-managed session",
      minimalCookies: ["account_id", "cookie_token"],
      minimalHeaders: [],
      refreshDependency: "none"
    },
    "login/account": {
      endpoint: "api-takumi/common/badge/v1/login/account",
      templateSource: "TeyvatGuide / QR script-managed session",
      minimalCookies: ["account_id", "cookie_token"],
      minimalHeaders: [],
      refreshDependency: "none"
    },
    "login/info": {
      endpoint: "api-takumi/common/badge/v1/login/info",
      templateSource: "minimal web session",
      minimalCookies: ["e_nap_token"],
      minimalHeaders: [],
      refreshDependency: "e_nap_token"
    },
    avatar_basic_list: {
      endpoint: "act-api-takumi/event/nap_cultivate_tool/user/avatar_basic_list",
      templateSource: "2.js minimal cultivate",
      minimalCookies: ["e_nap_token"],
      minimalHeaders: ["x-rpc-device_id", "x-rpc-device_fp"],
      refreshDependency: "e_nap_token"
    },
    batch_avatar_detail_v2: {
      endpoint: "act-api-takumi/event/nap_cultivate_tool/user/batch_avatar_detail_v2",
      templateSource: "2.js minimal cultivate",
      minimalCookies: ["e_nap_token"],
      minimalHeaders: ["x-rpc-device_id", "x-rpc-device_fp"],
      refreshDependency: "e_nap_token"
    },
    avatar_calc: {
      endpoint: "act-api-takumi/event/nap_cultivate_tool/user/avatar_calc",
      templateSource: "2.js minimal cultivate",
      minimalCookies: ["e_nap_token"],
      minimalHeaders: [],
      refreshDependency: "e_nap_token"
    },
    note: {
      endpoint: "api-takumi-record/event/game_record_zzz/api/zzz/note",
      templateSource: "current-repo mobile note",
      minimalCookies: ["ltoken", "ltuid"],
      minimalHeaders: ["x-rpc-device_id", "x-rpc-device_fp"],
      refreshDependency: "none"
    },
    getFp: {
      endpoint: "public-data-api/device-fp/api/getFp",
      templateSource: "current-repo / TeyvatGuide Xiaomi ext_fields",
      minimalCookies: [],
      minimalHeaders: [],
      refreshDependency: "none"
    }
  };
  function getMinimalAuthContract(id) {
    return MINIMAL_AUTH_CONTRACTS[id];
  }
  function resolveNapAuthContractId(endpoint) {
    switch (endpoint) {
      case "/user/avatar_basic_list":
        return "avatar_basic_list";
      case "/user/batch_avatar_detail_v2":
        return "batch_avatar_detail_v2";
      case "/user/avatar_calc":
        return "avatar_calc";
      default:
        throw new Error(`未配置的 NAP 鉴权结构: ${endpoint}`);
    }
  }
  function buildHeadersFromContract(contractId, device) {
    const headers = {};
    for (const headerName of getMinimalAuthContract(contractId).minimalHeaders) {
      if (!device) {
        throw new Error(`缺少设备信息，无法生成鉴权头: ${headerName}`);
      }
      if (headerName === "x-rpc-device_id") {
        headers[headerName] = device.deviceId;
        continue;
      }
      if (headerName === "x-rpc-device_fp") {
        headers[headerName] = device.deviceFp;
        continue;
      }
    }
    return headers;
  }
  function buildQrHeaders(deviceId) {
    return {
      Accept: ACCEPT_JSON,
      "User-Agent": QR_USER_AGENT,
      "x-rpc-app_id": "ddxf5dufpuyo",
      "x-rpc-client_type": "3",
      "x-rpc-device_id": deviceId,
      "Content-Type": "application/json"
    };
  }
  function buildDeviceFpHeaders() {
    return buildHeadersFromContract("getFp");
  }
  function buildCookieTokenExchangeHeaders() {
    return {};
  }
  function buildLTokenExchangeHeaders() {
    return {};
  }
  function buildNapBootstrapHeaders() {
    return buildHeadersFromContract("login/account");
  }
  function buildNapSessionHeaders() {
    return buildHeadersFromContract("login/info");
  }
  function buildGameRecordHeaders(device) {
    return buildHeadersFromContract("note", device);
  }
  function buildVerifyCookieTokenHeaders() {
    return buildHeadersFromContract("verifyCookieToken");
  }
  function buildRoleByCookieTokenHeaders() {
    return buildHeadersFromContract("getUserGameRolesByCookieToken");
  }
  function buildNapCultivateHeaders(endpoint, device) {
    return buildHeadersFromContract(resolveNapAuthContractId(endpoint), device);
  }
  class HttpRequestError extends Error {
    status;
    statusText;
    context;
    constructor(status, statusText, context) {
      super(context ? `${context}: HTTP ${status}: ${statusText}` : `HTTP ${status}: ${statusText}`);
      this.name = "HttpRequestError";
      this.status = status;
      this.statusText = statusText;
      this.context = context;
    }
  }
  class ApiResponseError extends Error {
    retcode;
    apiMessage;
    context;
    constructor(retcode, apiMessage, context) {
      super(context ? `${context}: API Error ${retcode}: ${apiMessage}` : `API Error ${retcode}: ${apiMessage}`);
      this.name = "ApiResponseError";
      this.retcode = retcode;
      this.apiMessage = apiMessage;
      this.context = context;
    }
  }
  class DeviceFingerprintRefreshError extends Error {
    retcode;
    apiMessage;
    causeError;
    constructor(retcode, apiMessage, causeError) {
      super(`设备指纹刷新失败，原始错误: API Error ${retcode}: ${apiMessage}`);
      this.name = "DeviceFingerprintRefreshError";
      this.retcode = retcode;
      this.apiMessage = apiMessage;
      this.causeError = causeError;
    }
  }
  class InvalidDeviceFingerprintError extends Error {
    constructor() {
      super("❌ 设备指纹有误，请检查");
      this.name = "InvalidDeviceFingerprintError";
    }
  }
  function getHoyoErrorSummary(error) {
    if (error instanceof DeviceFingerprintRefreshError) {
      return `设备指纹刷新失败（${error.retcode}）：${error.apiMessage}`;
    }
    if (error instanceof InvalidDeviceFingerprintError) {
      return "设备指纹无效";
    }
    if (error instanceof HttpRequestError) {
      return `网络请求失败（HTTP ${error.status} ${error.statusText}）`;
    }
    if (error instanceof ApiResponseError) {
      return `接口返回错误（${error.retcode}）：${error.apiMessage}`;
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return String(error);
  }
  function getHoyoErrorSuggestion(error) {
    if (error instanceof DeviceFingerprintRefreshError || error instanceof InvalidDeviceFingerprintError) {
      return "请重置设备信息后重试";
    }
    if (error instanceof HttpRequestError) {
      return "请检查网络后重试";
    }
    if (error instanceof ApiResponseError) {
      return "请稍后重试，必要时刷新登录";
    }
    return "请稍后重试";
  }
  const AUTH_BUNDLE_KEY = "zzz_hoyo_auth_bundle";
  const LEGACY_PASSPORT_TOKEN_KEY = "zzz_passport_tokens";
  const AUTH_BUNDLE_SCHEMA_VERSION = 1;
  let migrationPromise = null;
  function createEmptyAuthBundle() {
    return {
      updatedAt: Date.now(),
      schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION
    };
  }
  function parseLegacyTokens(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.stoken || !parsed.mid) {
        return null;
      }
      return {
        stoken: parsed.stoken,
        mid: parsed.mid,
        updatedAt: parsed.updatedAt,
        cookieTokenUpdatedAt: parsed.cookieTokenUpdatedAt
      };
    } catch {
      return null;
    }
  }
  function parseAuthBundle(raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        ...createEmptyAuthBundle(),
        ...parsed,
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
        schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION
      };
    } catch {
      return null;
    }
  }
  async function writeBundle(bundle) {
    await _GM.setValue(AUTH_BUNDLE_KEY, JSON.stringify(bundle));
  }
  async function migrateLegacyAuthBundle() {
    if (!migrationPromise) {
      migrationPromise = (async () => {
        const existing = parseAuthBundle(await _GM.getValue(AUTH_BUNDLE_KEY, ""));
        if (existing) {
          return;
        }
        const legacyRawFromScript = await _GM.getValue(LEGACY_PASSPORT_TOKEN_KEY, "");
        const legacyRawFromPage = localStorage.getItem(LEGACY_PASSPORT_TOKEN_KEY) ?? "";
        const legacy = parseLegacyTokens(legacyRawFromScript) ?? parseLegacyTokens(legacyRawFromPage);
        if (!legacy) {
          return;
        }
        const migrated = {
          ...createEmptyAuthBundle(),
          stoken: legacy.stoken,
          mid: legacy.mid,
          updatedAt: Date.now(),
          rootTokensUpdatedAt: legacy.updatedAt ?? Date.now(),
          cookieTokenUpdatedAt: legacy.cookieTokenUpdatedAt
        };
        await writeBundle(migrated);
        await _GM.deleteValue(LEGACY_PASSPORT_TOKEN_KEY);
        localStorage.removeItem(LEGACY_PASSPORT_TOKEN_KEY);
        logger.info("🔐 已将旧版通行证凭证迁移到新的 HoYo 鉴权存储");
      })();
    }
    await migrationPromise;
  }
  async function readAuthBundle() {
    await migrateLegacyAuthBundle();
    const raw = await _GM.getValue(AUTH_BUNDLE_KEY, "");
    return parseAuthBundle(raw) ?? createEmptyAuthBundle();
  }
  async function patchAuthBundle(patch) {
    const current = await readAuthBundle();
    const next = {
      ...current,
      ...patch,
      updatedAt: Date.now(),
      schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION
    };
    await writeBundle(next);
    return next;
  }
  async function persistRootTokens(rootTokens) {
    const current = await readAuthBundle();
    const changed = current.stoken !== rootTokens.stoken || current.mid !== rootTokens.mid || current.stuid !== (rootTokens.stuid ?? void 0);
    const next = {
      ...createEmptyAuthBundle(),
      ...current,
      stoken: rootTokens.stoken,
      mid: rootTokens.mid,
      stuid: rootTokens.stuid ?? void 0,
      updatedAt: Date.now(),
      rootTokensUpdatedAt: Date.now(),
      schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION
    };
    if (changed) {
      next.ltoken = void 0;
      next.ltuid = void 0;
      next.cookieToken = void 0;
      next.accountId = void 0;
      next.eNapToken = void 0;
      next.selectedRole = void 0;
      next.ltokenUpdatedAt = void 0;
      next.cookieTokenUpdatedAt = void 0;
      next.eNapTokenUpdatedAt = void 0;
      next.roleUpdatedAt = void 0;
    }
    await writeBundle(next);
    return next;
  }
  async function persistLToken(ltoken, ltuid) {
    return await patchAuthBundle({
      ltoken,
      ltuid,
      ltokenUpdatedAt: Date.now()
    });
  }
  async function persistCookieToken(cookieToken, accountId) {
    return await patchAuthBundle({
      cookieToken,
      accountId,
      cookieTokenUpdatedAt: Date.now()
    });
  }
  async function persistNapToken(eNapToken) {
    return await patchAuthBundle({
      eNapToken,
      eNapTokenUpdatedAt: Date.now()
    });
  }
  async function persistSelectedRole(role) {
    return await patchAuthBundle({
      selectedRole: role,
      roleUpdatedAt: Date.now()
    });
  }
  function hasRootTokens$2(bundle) {
    return Boolean(bundle.stoken && bundle.mid);
  }
  function hasLToken$1(bundle) {
    return Boolean(bundle.ltoken && bundle.ltuid);
  }
  function hasNapToken$1(bundle) {
    return Boolean(bundle.eNapToken);
  }
  function getCookieValueFromSetCookieLines(setCookieLines, cookieName) {
    for (const line of setCookieLines) {
      const parsed = parseSetCookieLine(line);
      if (parsed?.name === cookieName) {
        return parsed.value;
      }
    }
    return null;
  }
  function extractCookieTokenExchangeResult(setCookieLines, data) {
    const cookieToken = data.cookie_token ?? getCookieValueFromSetCookieLines(setCookieLines, "cookie_token");
    const accountId = getCookieValueFromSetCookieLines(setCookieLines, "account_id") ?? data.uid;
    if (!cookieToken) {
      throw new Error("获取 cookie_token 失败：响应中未返回 cookie_token");
    }
    if (!accountId) {
      throw new Error("获取 cookie_token 失败：响应中未返回 account_id/uid");
    }
    return {
      uid: data.uid,
      cookieToken,
      accountId
    };
  }
  function buildDeviceExtFields(profile) {
    const extFields = {
      proxyStatus: 0,
      isRoot: 0,
      romCapacity: "512",
      deviceName: profile.deviceName,
      productName: profile.product,
      romRemain: "512",
      hostname: "dg02-pool03-kvm87",
      screenSize: "1440x2905",
      isTablet: 0,
      aaid: "",
      model: profile.deviceName,
      brand: "XiaoMi",
      hardware: "qcom",
      deviceType: "OP5913L1",
      devId: "unknown",
      serialNumber: "unknown",
      sdCardCapacity: 512215,
      buildTime: "1693626947000",
      buildUser: "android-build",
      simState: "5",
      ramRemain: "239814",
      appUpdateTimeDiff: 1702604034882,
      deviceInfo: `XiaoMi ${profile.deviceName} OP5913L1:13 SKQ1.221119.001 T.118e6c7-5aa23-73911:user release-keys`,
      vaid: "",
      buildType: "user",
      sdkVersion: "34",
      ui_mode: "UI_MODE_TYPE_NORMAL",
      isMockLocation: 0,
      cpuType: "arm64-v8a",
      isAirMode: 0,
      ringMode: 2,
      chargeStatus: 1,
      manufacturer: "XiaoMi",
      emulatorStatus: 0,
      appMemory: "512",
      osVersion: "14",
      vendor: "unknown",
      accelerometer: "1.4883357x9.80665x-0.1963501",
      sdRemain: 239600,
      buildTags: "release-keys",
      packageName: "com.mihoyo.hyperion",
      networkType: "WiFi",
      oaid: "",
      debugStatus: 1,
      ramCapacity: "469679",
      magnetometer: "20.081251x-27.457501x2.1937501",
      display: `${profile.product}_13.1.0.181(CN01)`,
      appInstallTimeDiff: 1688455751496,
      packageVersion: APP_VERSION,
      gyroscope: "0.030226856x-0.014647375x-0.0013732915",
      batteryStatus: 100,
      hasKeyboard: 0,
      board: "taro"
    };
    return JSON.stringify(extFields);
  }
  function buildDeviceFpRequest(profile) {
    return {
      device_id: profile.deviceId,
      seed_id: profile.seedId,
      seed_time: profile.seedTime,
      platform: "2",
      device_fp: profile.deviceFp,
      app_name: "bbs_cn",
      ext_fields: buildDeviceExtFields(profile)
    };
  }
  function generateProductName() {
    return generateUpperAndNumberString(6);
  }
  function generateDeviceName() {
    return generateUpperAndNumberString(12);
  }
  function generateUpperAndNumberString(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
  function generateUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  function generateSeedId() {
    return generateHexString(16);
  }
  function generateHexString(length) {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return hex.substring(0, length);
  }
  function createDeviceProfileCore(deps) {
    function createDeviceProfile() {
      return {
        deviceId: deps.generateUUID(),
        product: deps.generateProductName(),
        deviceName: deps.generateDeviceName(),
        seedId: deps.generateSeedId(),
        seedTime: deps.now().toString(),
        deviceFp: deps.deviceFpPlaceholder,
        updatedAt: deps.now(),
        schemaVersion: 1
      };
    }
    function parseDeviceProfile(raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.deviceId || !parsed.deviceFp) {
          return null;
        }
        return {
          deviceId: parsed.deviceId,
          product: parsed.product || deps.generateProductName(),
          deviceName: parsed.deviceName || deps.generateDeviceName(),
          seedId: parsed.seedId || deps.generateSeedId(),
          seedTime: parsed.seedTime || deps.now().toString(),
          deviceFp: parsed.deviceFp,
          updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : typeof parsed.timestamp === "number" ? parsed.timestamp : deps.now(),
          schemaVersion: 1
        };
      } catch {
        return null;
      }
    }
    function shouldRefreshFingerprint(profile, forceRefresh = false) {
      if (forceRefresh) {
        return true;
      }
      if (profile.deviceFp === deps.deviceFpPlaceholder) {
        return true;
      }
      return deps.now() - profile.updatedAt > deps.deviceFpTtlMs;
    }
    return {
      createDeviceProfile,
      parseDeviceProfile,
      shouldRefreshFingerprint
    };
  }
  const DEVICE_PROFILE_KEY = "zzz_device_info";
  const DEVICE_PROFILE_SCHEMA_VERSION = 1;
  let deviceProfileCache = null;
  let deviceProfilePromise = null;
  const deviceProfileCore = createDeviceProfileCore({
    now: () => Date.now(),
    generateUUID,
    generateSeedId,
    generateProductName,
    generateDeviceName,
    deviceFpPlaceholder: DEVICE_FP_PLACEHOLDER,
    deviceFpTtlMs: DEVICE_FP_TTL_MS
  });
  async function writeDeviceProfile(profile) {
    const normalized = {
      ...profile,
      schemaVersion: DEVICE_PROFILE_SCHEMA_VERSION
    };
    await _GM.setValue(DEVICE_PROFILE_KEY, JSON.stringify(normalized));
    localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(normalized));
  }
  async function readDeviceProfile() {
    const gmRaw = await _GM.getValue(DEVICE_PROFILE_KEY, "");
    const gmProfile = deviceProfileCore.parseDeviceProfile(gmRaw);
    if (gmProfile) {
      localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(gmProfile));
      return gmProfile;
    }
    const localRaw = localStorage.getItem(DEVICE_PROFILE_KEY) ?? "";
    const localProfile = deviceProfileCore.parseDeviceProfile(localRaw);
    if (localProfile) {
      await writeDeviceProfile(localProfile);
      return localProfile;
    }
    const created = deviceProfileCore.createDeviceProfile();
    await writeDeviceProfile(created);
    return created;
  }
  async function loadDeviceProfile(forceRefresh = false) {
    if (!deviceProfilePromise) {
      deviceProfilePromise = (async () => {
        if (!deviceProfileCache) {
          deviceProfileCache = await readDeviceProfile();
        }
        if (deviceProfileCore.shouldRefreshFingerprint(deviceProfileCache, forceRefresh)) {
          deviceProfileCache = await refreshDeviceFingerprintInternal(deviceProfileCache);
        }
        return deviceProfileCache;
      })().finally(() => {
        deviceProfilePromise = null;
      });
    }
    return await deviceProfilePromise;
  }
  async function refreshDeviceFingerprintInternal(profile) {
    const requestBody = buildDeviceFpRequest(profile);
    logger.info(`🔐 开始刷新设备指纹，设备档案: ${profile.deviceId}`);
    const response = await GM_fetch(DEVICE_FP_URL, {
      method: "POST",
      anonymous: true,
      headers: {
        ...buildDeviceFpHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      throw new HttpRequestError(response.status, response.statusText, "设备指纹获取失败");
    }
    const data = await response.json();
    if (data.retcode !== 0 || data.data.code !== 200 || !data.data.device_fp) {
      throw new ApiResponseError(data.retcode, data.message, "设备指纹获取失败");
    }
    const next = {
      ...profile,
      deviceFp: data.data.device_fp,
      updatedAt: Date.now()
    };
    await writeDeviceProfile(next);
    logger.info("✅ 设备指纹刷新成功");
    return next;
  }
  async function getCurrentDeviceProfile() {
    if (deviceProfileCache) {
      return deviceProfileCache;
    }
    deviceProfileCache = await readDeviceProfile();
    return deviceProfileCache;
  }
  async function ensureDeviceProfile(forceRefresh = false) {
    const profile = await loadDeviceProfile(forceRefresh);
    if (profile.deviceFp === DEVICE_FP_PLACEHOLDER) {
      throw new Error("设备指纹仍为占位值，无法继续请求");
    }
    return profile;
  }
  async function refreshDeviceFingerprint() {
    const profile = await getCurrentDeviceProfile();
    deviceProfileCache = await refreshDeviceFingerprintInternal(profile);
    return deviceProfileCache;
  }
  async function resetDeviceProfile() {
    const next = deviceProfileCore.createDeviceProfile();
    await writeDeviceProfile(next);
    deviceProfileCache = next;
    try {
      deviceProfileCache = await refreshDeviceFingerprintInternal(next);
    } catch (error) {
      logger.warn("⚠️ 设备档案已重建，但首次刷新指纹失败，将保留占位值", error);
    }
    return deviceProfileCache;
  }
  function hasRootTokens$1(bundle) {
    return Boolean(bundle.stoken && bundle.mid);
  }
  function hasCookieToken(bundle) {
    return Boolean(bundle.accountId && bundle.cookieToken);
  }
  function hasNapToken(bundle) {
    return Boolean(bundle.eNapToken);
  }
  function isCookieTokenFresh(updatedAt, now, ttlMs) {
    if (!updatedAt) {
      return false;
    }
    return now() - updatedAt < ttlMs;
  }
  function createPassportNapCore(deps) {
    let cookieTokenRefreshPromise = null;
    let primaryGameRolePromise = null;
    let napTokenRefreshPromise = null;
    async function ensureCookieToken(forceRefresh = false) {
      const current = await deps.readAuthBundle();
      if (!forceRefresh && hasCookieToken(current) && isCookieTokenFresh(current.cookieTokenUpdatedAt, deps.now, deps.cookieTokenTtlMs)) {
        return;
      }
      if (cookieTokenRefreshPromise) {
        deps.logger.debug(`🔁 复用进行中的 cookie_token 刷新${forceRefresh ? "（强制）" : ""}`);
        await cookieTokenRefreshPromise;
        return;
      }
      const refreshPromise = (async () => {
        const latestBeforeRefresh = await deps.readAuthBundle();
        if (!forceRefresh && hasCookieToken(latestBeforeRefresh) && isCookieTokenFresh(latestBeforeRefresh.cookieTokenUpdatedAt, deps.now, deps.cookieTokenTtlMs)) {
          return;
        }
        if (!hasRootTokens$1(latestBeforeRefresh)) {
          throw new Error("未找到 stoken/mid，请先扫码登录");
        }
        const { cookieToken, accountId, uid } = await deps.requestCookieTokenByStoken();
        await deps.persistCookieToken(cookieToken, accountId);
        if (uid && !latestBeforeRefresh.stuid) {
          await deps.patchAuthBundle({ stuid: uid });
        }
        deps.logger.info("🔐 已刷新 cookie_token");
      })();
      cookieTokenRefreshPromise = refreshPromise;
      try {
        await refreshPromise;
      } finally {
        if (cookieTokenRefreshPromise === refreshPromise) {
          cookieTokenRefreshPromise = null;
        }
      }
    }
    async function getPrimaryGameRole2(forceRefresh = false) {
      const current = await deps.readAuthBundle();
      if (!forceRefresh && current.selectedRole) {
        return current.selectedRole;
      }
      if (primaryGameRolePromise) {
        deps.logger.debug(`🔁 复用进行中的角色发现${forceRefresh ? "（强制）" : ""}`);
        return await primaryGameRolePromise;
      }
      const rolePromise = (async () => {
        await ensureCookieToken(forceRefresh);
        const bundle = await deps.readAuthBundle();
        if (!hasCookieToken(bundle)) {
          throw new Error("未找到 cookie_token/account_id，请先完成扫码登录");
        }
        const cookie = deps.buildCookieTokenCookie(bundle);
        await deps.verifyCookieToken(cookie);
        const roles = await deps.requestGameRolesByCookieToken(cookie);
        const role = roles[0];
        if (!role) {
          throw new Error("未找到绝区零角色");
        }
        await deps.persistSelectedRole(role);
        return role;
      })();
      primaryGameRolePromise = rolePromise;
      try {
        return await rolePromise;
      } finally {
        if (primaryGameRolePromise === rolePromise) {
          primaryGameRolePromise = null;
        }
      }
    }
    async function issueNapBusinessToken(role) {
      await ensureCookieToken(false);
      let bundle = await deps.readAuthBundle();
      if (!hasCookieToken(bundle)) {
        throw new Error("未找到 cookie_token/account_id，无法初始化 e_nap_token");
      }
      try {
        return await deps.requestNapBootstrap(role, deps.buildCookieTokenCookie(bundle));
      } catch (error) {
        if (!deps.isAuthRefreshableError(error)) {
          throw error;
        }
        deps.logger.warn("⚠️ e_nap_token 自举命中鉴权失败，升级刷新 cookie_token 后重试");
        await ensureCookieToken(true);
        bundle = await deps.readAuthBundle();
        if (!hasCookieToken(bundle)) {
          throw new Error("刷新 cookie_token 后仍缺少 cookie_token/account_id");
        }
        return await deps.requestNapBootstrap(role, deps.buildCookieTokenCookie(bundle));
      }
    }
    async function ensureNapBusinessToken2(forceRefresh = false, role) {
      const current = await deps.readAuthBundle();
      if (!forceRefresh && hasNapToken(current)) {
        return current.eNapToken;
      }
      if (napTokenRefreshPromise) {
        deps.logger.debug(`🔁 复用进行中的 e_nap_token 刷新${forceRefresh ? "（强制）" : ""}`);
        return await napTokenRefreshPromise;
      }
      const refreshPromise = (async () => {
        const latestBeforeRefresh = await deps.readAuthBundle();
        if (!forceRefresh && hasNapToken(latestBeforeRefresh)) {
          return latestBeforeRefresh.eNapToken;
        }
        const resolvedRole = role ?? latestBeforeRefresh.selectedRole ?? await getPrimaryGameRole2(false);
        const eNapToken = await issueNapBusinessToken(resolvedRole);
        await deps.persistNapToken(eNapToken);
        await deps.persistSelectedRole(resolvedRole);
        deps.logger.info(`🔐 已${forceRefresh ? "重新" : ""}完成 e_nap_token 自举`);
        return eNapToken;
      })();
      napTokenRefreshPromise = refreshPromise;
      try {
        return await refreshPromise;
      } finally {
        if (napTokenRefreshPromise === refreshPromise) {
          napTokenRefreshPromise = null;
        }
      }
    }
    async function initializeNapToken2() {
      const role = await getPrimaryGameRole2(false);
      await ensureNapBusinessToken2(false, role);
      return role;
    }
    function reset() {
      cookieTokenRefreshPromise = null;
      primaryGameRolePromise = null;
      napTokenRefreshPromise = null;
    }
    return {
      ensureCookieToken,
      getPrimaryGameRole: getPrimaryGameRole2,
      ensureNapBusinessToken: ensureNapBusinessToken2,
      initializeNapToken: initializeNapToken2,
      reset
    };
  }
  function hasRootTokens(bundle) {
    return Boolean(bundle.stoken && bundle.mid);
  }
  function hasLToken(bundle) {
    return Boolean(bundle.ltoken && bundle.ltuid);
  }
  function resolveLtuid(bundle, fallbackUid) {
    return bundle.ltuid || bundle.stuid || fallbackUid;
  }
  function createRecordAuthCore(deps) {
    let lTokenRefreshPromise = null;
    async function ensureLToken2(forceRefresh = false) {
      const current = await deps.readAuthBundle();
      if (!forceRefresh && hasLToken(current)) {
        return;
      }
      if (lTokenRefreshPromise) {
        deps.logger.debug(`🔁 复用进行中的 ltoken 刷新${forceRefresh ? "（强制）" : ""}`);
        await lTokenRefreshPromise;
        return;
      }
      const refreshPromise = (async () => {
        const latestBeforeRefresh = await deps.readAuthBundle();
        if (!forceRefresh && hasLToken(latestBeforeRefresh)) {
          return;
        }
        if (!hasRootTokens(latestBeforeRefresh)) {
          throw new Error("未找到 stoken/mid，请先扫码登录");
        }
        let resolvedUid = resolveLtuid(latestBeforeRefresh);
        if (!resolvedUid) {
          const cookieAccountInfo = await deps.requestCookieAccountInfoByStoken();
          resolvedUid = cookieAccountInfo.uid;
          if (resolvedUid) {
            await deps.patchAuthBundle({
              stuid: latestBeforeRefresh.stuid || resolvedUid,
              ltuid: resolvedUid
            });
          }
        }
        const data = await deps.requestLTokenByStoken();
        const latestAfterRefresh = await deps.readAuthBundle();
        const ltuid = resolveLtuid(latestAfterRefresh, resolvedUid);
        if (!ltuid) {
          throw new Error("获取 ltoken 成功但缺少 ltuid/stuid");
        }
        await deps.persistLToken(data.ltoken, ltuid);
        deps.logger.info("🔐 已刷新 ltoken");
      })();
      lTokenRefreshPromise = refreshPromise;
      try {
        await refreshPromise;
      } finally {
        if (lTokenRefreshPromise === refreshPromise) {
          lTokenRefreshPromise = null;
        }
      }
    }
    function reset() {
      lTokenRefreshPromise = null;
    }
    return {
      ensureLToken: ensureLToken2,
      reset
    };
  }
  const QR_EXPIRED_RETCODE = -106;
  async function requestApi(url, init, context) {
    const response = await GM_fetch(url, init);
    if (!response.ok) {
      throw new HttpRequestError(response.status, response.statusText, context);
    }
    const data = await response.json();
    if (data.retcode !== 0) {
      throw new ApiResponseError(data.retcode, data.message, context);
    }
    return { response, data };
  }
  function isPassportAuthHttpStatus(status) {
    return status === 401 || status === 403;
  }
  function isPassportAuthRetcode(retcode, message = "") {
    const normalized = message.toLowerCase();
    if ([-100, 10001, 10002, 10101, -3101].includes(retcode)) {
      return true;
    }
    return normalized.includes("登录") || normalized.includes("未登录") || normalized.includes("token") || normalized.includes("cookie");
  }
  async function hasPersistedStoken() {
    return hasRootTokens$2(await readAuthBundle());
  }
  function isAuthRefreshableError(error) {
    if (error instanceof ApiResponseError) {
      return isPassportAuthRetcode(error.retcode, error.apiMessage);
    }
    if (error instanceof HttpRequestError) {
      return isPassportAuthHttpStatus(error.status);
    }
    return false;
  }
  async function requestCookieTokenByStoken() {
    const bundle = await readAuthBundle();
    const { response, data } = await requestApi(
      `${COOKIE_TOKEN_URL}?stoken=${encodeURIComponent(bundle.stoken ?? "")}`,
      {
        method: "GET",
        anonymous: true,
        cookie: buildStokenCookie(bundle),
        headers: buildCookieTokenExchangeHeaders()
      },
      "获取 cookie_token 失败"
    );
    return extractCookieTokenExchangeResult(getResponseHeaderLines(response, "set-cookie"), data.data);
  }
  async function exchangeLTokenByStoken() {
    const bundle = await readAuthBundle();
    if (!hasRootTokens$2(bundle)) {
      throw new Error("未找到 stoken/mid，请先扫码登录");
    }
    const { data } = await requestApi(
      `${LTOKEN_URL}?stoken=${encodeURIComponent(bundle.stoken)}`,
      {
        method: "GET",
        anonymous: true,
        cookie: buildStokenCookie(bundle),
        headers: buildLTokenExchangeHeaders()
      },
      "获取 ltoken 失败"
    );
    return data.data;
  }
  async function requestCookieAccountInfoByStoken() {
    const bundle = await readAuthBundle();
    const { data } = await requestApi(
      `${COOKIE_TOKEN_URL}?stoken=${encodeURIComponent(bundle.stoken ?? "")}`,
      {
        method: "GET",
        anonymous: true,
        cookie: buildStokenCookie(bundle),
        headers: buildCookieTokenExchangeHeaders()
      },
      "获取通行证账号信息失败"
    );
    return data.data;
  }
  async function requestGameRolesByCookieToken(cookie) {
    const { data } = await requestApi(
      GAME_ROLE_BY_COOKIE_TOKEN_URL,
      {
        method: "GET",
        anonymous: true,
        cookie,
        headers: buildRoleByCookieTokenHeaders()
      },
      "获取绝区零角色失败"
    );
    if (!data.data.list?.length) {
      throw new Error("未找到绝区零角色");
    }
    return data.data.list;
  }
  async function verifyCookieToken(cookie) {
    await requestApi(
      VERIFY_COOKIE_TOKEN_URL,
      {
        method: "POST",
        anonymous: true,
        cookie,
        headers: buildVerifyCookieTokenHeaders()
      },
      "校验 cookie_token 失败"
    );
  }
  async function requestNapBootstrap(role, cookie) {
    const { response } = await requestApi(
      NAP_TOKEN_URL,
      {
        method: "POST",
        anonymous: true,
        cookie,
        headers: {
          ...buildNapBootstrapHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          game_biz: role.game_biz,
          lang: "zh-cn",
          region: role.region,
          uid: role.game_uid
        })
      },
      "初始化绝区零业务态失败"
    );
    const eNapToken = getCookieValueFromResponse(response, "e_nap_token");
    if (!eNapToken) {
      throw new Error("初始化绝区零业务态失败：响应中未返回 e_nap_token");
    }
    return eNapToken;
  }
  const passportNapCore = createPassportNapCore({
    now: () => Date.now(),
    logger,
    readAuthBundle,
    patchAuthBundle,
    persistCookieToken,
    persistSelectedRole,
    persistNapToken,
    requestCookieTokenByStoken,
    verifyCookieToken,
    requestGameRolesByCookieToken,
    requestNapBootstrap,
    buildCookieTokenCookie,
    isAuthRefreshableError,
    cookieTokenTtlMs: COOKIE_TOKEN_TTL_MS
  });
  const recordAuthCore = createRecordAuthCore({
    logger,
    readAuthBundle,
    patchAuthBundle,
    persistLToken,
    requestCookieAccountInfoByStoken,
    requestLTokenByStoken: exchangeLTokenByStoken
  });
  async function ensureLToken(forceRefresh = false) {
    await recordAuthCore.ensureLToken(forceRefresh);
  }
  async function getPrimaryGameRole(forceRefresh = false) {
    return await passportNapCore.getPrimaryGameRole(forceRefresh);
  }
  async function initializeNapToken() {
    return await passportNapCore.initializeNapToken();
  }
  async function ensureNapBusinessToken(forceRefresh = false) {
    await passportNapCore.ensureNapBusinessToken(forceRefresh);
  }
  async function createQRLogin() {
    const device = await getCurrentDeviceProfile();
    const { data } = await requestApi(
      CREATE_QR_LOGIN_URL,
      {
        method: "POST",
        headers: buildQrHeaders(device.deviceId),
        body: JSON.stringify({})
      },
      "创建二维码失败"
    );
    return data.data;
  }
  async function queryQRLoginStatus(ticket) {
    const device = await getCurrentDeviceProfile();
    const response = await GM_fetch(
      QUERY_QR_LOGIN_STATUS_URL,
      {
        method: "POST",
        headers: buildQrHeaders(device.deviceId),
        body: JSON.stringify({ ticket })
      }
    );
    if (!response.ok) {
      throw new HttpRequestError(response.status, response.statusText, "查询扫码状态失败");
    }
    const data = await response.json();
    if (data.retcode === QR_EXPIRED_RETCODE) {
      throw new ApiResponseError(data.retcode, data.message, "二维码已过期");
    }
    if (data.retcode !== 0) {
      throw new ApiResponseError(data.retcode, data.message, "查询扫码状态失败");
    }
    return data.data;
  }
  function startQRLoginPolling(ticket, callbacks) {
    let cancelled = false;
    let currentTicket = ticket;
    const cancel = () => {
      cancelled = true;
    };
    const poll = async () => {
      while (!cancelled) {
        await sleep(1e3);
        if (cancelled) {
          return;
        }
        try {
          const statusData = await queryQRLoginStatus(currentTicket);
          if (cancelled) {
            return;
          }
          callbacks.onStatusChange(statusData.status);
          if (statusData.status === "Confirmed") {
            const stoken = statusData.tokens?.[0]?.token;
            const mid = statusData.user_info?.mid;
            const stuid = statusData.user_info?.aid;
            if (!stoken || !mid) {
              callbacks.onError(new Error("扫码成功但缺少 stoken/mid"));
              return;
            }
            await persistRootTokens({ stoken, mid, stuid });
            const roleInfo = await initializeNapToken();
            callbacks.onComplete(roleInfo);
            return;
          }
        } catch (error) {
          if (error instanceof ApiResponseError && error.retcode === QR_EXPIRED_RETCODE) {
            try {
              const newData = await createQRLogin();
              currentTicket = newData.ticket;
              callbacks.onQRExpired(newData);
              continue;
            } catch (refreshError) {
              callbacks.onError(refreshError);
              return;
            }
          }
          callbacks.onError(error);
          return;
        }
      }
    };
    void poll();
    return cancel;
  }
  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }
  let userInfoCache = null;
  let initializePromise = null;
  function cacheUserInfoFromRole(role) {
    userInfoCache = {
      uid: role.game_uid,
      nickname: role.nickname,
      level: role.level,
      region: role.region
    };
  }
  function cacheUserInfoFromLogin(profile) {
    userInfoCache = {
      uid: profile.game_uid,
      nickname: profile.nickname,
      level: profile.level,
      region: profile.region
    };
  }
  async function requestLoginInfo(forceRefresh = false) {
    if (forceRefresh) {
      await ensureNapBusinessToken(true);
    }
    const bundle = await readAuthBundle();
    if (!hasNapToken$1(bundle)) {
      await ensureNapBusinessToken(false);
    }
    const latest = await readAuthBundle();
    if (!hasNapToken$1(latest)) {
      throw new Error("未找到 e_nap_token，无法请求登录信息");
    }
    const response = await GM_fetch(`${NAP_LOGIN_INFO_URL}&ts=${Date.now()}`, {
      method: "GET",
      anonymous: true,
      cookie: buildNapCookie(latest),
      headers: buildNapSessionHeaders()
    });
    if (!response.ok) {
      throw new HttpRequestError(response.status, response.statusText, "获取登录信息失败");
    }
    const data = await response.json();
    if (data.retcode !== 0) {
      throw new ApiResponseError(data.retcode, data.message, "获取登录信息失败");
    }
    return data;
  }
  async function ensureUserInfo() {
    if (!userInfoCache) {
      await initializeUserInfo();
    }
  }
  function getUserInfo() {
    return userInfoCache;
  }
  async function initializeUserInfo() {
    if (userInfoCache) {
      return userInfoCache;
    }
    if (!initializePromise) {
      initializePromise = (async () => {
        const bundle = await readAuthBundle();
        if (bundle.selectedRole) {
          cacheUserInfoFromRole(bundle.selectedRole);
          return userInfoCache;
        }
        try {
          const role = await getPrimaryGameRole(false);
          cacheUserInfoFromRole(role);
          return userInfoCache;
        } catch (roleError) {
          logger.warn("⚠️ 通过角色发现初始化用户缓存失败，降级尝试 login/info", roleError);
        }
        const loginInfo = await requestLoginInfo(false);
        cacheUserInfoFromLogin(loginInfo.data);
        return userInfoCache;
      })().finally(() => {
        initializePromise = null;
      });
    }
    return await initializePromise;
  }
  function hydrateUserInfoFromRole(role) {
    if (!role.game_uid || !role.region) {
      throw new Error("角色信息不完整，无法写入用户缓存");
    }
    cacheUserInfoFromRole(role);
    logger.info(`👤 已使用角色信息更新用户缓存: ${role.nickname} (UID: ${role.game_uid})`);
  }
  async function getDeviceFingerprint() {
    await refreshDeviceFingerprint();
  }
  async function refreshDeviceInfo() {
    logger.info("🔄 开始重建设备档案...");
    const next = await resetDeviceProfile();
    if (next.deviceFp === DEVICE_FP_PLACEHOLDER) {
      throw new Error("设备档案已重建，但新的 device_fp 仍未成功获取");
    }
    logger.info("✅ 设备档案重建完成");
    logger.debug("设备档案详情:", next);
  }
  function createRouteRequestCore(deps) {
    const routeRefreshPromises = /* @__PURE__ */ new Map();
    async function refreshRouteAuth(route) {
      const inFlight = routeRefreshPromises.get(route);
      if (inFlight) {
        deps.logger.debug(`🔁 复用进行中的 ${route} 路由鉴权刷新`);
        await inFlight;
        return;
      }
      const refreshPromise = deps.triggerRouteAuthRefresh(route);
      routeRefreshPromises.set(route, refreshPromise);
      try {
        await refreshPromise;
      } finally {
        if (routeRefreshPromises.get(route) === refreshPromise) {
          routeRefreshPromises.delete(route);
        }
      }
    }
    async function execute({
      url,
      endpoint,
      route,
      method,
      body,
      headers = {},
      requestLabel
    }) {
      const executeRequest = async (authRetried = false, deviceRetried = false) => {
        const routeContext = await deps.buildRouteRequestContext(route, endpoint, authRetried);
        const finalHeaders = {
          ...routeContext.headers,
          ...headers
        };
        if (body !== void 0 && !finalHeaders["Content-Type"]) {
          finalHeaders["Content-Type"] = "application/json";
        }
        deps.logger.debug(`🌐 发起请求 ${requestLabel}${authRetried || deviceRetried ? " (重试)" : ""}`, {
          endpoint,
          route,
          authRetried,
          deviceRetried
        });
        try {
          const response = await deps.fetch(url, {
            method,
            anonymous: true,
            cookie: routeContext.cookie,
            headers: finalHeaders,
            body: body !== void 0 ? JSON.stringify(body) : void 0
          });
          if (!response.ok) {
            if (!authRetried && await deps.hasPersistedStoken() && deps.isPassportAuthHttpStatus(response.status)) {
              deps.logger.warn(`⚠️ 鉴权失败，准备刷新路由凭证后重试 ${requestLabel}`);
              await refreshRouteAuth(route);
              return await executeRequest(true, deviceRetried);
            }
            throw new HttpRequestError(response.status, response.statusText);
          }
          const data = await response.json();
          if (data.retcode !== 0) {
            if (DEVICE_FP_ERROR_CODES.has(data.retcode) && !deviceRetried) {
              deps.logger.warn(`⚠️ 设备指纹错误，准备刷新后重试 ${requestLabel}`, {
                retcode: data.retcode,
                message: data.message
              });
              try {
                await deps.getDeviceFingerprint();
                return await executeRequest(authRetried, true);
              } catch (error) {
                throw new DeviceFingerprintRefreshError(data.retcode, data.message, error);
              }
            }
            if (!authRetried && await deps.hasPersistedStoken() && deps.isPassportAuthRetcode(data.retcode, data.message)) {
              deps.logger.warn(`⚠️ 业务鉴权失败，准备刷新路由凭证后重试 ${requestLabel}`, {
                retcode: data.retcode,
                message: data.message
              });
              await refreshRouteAuth(route);
              return await executeRequest(true, deviceRetried);
            }
            throw new ApiResponseError(data.retcode, data.message);
          }
          return data;
        } catch (error) {
          if (error instanceof ApiResponseError || error instanceof HttpRequestError || error instanceof DeviceFingerprintRefreshError) {
            throw error;
          }
          deps.logger.error(`❌ 请求异常 ${requestLabel}`, error);
          throw error;
        }
      };
      return await executeRequest();
    }
    return {
      execute
    };
  }
  async function buildRouteRequestContext(route, endpoint, forceAuthRefresh = false) {
    if (route === "nap_cultivate") {
      const device2 = await ensureDeviceProfile();
      await ensureNapBusinessToken(forceAuthRefresh);
      const bundle2 = await readAuthBundle();
      if (!hasNapToken$1(bundle2)) {
        throw new Error("未找到 e_nap_token，请先完成扫码登录");
      }
      return {
        headers: buildNapCultivateHeaders(endpoint, device2),
        cookie: buildNapCookie(bundle2)
      };
    }
    await ensureLToken(forceAuthRefresh);
    const bundle = await readAuthBundle();
    if (!hasLToken$1(bundle)) {
      throw new Error("未找到 ltoken/ltuid，请先完成扫码登录");
    }
    const device = await getCurrentDeviceProfile();
    return {
      headers: buildGameRecordHeaders(device),
      cookie: buildLTokenCookie(bundle)
    };
  }
  async function triggerRouteAuthRefresh(route) {
    if (route === "nap_cultivate") {
      await ensureNapBusinessToken(true);
      return;
    }
    await ensureLToken(true);
  }
  const routeRequestCore = createRouteRequestCore({
    fetch: GM_fetch,
    logger,
    buildRouteRequestContext,
    triggerRouteAuthRefresh,
    hasPersistedStoken,
    isPassportAuthHttpStatus,
    isPassportAuthRetcode,
    getDeviceFingerprint
  });
  async function request(endpoint, baseUrl, options = {}) {
    const { method = "GET", params = {}, body, headers = {} } = options;
    const route = resolveHoyoAuthRoute(baseUrl);
    if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
      await ensureUserInfo();
    }
    let url = `${baseUrl}${endpoint}`;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
    const requestLabel = `${method} ${endpoint}`;
    return await routeRequestCore.execute({
      url,
      endpoint,
      route,
      method,
      body,
      headers,
      requestLabel
    });
  }
  async function resolveUserInfo(uid, region) {
    await ensureUserInfo();
    const userInfoCache2 = getUserInfo();
    if (userInfoCache2) {
      return {
        uid: userInfoCache2.uid,
        region: region || userInfoCache2.region
      };
    }
    throw new Error("❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社");
  }
  async function processBatches(items, batchSize, processor) {
    if (items.length <= batchSize) {
      return processor(items);
    }
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    const batchPromises = batches.map((batch) => processor(batch));
    const batchResults = await Promise.all(batchPromises);
    return batchResults.flat();
  }
  async function getAvatarBasicList(uid, region) {
    const userInfo = await resolveUserInfo(uid, region);
    const response = await request("/user/avatar_basic_list", NAP_CULTIVATE_TOOL_URL, {
      method: "GET",
      params: { uid: userInfo.uid, region: userInfo.region }
    });
    const unlocked = response.data.list.filter((avatar) => avatar.unlocked === true);
    if (unlocked.length === 0) {
      logger.warn("⚠️ 角色基础列表为空（unlocked=0）");
    } else {
      logger.debug(`✅ 获取角色基础列表成功: ${unlocked.length} 个角色`);
    }
    return unlocked;
  }
  async function batchGetAvatarDetail(avatarList, uid, region) {
    if (avatarList.length === 0) {
      logger.warn("⚠️ 批量角色详情请求为空，返回空列表");
      return [];
    }
    const userInfo = await resolveUserInfo(uid, region);
    const processedAvatarList = typeof avatarList[0] === "number" ? avatarList.map((id) => ({
      avatar_id: id,
      is_teaser: false,
      teaser_need_weapon: false,
      teaser_sp_skill: false
    })) : avatarList;
    const details = await processBatches(
      processedAvatarList,
      10,
      async (batch) => {
        logger.debug(`📦 拉取角色详情批次: ${batch.length} 个`);
        const response = await request("/user/batch_avatar_detail_v2", NAP_CULTIVATE_TOOL_URL, {
          method: "POST",
          params: { uid: userInfo.uid, region: userInfo.region },
          body: { avatar_list: batch }
        });
        return response.data.list;
      }
    );
    logger.debug(`✅ 批量角色详情获取完成: ${details.length} 个`);
    return details;
  }
  async function getGameNote(roleId, server) {
    const userInfo = await resolveUserInfo(roleId, server);
    logger.debug(`📘 获取游戏便笺: uid=${userInfo.uid}, region=${userInfo.region}`);
    const response = await request("/note", GAME_RECORD_URL, {
      method: "GET",
      params: {
        server: userInfo.region,
        role_id: userInfo.uid
      }
    });
    logger.debug("✅ 游戏便笺获取成功");
    return response.data;
  }
  const SEELIE_BASE_URL = "https://zzz.seelie.me";
  const SITE_MANIFEST_CACHE_KEY = "seelie_site_manifest_v1";
  const SITE_MANIFEST_CACHE_TTL_MS = 6 * 60 * 60 * 1e3;
  const INDEX_SCRIPT_PATTERN = /\/assets\/index-([a-f0-9]+)\.js/;
  const STRINGS_ZH_PATTERN = /strings-zh-([a-f0-9]+)\.js/;
  const SIGNAL_TRACKER_HREF_PATTERN = /https:\/\/stardb\.gg\/zzz\/signal-tracker[^\s"'`)]*/;
  const STATS_FILE_PATTERNS = {
    charactersStats: /stats-characters-[a-f0-9]+\.js/,
    weaponsStats: /stats-weapons-[a-f0-9]+\.js/,
    weaponsStatsCommon: /stats-weapons-common-[a-f0-9]+\.js/
  };
  let runtimeManifest = null;
  let runtimeManifestLoading = null;
  async function fetchContent(url) {
    const response = await GM_fetch(url);
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText} (${url})`);
    }
    return await response.text();
  }
  function toRuntimeManifest(stored, source) {
    return {
      ...stored,
      source
    };
  }
  function readCachedManifest() {
    try {
      const value = localStorage.getItem(SITE_MANIFEST_CACHE_KEY);
      if (!value) {
        return null;
      }
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object" || parsed === null || typeof parsed.fetchedAt !== "number" || typeof parsed.indexScriptPath !== "string" || typeof parsed.indexScriptUrl !== "string" || typeof parsed.statsFiles !== "object" || parsed.statsFiles === null || typeof parsed.adHints !== "object" || parsed.adHints === null) {
        return null;
      }
      return {
        fetchedAt: parsed.fetchedAt,
        indexScriptPath: parsed.indexScriptPath,
        indexScriptUrl: parsed.indexScriptUrl,
        stringsZhFile: typeof parsed.stringsZhFile === "string" ? parsed.stringsZhFile : null,
        stringsZhUrl: typeof parsed.stringsZhUrl === "string" ? parsed.stringsZhUrl : null,
        statsFiles: parsed.statsFiles,
        adHints: {
          hasPleaseSticker: Boolean(parsed.adHints.hasPleaseSticker),
          hasLeaderboardTarget: Boolean(parsed.adHints.hasLeaderboardTarget),
          hasPwIncontent: Boolean(parsed.adHints.hasPwIncontent),
          usesLegacyContainer: Boolean(parsed.adHints.usesLegacyContainer),
          usesModernContainer: Boolean(parsed.adHints.usesModernContainer),
          signalTrackerHref: typeof parsed.adHints.signalTrackerHref === "string" ? parsed.adHints.signalTrackerHref : null
        }
      };
    } catch (error) {
      logger.warn("读取 site manifest 缓存失败，忽略缓存:", error);
      return null;
    }
  }
  function writeCachedManifest(manifest) {
    try {
      localStorage.setItem(SITE_MANIFEST_CACHE_KEY, JSON.stringify(manifest));
    } catch (error) {
      logger.warn("写入 site manifest 缓存失败:", error);
    }
  }
  function isCacheFresh(manifest) {
    return Date.now() - manifest.fetchedAt < SITE_MANIFEST_CACHE_TTL_MS;
  }
  function extractStatsFiles(indexScriptContent) {
    const statsFiles = {};
    Object.keys(STATS_FILE_PATTERNS).forEach((name) => {
      const fileMatch = indexScriptContent.match(STATS_FILE_PATTERNS[name]);
      if (fileMatch) {
        statsFiles[name] = fileMatch[0];
      }
    });
    return statsFiles;
  }
  function buildStoredManifest(mainPageHtml, indexScriptContent) {
    const indexMatch = mainPageHtml.match(INDEX_SCRIPT_PATTERN);
    if (!indexMatch) {
      throw new Error("在主页 HTML 中未找到 index-*.js");
    }
    const indexScriptPath = indexMatch[0];
    const indexScriptUrl = `${SEELIE_BASE_URL}${indexScriptPath}`;
    const stringsZhMatch = indexScriptContent.match(STRINGS_ZH_PATTERN);
    const stringsZhFile = stringsZhMatch ? stringsZhMatch[0] : null;
    const stringsZhUrl = stringsZhFile ? `${SEELIE_BASE_URL}/assets/locale/${stringsZhFile}` : null;
    const signalTrackerHrefMatch = indexScriptContent.match(SIGNAL_TRACKER_HREF_PATTERN);
    const signalTrackerHref = signalTrackerHrefMatch ? signalTrackerHrefMatch[0] : null;
    return {
      fetchedAt: Date.now(),
      indexScriptPath,
      indexScriptUrl,
      stringsZhFile,
      stringsZhUrl,
      statsFiles: extractStatsFiles(indexScriptContent),
      adHints: {
        hasPleaseSticker: indexScriptContent.includes("img/stickers/please.png"),
        hasLeaderboardTarget: indexScriptContent.includes("leaderboard-target"),
        hasPwIncontent: indexScriptContent.includes("pw-incontent"),
        usesLegacyContainer: indexScriptContent.includes("overflow-hidden relative text-white"),
        usesModernContainer: indexScriptContent.includes("relative mx-auto overflow-hidden shrink-0"),
        signalTrackerHref
      }
    };
  }
  async function fetchManifestFromNetwork() {
    const mainPageHtml = await fetchContent(SEELIE_BASE_URL);
    const indexMatch = mainPageHtml.match(INDEX_SCRIPT_PATTERN);
    if (!indexMatch) {
      throw new Error("在主页 HTML 中未找到 index-*.js");
    }
    const indexScriptPath = indexMatch[0];
    const indexScriptUrl = `${SEELIE_BASE_URL}${indexScriptPath}`;
    const indexScriptContent = await fetchContent(indexScriptUrl);
    const stored = buildStoredManifest(mainPageHtml, indexScriptContent);
    writeCachedManifest(stored);
    return toRuntimeManifest(stored, "network");
  }
  function getCachedSiteManifest() {
    if (runtimeManifest) {
      return runtimeManifest;
    }
    const cached = readCachedManifest();
    if (!cached) {
      return null;
    }
    return toRuntimeManifest(cached, "cache");
  }
  async function getSiteManifest(options = {}) {
    const { forceRefresh = false } = options;
    if (!forceRefresh && runtimeManifest) {
      return runtimeManifest;
    }
    if (!forceRefresh && runtimeManifestLoading) {
      return runtimeManifestLoading;
    }
    if (!forceRefresh) {
      const cached = readCachedManifest();
      if (cached && isCacheFresh(cached)) {
        runtimeManifest = toRuntimeManifest(cached, "cache");
        return runtimeManifest;
      }
    }
    runtimeManifestLoading = (async () => {
      try {
        const manifest = await fetchManifestFromNetwork();
        runtimeManifest = manifest;
        return manifest;
      } catch (error) {
        const cached = readCachedManifest();
        if (cached) {
          logger.warn("刷新 site manifest 失败，回退到缓存:", error);
          runtimeManifest = toRuntimeManifest(cached, "cache");
          return runtimeManifest;
        }
        throw error;
      } finally {
        runtimeManifestLoading = null;
      }
    })();
    return runtimeManifestLoading;
  }
  class SeelieDataUpdater {
    static UNIQUE_ZZZ_KEYS = ["denny", "w_engine", "drive_disc"];
    /**
     * 获取网络内容
     */
    static async fetchContent(url) {
      try {
        const response = await GM_fetch(url);
        if (!response.ok) {
          throw new Error(`请求失败，状态码: ${response.status} - ${response.statusText}`);
        }
        return await response.text();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`获取 ${url} 时网络错误: ${errorMessage}`);
      }
    }
    /**
     * 从 JS 内容中还原绝区零数据
     */
    static restoreZzzData(jsContent) {
      logger.debug("▶️  开始从 JS 内容中还原绝区零数据...");
      const exportMatch = jsContent.match(/\bexport\s*\{([\s\S]*?)\}/);
      if (!exportMatch) {
        throw new Error("在JS文件中未找到 export 语句。");
      }
      const exportedVars = exportMatch[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      let executionCode = jsContent.replace(/\bexport\s*\{[\s\S]*?};/, "");
      executionCode += `

// Appended by script
return { ${exportedVars.map((v) => `${v}: ${v}`).join(", ")} };`;
      try {
        const scriptRunner = new Function(executionCode);
        const allDataBlocks = scriptRunner();
        logger.debug(`🔍 正在 ${Object.keys(allDataBlocks).length} 个数据块中搜索绝区零数据...`);
        for (const blockName in allDataBlocks) {
          const block = allDataBlocks[blockName];
          if (!block || typeof block !== "object") continue;
          const sources = [block.default, block];
          for (const source of sources) {
            if (source && typeof source === "object" && this.UNIQUE_ZZZ_KEYS.some((key) => key in source)) {
              logger.debug(`🎯 命中！在变量 '${blockName}' 中找到关键词。`);
              return source;
            }
          }
        }
        throw new Error("未能在任何数据块中找到绝区零的锚点关键词。");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`还原数据时发生错误: ${errorMessage}`);
      }
    }
    /**
     * 解析统计数据 JS 文件
     */
    static parseStatsFile(jsContent) {
      try {
        const exportMatch = jsContent.match(/\bexport\s*\{([\s\S]*?)\}/);
        if (!exportMatch) {
          throw new Error("在统计文件中未找到 export 语句");
        }
        const exportItems = exportMatch[1].split(",").map((s) => s.trim());
        const exportMappings = {};
        let defaultExportVar = null;
        exportItems.forEach((item) => {
          const parts = item.split(/\s+as\s+/);
          if (parts.length === 2) {
            const [varName, exportName] = parts;
            if (exportName.trim() === "default") {
              defaultExportVar = varName.trim();
            }
            exportMappings[exportName.trim()] = varName.trim();
          } else {
            const varName = item.trim();
            exportMappings[varName] = varName;
          }
        });
        let executionCode = jsContent.replace(/\bexport\s*\{[\s\S]*?};/, "");
        if (defaultExportVar) {
          executionCode += `

// Appended by script
return ${defaultExportVar};`;
        } else {
          const allVars = Object.values(exportMappings);
          executionCode += `

// Appended by script
return { ${allVars.map((v) => `${v}: ${v}`).join(", ")} };`;
        }
        const scriptRunner = new Function(executionCode);
        return scriptRunner();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`解析统计文件时发生错误: ${errorMessage}`);
      }
    }
    /**
     * 处理统计数据文件（并行版本）
     */
    static async processStatsFiles(statsFiles) {
      logger.debug("▶️  开始并行处理统计数据文件...");
      const statsFileNames = ["charactersStats", "weaponsStats", "weaponsStatsCommon"];
      const statsPromises = statsFileNames.map(async (name) => {
        const fileName = statsFiles[name];
        if (!fileName) {
          logger.warn(`⚠️  未找到 ${name} 文件，跳过...`);
          return { name, data: null };
        }
        const statsFileUrl = `${SEELIE_BASE_URL}/assets/${fileName}`;
        logger.debug(`📥 下载 ${name} -> ${statsFileUrl}`);
        try {
          const statsFileContent = await this.fetchContent(statsFileUrl);
          const parsedData = this.parseStatsFile(statsFileContent);
          logger.debug(`✅ ${name} 处理完成`);
          return { name, data: parsedData };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`❌ 处理 ${name} 时出错: ${errorMessage}`);
          return { name, data: null };
        }
      });
      const results = await Promise.all(statsPromises);
      const statsData = {};
      results.forEach(({ name, data }) => {
        if (data !== null) {
          statsData[name] = data;
        }
      });
      logger.debug(`✅ 统计数据并行处理完成，共处理 ${Object.keys(statsData).length} 个文件`);
      return statsData;
    }
    /**
     * 更新 Seelie 数据（优化并行版本）
     */
    static async updateSeelieData() {
      try {
        logger.debug("🚀 开始更新 Seelie 数据...");
        const siteManifest = await getSiteManifest();
        logger.debug(`第一步：使用站点 manifest（来源: ${siteManifest.source}）`);
        logger.debug(`第二步：发现主脚本 -> ${siteManifest.indexScriptUrl}`);
        if (!siteManifest.stringsZhUrl) {
          throw new Error("在主脚本中未找到 strings-zh-*.js 语言包。");
        }
        logger.debug(`第三步：发现中文语言包 -> ${siteManifest.stringsZhUrl}`);
        logger.debug("🔄 开始并行处理语言包和统计数据...");
        const [stringsFileContent, statsData] = await Promise.all([
          this.fetchContent(siteManifest.stringsZhUrl),
          this.processStatsFiles(siteManifest.statsFiles)
        ]);
        logger.debug("✅ 语言包和统计数据并行处理完成");
        const languageData = this.restoreZzzData(stringsFileContent);
        logger.debug("🎉 Seelie 数据更新完成！");
        return { languageData, statsData };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Seelie 数据更新失败: ${errorMessage}`);
        throw error;
      }
    }
    /**
     * 缓存数据到 localStorage
     */
    static cacheData(languageData, statsData) {
      try {
        localStorage.setItem("seelie_language_data", JSON.stringify(languageData));
        localStorage.setItem("seelie_stats_data", JSON.stringify(statsData));
        localStorage.setItem("seelie_data_timestamp", Date.now().toString());
        logger.debug("✅ 数据已缓存到 localStorage");
      } catch (error) {
        logger.error("❌ 缓存数据失败:", error);
      }
    }
    /**
     * 从缓存获取数据
     */
    static getCachedData() {
      try {
        const languageDataStr = localStorage.getItem("seelie_language_data");
        const statsDataStr = localStorage.getItem("seelie_stats_data");
        const timestampStr = localStorage.getItem("seelie_data_timestamp");
        if (!languageDataStr || !statsDataStr || !timestampStr) {
          return null;
        }
        return {
          languageData: JSON.parse(languageDataStr),
          statsData: JSON.parse(statsDataStr),
          timestamp: parseInt(timestampStr)
        };
      } catch (error) {
        logger.error("❌ 获取缓存数据失败:", error);
        return null;
      }
    }
    /**
     * 获取最新数据（优先网络请求，失败时使用缓存）
     */
    static async getLatestData() {
      try {
        logger.debug("🔄 请求最新 Seelie 数据...");
        const { languageData, statsData } = await this.updateSeelieData();
        this.cacheData(languageData, statsData);
        return { languageData, statsData };
      } catch (error) {
        logger.warn("⚠️ 网络请求失败，尝试使用缓存数据:", error);
        const cachedData = this.getCachedData();
        if (cachedData) {
          logger.debug("✅ 使用缓存的 Seelie 数据");
          return {
            languageData: cachedData.languageData,
            statsData: cachedData.statsData
          };
        }
        throw new Error("网络请求失败且无可用缓存数据");
      }
    }
  }
  const ASCENSIONS = [9, 19, 29, 39, 49, 60];
  const SKILLS = {
    0: "basic",
    // 普通攻击
    1: "special",
    // 特殊技
    2: "dodge",
    // 闪避
    3: "chain",
    // 连携技
    5: "core",
    // 核心被动
    6: "assist"
    // 支援技
  };
  const RESIN_INTERVAL = 360;
  let runtimeDataCache = {};
  const DEFAULT_WEAPON_STATS_COMMON = {
    ascRate: [],
    rate: []
  };
  const missingStatsWarned = {
    charactersStats: false,
    weaponsStats: false,
    weaponsStatsCommon: false
  };
  function warnMissingStatsOnce(type, message) {
    if (missingStatsWarned[type]) {
      return;
    }
    missingStatsWarned[type] = true;
    logger.warn(message);
  }
  async function lazyLoadSeelieData() {
    if (runtimeDataCache.loaded) {
      return;
    }
    if (runtimeDataCache.loading) {
      await runtimeDataCache.loading;
      return;
    }
    runtimeDataCache.loading = (async () => {
      try {
        logger.debug("🔄 懒加载 Seelie 数据...");
        const { languageData, statsData } = await SeelieDataUpdater.getLatestData();
        runtimeDataCache.languageData = languageData;
        runtimeDataCache.statsData = statsData;
        runtimeDataCache.loaded = true;
        logger.info("✅ Seelie 数据加载完成");
      } catch (error) {
        logger.error("❌ Seelie 数据加载失败:", error);
        throw error;
      } finally {
        runtimeDataCache.loading = void 0;
      }
    })();
    await runtimeDataCache.loading;
  }
  async function getLanguageData() {
    await lazyLoadSeelieData();
    return runtimeDataCache.languageData;
  }
  async function getStatsData() {
    await lazyLoadSeelieData();
    return runtimeDataCache.statsData;
  }
  async function getCharacterStats() {
    try {
      const statsData = await getStatsData();
      if (statsData?.charactersStats && Array.isArray(statsData.charactersStats)) {
        logger.debug("✅ 使用动态角色统计数据");
        return statsData.charactersStats;
      }
    } catch (error) {
      logger.warn("⚠️ 获取角色统计数据失败:", error);
    }
    warnMissingStatsOnce("charactersStats", "⚠️ 角色统计数据缺失，回退为空数组");
    return [];
  }
  async function getWeaponStats() {
    try {
      const statsData = await getStatsData();
      if (statsData?.weaponsStats && typeof statsData.weaponsStats === "object") {
        logger.debug("✅ 使用动态武器统计数据");
        return statsData.weaponsStats;
      }
    } catch (error) {
      logger.warn("⚠️ 获取武器统计数据失败:", error);
    }
    warnMissingStatsOnce("weaponsStats", "⚠️ 武器统计数据缺失，回退为空对象");
    return {};
  }
  async function getWeaponStatsCommon() {
    try {
      const statsData = await getStatsData();
      if (statsData?.weaponsStatsCommon && typeof statsData.weaponsStatsCommon === "object" && Array.isArray(statsData.weaponsStatsCommon.ascRate) && Array.isArray(statsData.weaponsStatsCommon.rate)) {
        logger.debug("✅ 使用动态武器通用统计数据");
        return statsData.weaponsStatsCommon;
      }
    } catch (error) {
      logger.warn("⚠️ 获取武器通用统计数据失败:", error);
    }
    warnMissingStatsOnce("weaponsStatsCommon", "⚠️ 武器通用统计数据缺失，回退为空配置");
    return DEFAULT_WEAPON_STATS_COMMON;
  }
  class SeelieCore {
    appElement = null;
    rootComponent = null;
    lastToast = null;
    constructor() {
      this.init();
    }
    /**
     * 初始化，获取 #app 元素和根组件
     */
    init() {
      this.appElement = document.querySelector("#app");
      if (!this.appElement) {
        logger.warn("⚠️ SeelieCore: 未找到 #app 元素");
        return;
      }
      if (this.appElement._vnode?.component) {
        this.completeInit();
        return;
      }
      this.waitForVNodeComponent();
    }
    /**
     * 等待 _vnode.component 出现
     */
    waitForVNodeComponent() {
      const timeoutValue = 3e3;
      if (!this.appElement) return;
      logger.debug("🔍 SeelieCore: 等待 _vnode.component 出现...", this.appElement?._vnode?.component);
      const observer2 = new MutationObserver(() => {
        logger.debug("🔍 SeelieCore: 等待 _vnode.component 出现...", this.appElement?._vnode?.component);
        if (this.appElement?._vnode?.component) {
          clean();
          this.completeInit();
        }
      });
      observer2.observe(this.appElement, {
        attributes: true,
        childList: false,
        subtree: false
      });
      const timeoutTimer = setTimeout(() => {
        if (!this.rootComponent) {
          clean();
          logger.warn(`⚠️ SeelieCore: 等待 _vnode.component 超时 ${timeoutValue / 1e3}秒`);
        }
      }, timeoutValue);
      const clean = () => {
        observer2.disconnect();
        clearTimeout(timeoutTimer);
      };
    }
    /**
     * 完成初始化
     */
    completeInit() {
      if (!this.appElement?._vnode?.component) {
        logger.warn("⚠️ SeelieCore: 完成初始化时 _vnode.component 不存在");
        return;
      }
      this.rootComponent = this.appElement._vnode.component;
      lazyLoadSeelieData();
      logger.debug("✅ SeelieCore: 已尝试初始化 stats 数据");
      logger.log("✅ SeelieCore 初始化成功");
    }
    /**
     * 确保组件已初始化
     */
    ensureInitialized() {
      if (!this.rootComponent) {
        this.init();
      }
      return !!this.rootComponent;
    }
    /**
     * 获取根组件的 proxy 对象
     */
    getProxy() {
      if (!this.ensureInitialized()) {
        return null;
      }
      return this.rootComponent?.proxy;
    }
    /**
     * 获取 accountResin 属性值
     */
    getAccountResin() {
      const proxy = this.getProxy();
      if (!proxy) {
        logger.warn("⚠️ 无法获取组件 proxy 对象");
        return null;
      }
      const accountResin = proxy.accountResin;
      logger.debug("📖 获取 accountResin:", accountResin);
      return accountResin;
    }
    /**
     * 设置 accountResin 属性值
     */
    setAccountResin(value) {
      const proxy = this.getProxy();
      if (!proxy) {
        logger.warn("⚠️ 无法获取组件 proxy 对象");
        return false;
      }
      try {
        const oldValue = proxy.accountResin;
        const convertedValue = this.convertToAccountResinFormat(value);
        proxy.accountResin = convertedValue;
        logger.debug("✏️ 设置 accountResin:", {
          oldValue,
          inputValue: value,
          convertedValue
        });
        return true;
      } catch (error) {
        logger.error("❌ 设置 accountResin 失败:", error);
        return false;
      }
    }
    /**
     * 将输入参数转换为 accountResin 格式
     */
    convertToAccountResinFormat(input) {
      if (!input || !input.progress) {
        throw new Error("输入参数格式错误，缺少 progress 字段");
      }
      const { progress, restore } = input;
      const currentAmount = progress.current;
      const maxAmount = progress.max;
      const restoreSeconds = restore;
      const now = /* @__PURE__ */ new Date();
      const theoreticalRestoreTime = (maxAmount - currentAmount) * RESIN_INTERVAL;
      const updateTime = new Date(now.getTime() + (restoreSeconds - theoreticalRestoreTime) * 1e3);
      return {
        amount: currentAmount,
        time: updateTime.toString()
      };
    }
    /**
     * 设置 Toast 消息
     */
    setToast(message, type = "") {
      const proxy = this.getProxy();
      if (!proxy) {
        logger.warn("⚠️ 无法获取组件 proxy 对象");
        return false;
      }
      try {
        const now = Date.now();
        if (this.lastToast && this.lastToast.message === message && this.lastToast.type === type && now - this.lastToast.timestamp < 1500) {
          logger.debug("🍞 跳过重复 Toast:", { message, type });
          return true;
        }
        proxy.toast = message;
        proxy.toastType = type;
        this.lastToast = { message, type, timestamp: now };
        logger.debug("🍞 设置 Toast:", { message, type });
        return true;
      } catch (error) {
        logger.error("❌ 设置 Toast 失败:", error);
        return false;
      }
    }
    /**
     * 调用组件的 addGoal 方法
     */
    addGoal(goal) {
      const proxy = this.getProxy();
      if (!proxy) {
        logger.warn("⚠️ 无法获取组件 proxy 对象");
        return false;
      }
      if (typeof proxy.addGoal !== "function") {
        logger.warn("⚠️ addGoal 方法不存在");
        return false;
      }
      try {
        proxy.addGoal(goal);
        return true;
      } catch (error) {
        logger.error("❌ 调用 addGoal 失败:", error);
        return false;
      }
    }
    /**
     * 调用组件的 removeGoal 方法
     */
    removeGoal(goal) {
      const proxy = this.getProxy();
      if (!proxy) {
        logger.warn("⚠️ 无法获取组件 proxy 对象");
        return false;
      }
      if (typeof proxy.removeGoal !== "function") {
        logger.warn("⚠️ removeGoal 方法不存在");
        return false;
      }
      try {
        proxy.removeGoal(goal);
        return true;
      } catch (error) {
        logger.error("❌ 调用 removeGoal 失败:", error);
        return false;
      }
    }
    /**
     * 调用组件的 setInventory 方法
     */
    setInventory(type, item, tier, value) {
      const proxy = this.getProxy();
      if (!proxy) {
        logger.warn("⚠️ 无法获取组件 proxy 对象");
        return false;
      }
      if (typeof proxy.setInventory !== "function") {
        logger.warn("⚠️ setInventory 方法不存在");
        return false;
      }
      try {
        proxy.setInventory(type, item, tier, value);
        return true;
      } catch (error) {
        logger.error("❌ 调用 setInventory 失败:", error);
        return false;
      }
    }
    /**
     * 获取组件的 characters 数据
     */
    getCharacters() {
      const proxy = this.getProxy();
      return proxy?.characters || {};
    }
    /**
     * 获取组件的 weapons 数据
     */
    getWeapons() {
      const proxy = this.getProxy();
      return proxy?.weapons || {};
    }
    /**
     * 获取组件的 goals 数据
     */
    getGoals() {
      const proxy = this.getProxy();
      return proxy?.goals || [];
    }
    /**
     * 获取组件的 items 数据
     */
    getItems() {
      const proxy = this.getProxy();
      return proxy?.items || {};
    }
    /**
     * 获取完整的组件上下文信息（调试用）
     */
    getContextInfo() {
      const proxy = this.getProxy();
      if (!proxy) {
        return null;
      }
      return {
        keys: Object.keys(proxy),
        accountResin: proxy.accountResin,
        hasAccountResin: "accountResin" in proxy,
        contextType: typeof proxy
      };
    }
    /**
     * 重新初始化（当页面路由变化时调用）
     */
    refresh() {
      logger.debug("🔄 SeelieCore 重新初始化...");
      this.appElement = null;
      this.rootComponent = null;
      this.init();
    }
  }
  async function calculateCharacterAsc(character) {
    try {
      const characterStats = await getCharacterStats();
      const stats = characterStats.find((s) => s.id === character.id);
      if (!stats) {
        logger.warn(`⚠️ 未找到角色 ${character.name_mi18n} 的统计数据`);
        return ASCENSIONS.findIndex((level) => level >= character.level);
      }
      const hpProperty = character.properties.find((p) => p.property_id === 1);
      if (!hpProperty) {
        logger.warn(`⚠️ 角色 ${character.name_mi18n} 缺少生命值属性`);
        return ASCENSIONS.findIndex((level) => level >= character.level);
      }
      const actualHP = parseInt(hpProperty.base || hpProperty.final);
      const baseHP = stats.base;
      const growthHP = (character.level - 1) * stats.growth / 1e4;
      const coreSkill = character.skills.find((s) => s.skill_type === 5);
      const coreHP = coreSkill && stats.core ? stats.core[coreSkill.level - 2] || 0 : 0;
      const calculatedBaseHP = baseHP + growthHP + coreHP;
      for (let i = 0; i < stats.ascHP.length; i++) {
        const ascHP = stats.ascHP[i];
        if (Math.floor(calculatedBaseHP + ascHP) === actualHP) {
          return i;
        }
      }
      logger.warn(`HP error: ${character.name_mi18n}, base: ${baseHP}, growth: ${growthHP}, core: ${coreHP}, fixed: ${calculatedBaseHP}, target: ${actualHP}`);
      return ASCENSIONS.findIndex((level) => level >= character.level);
    } catch (error) {
      logger.error("❌ 计算角色突破等级失败:", error);
      return ASCENSIONS.findIndex((level) => level >= character.level);
    }
  }
  async function calculateWeaponAsc(weapon) {
    try {
      const weaponStatsCommon = await getWeaponStatsCommon();
      const weaponStats = await getWeaponStats();
      const levelRate = weaponStatsCommon.rate[weapon.level] || 0;
      const atkProperty = weapon.main_properties.find((p) => p.property_id === 12101);
      if (!atkProperty) {
        logger.warn(`⚠️ 武器 ${weapon.name} 缺少攻击力属性`);
        return ASCENSIONS.findIndex((level) => level >= weapon.level);
      }
      const actualATK = parseInt(atkProperty.base);
      const baseATK = weaponStats[weapon.id] || 48;
      const growthATK = baseATK * levelRate / 1e4;
      const calculatedBaseATK = baseATK + growthATK;
      for (let i = 0; i < weaponStatsCommon.ascRate.length; i++) {
        const ascRate = weaponStatsCommon.ascRate[i];
        const ascATK = baseATK * ascRate / 1e4;
        if (Math.floor(calculatedBaseATK + ascATK) === actualATK) {
          return i;
        }
      }
      logger.warn(`ATK error: ${weapon.name}, base: ${baseATK}, growth: ${growthATK}, fixed: ${calculatedBaseATK}, target: ${actualATK}`);
      return ASCENSIONS.findIndex((level) => level >= weapon.level);
    } catch (error) {
      logger.error("❌ 计算武器突破等级失败:", error);
      return ASCENSIONS.findIndex((level) => level >= weapon.level);
    }
  }
  function calculateSkillLevel(skillLevel, skillType, characterRank) {
    let currentLevel = skillLevel;
    if (skillType === "core") {
      currentLevel--;
    } else if (characterRank >= 5) {
      currentLevel -= 4;
    } else if (characterRank >= 3) {
      currentLevel -= 2;
    }
    return Math.max(1, currentLevel);
  }
  class CharacterManager extends SeelieCore {
    /**
     * 设置角色基础数据
     */
    async setCharacter(data) {
      try {
        const character = data.avatar || data;
        const characterKey = this.findCharacterKey(character.id);
        if (!characterKey) {
          throw new Error("Character not found.");
        }
        const existingGoal = this.findExistingGoal(characterKey, "character");
        const currentAsc = await calculateCharacterAsc(character);
        const existingGoalData = existingGoal;
        let targetLevel = existingGoalData?.goal?.level;
        if (!targetLevel || targetLevel < character.level) {
          targetLevel = character.level;
        }
        let targetAsc = existingGoalData?.goal?.asc;
        if (!targetAsc || targetAsc < currentAsc) {
          targetAsc = currentAsc;
        }
        const goal = {
          type: "character",
          character: characterKey,
          cons: character.rank,
          current: {
            level: character.level,
            asc: currentAsc
          },
          goal: {
            level: targetLevel || character.level,
            asc: targetAsc || currentAsc
          }
        };
        if (this.addGoal(goal)) {
          logger.debug("✓ 角色数据设置成功:", {
            character: characterKey,
            level: character.level,
            rank: character.rank,
            currentAsc,
            targetLevel,
            targetAsc
          });
          return true;
        }
        return false;
      } catch (error) {
        logger.error("❌ 设置角色数据失败:", error);
        return false;
      }
    }
    /**
     * 设置角色天赋数据
     */
    setTalents(data) {
      try {
        const character = data.avatar || data;
        const characterKey = this.findCharacterKey(character.id);
        if (!characterKey) {
          throw new Error("Character not found.");
        }
        const existingGoal = this.findExistingGoal(characterKey, "talent");
        const talents = {};
        character.skills.forEach((skill) => {
          const skillType = SKILLS[skill.skill_type];
          if (!skillType) return;
          const currentLevel = calculateSkillLevel(skill.level, skillType, character.rank);
          const existingSkillGoal = existingGoal;
          let targetLevel = existingSkillGoal?.[skillType]?.goal;
          if (!targetLevel || targetLevel < currentLevel) {
            targetLevel = currentLevel;
          }
          talents[skillType] = {
            current: currentLevel,
            goal: targetLevel || currentLevel
          };
        });
        const goal = {
          type: "talent",
          character: characterKey,
          ...talents
        };
        if (this.addGoal(goal)) {
          logger.debug("✓ 角色天赋数据设置成功:", { character: characterKey, talents });
          return true;
        }
        return false;
      } catch (error) {
        logger.error("❌ 设置角色天赋数据失败:", error);
        return false;
      }
    }
    /**
     * 设置武器数据
     */
    async setWeapon(data) {
      try {
        const character = data.avatar || data;
        const weapon = data.weapon;
        const characterKey = this.findCharacterKey(character.id);
        if (!characterKey) {
          throw new Error("Character not found.");
        }
        const existingGoal = this.findExistingGoal(characterKey, "weapon");
        if (!weapon) {
          if (existingGoal && this.removeGoal(existingGoal)) {
            logger.debug("✓ 移除武器目标成功");
          }
          return true;
        }
        const weaponKey = this.findWeaponKey(weapon.id);
        if (!weaponKey) {
          throw new Error("Weapon not found.");
        }
        const currentAsc = await calculateWeaponAsc(weapon);
        const current = {
          level: weapon.level,
          asc: currentAsc
        };
        let goal = {
          level: current.level,
          asc: current.asc
        };
        const weapons = this.getWeapons();
        const existingGoalData = existingGoal;
        const existingWeapon = existingGoalData?.weapon ? weapons[existingGoalData.weapon] : null;
        const newWeapon = weapons[weaponKey];
        if (existingWeapon?.id === newWeapon?.id && existingGoalData?.goal) {
          goal.level = Math.max(existingGoalData.goal.level || current.level, current.level);
          goal.asc = Math.max(existingGoalData.goal.asc || current.asc, current.asc);
          if (newWeapon.craftable) {
            current.craft = weapon.star;
            goal.craft = Math.max(existingGoalData.goal.craft || weapon.star, weapon.star);
          }
        } else {
          if (newWeapon.craftable) {
            current.craft = weapon.star;
            goal.craft = weapon.star;
          }
        }
        const weaponGoal = {
          type: "weapon",
          character: characterKey,
          weapon: weaponKey,
          current,
          goal
        };
        if (this.addGoal(weaponGoal)) {
          logger.debug("✓ 武器数据设置成功:", {
            character: characterKey,
            weapon: weaponKey,
            current,
            goal
          });
          return true;
        }
        return false;
      } catch (error) {
        logger.error("❌ 设置武器数据失败:", error);
        return false;
      }
    }
    /**
     * 同步单个角色的完整数据
     */
    async syncCharacter(data) {
      const result = {
        success: 0,
        failed: 0,
        errors: []
      };
      const character = data.avatar || data;
      const characterName = character.name_mi18n || `角色ID:${character.id}`;
      logger.debug(`🔄 开始同步角色: ${characterName}`);
      const operations = [
        { name: "角色数据", fn: () => this.setCharacter(data) },
        { name: "天赋数据", fn: () => this.setTalents(data) },
        { name: "武器数据", fn: () => this.setWeapon(data) }
      ];
      const operationPromises = operations.map(async ({ name, fn }) => {
        try {
          const success = await fn();
          if (success) {
            logger.debug(`✓ ${characterName} - ${name}同步成功`);
            return { success: true, error: null };
          } else {
            const errorMsg = `${characterName} - ${name}同步失败`;
            return { success: false, error: errorMsg };
          }
        } catch (error) {
          const errorMsg = `${characterName} - ${name}同步错误: ${error}`;
          logger.error(`❌ ${errorMsg}`);
          return { success: false, error: errorMsg };
        }
      });
      const results = await Promise.all(operationPromises);
      results.forEach(({ success, error }) => {
        if (success) {
          result.success++;
        } else {
          result.failed++;
          if (error) {
            result.errors.push(error);
          }
        }
      });
      if (result.failed > 0) {
        logger.warn(`⚠️ ${characterName} 同步完成 - 成功: ${result.success}, 失败: ${result.failed}`);
      } else {
        logger.debug(`✅ ${characterName} 同步完成 - 成功: ${result.success}`);
      }
      return result;
    }
    /**
     * 同步多个角色的完整数据
     */
    async syncAllCharacters(dataList) {
      const overallResult = {
        total: dataList.length,
        success: 0,
        failed: 0,
        errors: [],
        details: []
      };
      logger.debug(`🚀 开始批量同步 ${dataList.length} 个角色`);
      const syncPromises = dataList.map(async (data, index) => {
        const character = data.avatar || data;
        const characterName = character.name_mi18n || `角色ID:${character.id}`;
        logger.debug(`📝 [${index + 1}/${dataList.length}] 同步角色: ${characterName}`);
        try {
          const result = await this.syncCharacter(data);
          return {
            character: characterName,
            result,
            success: result.failed === 0
          };
        } catch (error) {
          const errorMsg = `${characterName} - 批量同步失败: ${error}`;
          logger.error(`❌ ${errorMsg}`);
          return {
            character: characterName,
            result: { success: 0, failed: 1, errors: [errorMsg] },
            success: false
          };
        }
      });
      const results = await Promise.all(syncPromises);
      results.forEach(({ character, result, success }) => {
        overallResult.details.push({
          character,
          result
        });
        if (success) {
          overallResult.success++;
        } else {
          overallResult.failed++;
          overallResult.errors.push(...result.errors);
        }
      });
      this.logBatchResult(overallResult);
      return overallResult;
    }
    /**
     * 查找角色键名
     */
    findCharacterKey(characterId) {
      const characters = this.getCharacters();
      return Object.keys(characters).find((key) => characters[key].id === characterId) || null;
    }
    /**
     * 查找武器键名
     */
    findWeaponKey(weaponId) {
      const weapons = this.getWeapons();
      return Object.keys(weapons).find((key) => weapons[key].id === weaponId) || null;
    }
    /**
     * 查找现有目标
     */
    findExistingGoal(characterKey, type) {
      const goals = this.getGoals();
      return goals.find((goal) => {
        const g = goal;
        return g.character === characterKey && g.type === type;
      });
    }
    /**
     * 记录批量同步结果
     */
    logBatchResult(result) {
      if (result.failed > 0) {
        logger.warn(`⚠️ 批量同步完成:`);
        logger.warn(`   总计: ${result.total} 个角色`);
        logger.warn(`   成功: ${result.success} 个角色`);
        logger.warn(`   失败: ${result.failed} 个角色`);
      } else {
        logger.debug(`🎯 批量同步完成:`);
        logger.debug(`   总计: ${result.total} 个角色`);
        logger.debug(`   成功: ${result.success} 个角色`);
      }
      if (result.errors.length > 0) {
        logger.warn(`   错误详情:`);
        result.errors.forEach((error) => logger.warn(`     - ${error}`));
      }
    }
    /**
     * 显示批量同步 Toast
     */
    // private showBatchToast(result: BatchSyncResult): void {
    //   if (result.success > 0) {
    //     this.setToast(
    //       `成功同步 ${result.success}/${result.total} 个角色`,
    //       result.failed === 0 ? 'success' : 'warning'
    //     )
    //   }
    //   if (result.failed > 0) {
    //     this.setToast(
    //       `${result.failed} 个角色同步失败，请查看控制台`,
    //       'error'
    //     )
    //   }
    // }
    // 辅助函数
    // 缓存变量
    _minimumSetCoverCache = null;
    _minimumSetWeaponsCache = null;
    /**
     * 使用贪心算法找到最小集合覆盖的角色ID列表
     * 目标是用最少的角色覆盖所有属性组合（属性、风格、模拟材料、周本）
     */
    findMinimumSetCoverIds() {
      if (this._minimumSetCoverCache !== null) {
        logger.debug("📦 使用缓存的最小集合覆盖结果");
        return this._minimumSetCoverCache;
      }
      const charactersData = this.getCharacters();
      const charactersArray = Object.values(charactersData);
      const universeOfAttributes = /* @__PURE__ */ new Set();
      for (const char of charactersArray) {
        universeOfAttributes.add(char.attribute);
        universeOfAttributes.add(char.style);
        universeOfAttributes.add(char.boss);
        universeOfAttributes.add(char.boss_weekly);
      }
      const attributesToCover = new Set(universeOfAttributes);
      const resultIds = [];
      const usedCharacterIds = /* @__PURE__ */ new Set();
      while (attributesToCover.size > 0) {
        let bestCharacter = null;
        let maxCoveredCount = 0;
        for (const char of charactersArray) {
          if (usedCharacterIds.has(char.id)) {
            continue;
          }
          if (new Date(char.release) > /* @__PURE__ */ new Date()) {
            continue;
          }
          const characterAttributes = /* @__PURE__ */ new Set([
            char.attribute,
            char.style,
            char.boss,
            char.boss_weekly
          ]);
          let currentCoverCount = 0;
          for (const attr of characterAttributes) {
            if (attributesToCover.has(attr)) {
              currentCoverCount++;
            }
          }
          if (currentCoverCount > maxCoveredCount) {
            maxCoveredCount = currentCoverCount;
            bestCharacter = char;
          }
        }
        if (bestCharacter === null) {
          logger.warn("⚠️ 无法覆盖所有属性，可能缺少某些属性的组合");
          break;
        }
        resultIds.push({ id: bestCharacter.id, style: bestCharacter.style });
        usedCharacterIds.add(bestCharacter.id);
        const bestCharacterAttributes = /* @__PURE__ */ new Set([
          bestCharacter.attribute,
          bestCharacter.style,
          bestCharacter.boss,
          bestCharacter.boss_weekly
        ]);
        for (const attr of bestCharacterAttributes) {
          attributesToCover.delete(attr);
        }
        logger.debug(`✅ 选择角色 ${bestCharacter.id}，覆盖 ${maxCoveredCount} 个属性`);
      }
      logger.debug(`🎯 最小集合覆盖完成，共选择 ${resultIds.length} 个角色: ${resultIds.join(", ")}`);
      this._minimumSetCoverCache = resultIds;
      return resultIds;
    }
    /**
     * 返回每个职业对应一个武器
     */
    findMinimumSetWeapons() {
      if (this._minimumSetWeaponsCache !== null) {
        logger.debug("📦 使用缓存的最小武器集合结果");
        return this._minimumSetWeaponsCache;
      }
      const weaponsData = this.getWeapons();
      const weaponsArray = Object.values(weaponsData);
      const result = {};
      for (const weapon of weaponsArray) {
        if (weapon.tier === 5 && !result[weapon.style] && /* @__PURE__ */ new Date() >= new Date(weapon.release)) {
          result[weapon.style] = weapon.id;
        }
      }
      this._minimumSetWeaponsCache = result;
      return result;
    }
  }
  class SeelieDataManager extends CharacterManager {
    // 继承所有功能，无需额外实现
  }
  const seelieDataManager = new SeelieDataManager();
  const setResinData = (data) => {
    return seelieDataManager.setAccountResin(data);
  };
  const setToast = (message, type = "success") => {
    return seelieDataManager.setToast(message, type);
  };
  const syncCharacter = async (data) => {
    return await seelieDataManager.syncCharacter(data);
  };
  const syncAllCharacters = async (dataList) => {
    return await seelieDataManager.syncAllCharacters(dataList);
  };
  const setInventory = (type, item, tier, value) => {
    return seelieDataManager.setInventory(type, item, tier, value);
  };
  const findMinimumSetCoverIds = () => {
    return seelieDataManager.findMinimumSetCoverIds();
  };
  const findMinimumSetWeapons = () => {
    return seelieDataManager.findMinimumSetWeapons();
  };
  const getItems = () => {
    return seelieDataManager.getItems();
  };
  var SkillType = /* @__PURE__ */ ((SkillType2) => {
    SkillType2[SkillType2["NormalAttack"] = 0] = "NormalAttack";
    SkillType2[SkillType2["SpecialSkill"] = 1] = "SpecialSkill";
    SkillType2[SkillType2["Dodge"] = 2] = "Dodge";
    SkillType2[SkillType2["Chain"] = 3] = "Chain";
    SkillType2[SkillType2["CorePassive"] = 5] = "CorePassive";
    SkillType2[SkillType2["SupportSkill"] = 6] = "SupportSkill";
    return SkillType2;
  })(SkillType || {});
  async function getAvatarItemCalc(avatar_id, weapon_id, uid, region) {
    const userInfo = await resolveUserInfo(uid, region);
    logger.debug(`🧮 开始计算养成材料: avatar=${avatar_id}, weapon=${weapon_id}`);
    const body = {
      avatar_id: Number(avatar_id),
      avatar_level: ASCENSIONS[ASCENSIONS.length - 1],
      // 最大等级
      avatar_current_level: 1,
      avatar_current_promotes: 1,
      skills: Object.values(SkillType).filter((value) => typeof value !== "string").map((skillType) => ({
        skill_type: skillType,
        level: skillType === SkillType.CorePassive ? 7 : 12,
        init_level: 1
        // 初始
      })),
      weapon_info: {
        weapon_id: Number(weapon_id),
        weapon_level: ASCENSIONS[ASCENSIONS.length - 1],
        weapon_promotes: 0,
        weapon_init_level: 0
      }
    };
    const response = await request("/user/avatar_calc", NAP_CULTIVATE_TOOL_URL, {
      method: "POST",
      params: { uid: userInfo.uid, region: userInfo.region },
      body
    });
    logger.debug(`✅ 养成材料计算完成: avatar=${avatar_id}, weapon=${weapon_id}`);
    return response.data;
  }
  async function batchGetAvatarItemCalc(calcAvatars, uid, region) {
    if (calcAvatars.length === 0) {
      logger.warn("⚠️ 批量养成材料计算参数为空，返回空列表");
      return [];
    }
    logger.debug(`📦 开始批量养成材料计算: ${calcAvatars.length} 个角色`);
    const promises = calcAvatars.map(
      (item) => getAvatarItemCalc(item.avatar_id, item.weapon_id, uid, region)
    );
    const result = await Promise.all(promises);
    logger.debug(`✅ 批量养成材料计算完成: ${result.length} 个结果`);
    return result;
  }
  function collectAllItemsInfo(itemsData) {
    const allItemsInfo = {};
    for (const data of itemsData) {
      const allConsumes = [
        ...data.avatar_consume,
        ...data.weapon_consume,
        ...data.skill_consume,
        ...data.need_get
      ];
      for (const item of allConsumes) {
        const id = item.id.toString();
        if (!(id in allItemsInfo)) {
          allItemsInfo[id] = {
            id: item.id,
            name: item.name
          };
        }
      }
    }
    return allItemsInfo;
  }
  function buildItemsInventory(itemsData, allItemsInfo) {
    const inventory = {};
    const userOwnItems = {};
    for (const data of itemsData) {
      Object.assign(userOwnItems, data.user_owns_materials);
    }
    for (const [id, itemInfo] of Object.entries(allItemsInfo)) {
      const count = userOwnItems[id] || 0;
      inventory[itemInfo.name] = count;
    }
    return inventory;
  }
  function buildCnToSeelieNameMapping(i18nData) {
    const mapping = {};
    for (const [key, value] of Object.entries(i18nData)) {
      if (typeof value === "string") {
        mapping[value] = key;
      } else if (Array.isArray(value)) {
        value.forEach((v, index) => {
          mapping[v] = `${key}+${index}`;
        });
      }
    }
    return mapping;
  }
  function syncItemsToSeelie(itemsInventory, cnName2SeelieItemName, seelieItems) {
    let successNum = 0;
    let failNum = 0;
    for (const [cnName, count] of Object.entries(itemsInventory)) {
      const seelieName = cnName2SeelieItemName[cnName];
      if (!seelieName) {
        failNum++;
        continue;
      }
      try {
        const seelieNameParts = seelieName.split("+");
        if (seelieNameParts.length > 1) {
          const realName = seelieNameParts[0];
          const tier = Number(seelieNameParts[1]);
          const type = seelieItems[realName].type;
          if (type && setInventory(type, realName, tier, count)) {
            successNum++;
          } else {
            failNum++;
          }
        } else {
          const type = seelieItems[seelieName]?.type;
          if (type && setInventory(type, seelieName, 0, count)) {
            successNum++;
          } else {
            failNum++;
          }
        }
      } catch {
        failNum++;
      }
    }
    return { successNum, failNum };
  }
  function buildUserOwnItemsById(itemsData) {
    const merged = {};
    for (const data of itemsData) {
      const allConsumes = [
        ...data.avatar_consume,
        ...data.weapon_consume,
        ...data.skill_consume,
        ...data.need_get
      ];
      for (const item of allConsumes) {
        const id = item.id.toString();
        if (!(id in merged)) {
          merged[id] = 0;
        }
      }
      for (const [id, count] of Object.entries(data.user_owns_materials)) {
        merged[id] = Math.max(merged[id] ?? 0, count);
      }
    }
    return merged;
  }
  function buildItemIdToSeelieIndex(seelieItems, coinId) {
    const index = /* @__PURE__ */ new Map();
    for (const [key, item] of Object.entries(seelieItems)) {
      if (item.id != null) {
        index.set(item.id, { key, tier: 0, type: item.type });
      }
      if (item.ids) {
        for (let i = 0; i < item.ids.length; i++) {
          index.set(item.ids[i], { key, tier: i, type: item.type });
        }
      }
    }
    if (coinId != null && !index.has(coinId)) {
      index.set(coinId, { key: "denny", tier: 0, type: "denny" });
    }
    return index;
  }
  function syncItemsToSeelieById(userOwnById, idIndex) {
    let successNum = 0;
    let failNum = 0;
    const unknownIds = [];
    for (const [idStr, count] of Object.entries(userOwnById)) {
      const id = Number(idStr);
      const entry = idIndex.get(id);
      if (!entry) {
        unknownIds.push(idStr);
        failNum++;
        continue;
      }
      try {
        if (setInventory(entry.type, entry.key, entry.tier, count)) {
          successNum++;
        } else {
          failNum++;
          logger.warn(`⚠️ setInventory 失败: id=${idStr}, key=${entry.key}`);
        }
      } catch (error) {
        failNum++;
        logger.error(`❌ setInventory 异常: id=${idStr}`, error);
      }
    }
    if (unknownIds.length > 0) {
      logger.warn(`⚠️ ID 映射未命中 ${unknownIds.length} 项:`, unknownIds);
    }
    return { successNum, failNum, unknownIds };
  }
  class SyncService {
    shouldNotify(options) {
      return options?.notify !== false;
    }
    buildErrorFeedback(message, error) {
      if (!error) {
        return {
          summary: message,
          toast: `${message}，请稍后重试`
        };
      }
      const summary = `${message}：${getHoyoErrorSummary(error)}`;
      const suggestion = getHoyoErrorSuggestion(error);
      return {
        summary,
        toast: `${message}，${suggestion}`
      };
    }
    /**
     * 布尔任务失败处理（日志 + Toast + 统一返回）
     */
    failBooleanTask(message, error, notify = true) {
      const feedback = this.buildErrorFeedback(message, error);
      logger.error(`❌ ${feedback.summary}`, error);
      if (notify) {
        setToast(feedback.toast, "error");
      }
      return false;
    }
    /**
     * 单角色同步任务失败处理
     */
    failSyncResult(message, error, notify = true) {
      const feedback = this.buildErrorFeedback(message, error);
      logger.error(`❌ ${feedback.summary}`, error);
      if (notify) {
        setToast(feedback.toast, "error");
      }
      return {
        success: 0,
        failed: 1,
        errors: error ? [feedback.summary] : [message]
      };
    }
    /**
     * 批量角色同步失败处理
     */
    failBatchSyncResult(message, error, notify = true) {
      const feedback = this.buildErrorFeedback(message, error);
      logger.error(`❌ ${feedback.summary}`, error);
      if (notify) {
        setToast(feedback.toast, "error");
      }
      return {
        success: 0,
        failed: 1,
        errors: error ? [feedback.summary] : [message],
        total: 0,
        details: []
      };
    }
    /**
     * 养成材料同步失败处理
     */
    failItemsSyncResult(message, error, notify = true) {
      const feedback = this.buildErrorFeedback(message, error);
      logger.error(`❌ ${feedback.summary}`, error);
      if (notify) {
        setToast(feedback.toast, "error");
      }
      return {
        success: false,
        partial: false,
        successNum: 0,
        failNum: 0
      };
    }
    /**
     * 布尔任务执行模板（统一捕获并转为 failBooleanTask）
     */
    async executeBooleanTask(executor, failMessage, notify = true) {
      try {
        return await executor();
      } catch (error) {
        return this.failBooleanTask(failMessage, error, notify);
      }
    }
    /**
     * 单体结果任务执行模板（统一捕获并转为 failSyncResult）
     */
    async executeSyncResultTask(executor, failMessage, notify = true) {
      try {
        return await executor();
      } catch (error) {
        return this.failSyncResult(failMessage, error, notify);
      }
    }
    /**
     * 批量结果任务执行模板（统一捕获并转为 failBatchSyncResult）
     */
    async executeBatchSyncTask(executor, failMessage, notify = true) {
      try {
        return await executor();
      } catch (error) {
        return this.failBatchSyncResult(failMessage, error, notify);
      }
    }
    /**
     * 同步电量（树脂）数据
     */
    async syncResinData(options) {
      const notify = this.shouldNotify(options);
      return this.executeBooleanTask(async () => {
        logger.info("🔋 开始同步电量数据...");
        const gameNote = await getGameNote();
        if (!gameNote) {
          return this.failBooleanTask("获取游戏便笺失败", void 0, notify);
        }
        const resinData = gameNote.energy;
        const success = setResinData(resinData);
        if (success) {
          logger.info("✅ 电量数据同步成功");
          if (notify) {
            setToast(`电量同步成功: ${resinData.progress.current}/${resinData.progress.max}`, "success");
          }
        } else {
          return this.failBooleanTask("电量数据设置失败", void 0, notify);
        }
        return success;
      }, "电量数据同步失败", notify);
    }
    /**
     * 同步单个角色数据
     */
    async syncSingleCharacter(avatarId, options) {
      const notify = this.shouldNotify(options);
      return this.executeSyncResultTask(async () => {
        logger.info(`👤 开始同步角色数据: ${avatarId}`);
        const avatarDetails = await batchGetAvatarDetail([avatarId], void 0);
        if (!avatarDetails || avatarDetails.length === 0) {
          return this.failSyncResult("获取角色详细信息失败", void 0, notify);
        }
        const avatarDetail = avatarDetails[0];
        const result = await syncCharacter(avatarDetail);
        if (result.success > 0 && result.failed === 0) {
          logger.info(`✅ 角色 ${avatarDetail.avatar.name_mi18n} 同步成功`);
          if (notify) {
            setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步成功`, "success");
          }
        } else if (result.success > 0) {
          logger.warn(`⚠️ 角色 ${avatarDetail.avatar.name_mi18n} 同步部分成功: 成功 ${result.success}，失败 ${result.failed}`);
          if (notify) {
            setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步部分成功`, "warning");
          }
        } else {
          logger.error(`❌ 角色 ${avatarDetail.avatar.name_mi18n} 同步失败`);
          if (notify) {
            setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步失败`, "error");
          }
        }
        return result;
      }, `角色 ${avatarId} 同步失败`, notify);
    }
    /**
     * 同步所有角色数据
     */
    async syncAllCharacters(options) {
      const notify = this.shouldNotify(options);
      return this.executeBatchSyncTask(async () => {
        logger.info("👥 开始同步所有角色数据...");
        const avatarList = await getAvatarBasicList();
        if (!avatarList || avatarList.length === 0) {
          return this.failBatchSyncResult("获取角色列表失败或角色列表为空", void 0, notify);
        }
        logger.info(`📋 找到 ${avatarList.length} 个角色`);
        if (notify) {
          setToast(`开始同步 ${avatarList.length} 个角色...`, "");
        }
        const avatarIds = avatarList.map((avatar) => avatar.avatar.id);
        const avatarDetails = await batchGetAvatarDetail(avatarIds, void 0);
        if (!avatarDetails || avatarDetails.length === 0) {
          return this.failBatchSyncResult("获取角色详细信息失败", void 0, notify);
        }
        const batchResult = await syncAllCharacters(avatarDetails);
        if (batchResult.success > 0 && batchResult.failed === 0) {
          logger.info(`✅ 所有角色同步完成: 成功 ${batchResult.success}`);
          if (notify) {
            setToast(`角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, "success");
          }
        } else if (batchResult.success > 0) {
          logger.warn(`⚠️ 所有角色同步完成（部分失败）: 成功 ${batchResult.success}，失败 ${batchResult.failed}`);
          if (notify) {
            setToast(`角色同步部分完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, "warning");
          }
        } else {
          logger.error(`❌ 角色批量同步失败`);
          if (notify) {
            setToast("角色批量同步失败", "error");
          }
        }
        return batchResult;
      }, "所有角色同步失败", notify);
    }
    /**
     * 同步养成材料数据
     * 主路径：ID 映射；若命中率不足则降级名字映射
     */
    async syncItemsData(options) {
      const notify = this.shouldNotify(options);
      try {
        logger.info("🔋 开始同步养成材料数据...");
        const minSetChar = findMinimumSetCoverIds();
        const minSetWeapon = findMinimumSetWeapons();
        const calcParams = minSetChar.map((item) => ({
          avatar_id: item.id,
          weapon_id: minSetWeapon[item.style]
        }));
        const itemsData = await batchGetAvatarItemCalc(calcParams);
        if (!itemsData) {
          return this.failItemsSyncResult("获取养成材料数据失败", void 0, notify);
        }
        const seelieItems = getItems();
        const coinId = itemsData[0]?.coin_id;
        const idIndex = buildItemIdToSeelieIndex(seelieItems, coinId);
        if (idIndex.size > 0) {
          const userOwnById = buildUserOwnItemsById(itemsData);
          const idResult = syncItemsToSeelieById(userOwnById, idIndex);
          const total = idResult.successNum + idResult.failNum;
          const hitRate = total > 0 ? idResult.successNum / total : 0;
          logger.info(`📊 ID 映射命中率: ${(hitRate * 100).toFixed(1)}% (${idResult.successNum}/${total})`);
          if (hitRate >= 0.7) {
            return this.buildItemsSyncResult(idResult.successNum, idResult.failNum, notify, {
              mappedBy: "id",
              unknownIds: idResult.unknownIds
            });
          }
          logger.warn(`⚠️ ID 映射命中率过低 (${(hitRate * 100).toFixed(1)}%)，降级到名字映射`);
        } else {
          logger.warn("⚠️ Seelie items 中无 id/ids 字段，降级到名字映射");
        }
        return await this.syncItemsByName(itemsData, seelieItems, notify);
      } catch (error) {
        return this.failItemsSyncResult("养成材料同步失败", error, notify);
      }
    }
    /**
     * 名字映射路径（fallback）
     */
    async syncItemsByName(itemsData, seelieItems, notify) {
      const allItemsInfo = collectAllItemsInfo(itemsData);
      const itemsInventory = buildItemsInventory(itemsData, allItemsInfo);
      seelieItems["denny"] = { type: "denny" };
      const i18nData = await getLanguageData();
      if (!i18nData) {
        return this.failItemsSyncResult("获取语言数据失败（名字映射降级）", void 0, notify);
      }
      const cnName2SeelieItemName = buildCnToSeelieNameMapping(i18nData);
      const { successNum, failNum } = syncItemsToSeelie(itemsInventory, cnName2SeelieItemName, seelieItems);
      return this.buildItemsSyncResult(successNum, failNum, notify, { mappedBy: "name-fallback" });
    }
    /**
     * 构建统一的 ItemsSyncResult 并输出日志/Toast
     */
    buildItemsSyncResult(successNum, failNum, notify, extra) {
      const hasSuccess = successNum > 0;
      const total = successNum + failNum;
      const isPartial = hasSuccess && failNum > 0;
      logger.info(`📦 材料同步策略: ${extra.mappedBy}`);
      if (hasSuccess && !isPartial) {
        logger.info(`✅ 养成材料同步成功: ${successNum}/${total}`);
        if (notify) {
          setToast(`养成材料同步完成: 成功 ${successNum}，失败 ${failNum}`, "success");
        }
        return { success: true, partial: false, successNum, failNum, ...extra };
      } else if (hasSuccess) {
        logger.warn(`⚠️ 养成材料同步部分成功: ${successNum}/${total}`);
        if (notify) {
          setToast(`养成材料同步部分完成: 成功 ${successNum}，失败 ${failNum}`, "warning");
        }
        return { success: true, partial: true, successNum, failNum, ...extra };
      }
      return this.failItemsSyncResult("养成材料同步失败", void 0, notify);
    }
    /**
     * 执行完整同步（电量 + 所有角色 + 养成材料）
     */
    async syncAll() {
      logger.info("🚀 开始执行完整同步...");
      setToast("开始执行完整同步...", "");
      const [resinSync, characterSync, itemsResult] = await Promise.all([
        this.syncResinData({ notify: true }),
        this.syncAllCharacters({ notify: true }),
        this.syncItemsData({ notify: true })
      ]);
      const itemsSync = itemsResult.success;
      const itemsPartial = itemsResult.partial;
      const charactersAllSuccess = characterSync.success > 0 && characterSync.failed === 0;
      const totalSuccess = resinSync && charactersAllSuccess && itemsSync && !itemsPartial;
      const totalFailed = !resinSync && characterSync.success === 0 && !itemsSync;
      const itemsSummary = !itemsSync ? "失败" : itemsPartial ? `部分完成（成功 ${itemsResult.successNum}，失败 ${itemsResult.failNum}）` : "成功";
      const summary = `电量${resinSync ? "成功" : "失败"}，角色成功 ${characterSync.success} 失败 ${characterSync.failed}，养成材料${itemsSummary}`;
      if (totalSuccess) {
        logger.info(`✅ 完整同步完成：${summary}`);
        setToast(`完整同步完成：${summary}`, "success");
      } else if (totalFailed) {
        logger.error(`❌ 完整同步失败：${summary}`);
        setToast("完整同步失败，请刷新登录后重试", "error");
      } else {
        logger.warn(`⚠️ 完整同步部分完成：${summary}`);
        setToast(`完整同步部分完成：${summary}`, "warning");
      }
      return { resinSync, characterSync, itemsSync, itemsPartial };
    }
  }
  const syncService = new SyncService();
  const PLEASE_IMAGE_SELECTOR = 'img[src*="please.png"]';
  const AD_SLOT_SELECTOR = "#large-leaderboard-ad, #leaderboard-target, .pw-incontent";
  const SIGNAL_TRACKER_SELECTOR = 'a[href*="stardb.gg/zzz/signal-tracker"]';
  const LEGACY_AD_CONTAINER_SELECTOR = "div.overflow-hidden.relative.text-white:has(#leaderboard-target)";
  const MODERN_AD_CONTAINER_SELECTOR = "div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)";
  const TARGET_HOST$1 = "zzz.seelie.me";
  const EARLY_HIDE_STYLE_ID = "seelie-ad-cleaner-style";
  const BASE_UBLOCK_RULES = [
    "! zzz-seelie-sync 强化规则（由脚本动态生成）",
    'zzz.seelie.me##img[src*="img/stickers/please.png"]',
    "zzz.seelie.me###leaderboard-target",
    "zzz.seelie.me###large-leaderboard-ad",
    "zzz.seelie.me##.pw-incontent",
    "zzz.seelie.me##div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)",
    "zzz.seelie.me##div.overflow-hidden.relative.text-white:has(#leaderboard-target)"
  ];
  const adContainerSelectors = /* @__PURE__ */ new Set([
    LEGACY_AD_CONTAINER_SELECTOR,
    MODERN_AD_CONTAINER_SELECTOR
  ]);
  const signalTrackerSelectors = /* @__PURE__ */ new Set([
    SIGNAL_TRACKER_SELECTOR
  ]);
  let initialized = false;
  let observer = null;
  let routeUnwatch = null;
  let cleanupScheduled = false;
  function getSignalTrackerSelector() {
    return Array.from(signalTrackerSelectors).join(", ");
  }
  function getCleanupTriggerSelector() {
    const signalSelector = getSignalTrackerSelector();
    if (signalSelector) {
      return `${PLEASE_IMAGE_SELECTOR}, ${AD_SLOT_SELECTOR}, ${signalSelector}`;
    }
    return `${PLEASE_IMAGE_SELECTOR}, ${AD_SLOT_SELECTOR}`;
  }
  function buildEarlyHideStyle() {
    const nodeSelectors = [PLEASE_IMAGE_SELECTOR, AD_SLOT_SELECTOR];
    const signalSelector = getSignalTrackerSelector();
    if (signalSelector) {
      nodeSelectors.push(signalSelector);
    }
    const containerSelectors = new Set(adContainerSelectors);
    containerSelectors.add(`div.overflow-hidden.relative.text-white:has(${PLEASE_IMAGE_SELECTOR})`);
    containerSelectors.add(`div.overflow-hidden.relative.text-white:has(${AD_SLOT_SELECTOR})`);
    containerSelectors.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${PLEASE_IMAGE_SELECTOR})`);
    containerSelectors.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${AD_SLOT_SELECTOR})`);
    return `
${nodeSelectors.join(",\n")} {
  display: none !important;
  visibility: hidden !important;
}

${Array.from(containerSelectors).join(",\n")} {
  display: none !important;
}
`;
  }
  function refreshEarlyHideStyleContent() {
    const style = document.getElementById(EARLY_HIDE_STYLE_ID);
    if (!style) {
      return;
    }
    style.textContent = buildEarlyHideStyle();
  }
  function injectEarlyHideStyle() {
    const existingStyle = document.getElementById(EARLY_HIDE_STYLE_ID);
    if (existingStyle) {
      existingStyle.textContent = buildEarlyHideStyle();
      return;
    }
    const style = document.createElement("style");
    style.id = EARLY_HIDE_STYLE_ID;
    style.textContent = buildEarlyHideStyle();
    const parent = document.head || document.documentElement;
    if (!parent) {
      logger.warn("⚠️ 去广告样式注入失败：未找到 head/documentElement");
      return;
    }
    parent.appendChild(style);
  }
  function removeEarlyHideStyle() {
    const style = document.getElementById(EARLY_HIDE_STYLE_ID);
    if (style) {
      style.remove();
    }
  }
  function addAdContainerSelector(selector) {
    const normalized = selector.trim();
    if (!normalized || adContainerSelectors.has(normalized)) {
      return false;
    }
    adContainerSelectors.add(normalized);
    return true;
  }
  function addSignalTrackerSelector(selector) {
    const normalized = selector.trim();
    if (!normalized || signalTrackerSelectors.has(normalized)) {
      return false;
    }
    signalTrackerSelectors.add(normalized);
    return true;
  }
  function applyManifestHints(manifest) {
    let changed = false;
    if (manifest.adHints.usesLegacyContainer) {
      changed = addAdContainerSelector(LEGACY_AD_CONTAINER_SELECTOR) || changed;
    }
    if (manifest.adHints.usesModernContainer) {
      changed = addAdContainerSelector(MODERN_AD_CONTAINER_SELECTOR) || changed;
    }
    if (manifest.adHints.signalTrackerHref) {
      const safeHref = manifest.adHints.signalTrackerHref.replace(/"/g, '\\"');
      changed = addSignalTrackerSelector(`a[href="${safeHref}"]`) || changed;
    }
    return changed;
  }
  function hydrateRulesFromManifest() {
    const cachedManifest = getCachedSiteManifest();
    if (cachedManifest) {
      const changed = applyManifestHints(cachedManifest);
      if (changed) {
        refreshEarlyHideStyleContent();
      }
    }
    void getSiteManifest().then((manifest) => {
      const changed = applyManifestHints(manifest);
      if (!changed) {
        return;
      }
      logger.debug("🔄 已根据 site manifest 更新去广告规则");
      refreshEarlyHideStyleContent();
      scheduleCleanup();
    }).catch((error) => {
      logger.warn("⚠️ 获取 site manifest 失败，继续使用内置去广告规则:", error);
    });
  }
  function looksLikeAdContainer(element) {
    const htmlElement = element;
    const classList = htmlElement.classList;
    const hasAdSlot = element.querySelector(AD_SLOT_SELECTOR) !== null;
    const isLegacyAdContainer = classList.contains("overflow-hidden") && classList.contains("relative") && classList.contains("text-white");
    const isModernAdContainer = classList.contains("overflow-hidden") && classList.contains("relative") && classList.contains("mx-auto") && classList.contains("shrink-0");
    return hasAdSlot || isLegacyAdContainer || isModernAdContainer;
  }
  function findAdContainer(node) {
    let current = node;
    while (current && current !== document.body) {
      if (looksLikeAdContainer(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }
  function collectAdContainers() {
    const containers = /* @__PURE__ */ new Set();
    document.querySelectorAll(PLEASE_IMAGE_SELECTOR).forEach((node) => {
      const container = findAdContainer(node);
      if (container) {
        containers.add(container);
      }
    });
    document.querySelectorAll(AD_SLOT_SELECTOR).forEach((node) => {
      const container = findAdContainer(node);
      if (container) {
        containers.add(container);
      }
    });
    return containers;
  }
  function collectSignalTrackerLinks() {
    const links = /* @__PURE__ */ new Set();
    const selector = getSignalTrackerSelector();
    if (!selector) {
      return links;
    }
    document.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLElement) {
        links.add(node);
      }
    });
    return links;
  }
  function cleanupAds() {
    const containers = collectAdContainers();
    const signalTrackerLinks = collectSignalTrackerLinks();
    containers.forEach((container) => {
      container.remove();
    });
    signalTrackerLinks.forEach((link) => {
      link.remove();
    });
    const removedCount = containers.size + signalTrackerLinks.size;
    if (removedCount > 0) {
      logger.info(
        `🧹 已移除广告节点 ${removedCount} 个（横幅: ${containers.size}，Signal Tracker: ${signalTrackerLinks.size}）`
      );
    }
    return removedCount;
  }
  function scheduleCleanup() {
    if (cleanupScheduled) {
      return;
    }
    cleanupScheduled = true;
    queueMicrotask(() => {
      cleanupScheduled = false;
      cleanupAds();
    });
  }
  function shouldTriggerCleanup(mutations) {
    const cleanupTriggerSelector = getCleanupTriggerSelector();
    return mutations.some((mutation) => {
      if (mutation.type === "attributes") {
        const target = mutation.target;
        if (target instanceof Element) {
          return target.matches(cleanupTriggerSelector) || target.querySelector(cleanupTriggerSelector) !== null;
        }
        return false;
      }
      return Array.from(mutation.addedNodes).some((node) => {
        if (!(node instanceof Element)) {
          return false;
        }
        return node.matches(cleanupTriggerSelector) || node.querySelector(cleanupTriggerSelector) !== null;
      });
    });
  }
  function setupObserver() {
    if (observer || !document.body) {
      return;
    }
    observer = new MutationObserver((mutations) => {
      if (shouldTriggerCleanup(mutations)) {
        scheduleCleanup();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "class", "id"]
    });
  }
  function startCleanerRuntime() {
    if (initialized || !document.body) {
      return;
    }
    initialized = true;
    cleanupAds();
    setupObserver();
    const { unwatch } = useRouterWatcher(
      () => {
        scheduleCleanup();
      },
      {
        delay: 0,
        immediate: true
      }
    );
    routeUnwatch = unwatch;
    logger.info("✅ 去广告模块已启动（manifest + fallback）");
  }
  function buildUBlockRules() {
    const rules = new Set(BASE_UBLOCK_RULES);
    adContainerSelectors.forEach((selector) => {
      rules.add(`zzz.seelie.me##${selector}`);
    });
    signalTrackerSelectors.forEach((selector) => {
      rules.add(`zzz.seelie.me##${selector}`);
    });
    return Array.from(rules);
  }
  function getUBlockRulesText() {
    return buildUBlockRules().join("\n");
  }
  function initAdCleaner() {
    if (window.location.hostname !== TARGET_HOST$1) {
      logger.debug(`去广告模块跳过，当前域名: ${window.location.hostname}`);
      return;
    }
    hydrateRulesFromManifest();
    injectEarlyHideStyle();
    if (initialized) {
      logger.debug("去广告模块已初始化，跳过重复初始化");
      return;
    }
    if (!document.body) {
      window.addEventListener("DOMContentLoaded", () => {
        startCleanerRuntime();
      }, { once: true });
      return;
    }
    startCleanerRuntime();
  }
  function destroyAdCleaner() {
    cleanupScheduled = false;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (routeUnwatch) {
      routeUnwatch();
      routeUnwatch = null;
    }
    removeEarlyHideStyle();
    initialized = false;
    logger.debug("🗑️ 去广告模块已停止");
  }
  const TARGET_HOST = "zzz.seelie.me";
  const AD_CLEANER_ENABLED_KEY = "seelie_ad_cleaner_enabled";
  const AD_CLEANER_ENABLED_DEFAULT = true;
  function isTargetHost() {
    return window.location.hostname === TARGET_HOST;
  }
  function safeReadAdCleanerEnabled() {
    try {
      const value = localStorage.getItem(AD_CLEANER_ENABLED_KEY);
      if (value === null) {
        return AD_CLEANER_ENABLED_DEFAULT;
      }
      return value === "1";
    } catch (error) {
      logger.warn("读取去广告开关失败，使用默认值:", error);
      return AD_CLEANER_ENABLED_DEFAULT;
    }
  }
  function safeWriteAdCleanerEnabled(enabled) {
    try {
      localStorage.setItem(AD_CLEANER_ENABLED_KEY, enabled ? "1" : "0");
    } catch (error) {
      logger.warn("写入去广告开关失败:", error);
    }
  }
  function applyAdCleanerEnabled(enabled) {
    if (enabled) {
      initAdCleaner();
      return;
    }
    destroyAdCleaner();
  }
  function isAdCleanerSettingAvailable() {
    return isTargetHost();
  }
  function getAdCleanerEnabled() {
    return safeReadAdCleanerEnabled();
  }
  function setAdCleanerEnabled(enabled) {
    safeWriteAdCleanerEnabled(enabled);
    applyAdCleanerEnabled(enabled);
  }
  async function copyAdCleanerRules() {
    const rules = getUBlockRulesText();
    if (!navigator?.clipboard?.writeText) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(rules);
      return true;
    } catch (error) {
      logger.warn("复制 uBlock 规则失败:", error);
      return false;
    }
  }
  function initAdCleanerSettings() {
    if (!isTargetHost()) {
      return;
    }
    applyAdCleanerEnabled(safeReadAdCleanerEnabled());
  }
  const SETTINGS_STYLE_ID = "ZSS-settings-style";
  function ensureSettingsStyles() {
    if (document.getElementById(SETTINGS_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SETTINGS_STYLE_ID;
    style.textContent = `
/* ── 设置入口按钮 ── */
.ZSS-settings-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 20px;
  border-radius: 6px;
  border: 1px solid #dbe1eb33;
  background: rgba(49, 50, 77, 0.55);
  color: rgb(148 156 182);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
  line-height: 1;
}
.ZSS-settings-btn:hover {
  color: rgb(255 255 255);
  border-color: #dbe1eb55;
  background: rgba(72, 75, 106, 0.8);
}
.ZSS-settings-btn .ZSS-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.ZSS-settings-btn:hover .ZSS-icon {
  transform: rotate(45deg);
}

/* ── icon 尺寸通用约束 ── */
.ZSS-icon {
  display: inline-block;
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1);
}

/* ── Modal overlay ── */
.ZSS-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  transition: background 0.25s ease, backdrop-filter 0.25s ease;
}
.ZSS-modal-overlay.ZSS-open {
  background: rgba(7, 4, 21, 0.55);
  backdrop-filter: blur(4px);
}

/* ── Modal dialog ── */
.ZSS-modal-dialog {
  width: 100%;
  max-width: 380px;
  border-radius: 12px;
  border: 1px solid #dbe1eb33;
  background: rgb(31 30 54);
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
  overflow: hidden;
  transform: translateY(16px) scale(0.97);
  opacity: 0;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s ease;
}
.ZSS-modal-overlay.ZSS-open .ZSS-modal-dialog {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* ── Modal header ── */
.ZSS-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #dbe1eb1f;
}
.ZSS-modal-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: rgb(255 255 255);
}
.ZSS-modal-title .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgb(148 156 182);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.ZSS-modal-close:hover {
  background: rgba(72, 75, 106, 0.65);
  color: rgb(255 255 255);
}
.ZSS-modal-close .ZSS-icon {
  width: 16px;
  height: 16px;
}

/* ── Modal body ── */
.ZSS-modal-body {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Setting card ── */
.ZSS-card {
  border-radius: 8px;
  border: 1px solid #dbe1eb26;
  background: rgba(49, 50, 77, 0.28);
  padding: 12px 14px;
}

/* ── Toggle row（带开关的设置行） ── */
.ZSS-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ZSS-toggle-row > .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-toggle-info {
  flex: 1;
  min-width: 0;
}
.ZSS-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: rgb(255 255 255);
  line-height: 1.3;
}
.ZSS-toggle-desc {
  font-size: 11px;
  color: rgb(148 156 182);
  margin-top: 2px;
  line-height: 1.4;
}

/* ── Toggle 开关 ── */
.ZSS-switch {
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}
.ZSS-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.ZSS-switch-track {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgb(72 75 106);
  transition: background 0.2s ease;
}
.ZSS-switch input:checked + .ZSS-switch-track {
  background: rgb(139 92 246);
}
.ZSS-switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
  transition: transform 0.2s cubic-bezier(.4,0,.2,1);
}
.ZSS-switch input:checked ~ .ZSS-switch-knob {
  transform: translateX(16px);
}

/* ── Action row（带按钮的设置行） ── */
.ZSS-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ZSS-action-row > .ZSS-icon {
  width: 16px;
  height: 16px;
  color: rgb(167 139 250);
}
.ZSS-action-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(255 255 255);
  background: rgba(49, 50, 77, 0.6);
  border: 1px solid #dbe1eb33;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.ZSS-action-btn:hover {
  border-color: #dbe1eb55;
  color: rgb(255 255 255);
  background: rgba(72, 75, 106, 0.85);
}
.ZSS-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── uBlock section ── */
.ZSS-ublock-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  margin-top: 10px;
  padding: 7px 0;
}
.ZSS-ublock-copy.is-loading {
  opacity: 0.7;
  cursor: wait;
}
.ZSS-ublock-copy.is-success {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}
.ZSS-ublock-copy.is-success:hover {
  border-color: #22c55e;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}
.ZSS-ublock-copy.is-error {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
}
.ZSS-ublock-copy.is-error:hover {
  border-color: #f59e0b;
  color: #fde68a;
  background: rgba(245, 158, 11, 0.12);
}
.ZSS-ublock-copy .ZSS-icon {
  width: 13px;
  height: 13px;
}

/* ── Modal footer ── */
.ZSS-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 18px;
  border-top: 1px solid #dbe1eb1f;
}
.ZSS-modal-footer-btn {
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(255 255 255);
  background: rgba(49, 50, 77, 0.6);
  border: 1px solid #dbe1eb33;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.ZSS-modal-footer-btn:hover {
  border-color: #dbe1eb55;
  color: rgb(255 255 255);
  background: rgba(72, 75, 106, 0.85);
}
  `;
    (document.head || document.documentElement).appendChild(style);
  }
  function icon$1(svg) {
    return `<span class="ZSS-icon">${svg}</span>`;
  }
  const SVG$1 = {
    gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>`
  };
  function createSettingsButton(onClick) {
    ensureSettingsStyles();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ZSS-settings-btn";
    btn.innerHTML = `${icon$1(SVG$1.gear)}<span>设置</span>`;
    btn.addEventListener("click", onClick);
    return btn;
  }
  function createSettingsModalView(actions) {
    ensureSettingsStyles();
    const overlay = document.createElement("div");
    overlay.className = "ZSS-modal-overlay";
    overlay.setAttribute("data-seelie-settings-modal", "true");
    const dialog = document.createElement("div");
    dialog.className = "ZSS-modal-dialog";
    const header = document.createElement("div");
    header.className = "ZSS-modal-header";
    const title = document.createElement("div");
    title.className = "ZSS-modal-title";
    title.innerHTML = `${icon$1(SVG$1.gear)}脚本设置`;
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ZSS-modal-close";
    closeBtn.innerHTML = icon$1(SVG$1.close);
    closeBtn.addEventListener("click", actions.onClose);
    header.append(title, closeBtn);
    const body = document.createElement("div");
    body.className = "ZSS-modal-body";
    if (isAdCleanerSettingAvailable()) {
      body.append(
        buildAdCleanerCard(actions),
        buildUBlockCard(actions)
      );
    }
    body.appendChild(buildResetDeviceCard(actions));
    const footer = document.createElement("div");
    footer.className = "ZSS-modal-footer";
    const footerBtn = document.createElement("button");
    footerBtn.type = "button";
    footerBtn.className = "ZSS-modal-footer-btn";
    footerBtn.textContent = "关闭";
    footerBtn.addEventListener("click", actions.onClose);
    footer.appendChild(footerBtn);
    dialog.append(header, body, footer);
    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) actions.onClose();
    });
    dialog.addEventListener("click", (e) => e.stopPropagation());
    requestAnimationFrame(() => overlay.classList.add("ZSS-open"));
    return overlay;
  }
  function buildAdCleanerCard(actions) {
    const card = document.createElement("div");
    card.className = "ZSS-card";
    const row = document.createElement("div");
    row.className = "ZSS-toggle-row";
    const iconEl = document.createElement("span");
    iconEl.className = "ZSS-icon";
    iconEl.innerHTML = SVG$1.shield;
    const info = document.createElement("div");
    info.className = "ZSS-toggle-info";
    const label = document.createElement("div");
    label.className = "ZSS-toggle-label";
    label.textContent = "脚本去广告";
    const desc = document.createElement("div");
    desc.className = "ZSS-toggle-desc";
    desc.textContent = "关闭后将停止脚本内的去广告逻辑";
    info.append(label, desc);
    const toggle = document.createElement("label");
    toggle.className = "ZSS-switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = getAdCleanerEnabled();
    input.addEventListener("change", () => actions.onToggleAdCleaner(input.checked));
    const track = document.createElement("span");
    track.className = "ZSS-switch-track";
    const knob = document.createElement("span");
    knob.className = "ZSS-switch-knob";
    toggle.append(input, track, knob);
    row.append(iconEl, info, toggle);
    card.appendChild(row);
    return card;
  }
  function buildUBlockCard(actions) {
    const card = document.createElement("div");
    card.className = "ZSS-card";
    const row = document.createElement("div");
    row.className = "ZSS-action-row";
    const iconEl = document.createElement("span");
    iconEl.className = "ZSS-icon";
    iconEl.innerHTML = SVG$1.filter;
    const info = document.createElement("div");
    info.className = "ZSS-toggle-info";
    const label = document.createElement("div");
    label.className = "ZSS-toggle-label";
    label.textContent = "uBlock Origin 规则";
    const desc = document.createElement("div");
    desc.className = "ZSS-toggle-desc";
    desc.textContent = "复制到「我的过滤器」，在浏览器层拦截广告";
    info.append(label, desc);
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "ZSS-action-btn ZSS-ublock-copy";
    copyBtn.innerHTML = `${icon$1(SVG$1.copy)}<span class="ZSS-ublock-copy-text">复制规则到剪贴板</span>`;
    const copyText = copyBtn.querySelector(".ZSS-ublock-copy-text");
    let resetTimer = null;
    const setCopyButtonState = (state) => {
      copyBtn.classList.remove("is-loading", "is-success", "is-error");
      copyBtn.disabled = false;
      if (state === "loading") {
        copyBtn.classList.add("is-loading");
        copyBtn.disabled = true;
        copyText.textContent = "复制中…";
        return;
      }
      if (state === "success") {
        copyBtn.classList.add("is-success");
        copyText.textContent = "已复制";
        return;
      }
      if (state === "error") {
        copyBtn.classList.add("is-error");
        copyText.textContent = "复制失败";
        return;
      }
      copyText.textContent = "复制规则到剪贴板";
    };
    copyBtn.addEventListener("click", async () => {
      if (resetTimer !== null) {
        window.clearTimeout(resetTimer);
        resetTimer = null;
      }
      setCopyButtonState("loading");
      try {
        const copied = await actions.onCopyUBlockRules();
        setCopyButtonState(copied ? "success" : "error");
      } catch {
        setCopyButtonState("error");
      }
      resetTimer = window.setTimeout(() => {
        setCopyButtonState("idle");
        resetTimer = null;
      }, 1800);
    });
    row.append(iconEl, info);
    card.append(row, copyBtn);
    return card;
  }
  function buildResetDeviceCard(actions) {
    const card = document.createElement("div");
    card.className = "ZSS-card";
    const row = document.createElement("div");
    row.className = "ZSS-action-row";
    const iconEl = document.createElement("span");
    iconEl.className = "ZSS-icon";
    iconEl.innerHTML = SVG$1.refresh;
    const info = document.createElement("div");
    info.className = "ZSS-toggle-info";
    const label = document.createElement("div");
    label.className = "ZSS-toggle-label";
    label.textContent = "重置设备信息";
    const desc = document.createElement("div");
    desc.className = "ZSS-toggle-desc";
    desc.textContent = "同步遇到 1034 设备异常时使用";
    info.append(label, desc);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ZSS-action-btn";
    btn.textContent = "重置";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "重置中…";
      try {
        await actions.onResetDevice();
      } finally {
        btn.disabled = false;
        btn.textContent = "重置";
      }
    });
    row.append(iconEl, info, btn);
    card.appendChild(row);
    return card;
  }
  function mapUserInfoError(error) {
    const message = String(error);
    if (message.includes("获取用户角色失败") || message.includes("未登录") || message.includes("stoken") || message.includes("ltoken") || message.includes("e_nap_token") || message.includes("扫码登录") || message.includes("HTTP 401") || message.includes("HTTP 403")) {
      return { error: "login_required", message: "请先扫码登录" };
    }
    if (message.includes("未找到绝区零游戏角色")) {
      return { error: "no_character", message: "未找到绝区零游戏角色" };
    }
    if (message.includes("网络") || message.includes("timeout") || message.includes("fetch")) {
      return { error: "network_error", message: "网络连接失败，请重试" };
    }
    return { error: "unknown", message: "用户信息加载失败" };
  }
  const SYNC_OPTION_CONFIGS = [
    {
      action: "resin",
      text: "同步电量",
      icon: `<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>`
    },
    {
      action: "characters",
      text: "同步角色",
      icon: `<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>`
    },
    {
      action: "items",
      text: "同步材料",
      icon: `<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
    </svg>`
    },
    {
      action: "reset_device",
      text: "重置设备",
      icon: `<svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15M12 3v9m0 0l-3-3m3 3l3-3"></path>
    </svg>`
    }
  ];
  function summarizeCharacterSync(characterSync) {
    const total = characterSync.total > 0 ? characterSync.total : characterSync.success + characterSync.failed;
    if (characterSync.success > 0 && characterSync.failed === 0) {
      return {
        status: "success",
        summary: `角色同步成功（${characterSync.success}/${total}）`
      };
    }
    if (characterSync.success > 0) {
      return {
        status: "partial",
        summary: `角色同步部分完成（成功 ${characterSync.success}，失败 ${characterSync.failed}）`
      };
    }
    return {
      status: "failed",
      summary: "角色同步失败"
    };
  }
  function buildFullSyncFeedback(result) {
    const { resinSync, characterSync, itemsSync, itemsPartial } = result;
    const characterSummary = summarizeCharacterSync(characterSync);
    const itemsSummary = !itemsSync ? "养成材料同步失败" : itemsPartial ? "养成材料同步部分完成" : "养成材料同步成功";
    const details = [
      resinSync ? "电量同步成功" : "电量同步失败",
      characterSummary.summary,
      itemsSummary
    ];
    if (characterSync.errors.length > 0) {
      const topErrors = characterSync.errors.slice(0, 2).join("；");
      details.push(`角色错误摘要：${topErrors}`);
    }
    const allSuccess = resinSync && characterSummary.status === "success" && itemsSync && !itemsPartial;
    const allFailed = !resinSync && characterSummary.status === "failed" && !itemsSync;
    if (allSuccess) {
      return {
        status: "success",
        summary: "完整同步成功",
        details
      };
    }
    if (allFailed) {
      return {
        status: "failed",
        summary: "完整同步失败，请检查登录状态和网络后重试",
        details
      };
    }
    return {
      status: "partial",
      summary: `完整同步部分完成：角色成功 ${characterSync.success}，失败 ${characterSync.failed}，养成材料${itemsSync ? itemsPartial ? "部分完成" : "成功" : "失败"}`,
      details
    };
  }
  function createActionButton(className, text, onClick) {
    const button = document.createElement("button");
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }
  function createHint(text) {
    const hint = document.createElement("div");
    hint.className = "ZSS-error-hint";
    hint.textContent = text;
    return hint;
  }
  function createUserInfoErrorView(errorInfo, actions) {
    const errorContainer = document.createElement("div");
    errorContainer.className = "ZSS-error-container";
    const errorIcon = document.createElement("div");
    errorIcon.className = "ZSS-error-icon";
    errorIcon.innerHTML = `
    <svg class="ZSS-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
  `;
    const errorMessage = document.createElement("div");
    errorMessage.className = "ZSS-error-message";
    errorMessage.textContent = errorInfo.message;
    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorMessage);
    if (errorInfo.error === "login_required") {
      errorContainer.appendChild(createHint("请使用扫码登录完成鉴权"));
      if (actions.onStartQRLogin) {
        errorContainer.appendChild(
          createActionButton(
            "ZSS-action-button ZSS-action-button--login",
            "扫码登录",
            actions.onStartQRLogin
          )
        );
      }
      return errorContainer;
    }
    if (errorInfo.error === "no_character") {
      errorContainer.appendChild(createHint("请先绑定绝区零游戏角色后再扫码登录"));
      return errorContainer;
    }
    if (errorInfo.error === "network_error") {
      errorContainer.appendChild(createHint("请检查网络或代理设置后重试，必要时刷新登录状态"));
      errorContainer.appendChild(
        createActionButton(
          "ZSS-action-button ZSS-action-button--retry-network",
          "重试",
          actions.onRetry
        )
      );
      return errorContainer;
    }
    errorContainer.appendChild(createHint("请先重试；若持续失败，请刷新页面并重新扫码登录。"));
    errorContainer.appendChild(
      createActionButton(
        "ZSS-action-button ZSS-action-button--retry-default",
        "重试",
        actions.onRetry
      )
    );
    return errorContainer;
  }
  function createUserInfoSection(userInfo, actions) {
    const section = document.createElement("div");
    section.className = "ZSS-user-section";
    const infoText = document.createElement("div");
    infoText.className = "ZSS-user-info-text";
    if (userInfo && !("error" in userInfo)) {
      const nickname = document.createElement("div");
      nickname.className = "ZSS-user-nickname";
      nickname.textContent = userInfo.nickname;
      const uid = document.createElement("div");
      uid.className = "ZSS-user-uid";
      uid.textContent = `UID: ${userInfo.uid}`;
      infoText.appendChild(nickname);
      infoText.appendChild(uid);
    } else if (userInfo && "error" in userInfo) {
      const errorContainer = createUserInfoErrorView(userInfo, {
        onRetry: actions.onRetry,
        onStartQRLogin: actions.onStartQRLogin
      });
      infoText.appendChild(errorContainer);
    } else {
      const errorText = document.createElement("div");
      errorText.className = "ZSS-user-error-fallback";
      errorText.textContent = "用户信息加载失败";
      infoText.appendChild(errorText);
    }
    section.appendChild(infoText);
    return section;
  }
  function createDetailedSyncOptions(syncOptions, isUserInfoValid, actions) {
    const container = document.createElement("div");
    container.className = "ZSS-sync-grid";
    syncOptions.forEach((option) => {
      const button = document.createElement("button");
      const buttonClass = isUserInfoValid ? "ZSS-sync-option-btn--enabled" : "ZSS-sync-option-btn--disabled";
      button.className = `ZSS-sync-option-btn ${buttonClass}`;
      button.disabled = !isUserInfoValid;
      button.innerHTML = `${option.icon}<span class="ZSS-sync-text">${option.text}</span>`;
      if (isUserInfoValid) {
        button.addEventListener("click", (event) => {
          void actions.onSyncAction(option.action, event);
        });
      }
      container.appendChild(button);
    });
    return container;
  }
  function createSyncSectionView(options) {
    const { isUserInfoValid, syncOptions, actions } = options;
    const section = document.createElement("div");
    section.className = "ZSS-sync-section";
    const mainButtonModifier = isUserInfoValid ? "ZSS-main-sync-btn--enabled" : "ZSS-main-sync-btn--disabled";
    const mainSyncButton = document.createElement("button");
    mainSyncButton.className = `ZSS-main-sync-btn ${mainButtonModifier}`;
    mainSyncButton.setAttribute("data-sync-main", "true");
    mainSyncButton.disabled = !isUserInfoValid;
    mainSyncButton.innerHTML = `
    <svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    <span class="ZSS-sync-text">${isUserInfoValid ? "同步全部" : "请先登录"}</span>
  `;
    const expandButtonModifier = isUserInfoValid ? "ZSS-expand-btn--enabled" : "ZSS-expand-btn--disabled";
    const expandButton = document.createElement("button");
    expandButton.className = `ZSS-expand-btn ${expandButtonModifier}`;
    expandButton.disabled = !isUserInfoValid;
    expandButton.innerHTML = `
    <span class="ZSS-expand-label">更多选项</span>
    <svg class="ZSS-icon-sm ZSS-expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;
    if (isUserInfoValid) {
      mainSyncButton.addEventListener("click", () => {
        void actions.onSyncAll(mainSyncButton);
      });
      expandButton.addEventListener("click", () => {
        void actions.onToggleExpanded(expandButton);
      });
    }
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "ZSS-details-container";
    detailsContainer.style.maxHeight = "0";
    detailsContainer.style.opacity = "0";
    detailsContainer.appendChild(createDetailedSyncOptions(syncOptions, isUserInfoValid, actions));
    const settingsWrapper = document.createElement("div");
    settingsWrapper.className = "ZSS-settings-wrapper";
    settingsWrapper.appendChild(createSettingsButton(() => actions.onOpenSettings()));
    section.appendChild(mainSyncButton);
    section.appendChild(expandButton);
    section.appendChild(detailsContainer);
    section.appendChild(settingsWrapper);
    return section;
  }
  const QR_SIZE = 180;
  const QR_ERROR_TEXT = "二维码加载失败，请重试";
  const STATUS_TEXT = {
    Created: "请使用 App 扫描二维码",
    Scanned: "已扫码，请在手机上确认",
    Confirmed: "登录成功，正在刷新…"
  };
  const SVG = {
    qrcode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2z"/><path d="M20 14h2v2h-2z"/><path d="M14 20h2v2h-2z"/><path d="M20 20h2v2h-2z"/><path d="M17 17h2v2h-2z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };
  function icon(svg) {
    return `<span class="ZSS-icon">${svg}</span>`;
  }
  function clearCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  function getNextRenderToken(canvas) {
    const current = Number(canvas.dataset.renderToken || "0");
    const next = current + 1;
    canvas.dataset.renderToken = String(next);
    return next;
  }
  function isRenderTokenCurrent(canvas, token) {
    return canvas.dataset.renderToken === String(token);
  }
  async function renderQRCode(elements, qrText) {
    const token = getNextRenderToken(elements.qrImage);
    clearCanvas(elements.qrImage);
    try {
      await QRCode__namespace.toCanvas(elements.qrImage, qrText, {
        width: QR_SIZE,
        margin: 1,
        errorCorrectionLevel: "L"
      });
      if (!isRenderTokenCurrent(elements.qrImage, token)) return;
    } catch (error) {
      if (!isRenderTokenCurrent(elements.qrImage, token)) return;
      clearCanvas(elements.qrImage);
      elements.statusText.textContent = QR_ERROR_TEXT;
      elements.statusText.classList.remove("ZSS-qr-status--success");
      logger.error("二维码渲染失败:", error);
    }
  }
  function createQRLoginModal(qrData, onCancel) {
    const overlay = document.createElement("div");
    overlay.className = "ZSS-modal-overlay";
    overlay.setAttribute("data-seelie-qr-modal", "true");
    const dialog = document.createElement("div");
    dialog.className = "ZSS-modal-dialog";
    const header = document.createElement("div");
    header.className = "ZSS-modal-header";
    const title = document.createElement("div");
    title.className = "ZSS-modal-title";
    title.innerHTML = `${icon(SVG.qrcode)}扫码登录`;
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ZSS-modal-close";
    closeBtn.innerHTML = icon(SVG.close);
    closeBtn.addEventListener("click", onCancel);
    header.append(title, closeBtn);
    const body = document.createElement("div");
    body.className = "ZSS-modal-body";
    body.style.alignItems = "center";
    const qrImage = document.createElement("canvas");
    qrImage.className = "ZSS-qr-image";
    qrImage.width = QR_SIZE;
    qrImage.height = QR_SIZE;
    qrImage.setAttribute("aria-label", "扫码登录二维码");
    clearCanvas(qrImage);
    const statusText = document.createElement("div");
    statusText.className = "ZSS-qr-status";
    statusText.textContent = STATUS_TEXT.Created;
    body.append(qrImage, statusText);
    const footer = document.createElement("div");
    footer.className = "ZSS-modal-footer";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "ZSS-modal-footer-btn";
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", onCancel);
    footer.appendChild(cancelButton);
    dialog.append(header, body, footer);
    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) onCancel();
    });
    dialog.addEventListener("click", (e) => e.stopPropagation());
    requestAnimationFrame(() => overlay.classList.add("ZSS-open"));
    const elements = { overlay, qrImage, statusText };
    void renderQRCode(elements, qrData.url);
    return elements;
  }
  function updateQRLoginStatus(elements, status) {
    elements.statusText.textContent = STATUS_TEXT[status] || status;
    if (status === "Confirmed") {
      elements.statusText.classList.add("ZSS-qr-status--success");
    }
  }
  function refreshQRCode(elements, newData) {
    elements.statusText.textContent = STATUS_TEXT.Created;
    elements.statusText.classList.remove("ZSS-qr-status--success");
    void renderQRCode(elements, newData.url);
  }
  const PANEL_STYLE_ID = "ZSS-panel-style";
  const HOST_EASE = "cubic-bezier(.4,0,.2,1)";
  function ensurePanelStyles() {
    if (document.getElementById(PANEL_STYLE_ID)) {
      return;
    }
    const style = document.createElement("style");
    style.id = PANEL_STYLE_ID;
    style.textContent = `
.ZSS-panel {
  width: 100%;
  margin-bottom: .75rem;
  padding: .75rem;
  background-color: rgb(31 30 54);
  border-radius: .5rem;
  border-width: 1px;
  border-style: solid;
  border-color: #dbe1eb33;
}

.ZSS-user-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: .75rem;
}

.ZSS-user-info-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.ZSS-user-nickname {
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255);
}

.ZSS-user-uid {
  font-size: .75rem;
  line-height: 1rem;
  color: rgb(148 156 182);
}

.ZSS-user-error-fallback {
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(251 113 133);
}

.ZSS-error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ZSS-error-icon {
  margin-bottom: .5rem;
  color: rgb(251 113 133);
}

.ZSS-error-message {
  margin-bottom: .5rem;
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(251 113 133);
}

.ZSS-error-hint {
  margin-bottom: .5rem;
  font-size: .75rem;
  line-height: 1rem;
  text-align: center;
  color: rgb(148 156 182);
}

.ZSS-action-button {
  padding: .25rem .75rem;
  border-radius: .25rem;
  font-size: .75rem;
  line-height: 1rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${HOST_EASE};
  transition-duration: .2s;
}

.ZSS-action-button--login {
  background-color: rgb(2 132 199);
}

.ZSS-action-button--bind {
  background-color: rgb(124 58 237);
}

.ZSS-action-button--retry-network {
  background-color: rgb(5 150 105);
}

.ZSS-action-button--retry-default {
  background-color: rgb(72 75 106);
}

.ZSS-action-button--retry-default:hover {
  background-color: rgb(49 50 77);
}

.ZSS-sync-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ZSS-main-sync-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: .5rem;
  padding: .5rem 1.5rem;
  border-radius: .5rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${HOST_EASE};
  transition-duration: .2s;
}

.ZSS-main-sync-btn--enabled {
  background-color: rgb(49 50 77);
}

.ZSS-main-sync-btn--enabled:hover {
  background-color: rgb(72 75 106);
}

.ZSS-main-sync-btn--disabled {
  background-color: rgb(31 30 54);
}

.ZSS-main-sync-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .25rem 1rem;
  border-radius: .25rem;
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${HOST_EASE};
  transition-duration: .2s;
}

.ZSS-expand-btn--enabled {
  background-color: rgb(72 75 106);
}

.ZSS-expand-btn--enabled:hover {
  background-color: rgb(97 104 138);
}

.ZSS-expand-btn--disabled {
  background-color: rgb(49 50 77);
}

.ZSS-expand-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-details-container {
  width: 100%;
  margin-top: .5rem;
  overflow: hidden;
  transition-property: all;
  transition-timing-function: ${HOST_EASE};
  transition-duration: .3s;
}

.ZSS-sync-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: .5rem;
}

.ZSS-sync-option-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .5rem .75rem;
  border-radius: .25rem;
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(255 255 255);
  transition-property: all;
  transition-timing-function: ${HOST_EASE};
  transition-duration: .2s;
}

.ZSS-sync-option-btn--enabled {
  background-color: rgb(72 75 106);
}

.ZSS-sync-option-btn--enabled:hover {
  background-color: rgb(97 104 138);
}

.ZSS-sync-option-btn--disabled {
  background-color: rgb(49 50 77);
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-sync-option-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.ZSS-settings-wrapper {
  display: flex;
  justify-content: center;
  margin-top: .5rem;
}

.ZSS-sync-state-success {
  background-color: rgb(5 150 105);
}

.ZSS-sync-state-success:hover {
  background-color: rgb(5 150 105);
}

.ZSS-sync-state-warning {
  background-color: transparent;
}

.ZSS-sync-state-warning:hover {
  background-color: transparent;
}

.ZSS-sync-state-error {
  background-color: rgb(225 29 72);
}

.ZSS-sync-state-error:hover {
  background-color: rgb(225 29 72);
}

.ZSS-expand-label {
  margin-right: .25rem;
  font-size: .75rem;
  line-height: 1rem;
}

.ZSS-expand-icon {
  transition-property: transform;
  transition-timing-function: ${HOST_EASE};
  transition-duration: .2s;
}

.ZSS-icon-sm {
  width: .75rem;
  height: .75rem;
}

.ZSS-icon-md {
  width: 1rem;
  height: 1rem;
}

.ZSS-icon-lg {
  width: 1.5rem;
  height: 1.5rem;
}

.ZSS-mr-2 {
  margin-right: .5rem;
}

.ZSS-animate-spin {
  animation: ZSS-spin 1s linear infinite;
}

@keyframes ZSS-spin {
  to {
    transform: rotate(360deg);
  }
}

.ZSS-mt-2 {
  margin-top: .5rem;
}

.ZSS-qr-image {
  width: 180px;
  height: 180px;
  border-radius: .5rem;
  background-color: rgb(255 255 255);
  display: block;
  box-sizing: border-box;
  object-fit: contain;
  image-rendering: pixelated;
  margin-bottom: .75rem;
}

.ZSS-qr-status {
  font-size: .875rem;
  line-height: 1.25rem;
  color: rgb(148 156 182);
  margin-bottom: .5rem;
  text-align: center;
  transition: color .2s ${HOST_EASE};
}

.ZSS-qr-status--success {
  color: rgb(52 211 153);
}

  `;
    (document.head || document.documentElement).appendChild(style);
  }
  class SeeliePanel {
    container = null;
    userInfo = null;
    isLoading = false;
    isExpanded = false;
    // 控制二级界面展开状态
    settingsModal = null;
    settingsModalKeydownHandler = null;
    qrLoginCancelFn = null;
    qrLoginModal = null;
    qrLoginKeydownHandler = null;
    qrLoginGeneration = 0;
    // 组件相关的选择器常量
    static TARGET_SELECTOR = "div.flex.flex-col.items-center.justify-center.w-full.mt-3";
    static PANEL_SELECTOR = '[data-seelie-panel="true"]';
    constructor() {
    }
    /**
     * 初始化面板 - 由外部调用
     */
    async init() {
      try {
        await this.createPanel();
      } catch (error) {
        logger.error("初始化 Seelie 面板失败:", error);
        throw error;
      }
    }
    /**
     * 创建面板
     */
    async createPanel() {
      const targetContainer = document.querySelector(SeeliePanel.TARGET_SELECTOR);
      if (!targetContainer) {
        throw new Error("目标容器未找到");
      }
      const existingPanel = targetContainer.querySelector(SeeliePanel.PANEL_SELECTOR);
      if (existingPanel) {
        existingPanel.remove();
        logger.debug("清理了目标容器中的旧面板");
      }
      if (this.container && targetContainer.contains(this.container)) {
        logger.debug("面板已存在，跳过创建");
        return;
      }
      await this.loadUserInfo();
      this.container = this.createPanelElement();
      targetContainer.insertBefore(this.container, targetContainer.firstChild);
      logger.info("✅ Seelie 面板创建成功");
    }
    /**
     * 加载用户信息
     */
    async loadUserInfo() {
      try {
        this.userInfo = await initializeUserInfo();
        logger.debug("用户信息加载成功:", this.userInfo);
      } catch (error) {
        logger.error("加载用户信息失败:", error);
        setToast("用户信息加载失败，部分同步功能可能不可用", "warning");
        this.userInfo = mapUserInfoError(error);
      }
    }
    /**
     * 创建面板元素
     */
    createPanelElement() {
      ensurePanelStyles();
      const panel = document.createElement("div");
      panel.className = "ZSS-panel";
      panel.setAttribute("data-seelie-panel", "true");
      const userInfoSection = createUserInfoSection(this.userInfo, {
        onRetry: () => this.refreshUserInfo(),
        onStartQRLogin: () => this.startQRLogin()
      });
      const syncSection = this.createSyncSection();
      panel.appendChild(userInfoSection);
      panel.appendChild(syncSection);
      return panel;
    }
    /**
     * 打开设置弹窗
     */
    openSettingsModal() {
      if (!this.container || this.settingsModal) {
        return;
      }
      const modal = createSettingsModalView({
        onToggleAdCleaner: (enabled) => {
          setAdCleanerEnabled(enabled);
          const stateText = enabled ? "开启" : "关闭";
          setToast(`脚本去广告已${stateText}，如未生效可刷新页面`, "success");
        },
        onCopyUBlockRules: async () => {
          return copyAdCleanerRules();
        },
        onResetDevice: () => this.handleResetDeviceInfo(),
        onClose: () => this.closeSettingsModal()
      });
      this.settingsModal = modal;
      document.body.appendChild(modal);
      this.settingsModalKeydownHandler = (event) => {
        if (event.key === "Escape") {
          this.closeSettingsModal();
        }
      };
      window.addEventListener("keydown", this.settingsModalKeydownHandler);
    }
    /**
     * 关闭设置弹窗
     */
    closeSettingsModal() {
      if (this.settingsModal) {
        this.settingsModal.classList.remove("ZSS-open");
        const modal = this.settingsModal;
        setTimeout(() => modal.remove(), 300);
        this.settingsModal = null;
      }
      if (this.settingsModalKeydownHandler) {
        window.removeEventListener("keydown", this.settingsModalKeydownHandler);
        this.settingsModalKeydownHandler = null;
      }
    }
    /**
     * 启动扫码登录流程
     */
    async startQRLogin() {
      if (!this.container) return;
      this.cancelQRLogin();
      const generation = ++this.qrLoginGeneration;
      try {
        const qrData = await createQRLogin();
        if (this.qrLoginGeneration !== generation || !this.container) return;
        const qrElements = createQRLoginModal(
          qrData,
          () => {
            this.cancelQRLogin();
            void this.refreshUserInfo();
          }
        );
        this.qrLoginModal = qrElements.overlay;
        document.body.appendChild(this.qrLoginModal);
        this.qrLoginKeydownHandler = (event) => {
          if (event.key === "Escape") {
            this.cancelQRLogin();
            void this.refreshUserInfo();
          }
        };
        window.addEventListener("keydown", this.qrLoginKeydownHandler);
        this.qrLoginCancelFn = startQRLoginPolling(qrData.ticket, {
          onStatusChange: (status) => {
            updateQRLoginStatus(qrElements, status);
            if (status === "Scanned") {
              logger.info("扫码登录：用户已扫码，等待确认");
            }
          },
          onQRExpired: (newData) => {
            refreshQRCode(qrElements, newData);
            logger.info("扫码登录：二维码已过期，已自动刷新");
            setToast("二维码已过期，已自动刷新", "warning");
          },
          onComplete: (roleInfo) => {
            this.qrLoginCancelFn = null;
            this.closeQRLoginModal();
            logger.info("扫码登录成功，刷新面板");
            setToast("登录成功", "success");
            hydrateUserInfoFromRole(roleInfo);
            void this.refreshUserInfo();
          },
          onError: (error) => {
            this.qrLoginCancelFn = null;
            this.closeQRLoginModal();
            logger.error("扫码登录失败:", error);
            setToast("扫码登录失败，请重试", "error");
            void this.refreshUserInfo();
          }
        });
      } catch (error) {
        logger.error("启动扫码登录失败:", error);
        setToast("无法创建二维码，请重试", "error");
      }
    }
    /**
     * 关闭扫码登录 Modal（退场动画 + 移除 DOM）
     */
    closeQRLoginModal() {
      if (this.qrLoginModal) {
        this.qrLoginModal.classList.remove("ZSS-open");
        const modal = this.qrLoginModal;
        setTimeout(() => modal.remove(), 300);
        this.qrLoginModal = null;
      }
      if (this.qrLoginKeydownHandler) {
        window.removeEventListener("keydown", this.qrLoginKeydownHandler);
        this.qrLoginKeydownHandler = null;
      }
    }
    /**
     * 取消扫码登录（停止轮询 + 关闭弹窗）
     */
    cancelQRLogin() {
      if (this.qrLoginCancelFn) {
        this.qrLoginCancelFn();
        this.qrLoginCancelFn = null;
      }
      this.closeQRLoginModal();
    }
    /**
     * 创建同步按钮区域
     */
    createSyncSection() {
      const isUserInfoValid = !!this.userInfo && !("error" in this.userInfo);
      const syncActionHandlers = {
        resin: (event) => this.handleSyncResin(event),
        characters: (event) => this.handleSyncCharacters(event),
        items: (event) => this.handleSyncItems(event),
        reset_device: (event) => this.handleResetDeviceInfo(event)
      };
      return createSyncSectionView({
        isUserInfoValid,
        syncOptions: SYNC_OPTION_CONFIGS,
        actions: {
          onSyncAll: (button) => this.handleSyncAll(button),
          onToggleExpanded: (button) => this.toggleExpanded(button),
          onSyncAction: (action, event) => syncActionHandlers[action](event),
          onOpenSettings: () => this.openSettingsModal()
        }
      });
    }
    /**
     * 切换展开状态
     */
    toggleExpanded(expandButton) {
      if (this.isLoading) return;
      this.isExpanded = !this.isExpanded;
      const detailsContainer = this.container?.querySelector(".ZSS-details-container");
      const expandIcon = expandButton.querySelector(".ZSS-expand-icon");
      if (!detailsContainer || !expandIcon) return;
      if (this.isExpanded) {
        detailsContainer.style.maxHeight = "200px";
        detailsContainer.style.opacity = "1";
        expandIcon.style.transform = "rotate(180deg)";
      } else {
        detailsContainer.style.maxHeight = "0";
        detailsContainer.style.opacity = "0";
        expandIcon.style.transform = "rotate(0deg)";
      }
    }
    /**
     * 处理同步全部按钮点击
     */
    async handleSyncAll(button) {
      if (this.isLoading) return;
      if (!button) {
        button = this.container?.querySelector('[data-sync-main="true"]');
        if (!button) return;
      }
      await this.performSyncOperation(button, "同步中...", async () => this.performSync());
    }
    /**
     * 处理同步电量
     */
    async handleSyncResin(event) {
      await this.handleSyncActionFromEvent(
        event,
        "同步中...",
        "同步电量数据",
        async () => {
          const success = await syncService.syncResinData();
          return {
            status: success ? "success" : "error",
            message: success ? "电量同步完成" : "电量同步失败"
          };
        }
      );
    }
    /**
     * 处理同步角色
     */
    async handleSyncCharacters(event) {
      await this.handleSyncActionFromEvent(
        event,
        "同步中...",
        "同步角色数据",
        async () => {
          const result = await syncService.syncAllCharacters();
          if (result.success === 0) {
            return {
              status: "error",
              message: "角色同步失败"
            };
          }
          if (result.failed > 0) {
            return {
              status: "warning",
              message: `角色同步部分完成：成功 ${result.success}，失败 ${result.failed}`
            };
          }
          return {
            status: "success",
            message: `角色同步完成：成功 ${result.success}`
          };
        }
      );
    }
    /**
     * 处理同步材料
     */
    async handleSyncItems(event) {
      await this.handleSyncActionFromEvent(
        event,
        "同步中...",
        "同步材料数据",
        async () => {
          const result = await syncService.syncItemsData();
          if (!result.success) {
            return {
              status: "error",
              message: "养成材料同步失败"
            };
          }
          if (result.partial) {
            return {
              status: "warning",
              message: `养成材料同步部分完成：成功 ${result.successNum}，失败 ${result.failNum}`
            };
          }
          return {
            status: "success",
            message: `养成材料同步完成：成功 ${result.successNum}，失败 ${result.failNum}`
          };
        }
      );
    }
    /**
     * 处理重置设备信息
     */
    async handleResetDeviceInfo(event) {
      if (!event) {
        try {
          await refreshDeviceInfo();
          setToast("设备信息已重置", "success");
          logger.info("设备信息重置完成");
        } catch (error) {
          setToast("设备信息重置失败", "error");
          logger.error("设备信息重置失败:", error);
        }
        return;
      }
      await this.handleSyncActionFromEvent(
        event,
        "重置中...",
        "重置设备信息",
        async () => {
          try {
            await refreshDeviceInfo();
            setToast("设备信息已重置", "success");
            return { status: "success", message: "设备信息重置完成" };
          } catch (error) {
            setToast("设备信息重置失败", "error");
            logger.error("设备信息重置失败:", error);
            return { status: "error", message: "设备信息重置失败" };
          }
        }
      );
    }
    /**
     * 通用同步操作处理器
     */
    async performSyncOperation(button, loadingText, syncOperation) {
      if (this.isLoading) return;
      this.isLoading = true;
      const syncText = button.querySelector(".ZSS-sync-text");
      if (!syncText) {
        this.isLoading = false;
        return;
      }
      const originalText = syncText.textContent;
      try {
        this.setAllButtonsDisabled(true);
        syncText.textContent = loadingText;
        const icon2 = button.querySelector("svg");
        if (icon2) {
          icon2.classList.add("ZSS-animate-spin");
        }
        const operationResult = await syncOperation();
        if (operationResult.status === "success") {
          logger.info(operationResult.message);
        } else if (operationResult.status === "warning") {
          logger.warn(operationResult.message);
        } else {
          logger.warn(operationResult.message);
        }
        this.showSyncResult(button, syncText, originalText, icon2, operationResult.status);
      } catch (error) {
        logger.error("同步失败:", error);
        const icon2 = button.querySelector("svg");
        this.showSyncResult(button, syncText, originalText, icon2, "error");
      }
    }
    /**
     * 从点击事件中解析按钮元素
     */
    getButtonFromEvent(event) {
      return event?.target?.closest("button") || null;
    }
    /**
     * 从点击事件中解析按钮并执行同步动作
     */
    async handleSyncActionFromEvent(event, loadingText, actionName, syncAction) {
      const button = this.getButtonFromEvent(event);
      if (!button) return;
      await this.performSyncOperation(button, loadingText, async () => {
        const result = await syncAction();
        if (result.status === "warning") {
          logger.warn(`${actionName}部分完成`);
        }
        return result;
      });
    }
    /**
     * 执行同步操作
     */
    async performSync() {
      try {
        logger.info("开始执行完整同步...");
        const result = await syncService.syncAll();
        const feedback = buildFullSyncFeedback(result);
        const logPayload = {
          summary: feedback.summary,
          detail: feedback.details
        };
        if (feedback.status === "success") {
          logger.info("完整同步成功", logPayload);
          return {
            status: "success",
            message: feedback.summary
          };
        }
        if (feedback.status === "partial") {
          logger.warn("完整同步部分完成", logPayload);
          return {
            status: "warning",
            message: feedback.summary
          };
        }
        logger.error("完整同步失败", logPayload);
        return {
          status: "error",
          message: feedback.summary
        };
      } catch (error) {
        logger.error("同步操作失败:", error);
        return {
          status: "error",
          message: "同步失败，请稍后重试"
        };
      }
    }
    /**
     * 设置所有按钮的禁用状态
     */
    setAllButtonsDisabled(disabled) {
      if (!this.container) return;
      const buttons = this.container.querySelectorAll("button");
      buttons.forEach((button) => {
        button.disabled = disabled;
      });
    }
    /**
     * 显示同步结果
     */
    showSyncResult(button, syncText, originalText, icon2, type) {
      const textMap = {
        success: "同步完成",
        warning: "部分完成",
        error: "同步失败"
      };
      const stateClassMap = {
        success: "ZSS-sync-state-success",
        warning: "ZSS-sync-state-warning",
        error: "ZSS-sync-state-error"
      };
      const allStateClasses = Object.values(stateClassMap);
      const nextStateClass = stateClassMap[type];
      syncText.textContent = textMap[type];
      button.classList.remove(...allStateClasses);
      button.classList.add(nextStateClass);
      setTimeout(() => {
        syncText.textContent = originalText || "同步全部";
        button.classList.remove(nextStateClass);
        if (icon2) {
          icon2.classList.remove("ZSS-animate-spin");
        }
        this.setAllButtonsDisabled(false);
        this.isLoading = false;
      }, 2e3);
    }
    /**
     * 销毁面板
     */
    destroy() {
      this.closeSettingsModal();
      this.cancelQRLogin();
      this.closeQRLoginModal();
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }
      const allPanels = document.querySelectorAll(SeeliePanel.PANEL_SELECTOR);
      allPanels.forEach((panel) => {
        if (panel.parentNode) {
          panel.parentNode.removeChild(panel);
        }
      });
      logger.debug("Seelie 面板已销毁");
    }
    /**
     * 刷新组件（实现接口要求）
     */
    async refresh() {
      await this.refreshUserInfo();
    }
    /**
     * 刷新用户信息
     */
    async refreshUserInfo() {
      try {
        if (!this.container) return;
        this.cancelQRLogin();
        await this.loadUserInfo();
        const nextPanel = this.createPanelElement();
        this.container.replaceWith(nextPanel);
        this.container = nextPanel;
      } catch (error) {
        logger.error("刷新用户信息失败:", error);
      }
    }
  }
  function registerSeeliePanel() {
    const config = {
      id: "seelie-panel",
      targetSelector: SeeliePanel.TARGET_SELECTOR,
      componentSelector: SeeliePanel.PANEL_SELECTOR
    };
    domInjector.register(config, () => new SeeliePanel());
    logger.debug("📝 Seelie 面板组件注册完成");
  }
  function registerAllComponents() {
    logger.info("🎯 开始注册所有组件");
    registerSeeliePanel();
    logger.info("✅ 所有组件注册完成");
  }
  function initApp() {
    logger.info("🎯 zzz-seelie-sync 脚本已加载");
    initAdCleanerSettings();
    runWhenDOMReady(() => {
      initDOMInjector();
    });
  }
  function runWhenDOMReady(task) {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", task, { once: true });
      return;
    }
    task();
  }
  function initDOMInjector() {
    try {
      if (domInjector.isInit()) {
        logger.debug("DOM 注入管理器已初始化，跳过");
        return;
      }
      registerAllComponents();
      domInjector.init();
      logger.info("✅ DOM 注入管理器初始化完成");
    } catch (error) {
      logger.error("❌ 初始化 DOM 注入管理器失败:", error);
    }
  }
  function exposeRuntimeEnvGlobals() {
    if (typeof window === "undefined") {
      return;
    }
    const isDev = false;
    Reflect.set(window, "__ZSS_DEV__", isDev);
    Reflect.set(window, "isZssDevEnvironment", () => isDev);
  }
  exposeRuntimeEnvGlobals();
  initApp();

})(QRCode);