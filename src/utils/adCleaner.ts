import { getCachedSiteManifest, getSiteManifest, type SiteManifest } from './siteManifest'
import { logger } from './logger'
import { useRouterWatcher } from './useRouterWatcher'

import {
  AD_SLOT_SELECTOR,
  LEGACY_AD_CONTAINER_SELECTOR,
  MODERN_AD_CONTAINER_SELECTOR,
  PLEASE_IMAGE_SELECTOR,
  SIDEBAR_DIVIDER_SELECTOR,
  SIGNAL_TRACKER_SELECTOR,
  buildEarlyHideStyle as buildEarlyHideStyleText,
  buildUBlockRules
} from './adCleanerRules'

const TARGET_HOST = 'zzz.seelie.me'
const EARLY_HIDE_STYLE_ID = 'seelie-ad-cleaner-style'

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
  const parts = [PLEASE_IMAGE_SELECTOR, AD_SLOT_SELECTOR]

  const signalSelector = getSignalTrackerSelector()
  if (signalSelector) {
    parts.push(signalSelector)
  }

  // 分割线是条件渲染节点（settings.sidebar_divider_style），Vue 会重新插入，
  // 因此它自身的出现也要能触发清理，否则切换设置后残留分割线不会被回收
  parts.push(SIDEBAR_DIVIDER_SELECTOR)

  return parts.join(', ')
}

function buildEarlyHideStyle(): string {
  return buildEarlyHideStyleText(adContainerSelectors, getSignalTrackerSelector())
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

/**
 * 判断是否为侧边栏分割线。
 *
 * 分割线 class 已经改过两次名（zzz-divider → thematic-divider / simple-divider），
 * 且已成为用户可配置项，所以这里不硬编码具体 class：
 * 空的、带 `*-divider` class 的 div 即视为分割线。
 */
function isSidebarDivider(element: HTMLElement): boolean {
  if (element.tagName !== 'DIV' || element.children.length > 0) {
    return false
  }

  // 先走已知 class 选择器（快路径），失败再按 class 命名规律兜底
  if (element.matches(SIDEBAR_DIVIDER_SELECTOR)) {
    return true
  }

  return Array.from(element.classList).some((token) => token.endsWith('-divider'))
}

/**
 * 收集 Signal Tracker 所在的导航分组，以及紧贴其之前的那条分割线。
 *
 * 站点侧边栏结构（index-*.js 渲染函数 ur()）：
 *   主导航分组 → 分割线① → Signal Tracker 分组 → 分割线② → 设置入口
 *
 * 只删链接会留下空壳分组，让两条分割线贴在一起，视觉上多出一条线。
 * 因此连带删掉空壳分组和分割线①，保留分割线②作为导航/设置分隔。
 */
function collectSignalTrackerLayout(): Set<HTMLElement> {
  const nodes = new Set<HTMLElement>()

  document.querySelectorAll(SIGNAL_TRACKER_SELECTOR).forEach((link) => {
    if (!(link instanceof HTMLElement)) {
      return
    }

    // 从链接向上找它所在的导航分组，不依赖分组自身的 class
    const wrapper = link.parentElement
    if (!wrapper || wrapper === document.body) {
      return
    }

    // 分组里除了这条链接没有别的内容时才整体删，避免误删主导航
    const otherChildren = Array.from(wrapper.children).filter((child) => child !== link)
    if (otherChildren.length > 0) {
      return
    }

    // 分组前后两条分割线都要删：只删一条会留下一条孤线
    const siblings = [wrapper.previousElementSibling, wrapper.nextElementSibling]
    siblings.forEach((sibling) => {
      if (sibling instanceof HTMLElement && isSidebarDivider(sibling)) {
        nodes.add(sibling)
      }
    })

    nodes.add(wrapper)
  })

  return nodes
}

function cleanupAds(): number {
  const containers = collectAdContainers()
  // 先取分组与分割线，再取链接：链接被删后 :has() 就选不中分组了
  const signalTrackerLayout = collectSignalTrackerLayout()
  const signalTrackerLinks = collectSignalTrackerLinks()

  containers.forEach((container) => {
    container.remove()
  })

  signalTrackerLayout.forEach((node) => {
    node.remove()
  })

  // 分组已整体移除时，其中的链接会一起消失，这里只兜底处理游离链接
  signalTrackerLinks.forEach((link) => {
    if (link.isConnected) {
      link.remove()
    }
  })

  const removedCount = containers.size + signalTrackerLayout.size
  if (removedCount > 0) {
    logger.info(
      `🧹 已移除广告节点 ${removedCount} 个（横幅: ${containers.size}，Signal Tracker 区块: ${signalTrackerLayout.size}）`
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

export function getUBlockRulesText(): string {
  return buildUBlockRules(adContainerSelectors, signalTrackerSelectors).join('\n')
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
