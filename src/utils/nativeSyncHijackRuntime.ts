/**
 * 原生 SYNC 按钮劫持的运行时调度
 *
 * 同步按钮组件散布在角色页、材料页、账号弹窗等处，切页时会销毁重建，
 * 所以需要在路由变化和 DOM 变化后重新扫描。
 */

import { logger } from './logger';
import { seelieDataManager } from './seelie';
import { hijackNativeSyncButtons, probeNativeSyncButtons } from './nativeSyncHijack';
import { useRouterWatcher } from './useRouterWatcher';

const TARGET_HOST = 'zzz.seelie.me';
const RESCAN_DEBOUNCE_MS = 300;

let initialized = false;
let observer: MutationObserver | null = null;
let routeUnwatch: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function runHijack(): void {
  const root = seelieDataManager.getRootComponent();
  if (!root) {
    logger.debug('🔀 根组件尚未就绪，跳过本次劫持扫描');
    return;
  }

  hijackNativeSyncButtons(root);
}

function scheduleHijack(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runHijack();
  }, RESCAN_DEBOUNCE_MS);
}

/**
 * 启动原生 SYNC 按钮劫持
 */
export function initNativeSyncHijack(): void {
  if (initialized || window.location.hostname !== TARGET_HOST) {
    return;
  }

  initialized = true;

  // 首次扫描
  scheduleHijack();

  // 路由变化后组件重建，需要重扫
  const { unwatch } = useRouterWatcher(
    () => {
      scheduleHijack();
    },
    { delay: RESCAN_DEBOUNCE_MS, immediate: true }
  );
  routeUnwatch = unwatch;

  // 弹窗类同步按钮是按需挂载的，靠 DOM 变化兜底
  if (document.body) {
    observer = new MutationObserver(() => {
      scheduleHijack();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  logger.info('✅ 原生 SYNC 按钮劫持已启动');
}

/**
 * 停止劫持调度（已替换的方法不会还原）
 */
export function destroyNativeSyncHijack(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (routeUnwatch) {
    routeUnwatch();
    routeUnwatch = null;
  }

  initialized = false;
}

/**
 * 控制台探测入口：确认组件识别与 proxy 可写性
 */
export function probeNativeSync(): Array<Record<string, unknown>> {
  const root = seelieDataManager.getRootComponent();
  if (!root) {
    logger.warn('⚠️ 根组件未就绪');
    return [];
  }

  const result = probeNativeSyncButtons(root);
  logger.info('🔍 原生同步按钮探测结果:', result);
  return result;
}
