// Vue Router 监听 Hook

/**
 * 查找 Vue Router 实例
 */
function findVueRouter(): any {
  const appElement = document.querySelector('#app') as any;

  if (!appElement?.__vue_app__?._context?.provides) {
    console.error('❌ 未找到 Vue App 实例或 provides');
    return null;
  }

  const provides = appElement.__vue_app__._context.provides;
  console.log('🔍 查找 Vue Router 实例...');

  // 获取所有 Symbol 键
  const symbols = Object.getOwnPropertySymbols(provides);
  // console.log(`找到 ${symbols.length} 个 Symbol 属性`);

  // 遍历所有 Symbol 属性，查找 Vue Router
  for (const symbol of symbols) {
    const value = provides[symbol];

    // console.log(`检查 Symbol: ${symbol.toString()}`);
    // console.log('值的类型:', typeof value);

    // 检查是否是 Vue Router 实例
    if (value && typeof value === 'object') {
      const methods = Object.keys(value).filter(key => typeof value[key] === 'function');
      // console.log('对象方法:', methods);

      // Vue Router 通常有这些方法
      if (typeof value.afterEach === 'function' &&
        typeof value.beforeEach === 'function' &&
        typeof value.push === 'function') {
        // console.log('✓ 找到 Vue Router 实例:', symbol.toString());
        console.log('Router 实例:', value);
        return value;
      }
    }
  }

  // 备用方法：尝试从全局对象查找
  console.log('🔍 尝试备用方法查找 Router...');

  // 检查是否有全局的 router 实例
  if (typeof window !== 'undefined') {
    const globalRouter = (window as any).$router || (window as any).router;
    if (globalRouter && typeof globalRouter.afterEach === 'function') {
      console.log('✓ 从全局对象找到 Router 实例');
      return globalRouter;
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
    (to, from) => {
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