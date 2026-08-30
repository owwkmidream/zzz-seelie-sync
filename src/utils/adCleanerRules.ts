/**
 * 去广告选择器与规则构建（纯逻辑，便于单测）
 *
 * 站点侧边栏由 Vue 运行时渲染，主页 HTML 只是空壳，
 * 因此这里的选择器全部对齐 index-*.js 渲染函数里的静态 class 串。
 */

export const PLEASE_IMAGE_SELECTOR = 'img[src*="please.png"]'
export const AD_SLOT_SELECTOR = '#large-leaderboard-ad, #leaderboard-target, .pw-incontent'
export const SIGNAL_TRACKER_SELECTOR = 'a[href*="stardb.gg/zzz/signal-tracker"]'

export const LEGACY_AD_CONTAINER_SELECTOR = 'div.overflow-hidden.relative.text-white:has(#leaderboard-target)'
export const MODERN_AD_CONTAINER_SELECTOR = 'div.relative.mx-auto.overflow-hidden.shrink-0:has(#leaderboard-target):has(.pw-incontent)'

/**
 * 侧边栏分割线，站点内共两条。
 *
 * 站点已把分割线做成用户可配置项（settings.sidebar_divider_style），
 * class 在三态间切换：thematic-divider / simple-divider / 整个节点不渲染。
 * 且不再是 hoisted 静态节点（带 key，条件渲染），Vue 可能重新插入。
 */
export const THEMATIC_DIVIDER_SELECTOR = 'div.my-3.thematic-divider'
export const SIMPLE_DIVIDER_SELECTOR = 'div.my-3.simple-divider'
export const SIDEBAR_DIVIDER_SELECTORS: readonly string[] = [
  THEMATIC_DIVIDER_SELECTOR,
  SIMPLE_DIVIDER_SELECTOR
]
export const SIDEBAR_DIVIDER_SELECTOR = SIDEBAR_DIVIDER_SELECTORS.join(', ')

/**
 * 只用于承载 Signal Tracker 链接的导航分组。
 * 与主导航分组 class 完全相同，必须靠 :has() 区分。
 */
export const SIGNAL_TRACKER_WRAPPER_SELECTOR = `div.flex.flex-col.gap-1:has(> ${SIGNAL_TRACKER_SELECTOR})`

/**
 * 紧贴 Signal Tracker 分组之前的那条分割线。
 * 删掉链接后它会和后面一条分割线贴在一起，形成“多出来的分割线”。
 *
 * 注意：不能写成 `:has(+ 带 :has() 的选择器)`。
 * CSS 规范禁止 `:has()` 嵌套，非法选择器会让 matches() 抛错、
 * 并使整条逗号列表 CSS 规则失效。这里用 `+ 分组 > 链接` 的扁平写法，
 * 语义等价：存在一个「下一个兄弟是该分组、且该分组的子元素是 Tracker 链接」。
 */
export const ORPHAN_DIVIDER_SELECTORS: readonly string[] = SIDEBAR_DIVIDER_SELECTORS.flatMap(
  (divider) => [
    // 分组之前那条：往后看要用 :has()
    `${divider}:has(+ div.flex.flex-col.gap-1 > ${SIGNAL_TRACKER_SELECTOR})`,
    // 分组之后那条：往前看直接用相邻兄弟组合器，不需要 :has()
    `div.flex.flex-col.gap-1:has(> ${SIGNAL_TRACKER_SELECTOR}) + ${divider}`
  ]
)
export const ORPHAN_DIVIDER_SELECTOR = ORPHAN_DIVIDER_SELECTORS.join(', ')

const BASE_UBLOCK_RULES = [
  '! zzz-seelie-sync 强化规则（由脚本动态生成）',
  'zzz.seelie.me##img[src*="img/stickers/please.png"]',
  'zzz.seelie.me###leaderboard-target',
  'zzz.seelie.me###large-leaderboard-ad',
  'zzz.seelie.me##.pw-incontent',
  `zzz.seelie.me##${MODERN_AD_CONTAINER_SELECTOR}`,
  `zzz.seelie.me##${LEGACY_AD_CONTAINER_SELECTOR}`,
  `zzz.seelie.me##${SIGNAL_TRACKER_WRAPPER_SELECTOR}`,
  // uBlock 需要逐条列出：一条规则里放逗号列表会被整条丢弃
  ...ORPHAN_DIVIDER_SELECTORS.map((selector) => `zzz.seelie.me##${selector}`)
]

/**
 * 拼装 uBlock 规则文本
 */
export function buildUBlockRules(
  adContainerSelectors: Iterable<string>,
  signalTrackerSelectors: Iterable<string>
): string[] {
  const rules = new Set<string>(BASE_UBLOCK_RULES)

  for (const selector of adContainerSelectors) {
    rules.add(`zzz.seelie.me##${selector}`)
  }

  for (const selector of signalTrackerSelectors) {
    rules.add(`zzz.seelie.me##${selector}`)
  }

  return Array.from(rules)
}

/**
 * 构建早期隐藏样式：广告节点 + 广告容器 + Signal Tracker 分组与其前置分割线
 */
export function buildEarlyHideStyle(
  adContainerSelectors: Iterable<string>,
  signalTrackerSelector: string
): string {
  const nodeSelectors = [PLEASE_IMAGE_SELECTOR, AD_SLOT_SELECTOR]
  if (signalTrackerSelector) {
    nodeSelectors.push(signalTrackerSelector)
  }

  const containerSelectors = new Set<string>(adContainerSelectors)
  containerSelectors.add(`div.overflow-hidden.relative.text-white:has(${PLEASE_IMAGE_SELECTOR})`)
  containerSelectors.add(`div.overflow-hidden.relative.text-white:has(${AD_SLOT_SELECTOR})`)
  containerSelectors.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${PLEASE_IMAGE_SELECTOR})`)
  containerSelectors.add(`div.relative.mx-auto.overflow-hidden.shrink-0:has(${AD_SLOT_SELECTOR})`)
  containerSelectors.add(SIGNAL_TRACKER_WRAPPER_SELECTOR)
  ORPHAN_DIVIDER_SELECTORS.forEach((selector) => containerSelectors.add(selector))

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
