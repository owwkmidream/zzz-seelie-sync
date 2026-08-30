/**
 * Seelie 面板挂载点候选（纯逻辑，便于单测）
 *
 * 站点侧边栏底部区块的 class 串会随站点发版变化，这里按“精确 → 宽松 → 历史”
 * 的顺序排列候选，运行时逐个尝试，命中即用。
 */

/** 侧边栏底部区块（当前版本，带 mt-4 pt-4 border-t） */
export const CURRENT_PANEL_TARGET = 'div.flex.flex-col.items-center.justify-center.w-full.mt-4.pt-4';

/** 宽松兜底：只要求在侧边栏内、且是居中纵向铺满的区块 */
export const FALLBACK_PANEL_TARGET = '.min-h-screen div.flex.flex-col.items-center.justify-center.w-full';

/** 历史版本（mt-3），保留以兼容旧缓存页面 */
export const LEGACY_PANEL_TARGET = 'div.flex.flex-col.items-center.justify-center.w-full.mt-3';

/**
 * 候选挂载点，按优先级排列
 */
export const PANEL_TARGET_CANDIDATES: readonly string[] = [
  CURRENT_PANEL_TARGET,
  FALLBACK_PANEL_TARGET,
  LEGACY_PANEL_TARGET,
];

/**
 * 供 DOM 注入器做“容器是否存在”判断的合并选择器。
 *
 * 注意：逗号并列的选择器由文档顺序决定命中结果，控不了优先级，
 * 因此只用于存在性判断，实际插入位置走 resolvePanelTarget()。
 */
export const PANEL_TARGET_SELECTOR = PANEL_TARGET_CANDIDATES.join(', ');

/**
 * 按优先级解析实际挂载点
 */
export function resolvePanelTarget(
  root: Pick<ParentNode, 'querySelector'> = document,
  candidates: readonly string[] = PANEL_TARGET_CANDIDATES
): Element | null {
  for (const selector of candidates) {
    const element = root.querySelector(selector);
    if (element) {
      return element;
    }
  }

  return null;
}
