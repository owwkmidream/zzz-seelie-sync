import { logger } from './logger';
import { useRouterWatcher } from './useRouterWatcher';

const PLEASE_IMAGE_SELECTOR = 'img[src*="please.png"]';
const AD_SLOT_SELECTOR = '#large-leaderboard-ad, #leaderboard-target, .pw-incontent';
const CLEANUP_TRIGGER_SELECTOR = `${PLEASE_IMAGE_SELECTOR}, ${AD_SLOT_SELECTOR}`;
const TARGET_HOST = 'zzz.seelie.me';

let initialized = false;
let observer: MutationObserver | null = null;
let routeUnwatch: (() => void) | null = null;
let cleanupTimer: number | null = null;

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

function cleanupAds(): number {
  const containers = collectAdContainers();

  containers.forEach((container) => {
    container.remove();
  });

  if (containers.size > 0) {
    logger.info(`🧹 已移除 ${containers.size} 个广告容器（关键字: please.png）`);
  }

  return containers.size;
}

function scheduleCleanup(delay = 0): void {
  if (cleanupTimer !== null) {
    window.clearTimeout(cleanupTimer);
  }

  cleanupTimer = window.setTimeout(() => {
    cleanupTimer = null;
    cleanupAds();
  }, delay);
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

  observer = new MutationObserver((mutations) => {
    if (shouldTriggerCleanup(mutations)) {
      scheduleCleanup(80);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'id']
  });
}

/**
 * 初始化去广告逻辑（基于 please.png 关键词）
 */
export function initAdCleaner(): void {
  if (initialized) {
    logger.debug('去广告模块已初始化，跳过重复初始化');
    return;
  }

  if (window.location.hostname !== TARGET_HOST) {
    logger.debug(`去广告模块跳过，当前域名: ${window.location.hostname}`);
    return;
  }

  if (!document.body) {
    window.addEventListener('DOMContentLoaded', () => {
      initAdCleaner();
    }, { once: true });
    return;
  }

  initialized = true;

  scheduleCleanup();
  setupObserver();

  const { unwatch } = useRouterWatcher(
    () => {
      scheduleCleanup(150);
    },
    {
      delay: 150,
      immediate: true
    }
  );

  routeUnwatch = unwatch;
  logger.info('✅ 去广告模块已启动（please.png）');
}

/**
 * 停止去广告逻辑
 */
export function destroyAdCleaner(): void {
  if (cleanupTimer !== null) {
    window.clearTimeout(cleanupTimer);
    cleanupTimer = null;
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
  logger.debug('🗑️ 去广告模块已停止');
}
