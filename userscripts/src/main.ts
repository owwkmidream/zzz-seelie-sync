// Vue API 通过 auto-import 自动导入，无需手动 import
// import './style.css'; // 注释掉样式导入，避免影响目标网站
// import App from './App.vue'; // 暂时不需要 App 组件

import { initVNodeTraversal } from './utils/vnodeTraverser';

// 启动 VNode 遍历功能
console.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');
initVNodeTraversal();

// 原有的 Vue 应用创建逻辑保持不变（已注释）
// createApp(App).mount(
//   (() => {
//     const app = document.createElement('div');
//     document.body.append(app);
//     return app;
//   })(),
// );
