import { logger } from './logger';
import { useRouterWatcher } from './useRouterWatcher';

const PLEASE_IMAGE_SELECTOR = 'img[src*="please.png"]';
const AD_SLOT_SELECTOR = '#large-leaderboard-ad, #leaderboard-target, .pw-incontent';
const SIGNAL_TRACKER_SELECTOR = 'a[href*="stardb.gg/zzz/signal-tracker"], a[href*="/signal-tracker"]';
const CLEANUP_TRIGGER_SELECTOR = `${PLEASE_IMAGE_SELECTOR}, ${AD_SLOT_SELECTOR}, ${SIGNAL_TRACKER_SELECTOR}`;
const TARGET_HOST = 'zzz.seelie.me';
const EARLY_HIDE_STYLE_ID = 'seelie-ad-cleaner-style';
const EARLY_HIDE_STYLE = `
${PLEASE_IMAGE_SELECTOR},
${AD_SLOT_SELECTOR},
${SIGNAL_TRACKER_SELECTOR} {
  display: none !important;
  visibility: hidden !important;
}

div.overflow-hidden.relative.text-white:has(${PLEASE_IMAGE_SELECTOR}),
div.overflow-hidden.relative.text-white:has(${AD_SLOT_SELECTOR}) {
  display: none !important;
}
`;
export const UBLOCK_RULES_TEXT = [
  '! zzz-seelie-sync 推荐规则',
  'zzz.seelie.me##img[src*="img/stickers/please.png"]',
  'zzz.seelie.me###leaderboard-target',
  'zzz.seelie.me###large-leaderboard-ad',
  'zzz.seelie.me##.pw-incontent',
  'zzz.seelie.me##a[href*="stardb.gg/zzz/signal-tracker"]',
  'zzz.seelie.me##a[href*="/signal-tracker"]',
  'zzz.seelie.me##div.overflow-hidden.relative.text-white:has(img[src*="img/stickers/please.png"])',
  'zzz.seelie.me##div.overflow-hidden.relative.text-white:has(#leaderboard-target)',
  'zzz.seelie.me##div.overflow-hidden.relative.text-white:has(#large-leaderboard-ad)'
].join('\n');

let initialized = false;
let observer: MutationObserver | null = null;
let routeUnwatch: (() => void) | null = null;
let cleanupScheduled = false;

function injectEarlyHideStyle(): void {
  if (document.getElementById(EARLY_HIDE_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = EARLY_HIDE_STYLE_ID;
  style.textContent = EARLY_HIDE_STYLE;

  const parent = document.head || document.documentElement;
  if (!parent) {
    logger.warn('⚠️ 去广告样式注入失败：未找到 head/documentElement');
    return;
  }

  parent.appendChild(style);
}

function removeEarlyHideStyle(): void {
  const style = document.getElementById(EARLY_HIDE_STYLE_ID);
  if (style) {
    style.remove();
  }
}

function looksLikeAdContainer(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  const classList = htmlElement.classList;
  const hasAdSlot = element.querySelector(AD_SLOT_SELECTOR) !== null;

  return hasAdSlot || (
    classList.contains('overflow-hidden') &&
    classList.contains('relative') &&
    classList.contains('text-white')
  );
}

function findAdContainer(node: Element): HTMLElement | null {
  let current: HTMLElement | null = node as HTMLElement;

  while (current && current !== document.body) {
    if (looksLikeAdContainer(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function collectAdContainers(): Set<HTMLElement> {
  const containers = new Set<HTMLElement>();

  document.querySelectorAll(PLEASE_IMAGE_SELECTOR).forEach((node) => {
    const container = findAdContainer(node);
    if (container) {
      containers.add(container);
    }
  });

  document.querySelectorAll(AD_SLOT_SELECTOR).forEach((node) => {
    const container = findAdContainer(node);
    if (container) {
      containers.add(container);
    }
  });

  return containers;
}

function collectSignalTrackerLinks(): Set<HTMLElement> {
  const links = new Set<HTMLElement>();

  document.querySelectorAll(SIGNAL_TRACKER_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) {
      links.add(node);
    }
  });

  return links;
}

function cleanupAds(): number {
  const containers = collectAdContainers();
  const signalTrackerLinks = collectSignalTrackerLinks();

  containers.forEach((container) => {
    container.remove();
  });

  signalTrackerLinks.forEach((link) => {
    link.remove();
  });

  const removedCount = containers.size + signalTrackerLinks.size;
  if (removedCount > 0) {
    logger.info(
      `🧹 已移除广告节点 ${removedCount} 个（横幅: ${containers.size}，Signal Tracker: ${signalTrackerLinks.size}）`
    );
  }

  return removedCount;
}

function scheduleCleanup(): void {
  if (cleanupScheduled) {
    return;
  }

  cleanupScheduled = true;

  queueMicrotask(() => {
    cleanupScheduled = false;
    cleanupAds();
  });
}

function shouldTriggerCleanup(mutations: MutationRecord[]): boolean {
  return mutations.some((mutation) => {
    if (mutation.type === 'attributes') {
      const target = mutation.target;
      if (target instanceof Element) {
        return target.matches(CLEANUP_TRIGGER_SELECTOR) || target.querySelector(CLEANUP_TRIGGER_SELECTOR) !== null;
      }
      return false;
    }

    return Array.from(mutation.addedNodes).some((node) => {
      if (!(node instanceof Element)) {
        return false;
      }

      return node.matches(CLEANUP_TRIGGER_SELECTOR) || node.querySelector(CLEANUP_TRIGGER_SELECTOR) !== null;
    });
  });
}

function setupObserver(): void {
  if (observer) {
    return;
  }

  if (!document.body) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (shouldTriggerCleanup(mutations)) {
      scheduleCleanup();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'id']
  });
}

function startCleanerRuntime(): void {
  if (initialized) {
    return;
  }

  if (!document.body) {
    return;
  }

  initialized = true;

  cleanupAds();
  setupObserver();

  const { unwatch } = useRouterWatcher(
    () => {
      scheduleCleanup();
    },
    {
      delay: 0,
      immediate: true
    }
  );

  routeUnwatch = unwatch;
  logger.info('✅ 去广告模块已启动（please.png）');
}

/**
 * 初始化去广告逻辑（基于 please.png 关键词）
 */
export function initAdCleaner(): void {
  if (window.location.hostname !== TARGET_HOST) {
    logger.debug(`去广告模块跳过，当前域名: ${window.location.hostname}`);
    return;
  }

  injectEarlyHideStyle();

  if (initialized) {
    logger.debug('去广告模块已初始化，跳过重复初始化');
    return;
  }

  if (!document.body) {
    window.addEventListener('DOMContentLoaded', () => {
      startCleanerRuntime();
    }, { once: true });
    return;
  }

  startCleanerRuntime();
}

/**
 * 停止去广告逻辑
 */
export function destroyAdCleaner(): void {
  cleanupScheduled = false;

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (routeUnwatch) {
    routeUnwatch();
    routeUnwatch = null;
  }

  removeEarlyHideStyle();
  initialized = false;
  logger.debug('🗑️ 去广告模块已停止');
}
