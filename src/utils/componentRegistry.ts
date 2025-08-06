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
    condition: () => {
      // 可以添加额外的条件检查
      return true;
    },
  };

  domInjector.register(config, () => new SeeliePanel());
  logger.debug('📝 Seelie 面板组件注册完成');
}

/**
 * 组件注册函数映射
 */
const componentRegisters = {
  seeliePanel: registerSeeliePanel,
} as const;

/**
 * 注册所有组件
 */
export function registerAllComponents(): void {
  logger.debug('🎯 开始注册所有组件');

  // 注册所有组件
  Object.values(componentRegisters).forEach(register => register());

  logger.debug('✅ 所有组件注册完成');
}

/**
 * 按需注册指定组件
 */
export function registerComponents(
  components: (keyof typeof componentRegisters)[]
): void {
  logger.debug('🎯 按需注册指定组件:', components);

  for (const componentName of components) {
    const registerFn = componentRegisters[componentName];
    if (registerFn) {
      registerFn();
    } else {
      logger.warn(`⚠️ 未找到组件注册函数: ${componentName}`);
    }
  }

  logger.debug('✅ 指定组件注册完成');
}

/**
 * 获取全局 DOM 注入管理器实例
 */
export { domInjector };