// Vue Router 监听 Hook

/**
 * 查找 Vue Router 实例
 */
function findVueRouter(): any {
  const appElement = document.querySelector('#app') as any;

  if (!appElement?.__vue_app__) {
    console.error('❌ 未找到 Vue App 实例');
    return null;
  }

  console.log('🔍 查找 Vue Router 实例...');

  // 首选方法：直接从 __vue_app__.config.globalProperties.$router 获取
  const router = appElement.__vue_app__.config?.globalProperties?.$router;
  if (router) {
    if (typeof router.afterEach === 'function' &&
      typeof router.beforeEach === 'function' &&
      typeof router.push === 'function') {
      console.log('✓ 从 __vue_app__.config.globalProperties.$router 找到 Router 实例');
      console.log('Router 实例:', router);
      return router;
    }
  }

  // 备选方法：从 _context.provides 中查找
  const context = appElement.__vue_app__._context;
  if (context?.provides) {
    console.log('🔍 尝试从 provides 查找 Router...');
    const provides = context.provides;

    // 获取所有 Symbol 键
    const symbols = Object.getOwnPropertySymbols(provides);

    // 遍历所有 Symbol 属性，查找 Vue Router
    for (const symbol of symbols) {
      const value = provides[symbol];

      // 检查是否是 Vue Router 实例
      if (value && typeof value === 'object') {
        // Vue Router 通常有这些方法
        if (typeof value.afterEach === 'function' &&
          typeof value.beforeEach === 'function' &&
          typeof value.push === 'function') {
          console.log('✓ 从 provides 找到 Router 实例:', symbol.toString());
          console.log('Router 实例:', value);
          return value;
        }
      }
    }
  }

  console.error('❌ 未找到 Vue Router 实例');
  return null;
}

/**
 * 获取当前路由信息
 */
export function getCurrentRoute(): any {
  const router = findVueRouter();
  if (!router) {
    console.error('❌ 未找到 Router 实例');
    return null;
  }

  const currentRoute = router.currentRoute?.value || router.currentRoute;
  console.log('📍 当前路由:', currentRoute?.path);
  return currentRoute;
}

/**
 * 路由监听 Hook
 * @param callback 路由变化时的回调函数
 * @param options 配置选项
 */
export function useRouterWatcher(
  callback: (to: any, from: any) => void,
  options: {
    delay?: number;        // 回调延迟时间（ms），默认 100
    immediate?: boolean;   // 是否立即执行一次回调，默认 false
  } = {}
) {
  const { delay = 100, immediate = false } = options;

  console.log('🚦 设置路由监听 Hook...');

  const router = findVueRouter();
  if (!router) {
    console.error('❌ 无法设置路由监听：未找到 Router 实例');
    return {
      router: null,
      unwatch: () => { }
    };
  }

  // 如果需要立即执行
  if (immediate) {
    setTimeout(() => {
      callback(router.currentRoute?.value || router.currentRoute, null);
    }, delay);
  }

  // 注册路由变化后的钩子
  const unwatch = router.afterEach((to: any, from: any) => {
    console.log('🔄 路由变化检测到:', from?.path, '->', to?.path);

    // 延迟执行回调
    setTimeout(() => {
      callback(to, from);
    }, delay);
  });

  console.log('✓ 路由监听 Hook 设置完成');

  return {
    router,
    unwatch,
    getCurrentRoute: () => router.currentRoute?.value || router.currentRoute
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
      console.log('🔄 路由变化，重新执行函数...');
      fn();
    },
    { delay, immediate }
  );
}

// 将函数挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).useRouterWatcher = useRouterWatcher;
  (window as any).useRouterRerun = useRouterRerun;
  (window as any).getCurrentRoute = getCurrentRoute;
}