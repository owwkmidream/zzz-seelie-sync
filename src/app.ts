// 应用主逻辑

import { initVNodeTraversal } from './utils/vnodeTraverser';
import { domInjector } from './utils/useDOMInjector';
import { registerAllComponents } from './utils/componentRegistry';
import './utils/seelie';
import './api/hoyo';
import { logger } from './utils/logger';

/**
 * 初始化应用
 */
export function initApp(): void {
  logger.log('🎯 Vue 3 VNode 遍历脚本已加载 - 目标: https://zzz.seelie.me/*');

  // 初始化 VNode 遍历（通过全局 mixin 自动处理）
  if (import.meta.env.DEV && false) initVNodeTraversal();

  // 初始化 DOM 注入管理器
  initDOMInjector();
}

/**
 * 初始化 DOM 注入管理器
 */
function initDOMInjector(): void {
  try {
    // 避免重复初始化
    if (domInjector.isInit()) {
      logger.debug('DOM 注入管理器已初始化，跳过');
      return;
    }

    // 注册所有组件
    registerAllComponents();

    // 初始化管理器
    domInjector.init();

    logger.debug('✅ DOM 注入管理器初始化完成');

  } catch (error) {
    logger.error('❌ 初始化 DOM 注入管理器失败:', error);
  }
}
