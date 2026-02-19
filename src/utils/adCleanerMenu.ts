import { destroyAdCleaner, getUBlockRulesText, initAdCleaner } from './adCleaner';
import { logger } from './logger';

const TARGET_HOST = 'zzz.seelie.me';
const AD_CLEANER_ENABLED_KEY = 'seelie_ad_cleaner_enabled';
const AD_CLEANER_ENABLED_DEFAULT = true;

function isTargetHost(): boolean {
  return window.location.hostname === TARGET_HOST;
}

function safeReadAdCleanerEnabled(): boolean {
  try {
    const value = localStorage.getItem(AD_CLEANER_ENABLED_KEY);
    if (value === null) {
      return AD_CLEANER_ENABLED_DEFAULT;
    }
    return value === '1';
  } catch (error) {
    logger.warn('读取去广告开关失败，使用默认值:', error);
    return AD_CLEANER_ENABLED_DEFAULT;
  }
}

function safeWriteAdCleanerEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AD_CLEANER_ENABLED_KEY, enabled ? '1' : '0');
  } catch (error) {
    logger.warn('写入去广告开关失败:', error);
  }
}

function applyAdCleanerEnabled(enabled: boolean): void {
  if (enabled) {
    initAdCleaner();
    return;
  }

  destroyAdCleaner();
}

/**
 * 是否在目标站点，决定是否展示设置项
 */
export function isAdCleanerSettingAvailable(): boolean {
  return isTargetHost();
}

/**
 * 获取去广告开关状态
 */
export function getAdCleanerEnabled(): boolean {
  return safeReadAdCleanerEnabled();
}

/**
 * 更新去广告开关状态并立即生效
 */
export function setAdCleanerEnabled(enabled: boolean): void {
  safeWriteAdCleanerEnabled(enabled);
  applyAdCleanerEnabled(enabled);
}

/**
 * 获取当前 uBlock 规则文本
 */
export function getAdCleanerRulesText(): string {
  return getUBlockRulesText();
}

/**
 * 复制 uBlock 规则到剪贴板
 */
export async function copyAdCleanerRules(): Promise<boolean> {
  const rules = getUBlockRulesText();

  if (!navigator?.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(rules);
    return true;
  } catch (error) {
    logger.warn('复制 uBlock 规则失败:', error);
    return false;
  }
}

/**
 * 初始化去广告运行时（基于本地设置应用，不再使用 GM 菜单）
 */
export function initAdCleanerSettings(): void {
  if (!isTargetHost()) {
    return;
  }

  applyAdCleanerEnabled(safeReadAdCleanerEnabled());
}
