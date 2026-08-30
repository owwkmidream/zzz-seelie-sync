// 应用主逻辑

import { domInjector } from './utils/useDOMInjector';
import { registerAllComponents } from './utils/componentRegistry';
import { initAdCleanerSettings } from './utils/adCleanerMenu';
import { initGmMenu } from './utils/gmMenu';
import { initNativeSyncHijack, probeNativeSync } from './utils/nativeSyncHijackRuntime';
import './utils/seelie';
import './api/hoyo';
import { logger } from './utils/logger';

/**
 * 初始化应用
 */
export function initApp(): void {
  logger.info('🎯 zzz-seelie-sync 脚本已加载');

  // 初始化去广告设置对应的运行时逻辑
  initAdCleanerSettings();

  // 注册 GM 菜单（不依赖站点 DOM，作为面板注入失败时的兜底入口）
  initGmMenu();

  // 暴露探测入口，便于在控制台确认原生按钮劫持状态
  Reflect.set(window, 'zssProbeNativeSync', probeNativeSync);

  // document-start 阶段 body 可能尚未就绪，延后初始化 DOM 注入管理器
  runWhenDOMReady(() => {
    initDOMInjector();
    initNativeSyncHijack();
  });
}

function runWhenDOMReady(task: () => void): void {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', task, { once: true });
    return;
  }

  task();
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

    logger.info('✅ DOM 注入管理器初始化完成');

  } catch (error) {
    logger.error('❌ 初始化 DOM 注入管理器失败:', error);
  }
}
