// Vue API 通过 auto-import 自动导入，无需手动 import
// import './style.css'; // 注释掉样式导入，避免影响目标网站
// import App from './App.vue'; // 暂时不需要 App 组件

import { initVNodeTraversal, startVNodeTraversal } from './utils/vnodeTraverser';
import { useRouterWatcher, getCurrentRoute } from './utils/useRouterWatcher';
import { RouteButtonManager } from './utils/buttonInjector';

// 启动 VNode 遍历功能
console.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');

// 初始化 VNode 遍历
initVNodeTraversal();

// 创建按钮管理器
const buttonManager = new RouteButtonManager();

// 设置路由监听
setTimeout(() => {
  console.log('🚦 设置路由监听...');

  const { unwatch, getCurrentRoute: getRoute } = useRouterWatcher((to, from) => {
    // 路由变化时重新遍历 VNode 树
    console.log('🔄 路由变化，重新执行功能...');
    startVNodeTraversal();

    // 处理按钮注入
    buttonManager.onRouteChange(to?.path || '');
  }, {
    delay: 100,
    immediate: true // 立即执行一次，处理当前路由
  });

  // 将 unwatch 函数挂载到全局，方便调试时停止监听
  if (typeof window !== 'undefined') {
    (window as any).unwatchRouter = unwatch;
    (window as any).buttonManager = buttonManager;
  }
}, 500); // 延迟 500ms 确保 Router 完全初始化

// 原有的 Vue 应用创建逻辑保持不变（已注释）
// createApp(App).mount(
//   (() => {
//     const app = document.createElement('div');
//     document.body.append(app);
//     return app;
//   })(),
// );
