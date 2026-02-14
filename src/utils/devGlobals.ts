/**
 * DEV 环境全局调试挂载工具
 * 统一处理 window 类型断言与挂载逻辑，避免各模块重复样板代码
 */
export function exposeDevGlobals(globals: Record<string, unknown>): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return;
  }

  for (const [key, value] of Object.entries(globals)) {
    Reflect.set(window, key, value);
  }
}
