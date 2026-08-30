/**
 * GM 菜单入口
 *
 * 站点 DOM 改版时侧边栏面板会注入失败，此时用户没有任何入口触达同步功能。
 * 这里注册一个不依赖站点 DOM 的菜单项，用于唤出悬浮面板。
 */

import { GM } from '$';
import { logger } from './logger';
import { openFloatingPanel } from '@/components/SeeliePanelFloating';

const TARGET_HOST = 'zzz.seelie.me';
const MENU_CAPTION = '打开同步面板（悬浮窗）';

let registered = false;

/**
 * 注册 GM 菜单项
 */
export function initGmMenu(): void {
  if (registered) {
    return;
  }

  if (window.location.hostname !== TARGET_HOST) {
    return;
  }

  if (typeof GM?.registerMenuCommand !== 'function') {
    logger.warn('⚠️ 当前脚本管理器不支持 registerMenuCommand，跳过菜单注册');
    return;
  }

  try {
    void GM.registerMenuCommand(MENU_CAPTION, () => {
      void openFloatingPanel().catch((error) => {
        logger.error('❌ 打开悬浮面板失败:', error);
      });
    });

    registered = true;
    logger.info('✅ GM 菜单已注册：' + MENU_CAPTION);
  } catch (error) {
    logger.warn('⚠️ 注册 GM 菜单失败:', error);
  }
}
