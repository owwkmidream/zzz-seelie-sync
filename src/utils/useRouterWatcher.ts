// Vue Router 监听 Hook
import { logger } from "./logger";

interface VueApp {
  config?: {
    globalProperties?: {
      $router?: VueRouter;
    };
  };
  _context?: {
    provides?: Record<symbol, unknown>;
  };
}

interface AppElementWithVue extends HTMLElement {
  __vue_app__?: VueApp;
}

interface VueRouter {
  afterEach: (callback: (to: RouteLocation, from: RouteLocation) => void) => () => void;
  beforeEach: (callback: (to: RouteLocation, from: RouteLocation) => void) => () => void;
  push: (location: string | RouteLocation) => Promise<void>;
  currentRoute?: {
    value?: RouteLocation;
  } | RouteLocation;
}

export interface RouteLocation {
  path: string;
  [key: string]: unknown;
}

// 待注册的 Hook 队列
interface PendingHook {
  callback: (to: RouteLocation, from: RouteLocation | null) => void;
  options: {
    delay?: number;
    immediate?: boolean;
  };
  unwatchRef: { current: (() => void) | null };
}

let pendingHooks: PendingHook[] = [];
let routerObserver: MutationObserver | null = null;
let isObserving = false;

/**
 * 查找 Vue Router 实例
 */
function findVueRouter(): VueRouter | null {
  const appElement = document.querySelector('#app') as AppElementWithVue;

  if (!appElement?.__vue_app__) {
    logger.debug('🔍 未找到 Vue App 实例，可能还在加载中...');
    return null;
  }

  logger.debug('🔍 查找 Vue Router 实例...');

  // 首选方法：直接从 __vue_app__.config.globalProperties.$router 获取
  const router = appElement.__vue_app__.config?.globalProperties?.$router;
  if (router) {
    if (typeof router.afterEach === 'function' &&
      typeof router.beforeEach === 'function' &&
      typeof router.push === 'function') {
      logger.info('✓ 从 __vue_app__.config.globalProperties.$router 找到 Router 实例');
      logger.debug('Router 实例:', router);
      return router;
    }
  }

  // 备选方法：从 _context.provides 中查找
  const context = appElement.__vue_app__._context;
  if (context?.provides) {
    logger.debug('🔍 尝试从 provides 查找 Router...');
    const provides = context.provides;

    // 获取所有 Symbol 键
    const symbols = Object.getOwnPropertySymbols(provides);

    // 遍历所有 Symbol 属性，查找 Vue Router
    for (const symbol of symbols) {
      const value = provides[symbol];

      // 检查是否是 Vue Router 实例
      if (value && typeof value === 'object') {
        const potentialRouter = value as Record<string, unknown>
        // Vue Router 通常有这些方法
        if (typeof potentialRouter.afterEach === 'function' &&
          typeof potentialRouter.beforeEach === 'function' &&
          typeof potentialRouter.push === 'function') {
          logger.info('✓ 从 provides 找到 Router 实例:', symbol.toString());
          logger.debug('Router 实例:', value);
          return potentialRouter as unknown as VueRouter;
        }
      }
    }
  }

  logger.debug('🔍 未找到 Vue Router 实例，可能还在初始化中...');
  return null;
}

/**
 * 停止 MutationObserver
 */
function stopRouterObserver(): void {
  if (routerObserver) {
    routerObserver.disconnect();
    routerObserver = null;
  }
  isObserving = false;
}

/**
 * 启动 MutationObserver 监听 Vue App 的加载
 */
function startRouterObserver(): void {
  const timeout = 3000;
  if (isObserving || routerObserver) {
    return;
  }

  logger.debug('👀 启动 Vue Router 观察器...');
  isObserving = true;

  routerObserver = new MutationObserver(() => {
    const router = findVueRouter();
    if (router) {
      logger.info('✓ Vue Router 已加载，处理待注册的 Hook...');

      // 停止观察
      stopRouterObserver();

      // 处理所有待注册的 Hook
      processPendingHooks(router);
    }
  });

  // 观察整个 document 的变化
  routerObserver.observe(document.querySelector('#app') as Element, {
    childList: false,
    subtree: false,
    attributes: true,
  });

  // 设置超时，避免无限等待
  setTimeout(() => {
    if (isObserving) {
      logger.warn('⚠️ Vue Router 观察器超时，停止观察');
      stopRouterObserver();

      // 处理待注册的 Hook，即使没有找到 router
      processPendingHooks(null);
    }
  }, timeout); // 10秒超时
}

/**
 * 处理待注册的 Hook
 */
function processPendingHooks(router: VueRouter | null): void {
  logger.debug(`🔄 处理 ${pendingHooks.length} 个待注册的 Hook...`);

  const hooks = [...pendingHooks];
  pendingHooks = []; // 清空队列

  hooks.forEach(({ callback, options, unwatchRef }) => {
    if (router) {
      // 注册 Hook
      const { unwatch } = registerRouterHook(router, callback, options);
      unwatchRef.current = unwatch;
    } else {
      // Router 未找到，设置空的 unwatch 函数
      logger.warn('⚠️ Vue Router 未找到，Hook 注册失败');
      unwatchRef.current = () => { };
    }
  });
}

/**
 * 注册路由 Hook
 */
function registerRouterHook(
  router: VueRouter,
  callback: (to: RouteLocation, from: RouteLocation | null) => void,
  options: { delay?: number; immediate?: boolean }
): {
  router: VueRouter;
  unwatch: () => void;
  getCurrentRoute: () => RouteLocation | undefined;
} {
  const { delay = 100, immediate = false } = options;

  // 如果需要立即执行
  if (immediate) {
    setTimeout(() => {
      const currentRoute = router.currentRoute?.value || router.currentRoute;
      callback(currentRoute as RouteLocation, null);
    }, delay);
  }

  // 注册路由变化后的钩子
  const unwatch = router.afterEach((to: RouteLocation, from: RouteLocation) => {
    logger.debug('🔄 路由变化检测到:', from?.path, '->', to?.path);

    // 延迟执行回调
    setTimeout(() => {
      callback(to, from);
    }, delay);
  });

  return {
    router,
    unwatch,
    getCurrentRoute: () => {
      const currentRoute = router.currentRoute?.value || router.currentRoute;
      return currentRoute as RouteLocation | undefined;
    }
  };
}

/**
 * 获取当前路由信息
 */
export function getCurrentRoute(): RouteLocation | null {
  const router = findVueRouter();
  if (!router) {
    logger.error('❌ 未找到 Router 实例');
    return null;
  }

  const currentRoute = router.currentRoute?.value || router.currentRoute;
  const route = currentRoute as RouteLocation | undefined
  logger.debug('📍 当前路由:', route?.path);
  return route || null;
}

/**
 * 路由监听 Hook
 * @param callback 路由变化时的回调函数
 * @param options 配置选项
 */
export function useRouterWatcher(
  callback: (to: RouteLocation, from: RouteLocation | null) => void,
  options: {
    delay?: number;        // 回调延迟时间（ms），默认 100
    immediate?: boolean;   // 是否立即执行一次回调，默认 false
  } = {}
) {
  logger.debug('🚦 设置路由监听 Hook...');

  const router = findVueRouter();

  if (router) {
    // Router 已找到，直接注册
    logger.debug('✓ Vue Router 已存在，直接注册 Hook');
    const result = registerRouterHook(router, callback, options);
    return result;
  }

  // Router 未找到，创建延迟注册机制
  logger.debug('⏳ Vue Router 未找到，设置延迟注册...');

  // 创建 unwatch 引用，用于后续更新
  const unwatchRef = { current: null as (() => void) | null };

  // 添加到待注册队列
  pendingHooks.push({
    callback,
    options,
    unwatchRef
  });

  // 启动观察器（如果还没启动）
  startRouterObserver();

  // 返回同步结果，unwatch 会在 router 找到后更新
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
        return currentRoute as RouteLocation | undefined;
      }
      return undefined;
    }
  };
}

/**
 * 简化版路由监听，专门用于重新执行某个函数
 * @param fn 要重新执行的函数
 * @param options 配置选项
 */
export function useRouterRerun(
  fn: () => void,
  options: {
    delay?: number;        // 延迟时间（ms），默认 100
    immediate?: boolean;   // 是否立即执行一次，默认 true
  } = {}
) {
  const { delay = 100, immediate = true } = options;

  return useRouterWatcher(
    () => {
      logger.debug('🔄 路由变化，重新执行函数...');
      fn();
    },
    { delay, immediate }
  );
}

// 将函数挂载到全局对象，方便调试
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const globalWindow = window as unknown as Record<string, unknown>;
  globalWindow.useRouterWatcher = useRouterWatcher;
  globalWindow.useRouterRerun = useRouterRerun;
  globalWindow.getCurrentRoute = getCurrentRoute;
}