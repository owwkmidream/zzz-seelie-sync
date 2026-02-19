import { getCachedSiteManifest, getSiteManifest, type SiteManifest } from './siteManifest'
import { logger } from './logger'
import { useRouterWatcher } from './useRouterWatcher'

const PLEASE_IMAGE_SELECTOR = 'img[src*="please.png"]'
const AD_SLOT_SELECTOR = '#large-leaderboard-ad, #leaderboard-target, .pw-incontent'
const SIGNAL_TRACKER_SELECTOR = 'a[href*="stardb.gg/zzz/signal-tracker"]'

const LEGACY_AD_CONTAINER_SELECTOR = 'div.overflow-hidden.relative.text-white:has(#leaderboard-target)'
const MODERN_AD_CONTAINER_SELECTOR = 'div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)'

const TARGET_HOST = 'zzz.seelie.me'
const EARLY_HIDE_STYLE_ID = 'seelie-ad-cleaner-style'

const BASE_UBLOCK_RULES = [
  '! zzz-seelie-sync 强化规则（由脚本动态生成）',
  'zzz.seelie.me##img[src*="img/stickers/please.png"]',
  'zzz.seelie.me###leaderboard-target',
  'zzz.seelie.me###large-leaderboard-ad',
  'zzz.seelie.me##.pw-incontent',
  'zzz.seelie.me##div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)',
  'zzz.seelie.me##div.overflow-hidden.relative.text-white:has(#leaderboard-target)'
]

const adContainerSelectors = new Set<string>([
  LEGACY_AD_CONTAINER_SELECTOR,
  MODERN_AD_CONTAINER_SELECTOR
])

const signalTrackerSelectors = new Set<string>([
  SIGNAL_TRACKER_SELECTOR
])

let initialized = false
let observer: MutationObserver | null = null
let routeUnwatch: (() => void) | null = null
let cleanupScheduled = false

function getSignalTrackerSelector(): string {
  return Array.from(signalTrackerSelectors).join(', ')
}

function getCleanupTriggerSelector(): string {
  const signalSelector = getSignalTrackerSelector()
  if (signalSelector) {
    return `${PLEASE_IMAGE_SELECTOR}, ${AD_SLOT_SELECTOR}, ${signalSelector}`
  }
  return `${PLEASE_IMAGE_SELECTOR}, ${AD_SLOT_SELECTOR}`
}

function buildEarlyHideStyle(): string {
  const nodeSelectors = [PLEASE_IMAGE_SELECTOR, AD_SLOT_SELECTOR]
  const signalSelector = getSignalTrackerSelector()
  if (signalSelector) {
    nodeSelectors.push(signalSelector)
  }

  const containerSelectors = new Set<string>(adContainerSelectors)
  containerSelectors.add(`div.overflow-hidden.relative.text-white:has(${PLEASE_IMAGE_SELECTOR})`)
  containerSelectors.add(`div.overflow-hidden.relative.text-white:has(${AD_SLOT_SELECTOR})`)
  containerSelectors.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${PLEASE_IMAGE_SELECTOR})`)
  containerSelectors.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${AD_SLOT_SELECTOR})`)

  return `
${nodeSelectors.join(',\n')} {
  display: none !important;
  visibility: hidden !important;
}

${Array.from(containerSelectors).join(',\n')} {
  display: none !important;
}
`
}

function refreshEarlyHideStyleContent(): void {
  const style = document.getElementById(EARLY_HIDE_STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    return
  }
  style.textContent = buildEarlyHideStyle()
}

function injectEarlyHideStyle(): void {
  const existingStyle = document.getElementById(EARLY_HIDE_STYLE_ID) as HTMLStyleElement | null
  if (existingStyle) {
    existingStyle.textContent = buildEarlyHideStyle()
    return
  }

  const style = document.createElement('style')
  style.id = EARLY_HIDE_STYLE_ID
  style.textContent = buildEarlyHideStyle()

  const parent = document.head || document.documentElement
  if (!parent) {
    logger.warn('⚠️ 去广告样式注入失败：未找到 head/documentElement')
    return
  }

  parent.appendChild(style)
}

function removeEarlyHideStyle(): void {
  const style = document.getElementById(EARLY_HIDE_STYLE_ID)
  if (style) {
    style.remove()
  }
}

function addAdContainerSelector(selector: string): boolean {
  const normalized = selector.trim()
  if (!normalized || adContainerSelectors.has(normalized)) {
    return false
  }
  adContainerSelectors.add(normalized)
  return true
}

function addSignalTrackerSelector(selector: string): boolean {
  const normalized = selector.trim()
  if (!normalized || signalTrackerSelectors.has(normalized)) {
    return false
  }
  signalTrackerSelectors.add(normalized)
  return true
}

function applyManifestHints(manifest: SiteManifest): boolean {
  let changed = false

  if (manifest.adHints.usesLegacyContainer) {
    changed = addAdContainerSelector(LEGACY_AD_CONTAINER_SELECTOR) || changed
  }

  if (manifest.adHints.usesModernContainer) {
    changed = addAdContainerSelector(MODERN_AD_CONTAINER_SELECTOR) || changed
  }

  if (manifest.adHints.signalTrackerHref) {
    const safeHref = manifest.adHints.signalTrackerHref.replace(/"/g, '\\"')
    changed = addSignalTrackerSelector(`a[href="${safeHref}"]`) || changed
  }

  return changed
}

function hydrateRulesFromManifest(): void {
  const cachedManifest = getCachedSiteManifest()
  if (cachedManifest) {
    const changed = applyManifestHints(cachedManifest)
    if (changed) {
      refreshEarlyHideStyleContent()
    }
  }

  void getSiteManifest().then((manifest) => {
    const changed = applyManifestHints(manifest)
    if (!changed) {
      return
    }

    logger.debug('🔄 已根据 site manifest 更新去广告规则')
    refreshEarlyHideStyleContent()
    scheduleCleanup()
  }).catch((error) => {
    logger.warn('⚠️ 获取 site manifest 失败，继续使用内置去广告规则:', error)
  })
}

function looksLikeAdContainer(element: Element): boolean {
  const htmlElement = element as HTMLElement
  const classList = htmlElement.classList
  const hasAdSlot = element.querySelector(AD_SLOT_SELECTOR) !== null
  const isLegacyAdContainer = (
    classList.contains('overflow-hidden')
    && classList.contains('relative')
    && classList.contains('text-white')
  )
  const isModernAdContainer = (
    classList.contains('overflow-hidden')
    && classList.contains('relative')
    && classList.contains('mx-auto')
    && classList.contains('shrink-0')
  )

  return hasAdSlot || isLegacyAdContainer || isModernAdContainer
}

function findAdContainer(node: Element): HTMLElement | null {
  let current: HTMLElement | null = node as HTMLElement

  while (current && current !== document.body) {
    if (looksLikeAdContainer(current)) {
      return current
    }

    current = current.parentElement
  }

  return null
}

function collectAdContainers(): Set<HTMLElement> {
  const containers = new Set<HTMLElement>()

  document.querySelectorAll(PLEASE_IMAGE_SELECTOR).forEach((node) => {
    const container = findAdContainer(node)
    if (container) {
      containers.add(container)
    }
  })

  document.querySelectorAll(AD_SLOT_SELECTOR).forEach((node) => {
    const container = findAdContainer(node)
    if (container) {
      containers.add(container)
    }
  })

  return containers
}

function collectSignalTrackerLinks(): Set<HTMLElement> {
  const links = new Set<HTMLElement>()
  const selector = getSignalTrackerSelector()
  if (!selector) {
    return links
  }

  document.querySelectorAll(selector).forEach((node) => {
    if (node instanceof HTMLElement) {
      links.add(node)
    }
  })

  return links
}

function cleanupAds(): number {
  const containers = collectAdContainers()
  const signalTrackerLinks = collectSignalTrackerLinks()

  containers.forEach((container) => {
    container.remove()
  })

  signalTrackerLinks.forEach((link) => {
    link.remove()
  })

  const removedCount = containers.size + signalTrackerLinks.size
  if (removedCount > 0) {
    logger.info(
      `🧹 已移除广告节点 ${removedCount} 个（横幅: ${containers.size}，Signal Tracker: ${signalTrackerLinks.size}）`
    )
  }

  return removedCount
}

function scheduleCleanup(): void {
  if (cleanupScheduled) {
    return
  }

  cleanupScheduled = true

  queueMicrotask(() => {
    cleanupScheduled = false
    cleanupAds()
  })
}

function shouldTriggerCleanup(mutations: MutationRecord[]): boolean {
  const cleanupTriggerSelector = getCleanupTriggerSelector()

  return mutations.some((mutation) => {
    if (mutation.type === 'attributes') {
      const target = mutation.target
      if (target instanceof Element) {
        return target.matches(cleanupTriggerSelector) || target.querySelector(cleanupTriggerSelector) !== null
      }
      return false
    }

    return Array.from(mutation.addedNodes).some((node) => {
      if (!(node instanceof Element)) {
        return false
      }

      return node.matches(cleanupTriggerSelector) || node.querySelector(cleanupTriggerSelector) !== null
    })
  })
}

function setupObserver(): void {
  if (observer || !document.body) {
    return
  }

  observer = new MutationObserver((mutations) => {
    if (shouldTriggerCleanup(mutations)) {
      scheduleCleanup()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'id']
  })
}

function startCleanerRuntime(): void {
  if (initialized || !document.body) {
    return
  }

  initialized = true

  cleanupAds()
  setupObserver()

  const { unwatch } = useRouterWatcher(
    () => {
      scheduleCleanup()
    },
    {
      delay: 0,
      immediate: true
    }
  )

  routeUnwatch = unwatch
  logger.info('✅ 去广告模块已启动（manifest + fallback）')
}

function buildUBlockRules(): string[] {
  const rules = new Set<string>(BASE_UBLOCK_RULES)

  adContainerSelectors.forEach((selector) => {
    rules.add(`zzz.seelie.me##${selector}`)
  })

  signalTrackerSelectors.forEach((selector) => {
    rules.add(`zzz.seelie.me##${selector}`)
  })

  return Array.from(rules)
}

export function getUBlockRulesText(): string {
  return buildUBlockRules().join('\n')
}

/**
 * 初始化去广告逻辑（基于 manifest + 兜底规则）
 */
export function initAdCleaner(): void {
  if (window.location.hostname !== TARGET_HOST) {
    logger.debug(`去广告模块跳过，当前域名: ${window.location.hostname}`)
    return
  }

  hydrateRulesFromManifest()
  injectEarlyHideStyle()

  if (initialized) {
    logger.debug('去广告模块已初始化，跳过重复初始化')
    return
  }

  if (!document.body) {
    window.addEventListener('DOMContentLoaded', () => {
      startCleanerRuntime()
    }, { once: true })
    return
  }

  startCleanerRuntime()
}

/**
 * 停止去广告逻辑
 */
export function destroyAdCleaner(): void {
  cleanupScheduled = false

  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (routeUnwatch) {
    routeUnwatch()
    routeUnwatch = null
  }

  removeEarlyHideStyle()
  initialized = false
  logger.debug('🗑️ 去广告模块已停止')
}
