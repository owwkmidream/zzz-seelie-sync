// Vue API 通过 auto-import 自动导入，无需手动 import
// import './style.css'; // 注释掉样式导入，避免影响目标网站
// import App from './App.vue'; // 暂时不需要 App 组件

import { initVNodeTraversal, startVNodeTraversal } from './utils/vnodeTraverser';
import { useRouterRerun } from './utils/useRouterWatcher';

// 启动 VNode 遍历功能
console.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');

// 初始化 VNode 遍历
initVNodeTraversal();

// 设置路由监听，路由变化时重新遍历
setTimeout(() => {
  console.log('🚦 设置路由监听...');
  useRouterRerun(startVNodeTraversal, {
    delay: 100,      // 路由变化后延迟 100ms 重新遍历
    immediate: false // 不立即执行，因为已经在 initVNodeTraversal 中执行过了
  });
}, 500); // 延迟 500ms 确保 Router 完全初始化

// 原有的 Vue 应用创建逻辑保持不变（已注释）
// createApp(App).mount(
//   (() => {
//     const app = document.createElement('div');
//     document.body.append(app);
//     return app;
//   })(),
// );
