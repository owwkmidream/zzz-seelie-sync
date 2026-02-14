/**
 * 组件注册中心
 * 统一管理所有需要 DOM 注入的组件注册
 */

import { logger } from '@logger';
import { SeeliePanel } from '@/components/SeeliePanel';
import { domInjector, type ComponentConfig } from './useDOMInjector';

/**
 * Seelie 面板组件注册配置
 */
function registerSeeliePanel(): void {
  const config: ComponentConfig = {
    id: 'seelie-panel',
    targetSelector: SeeliePanel.TARGET_SELECTOR,
    componentSelector: SeeliePanel.PANEL_SELECTOR,
  };

  domInjector.register(config, () => new SeeliePanel());
  logger.debug('📝 Seelie 面板组件注册完成');
}

/**
 * 注册所有组件
 */
export function registerAllComponents(): void {
  logger.info('🎯 开始注册所有组件');

  registerSeeliePanel();

  logger.info('✅ 所有组件注册完成');
}

/**
 * 获取全局 DOM 注入管理器实例
 */
export { domInjector };
