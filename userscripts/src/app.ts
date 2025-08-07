// 应用主逻辑

import { initVNodeTraversal } from './utils/vnodeTraverser';
import { SeeliePanel } from './components/SeeliePanel';
import './utils/seelie';
import './api/hoyo';
import { logger } from './utils/logger';

// 全局面板实例
let seeliePanel: SeeliePanel | null = null;

/**
 * 初始化应用
 */
export function initApp(): void {
  logger.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');

  // 初始化 VNode 遍历（通过全局 mixin 自动处理）
  initVNodeTraversal();

  // 初始化 Seelie 面板
  initSeeliePanel();
}

/**
 * 初始化 Seelie 面板
 */
function initSeeliePanel(): void {
  try {
    // 避免重复创建
    if (seeliePanel) {
      logger.debug('Seelie 面板已存在，跳过初始化');
      return;
    }

    seeliePanel = new SeeliePanel();
    logger.debug('✅ Seelie 面板初始化完成');

    // 监听页面变化，确保面板在路由切换后仍然存在
    const observer = new MutationObserver(() => {
      const targetContainer = document.querySelector('div.flex.flex-col.items-center.justify-center.w-full.mt-3');
      const existingPanel = document.querySelector('[data-seelie-panel="true"]');

      if (targetContainer && !existingPanel) {
        logger.debug('检测到页面变化，重新创建面板');
        seeliePanel?.refreshUserInfo();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  } catch (error) {
    logger.error('初始化 Seelie 面板失败:', error);
  }
}