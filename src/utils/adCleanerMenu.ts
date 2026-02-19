import { destroyAdCleaner, getUBlockRulesText, initAdCleaner } from './adCleaner';
import { logger } from './logger';

const TARGET_HOST = 'zzz.seelie.me';
const AD_CLEANER_ENABLED_KEY = 'seelie_ad_cleaner_enabled';
const AD_CLEANER_ENABLED_DEFAULT = true;

let toggleMenuId: string | number | null = null;
let copyMenuId: string | number | null = null;

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

function unregisterMenuCommand(commandId: string | number | null): void {
  if (commandId === null) {
    return;
  }

  try {
    GM_unregisterMenuCommand(commandId);
  } catch (error) {
    logger.debug('注销菜单命令失败，忽略:', error);
  }
}

function copyRulesToClipboard(): boolean {
  try {
    GM_setClipboard(getUBlockRulesText(), 'text');
    return true;
  } catch (error) {
    logger.warn('复制 uBlock 规则失败:', error);
    return false;
  }
}

function showRulesToUser(): void {
  const copied = copyRulesToClipboard();
  if (copied) {
    window.alert('uBlock 规则已复制到剪贴板。请粘贴到 uBlock Origin 的“我的过滤器”。');
    return;
  }

  window.prompt('当前环境不支持自动复制，请手动复制以下规则到 uBlock Origin 的“我的过滤器”：', getUBlockRulesText());
}

function buildToggleMenuTitle(enabled: boolean): string {
  return enabled
    ? '脚本去广告：开启（点击关闭）'
    : '脚本去广告：关闭（点击开启）';
}

function rebuildMenuCommands(): void {
  unregisterMenuCommand(toggleMenuId);
  unregisterMenuCommand(copyMenuId);
  toggleMenuId = null;
  copyMenuId = null;

  const enabled = safeReadAdCleanerEnabled();

  toggleMenuId = GM_registerMenuCommand(buildToggleMenuTitle(enabled), () => {
    const nextEnabled = !safeReadAdCleanerEnabled();
    safeWriteAdCleanerEnabled(nextEnabled);
    applyAdCleanerEnabled(nextEnabled);
    rebuildMenuCommands();

    const stateText = nextEnabled ? '已开启' : '已关闭';
    window.alert(`${stateText}脚本内去广告。\n如需完整切换效果，建议刷新页面。`);
  });

  copyMenuId = GM_registerMenuCommand('复制 uBlock 去广告规则', () => {
    showRulesToUser();
  });
}

/**
 * 初始化去广告菜单功能（开关 + 复制 uBlock 规则）
 */
export function initAdCleanerMenu(): void {
  if (!isTargetHost()) {
    return;
  }

  if (typeof GM_registerMenuCommand !== 'function') {
    logger.warnOnce('ad-cleaner-menu-not-supported', '当前脚本管理器不支持菜单命令，跳过去广告菜单初始化');
    applyAdCleanerEnabled(safeReadAdCleanerEnabled());
    return;
  }

  applyAdCleanerEnabled(safeReadAdCleanerEnabled());
  rebuildMenuCommands();
}
