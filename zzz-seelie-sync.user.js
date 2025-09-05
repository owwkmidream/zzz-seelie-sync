// ==UserScript==
// @name         ZZZ Seelie 数据同步
// @namespace    github.com/owwkmidream
// @version      1.2.2.2-gfecabc1
// @author       owwkmidream
// @description  绝区零 Seelie 网站数据同步脚本
// @license      MIT
// @icon         https://zzz.seelie.me/img/logo.svg
// @homepageURL  https://github.com/owwkmidream/zzz-seelie-sync
// @supportURL   https://github.com/owwkmidream/zzz-seelie-sync/issues
// @downloadURL  https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.user.js
// @updateURL    https://fastgh.lainbo.com/https://raw.githubusercontent.com/owwkmidream/zzz-seelie-sync/refs/heads/release-nightly/zzz-seelie-sync.meta.js
// @match        https://zzz.seelie.me/*
// @match        https://do-not-exist.mihoyo.com/
// @require      https://fastly.jsdelivr.net/npm/@trim21/gm-fetch@0.3.0
// @connect      act-api-takumi.mihoyo.com
// @connect      api-takumi-record.mihoyo.com
// @connect      public-data-api.mihoyo.com
// @connect      api-takumi.mihoyo.com
// @grant        GM.cookie
// @grant        GM.xmlHttpRequest
// @run-at       document-end
// ==/UserScript==

(function (GM_fetch) {
  'use strict';

  class Logger {
    prefix;
    timestamp;
    showLocation;
    colors;
    fileColorMap = /* @__PURE__ */ new Map();
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
  function findVueRouter() {
    const appElement = document.querySelector("#app");
    if (!appElement?.__vue_app__) {
      logger.debug("🔍 未找到 Vue App 实例，可能还在加载中...");
      return null;
    }
    logger.debug("🔍 查找 Vue Router 实例...");
    const router = appElement.__vue_app__.config?.globalProperties?.$router;
    if (router) {
      if (typeof router.afterEach === "function" && typeof router.beforeEach === "function" && typeof router.push === "function") {
        logger.info("✓ 从 __vue_app__.config.globalProperties.$router 找到 Router 实例");
        logger.debug("Router 实例:", router);
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
        if (value && typeof value === "object") {
          const potentialRouter = value;
          if (typeof potentialRouter.afterEach === "function" && typeof potentialRouter.beforeEach === "function" && typeof potentialRouter.push === "function") {
            logger.info("✓ 从 provides 找到 Router 实例:", symbol.toString());
            logger.debug("Router 实例:", value);
            return potentialRouter;
          }
        }
      }
    }
    logger.debug("🔍 未找到 Vue Router 实例，可能还在初始化中...");
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
        logger.debug(`🚫 [${this.config.id}] 条件检查失败，跳过创建`);
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
        logger.debug(`⚠️ [${this.config.id}] 组件已在创建中，跳过重复创建`);
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
  const DEVICE_INFO_KEY = "zzz_device_info";
  const NAP_CULTIVATE_TOOL_URL = "https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool";
  const GAME_RECORD_URL = "https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz";
  const DEVICE_FP_URL = "https://public-data-api.mihoyo.com/device-fp/api/getFp";
  const GAME_ROLE_URL = "https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=nap_cn";
  const NAP_TOEKN_URL = "https://api-takumi.mihoyo.com/common/badge/v1/login/account";
  let NapTokenInitialized = false;
  let userInfoCache = null;
  let deviceInfoCache = {
    deviceId: generateUUID(),
    deviceFp: "0000000000000",
    timestamp: Date.now()
  };
  let deviceInfoPromise = null;
  const appVer = "2.85.1";
  const defaultHeaders = {
    "Accept": "application/json",
    "User-Agent": `Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 miHoYoBBS/${appVer}`
  };
  async function getZZZHeaderWithDevice() {
    const deviceInfo = await getDeviceInfo();
    return {
      ...defaultHeaders,
      "Referer": "https://act.mihoyo.com/",
      "x-rpc-app_version": appVer,
      "x-rpc-client_type": "5",
      "x-rpc-device_fp": deviceInfo.deviceFp,
      "x-rpc-device_id": deviceInfo.deviceId
    };
  }
  async function initializeNapToken() {
    if (NapTokenInitialized) {
      return;
    }
    logger.debug("🔄 初始化 nap_token cookie...");
    try {
      const rolesResponse = await GM_fetch(GAME_ROLE_URL, {
        method: "GET",
        headers: defaultHeaders
      });
      if (!rolesResponse.ok) {
        throw new Error(`获取用户角色失败: HTTP ${rolesResponse.status}`);
      }
      const rolesData = await rolesResponse.json();
      if (rolesData.retcode !== 0) {
        throw new Error(`获取用户角色失败: ${rolesData.message}`);
      }
      if (!rolesData.data?.list || rolesData.data.list.length === 0) {
        throw new Error("未找到绝区零游戏角色");
      }
      const roleInfo = rolesData.data.list[0];
      logger.debug(`🎮 找到角色: ${roleInfo.nickname} (UID: ${roleInfo.game_uid}, 等级: ${roleInfo.level})`);
      const tokenResponse = await GM_fetch(NAP_TOEKN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...defaultHeaders
        },
        body: JSON.stringify({
          region: roleInfo.region,
          uid: roleInfo.game_uid,
          game_biz: roleInfo.game_biz
        })
      });
      if (!tokenResponse.ok) {
        throw new Error(`设置 nap_token 失败: HTTP ${tokenResponse.status}`);
      }
      const tokenData = await tokenResponse.json();
      if (tokenData.retcode !== 0) {
        throw new Error(`设置 nap_token 失败: ${tokenData.message}`);
      }
      userInfoCache = {
        uid: roleInfo.game_uid,
        nickname: roleInfo.nickname,
        level: roleInfo.level,
        region: roleInfo.region,
        accountId: roleInfo.game_uid
        // 使用 game_uid 作为 accountId
      };
      logger.debug("✅ nap_token cookie 初始化完成");
      logger.info(`👤 用户信息: ${userInfoCache.nickname} (UID: ${userInfoCache.uid}, 等级: ${userInfoCache.level})`);
      NapTokenInitialized = true;
    } catch (error) {
      logger.error("❌ 初始化 nap_token 失败:", error);
      throw error;
    }
  }
  async function ensureUserInfo() {
    if (!userInfoCache) {
      await initializeNapToken();
    }
  }
  async function request(endpoint, baseUrl, options = {}) {
    const { method = "GET", params = {}, body, headers = {} } = options;
    if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
      await initializeNapToken();
    }
    let url = `${baseUrl}${endpoint}`;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }
    const deviceFpErrorCodes = [1034, 5003, 10035, 10041, 10053];
    const executeRequest = async (isRetry = false) => {
      const zzzHeaders = await getZZZHeaderWithDevice();
      const finalHeaders = {
        ...zzzHeaders,
        ...headers
      };
      if (finalHeaders["x-rpc-device_fp"] === "0000000000000") {
        throw new Error("❌ 设备指纹有误，请检查");
      }
      logger.debug(`🌐 请求 ${method} ${url}${isRetry ? " (重试)" : ""}`);
      try {
        const payload = [url, {
          method,
          headers: finalHeaders,
          body: body ? JSON.stringify(body) : void 0
        }];
        const response = await GM_fetch(...payload);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.retcode !== 0) {
          if (deviceFpErrorCodes.includes(data.retcode) && !isRetry) {
            logger.warn(`⚠️ 检测到设备指纹错误码 ${data.retcode}: ${data.message}，正在刷新设备指纹...`);
            try {
              await getDeviceFingerprint();
              logger.debug("✅ 设备指纹刷新完成，准备重试请求");
              return await executeRequest(true);
            } catch (fpError) {
              logger.error("❌ 设备指纹刷新失败:", fpError);
              throw new Error(`设备指纹刷新失败，原始错误: API Error ${data.retcode}: ${data.message}`);
            }
          }
          logger.error("❌ 请求失败\n请求:", payload, "\n响应：", response, data);
          throw new Error(`API Error ${data.retcode}: ${data.message}`);
        }
        logger.debug(`✅ 请求成功: ${payload[0]}, ${data.retcode}: ${data.message}`);
        return data;
      } catch (error) {
        if (error instanceof Error && error.message.includes("API Error")) {
          throw error;
        }
        logger.error(`❌ 请求失败:`, error);
        throw error;
      }
    };
    return await executeRequest();
  }
  async function getDeviceFingerprint() {
    const mysCookies = await _GM.cookie.list({ url: "https://do-not-exist.mihoyo.com/" });
    if (mysCookies.length !== 0) {
      for (const ck of mysCookies) {
        if (ck.name === "_MHYUUID") {
          logger.debug("🔐 从米游社获取到UUID", ck.value);
          deviceInfoCache.deviceId = ck.value;
        }
      }
    }
    if (!deviceInfoCache) {
      throw new Error("设备信息缓存未初始化");
    }
    const productName = generateProductName();
    const requestBody = {
      device_id: generateSeedId(),
      seed_id: generateUUID(),
      seed_time: Date.now().toString(),
      platform: "2",
      device_fp: deviceInfoCache.deviceFp,
      app_name: "bbs_cn",
      ext_fields: `{"proxyStatus":0,"isRoot":0,"romCapacity":"512","deviceName":"Pixel5","productName":"${productName}","romRemain":"512","hostname":"db1ba5f7c000000","screenSize":"1080x2400","isTablet":0,"aaid":"","model":"Pixel5","brand":"google","hardware":"windows_x86_64","deviceType":"redfin","devId":"REL","serialNumber":"unknown","sdCapacity":125943,"buildTime":"1704316741000","buildUser":"cloudtest","simState":0,"ramRemain":"124603","appUpdateTimeDiff":1716369357492,"deviceInfo":"google\\/${productName}\\/redfin:13\\/TQ3A.230901.001\\/2311.40000.5.0:user\\/release-keys","vaid":"","buildType":"user","sdkVersion":"33","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"chargeStatus":3,"manufacturer":"Google","emulatorStatus":0,"appMemory":"512","osVersion":"13","vendor":"unknown","accelerometer":"","sdRemain":123276,"buildTags":"release-keys","packageName":"com.mihoyo.hyperion","networkType":"WiFi","oaid":"","debugStatus":1,"ramCapacity":"125943","magnetometer":"","display":"TQ3A.230901.001","appInstallTimeDiff":1706444666737,"packageVersion":"2.20.2","gyroscope":"","batteryStatus":85,"hasKeyboard":10,"board":"windows"}`,
      bbs_device_id: deviceInfoCache.deviceId
    };
    logger.debug(`🔐 获取设备指纹，设备ID: ${deviceInfoCache.deviceId}`);
    try {
      const response = await GM_fetch(`${DEVICE_FP_URL}`, {
        method: "POST",
        headers: {
          ...defaultHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.retcode !== 0 || data.data.code !== 200) {
        throw new Error(`设备指纹获取失败 ${data.retcode}: ${data.message}`);
      }
      deviceInfoCache.deviceFp = data.data.device_fp;
      deviceInfoCache.timestamp = Date.now();
      localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfoCache));
      logger.debug(`✅ 设备指纹获取成功并更新缓存: ${data.data.device_fp}`);
    } catch (error) {
      logger.error(`❌ 设备指纹获取失败:`, error);
      throw error;
    }
  }
  function generateProductName() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
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
  async function getDeviceInfo(refresh) {
    if (deviceInfoPromise) {
      return deviceInfoPromise;
    }
    deviceInfoPromise = (async () => {
      const stored = localStorage.getItem(DEVICE_INFO_KEY);
      if (stored) {
        try {
          const storedDeviceInfo = JSON.parse(stored);
          logger.debug("📱 从localStorage获取设备信息:", storedDeviceInfo);
          deviceInfoCache = storedDeviceInfo;
        } catch (error) {
          logger.warn("⚠️ 解析设备信息失败，将重新生成:", error);
        }
      }
      let needRefresh = false;
      if (refresh === true) {
        needRefresh = true;
        logger.debug("📱 强制刷新设备指纹");
      } else if (refresh === false) {
        needRefresh = false;
        logger.debug("📱 跳过设备指纹刷新");
      } else {
        const now = Date.now();
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1e3;
        if (deviceInfoCache.deviceFp === "0000000000000") {
          needRefresh = true;
          logger.debug("📱 设备指纹为初始值，需要获取真实指纹");
        } else if (now - deviceInfoCache.timestamp > threeDaysInMs) {
          needRefresh = true;
          logger.debug("📱 设备信息超过3天，需要刷新");
        } else {
          logger.debug("📱 设备信息仍在有效期内");
        }
      }
      if (needRefresh) {
        try {
          await getDeviceFingerprint();
          logger.debug("✅ 设备指纹刷新完成");
        } catch (error) {
          logger.error("❌ 设备指纹刷新失败:", error);
          throw error;
        }
      }
      return deviceInfoCache;
    })();
    const result = await deviceInfoPromise;
    deviceInfoPromise = null;
    return result;
  }
  function getUserInfo() {
    return userInfoCache;
  }
  async function initializeUserInfo() {
    await ensureUserInfo();
    return userInfoCache;
  }
  async function refreshDeviceInfo() {
    logger.debug("🔄 开始刷新设备信息...");
    const newDeviceInfo = await getDeviceInfo(true);
    logger.debug("✅ 设备信息刷新完成:", newDeviceInfo);
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
    return response.data.list.filter((avatar) => avatar.unlocked === true);
  }
  async function batchGetAvatarDetail(avatarList, uid, region) {
    const userInfo = await resolveUserInfo(uid, region);
    const processedAvatarList = typeof avatarList[0] === "number" ? avatarList.map((id) => ({
      avatar_id: id,
      is_teaser: false,
      teaser_need_weapon: false,
      teaser_sp_skill: false
    })) : avatarList;
    return processBatches(
      processedAvatarList,
      10,
      async (batch) => {
        const response = await request("/user/batch_avatar_detail_v2", NAP_CULTIVATE_TOOL_URL, {
          method: "POST",
          params: { uid: userInfo.uid, region: userInfo.region },
          body: { avatar_list: batch }
        });
        return response.data.list;
      }
    );
  }
  async function getGameNote(roleId, server) {
    const userInfo = await resolveUserInfo(roleId, server);
    const response = await request("/note", GAME_RECORD_URL, {
      method: "GET",
      params: {
        server: userInfo.region,
        role_id: userInfo.uid
      }
    });
    return response.data;
  }
  class SeelieDataUpdater {
    static SEELIE_BASE_URL = "https://zzz.seelie.me";
    static UNIQUE_ZZZ_KEYS = ["denny", "w_engine", "drive_disc"];
    static STATS_FILE_PATTERNS = [
      { name: "charactersStats", pattern: /stats-characters-[a-f0-9]+\.js/ },
      { name: "weaponsStats", pattern: /stats-weapons-[a-f0-9]+\.js/ },
      { name: "weaponsStatsCommon", pattern: /stats-weapons-common-[a-f0-9]+\.js/ }
    ];
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
    static async processStatsFiles(indexScriptContent) {
      logger.debug("▶️  开始并行处理统计数据文件...");
      const statsPromises = this.STATS_FILE_PATTERNS.map(async ({ name, pattern }) => {
        const match = indexScriptContent.match(pattern);
        if (!match) {
          logger.warn(`⚠️  未找到 ${name} 文件，跳过...`);
          return { name, data: null };
        }
        const fileName = match[0];
        const statsFileUrl = `${this.SEELIE_BASE_URL}/assets/${fileName}`;
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
        logger.debug("第一步：获取 Seelie.me 主页...");
        const mainPageHtml = await this.fetchContent(this.SEELIE_BASE_URL);
        const indexScriptMatch = mainPageHtml.match(/\/assets\/index-([a-f0-9]+)\.js/);
        if (!indexScriptMatch) {
          throw new Error("在主页HTML中未找到 index-....js 脚本。");
        }
        const indexScriptUrl = `${this.SEELIE_BASE_URL}${indexScriptMatch[0]}`;
        logger.debug(`第二步：发现主脚本 -> ${indexScriptUrl}`);
        const indexScriptContent = await this.fetchContent(indexScriptUrl);
        const stringsFileMatch = indexScriptContent.match(/strings-zh-([a-f0-9]+)\.js/);
        if (!stringsFileMatch) {
          throw new Error("在主脚本中未找到 strings-zh-....js 语言包。");
        }
        const stringsFileUrl = `${this.SEELIE_BASE_URL}/assets/locale/${stringsFileMatch[0]}`;
        logger.debug(`第三步：发现中文语言包 -> ${stringsFileUrl}`);
        logger.debug("🔄 开始并行处理语言包和统计数据...");
        const [stringsFileContent, statsData] = await Promise.all([
          this.fetchContent(stringsFileUrl),
          this.processStatsFiles(indexScriptContent)
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
  const ASCENSIONS = [1, 10, 20, 30, 40, 50, 60];
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
    throw new Error("无法获取角色统计数据");
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
    throw new Error("无法获取武器统计数据");
  }
  async function getWeaponStatsCommon() {
    try {
      const statsData = await getStatsData();
      if (statsData?.weaponsStatsCommon && typeof statsData.weaponsStatsCommon === "object") {
        logger.debug("✅ 使用动态武器通用统计数据");
        return statsData.weaponsStatsCommon;
      }
    } catch (error) {
      logger.warn("⚠️ 获取武器通用统计数据失败:", error);
    }
    throw new Error("无法获取武器通用统计数据");
  }
  class SeelieCore {
    appElement = null;
    rootComponent = null;
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
      const observer = new MutationObserver(() => {
        logger.debug("🔍 SeelieCore: 等待 _vnode.component 出现...", this.appElement?._vnode?.component);
        if (this.appElement?._vnode?.component) {
          clean();
          this.completeInit();
        }
      });
      observer.observe(this.appElement, {
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
        observer.disconnect();
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
        proxy.toast = message;
        proxy.toastType = type;
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
      logger.debug(`HP error: ${character.name_mi18n}, base: ${baseHP}, growth: ${growthHP}, core: ${coreHP}, fixed: ${calculatedBaseHP}, target: ${actualHP}`);
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
      logger.debug(`ATK error: ${weapon.name}, base: ${baseATK}, growth: ${growthATK}, fixed: ${calculatedBaseATK}, target: ${actualATK}`);
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
      logger.debug(`✅ ${characterName} 同步完成 - 成功: ${result.success}, 失败: ${result.failed}`);
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
      logger.debug(`🎯 批量同步完成:`);
      logger.debug(`   总计: ${result.total} 个角色`);
      logger.debug(`   成功: ${result.success} 个角色`);
      logger.debug(`   失败: ${result.failed} 个角色`);
      if (result.errors.length > 0) {
        logger.debug(`   错误详情:`);
        result.errors.forEach((error) => logger.debug(`     - ${error}`));
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
  const syncAllCharacters$1 = async (dataList) => {
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
    return response.data;
  }
  async function batchGetAvatarItemCalc(calcAvatars, uid, region) {
    const promises = calcAvatars.map(
      (item) => getAvatarItemCalc(item.avatar_id, item.weapon_id, uid, region)
    );
    return await Promise.all(promises);
  }
  class SyncService {
    /**
     * 同步电量（树脂）数据
     */
    async syncResinData() {
      try {
        logger.debug("🔋 开始同步电量数据...");
        const gameNote = await getGameNote();
        if (!gameNote) {
          logger.error("❌ 获取游戏便笺失败");
          setToast("获取游戏便笺失败", "error");
          return false;
        }
        const resinData = gameNote.energy;
        const success = setResinData(resinData);
        if (success) {
          logger.debug("✅ 电量数据同步成功");
          setToast(`电量同步成功: ${resinData.progress.current}/${resinData.progress.max}`, "success");
        } else {
          logger.error("❌ 电量数据设置失败");
          setToast("电量数据设置失败", "error");
        }
        return success;
      } catch (error) {
        logger.error("❌ 电量数据同步失败:", error);
        setToast("电量数据同步失败", "error");
        return false;
      }
    }
    /**
     * 同步单个角色数据
     */
    async syncSingleCharacter(avatarId) {
      try {
        logger.debug(`👤 开始同步角色数据: ${avatarId}`);
        const avatarDetails = await batchGetAvatarDetail([avatarId], void 0);
        if (!avatarDetails || avatarDetails.length === 0) {
          const message = "获取角色详细信息失败";
          logger.error(`❌ ${message}`);
          setToast(message, "error");
          return { success: 0, failed: 1, errors: [message] };
        }
        const avatarDetail = avatarDetails[0];
        const result = await syncCharacter(avatarDetail);
        if (result.success > 0) {
          logger.debug(`✅ 角色 ${avatarDetail.avatar.name_mi18n} 同步成功`);
          setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步成功`, "success");
        } else {
          logger.error(`❌ 角色 ${avatarDetail.avatar.name_mi18n} 同步失败`);
          setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步失败`, "error");
        }
        return result;
      } catch (error) {
        const message = `角色 ${avatarId} 同步失败`;
        logger.error(`❌ ${message}:`, error);
        setToast(message, "error");
        return { success: 0, failed: 1, errors: [String(error)] };
      }
    }
    /**
     * 同步所有角色数据
     */
    async syncAllCharacters() {
      try {
        logger.debug("👥 开始同步所有角色数据...");
        const avatarList = await getAvatarBasicList();
        if (!avatarList || avatarList.length === 0) {
          const message = "获取角色列表失败或角色列表为空";
          logger.error(`❌ ${message}`);
          setToast(message, "error");
          return {
            success: 0,
            failed: 1,
            errors: [message],
            total: 0,
            details: []
          };
        }
        logger.debug(`📋 找到 ${avatarList.length} 个角色`);
        setToast(`开始同步 ${avatarList.length} 个角色...`, "");
        const avatarIds = avatarList.map((avatar) => avatar.avatar.id);
        const avatarDetails = await batchGetAvatarDetail(avatarIds, void 0);
        if (!avatarDetails || avatarDetails.length === 0) {
          const message = "获取角色详细信息失败";
          logger.error(`❌ ${message}`);
          setToast(message, "error");
          return {
            success: 0,
            failed: 1,
            errors: [message],
            total: 0,
            details: []
          };
        }
        const batchResult = await syncAllCharacters$1(avatarDetails);
        if (batchResult.success > 0) {
          logger.debug(`✅ 所有角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`);
          setToast(`角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, "success");
        } else {
          logger.error(`❌ 角色批量同步失败`);
          setToast("角色批量同步失败", "error");
        }
        return batchResult;
      } catch (error) {
        const message = "所有角色同步失败";
        logger.error(`❌ ${message}:`, error);
        setToast(message, "error");
        return {
          success: 0,
          failed: 1,
          errors: [String(error)],
          total: 0,
          details: []
        };
      }
    }
    /**
     * 同步养成材料数据
     */
    async syncItemsData() {
      try {
        logger.debug("🔋 开始始同步养成材料数据...");
        const minSetChar = findMinimumSetCoverIds();
        const minSetWeapon = findMinimumSetWeapons();
        const calcParams = minSetChar.map((item) => ({
          avatar_id: item.id,
          weapon_id: minSetWeapon[item.style]
        }));
        const itemsData = await batchGetAvatarItemCalc(calcParams);
        if (!itemsData) {
          const message = "获取养成材料数据失败";
          logger.error(`❌ ${message}`);
          setToast(message, "error");
          return false;
        }
        const allItemsInfo = this.collectAllItemsInfo(itemsData);
        const itemsInventory = this.buildItemsInventory(itemsData, allItemsInfo);
        const seelieItems = getItems();
        seelieItems["denny"] = { type: "denny" };
        const i18nData = await getLanguageData();
        if (!i18nData) {
          const message = "获取语言数据失败";
          logger.error(`❌ ${message}`);
          setToast(message, "error");
          return false;
        }
        const cnName2SeelieItemName = this.buildCnToSeelieNameMapping(i18nData);
        const { successNum, failNum } = this.syncItemsToSeelie(
          itemsInventory,
          cnName2SeelieItemName,
          seelieItems
        );
        const success = successNum > 0;
        const total = successNum + failNum;
        if (success) {
          logger.debug(`✅ 养成材料同步成功: ${successNum}/${total}`);
          const toastType = failNum === 0 ? "success" : "warning";
          setToast(`养成材料同步成功: ${successNum}/${total}`, toastType);
        } else {
          logger.error("❌ 养成材料同步失败");
          setToast("养成材料同步失败", "error");
        }
        return success;
      } catch (error) {
        const message = "养成材料同步失败";
        logger.error(`❌ ${message}:`, error);
        setToast(message, "error");
        return false;
      }
    }
    /**
     * 收集所有物品信息（从所有消耗类型中获取完整的物品信息）
     */
    collectAllItemsInfo(itemsData) {
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
    /**
     * 构建物品库存数据（名称到数量的映射）
     */
    buildItemsInventory(itemsData, allItemsInfo) {
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
    /**
     * 构建中文名称到 Seelie 物品名称的映射
     */
    buildCnToSeelieNameMapping(i18nData) {
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
    /**
     * 同步物品到 Seelie
     */
    syncItemsToSeelie(itemsInventory, cnName2SeelieItemName, seelieItems) {
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
    /**
     * 执行完整同步（电量 + 所有角色 + 养成材料）
     */
    async syncAll() {
      logger.debug("🚀 开始执行完整同步...");
      setToast("开始执行完整同步...", "");
      const [resinSync, characterSync, itemsSync] = await Promise.all([
        this.syncResinData(),
        this.syncAllCharacters(),
        this.syncItemsData()
      ]);
      const totalSuccess = resinSync && characterSync.success > 0 && itemsSync;
      const message = totalSuccess ? "完整同步成功" : "完整同步部分失败";
      logger.debug(`${totalSuccess ? "✅" : "⚠️"} ${message}`);
      setToast(message, totalSuccess ? "success" : "error");
      return { resinSync, characterSync, itemsSync };
    }
  }
  const syncService = new SyncService();
  const syncResinData = () => {
    return syncService.syncResinData();
  };
  const syncAllCharacters = () => {
    return syncService.syncAllCharacters();
  };
  const syncItemsData = () => {
    return syncService.syncItemsData();
  };
  const syncAll = () => {
    return syncService.syncAll();
  };
  const MYS_URL = "https://www.miyoushe.com/zzz/";
  class SeeliePanel {
    container = null;
    userInfo = null;
    isLoading = false;
    isExpanded = false;
    // 控制二级界面展开状态
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
        this.userInfo = null;
        const errorMessage = String(error);
        if (errorMessage.includes("获取用户角色失败") || errorMessage.includes("HTTP 401") || errorMessage.includes("HTTP 403")) {
          this.userInfo = { error: "login_required", message: "请先登录米游社账号" };
        } else if (errorMessage.includes("未找到绝区零游戏角色")) {
          this.userInfo = { error: "no_character", message: "未找到绝区零游戏角色" };
        } else if (errorMessage.includes("网络") || errorMessage.includes("timeout") || errorMessage.includes("fetch")) {
          this.userInfo = { error: "network_error", message: "网络连接失败，请重试" };
        } else {
          this.userInfo = { error: "unknown", message: "用户信息加载失败" };
        }
      }
    }
    /**
     * 创建面板元素
     */
    createPanelElement() {
      const panel = document.createElement("div");
      panel.className = "w-full mb-3 p-3 bg-gray-800 rounded-lg border border-gray-200/20";
      panel.setAttribute("data-seelie-panel", "true");
      const userInfoSection = this.createUserInfoSection();
      const syncSection = this.createSyncSection();
      panel.appendChild(userInfoSection);
      panel.appendChild(syncSection);
      return panel;
    }
    /**
     * 创建用户信息区域
     */
    createUserInfoSection() {
      const section = document.createElement("div");
      section.className = "flex flex-col items-center justify-center mb-3";
      const infoText = document.createElement("div");
      infoText.className = "flex flex-col items-center text-center";
      if (this.userInfo && !("error" in this.userInfo)) {
        const nickname = document.createElement("div");
        nickname.className = "text-sm font-medium text-white";
        nickname.textContent = this.userInfo.nickname;
        const uid = document.createElement("div");
        uid.className = "text-xs text-gray-400";
        uid.textContent = `UID: ${this.userInfo.uid}`;
        infoText.appendChild(nickname);
        infoText.appendChild(uid);
      } else if (this.userInfo && "error" in this.userInfo) {
        const errorInfo = this.userInfo;
        const errorContainer = document.createElement("div");
        errorContainer.className = "flex flex-col items-center";
        const errorIcon = document.createElement("div");
        errorIcon.className = "text-red-400 mb-2";
        errorIcon.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      `;
        const errorMessage = document.createElement("div");
        errorMessage.className = "text-sm text-red-400 mb-2";
        errorMessage.textContent = errorInfo.message;
        errorContainer.appendChild(errorIcon);
        errorContainer.appendChild(errorMessage);
        if (errorInfo.error === "login_required") {
          const loginHint = document.createElement("div");
          loginHint.className = "text-xs text-gray-400 mb-2 text-center";
          loginHint.textContent = "请在新标签页中登录米游社后刷新页面";
          const loginButton = document.createElement("button");
          loginButton.className = "px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all duration-200";
          loginButton.textContent = "前往米游社登录";
          loginButton.addEventListener("click", () => {
            window.open(MYS_URL, "_blank");
          });
          errorContainer.appendChild(loginHint);
          errorContainer.appendChild(loginButton);
        } else if (errorInfo.error === "no_character") {
          const characterHint = document.createElement("div");
          characterHint.className = "text-xs text-gray-400 mb-2 text-center";
          characterHint.textContent = "请先在米游社绑定绝区零游戏角色";
          const bindButton = document.createElement("button");
          bindButton.className = "px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-all duration-200";
          bindButton.textContent = "前往绑定角色";
          bindButton.addEventListener("click", () => {
            window.open(MYS_URL, "_blank");
          });
          errorContainer.appendChild(characterHint);
          errorContainer.appendChild(bindButton);
        } else if (errorInfo.error === "network_error") {
          const retryButton = document.createElement("button");
          retryButton.className = "px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-all duration-200";
          retryButton.textContent = "重试";
          retryButton.addEventListener("click", () => this.refreshUserInfo());
          errorContainer.appendChild(retryButton);
        } else {
          const retryButton = document.createElement("button");
          retryButton.className = "px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-all duration-200";
          retryButton.textContent = "重试";
          retryButton.addEventListener("click", () => this.refreshUserInfo());
          errorContainer.appendChild(retryButton);
        }
        infoText.appendChild(errorContainer);
      } else {
        const errorText = document.createElement("div");
        errorText.className = "text-sm text-red-400";
        errorText.textContent = "用户信息加载失败";
        infoText.appendChild(errorText);
      }
      section.appendChild(infoText);
      return section;
    }
    /**
     * 创建同步按钮区域
     */
    createSyncSection() {
      const section = document.createElement("div");
      section.className = "flex flex-col items-center";
      const isUserInfoValid = this.userInfo && !("error" in this.userInfo);
      const disabledClass = isUserInfoValid ? "" : " opacity-50 cursor-not-allowed";
      const disabledBgClass = isUserInfoValid ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800";
      const mainSyncButton = document.createElement("button");
      mainSyncButton.className = `flex items-center justify-center px-6 py-2 ${disabledBgClass} text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2${disabledClass}`;
      mainSyncButton.disabled = !isUserInfoValid;
      mainSyncButton.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      <span class="sync-text">${isUserInfoValid ? "同步全部" : "请先登录"}</span>
    `;
      const expandButton = document.createElement("button");
      expandButton.className = `flex items-center justify-center px-4 py-1 ${isUserInfoValid ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-700"} text-white text-sm rounded transition-all duration-200${disabledClass}`;
      expandButton.disabled = !isUserInfoValid;
      expandButton.innerHTML = `
      <span class="mr-1 text-xs">更多选项</span>
      <svg class="w-3 h-3 expand-icon transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    `;
      if (isUserInfoValid) {
        mainSyncButton.addEventListener("click", () => this.handleSyncAll(mainSyncButton));
        expandButton.addEventListener("click", () => this.toggleExpanded(expandButton));
      }
      const detailsContainer = document.createElement("div");
      detailsContainer.className = "w-full mt-2 overflow-hidden transition-all duration-300";
      detailsContainer.style.maxHeight = "0";
      detailsContainer.style.opacity = "0";
      const detailsContent = this.createDetailedSyncOptions();
      detailsContainer.appendChild(detailsContent);
      section.appendChild(mainSyncButton);
      section.appendChild(expandButton);
      section.appendChild(detailsContainer);
      return section;
    }
    /**
     * 创建详细同步选项
     */
    createDetailedSyncOptions() {
      const container = document.createElement("div");
      container.className = "grid grid-cols-2 gap-2";
      const isUserInfoValid = this.userInfo && !("error" in this.userInfo);
      const syncOptions = [
        {
          text: "同步电量",
          icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>`,
          handler: (event) => this.handleSyncResin(event)
        },
        {
          text: "同步角色",
          icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>`,
          handler: (event) => this.handleSyncCharacters(event)
        },
        {
          text: "同步材料",
          icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>`,
          handler: (event) => this.handleSyncItems(event)
        },
        {
          text: "重置设备",
          icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15M12 3v9m0 0l-3-3m3 3l3-3"></path>
        </svg>`,
          handler: (event) => this.handleResetDeviceInfo(event)
        }
      ];
      syncOptions.forEach((option) => {
        const button = document.createElement("button");
        const buttonClass = isUserInfoValid ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-700 opacity-50 cursor-not-allowed";
        button.className = `flex items-center justify-center px-3 py-2 ${buttonClass} text-white text-sm font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;
        button.disabled = !isUserInfoValid;
        button.innerHTML = `${option.icon}<span class="sync-text">${option.text}</span>`;
        if (isUserInfoValid) {
          button.addEventListener("click", option.handler);
        }
        container.appendChild(button);
      });
      return container;
    }
    /**
     * 切换展开状态
     */
    toggleExpanded(expandButton) {
      if (this.isLoading) return;
      this.isExpanded = !this.isExpanded;
      const detailsContainer = this.container?.querySelector(".overflow-hidden");
      const expandIcon = expandButton.querySelector(".expand-icon");
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
        button = this.container?.querySelector(".sync-text")?.closest("button");
        if (!button) return;
      }
      await this.performSyncOperation(button, "同步中...", async () => {
        logger.debug("开始同步全部数据...");
        await this.performSync();
        logger.debug("✅ 同步完成");
      });
    }
    /**
     * 处理同步电量
     */
    async handleSyncResin(event) {
      const button = event?.target?.closest("button");
      if (!button) return;
      await this.performSyncOperation(button, "同步中...", async () => {
        logger.debug("开始同步电量数据...");
        const success = await syncResinData();
        if (!success) {
          throw new Error("电量同步失败");
        }
        logger.debug("✅ 电量同步完成");
      });
    }
    /**
     * 处理同步角色
     */
    async handleSyncCharacters(event) {
      const button = event?.target?.closest("button");
      if (!button) return;
      await this.performSyncOperation(button, "同步中...", async () => {
        logger.debug("开始同步角色数据...");
        const result = await syncAllCharacters();
        if (result.success === 0) {
          throw new Error("角色同步失败");
        }
        logger.debug("✅ 角色同步完成");
      });
    }
    /**
     * 处理同步材料
     */
    async handleSyncItems(event) {
      const button = event?.target?.closest("button");
      if (!button) return;
      await this.performSyncOperation(button, "同步中...", async () => {
        logger.debug("开始同步材料数据...");
        const success = await syncItemsData();
        if (!success) {
          throw new Error("材料同步失败");
        }
        logger.debug("✅ 材料同步完成");
      });
    }
    /**
     * 处理重置设备信息
     */
    async handleResetDeviceInfo(event) {
      const button = event?.target?.closest("button");
      if (!button) return;
      await this.performSyncOperation(button, "重置中...", async () => {
        logger.debug("开始重置设备信息...");
        try {
          await refreshDeviceInfo();
          logger.debug("✅ 设备信息重置完成");
          setToast("设备信息已重置", "success");
        } catch (error) {
          logger.error("设备信息重置失败:", error);
          setToast("设备信息重置失败", "error");
        }
      });
    }
    /**
     * 通用同步操作处理器
     */
    async performSyncOperation(button, loadingText, syncOperation) {
      if (this.isLoading) return;
      this.isLoading = true;
      const syncText = button.querySelector(".sync-text");
      const originalText = syncText.textContent;
      try {
        this.setAllButtonsDisabled(true);
        syncText.textContent = loadingText;
        const icon = button.querySelector("svg");
        if (icon) {
          icon.classList.add("animate-spin");
        }
        await syncOperation();
        this.showSyncResult(button, syncText, originalText, icon, "success");
      } catch (error) {
        logger.error("同步失败:", error);
        const icon = button.querySelector("svg");
        this.showSyncResult(button, syncText, originalText, icon, "error");
      }
    }
    /**
     * 执行同步操作
     */
    async performSync() {
      try {
        logger.debug("开始执行完整同步...");
        const result = await syncAll();
        const { resinSync, characterSync, itemsSync } = result;
        const totalSuccess = resinSync && characterSync.success > 0 && itemsSync;
        if (!totalSuccess) {
          const errorMessages = [];
          if (!resinSync) errorMessages.push("电量同步失败");
          if (characterSync.success === 0) {
            const charErrors = characterSync.errors || ["角色同步失败"];
            errorMessages.push(...charErrors);
          }
          if (!itemsSync) errorMessages.push("养成材料同步失败");
          const errorMessage = errorMessages.length > 0 ? errorMessages.join(", ") : "同步过程中出现错误";
          throw new Error(errorMessage);
        }
        logger.info(`✅ 同步完成 - 电量: ${resinSync ? "成功" : "失败"}, 角色: ${characterSync.success}/${characterSync.total}, 养成材料: ${itemsSync ? "成功" : "失败"}`);
      } catch (error) {
        logger.error("同步操作失败:", error);
        throw error;
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
    showSyncResult(button, syncText, originalText, icon, type) {
      const isSuccess = type === "success";
      syncText.textContent = isSuccess ? "同步完成" : "同步失败";
      const originalBgClass = button.className.match(/bg-gray-\d+/)?.[0] || "bg-gray-700";
      const originalHoverClass = button.className.match(/hover:bg-gray-\d+/)?.[0] || "hover:bg-gray-600";
      const newColorClass = isSuccess ? "bg-green-600" : "bg-red-600";
      const newHoverClass = isSuccess ? "hover:bg-green-700" : "hover:bg-red-700";
      button.className = button.className.replace(originalBgClass, newColorClass).replace(originalHoverClass, newHoverClass);
      setTimeout(() => {
        syncText.textContent = originalText || "同步全部";
        button.className = button.className.replace(newColorClass, originalBgClass).replace(newHoverClass, originalHoverClass);
        if (icon) {
          icon.classList.remove("animate-spin");
        }
        this.setAllButtonsDisabled(false);
        this.isLoading = false;
      }, 2e3);
    }
    /**
     * 销毁面板
     */
    destroy() {
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
        await this.loadUserInfo();
        if (this.container) {
          const parent = this.container.parentNode;
          if (parent) {
            this.destroy();
            await this.createPanel();
          }
        }
      } catch (error) {
        logger.error("刷新用户信息失败:", error);
      }
    }
  }
  function registerSeeliePanel() {
    const config = {
      id: "seelie-panel",
      targetSelector: SeeliePanel.TARGET_SELECTOR,
      componentSelector: SeeliePanel.PANEL_SELECTOR,
      condition: () => {
        return true;
      }
    };
    domInjector.register(config, () => new SeeliePanel());
    logger.debug("📝 Seelie 面板组件注册完成");
  }
  const componentRegisters = {
    seeliePanel: registerSeeliePanel
  };
  function registerAllComponents() {
    logger.debug("🎯 开始注册所有组件");
    Object.values(componentRegisters).forEach((register) => register());
    logger.debug("✅ 所有组件注册完成");
  }
  function initApp() {
    logger.log("🎯 zzz-seelie-sync 脚本已加载");
    initDOMInjector();
  }
  function initDOMInjector() {
    try {
      if (domInjector.isInit()) {
        logger.debug("DOM 注入管理器已初始化，跳过");
        return;
      }
      registerAllComponents();
      domInjector.init();
      logger.debug("✅ DOM 注入管理器初始化完成");
    } catch (error) {
      logger.error("❌ 初始化 DOM 注入管理器失败:", error);
    }
  }
  initApp();

})(GM_fetch);