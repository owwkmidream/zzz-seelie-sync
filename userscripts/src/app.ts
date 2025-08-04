// 应用主逻辑

import { initVNodeTraversal, startVNodeTraversal } from './utils/vnodeTraverser';
import { useRouterWatcher } from './utils/useRouterWatcher';
import { RouteButtonManager } from './utils/buttonInjector';
import { seelieDataManager } from './utils/seelie';

/**
 * 初始化应用
 */
export function initApp(): void {
  console.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');

  // 初始化 VNode 遍历
  initVNodeTraversal();

  // 创建按钮管理器
  const buttonManager = new RouteButtonManager();

  // 设置路由监听
  setTimeout(() => {
    console.log('🚦 设置路由监听...');

    const { unwatch } = useRouterWatcher((to, from) => {
      // 路由变化时重新遍历 VNode 树
      console.log('🔄 路由变化，重新执行功能...');
      startVNodeTraversal();

      // 刷新 seelie 数据管理器
      seelieDataManager.refresh();

      // 处理按钮注入
      buttonManager.onRouteChange(to?.path || '');
    }, {
      delay: 100,
      immediate: true // 立即执行一次，处理当前路由
    });

    // 将调试函数挂载到全局
    if (typeof window !== 'undefined') {
      (window as any).unwatchRouter = unwatch;
      (window as any).buttonManager = buttonManager;
      (window as any).seelieDataManager = seelieDataManager;
    }
  }, 500); // 延迟 500ms 确保 Router 完全初始化
}