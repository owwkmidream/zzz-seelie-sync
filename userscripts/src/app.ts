// 应用主逻辑

import { initVNodeTraversal } from './utils/vnodeTraverser';
import './utils/seelie';
import './api/hoyo';

/**
 * 初始化应用
 */
export function initApp(): void {
  console.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');

  // 初始化 VNode 遍历（通过全局 mixin 自动处理）
  initVNodeTraversal();
}