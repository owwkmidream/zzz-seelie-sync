import { initApp } from './app';
import { exposeAllModulesAsDevGlobals } from './utils/devGlobals';

function exposeRuntimeEnvGlobals(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const isDev = import.meta.env.DEV;
  Reflect.set(window, '__ZSS_DEV__', isDev);
  Reflect.set(window, 'isZssDevEnvironment', () => isDev);
}

// 暴露运行环境标记（__ZSS_DEV__ / isZssDevEnvironment）
exposeRuntimeEnvGlobals();

// 启动应用
initApp();

// 开发环境下挂载全量调试全局对象
if (import.meta.env.DEV) {
  void exposeAllModulesAsDevGlobals();
}
