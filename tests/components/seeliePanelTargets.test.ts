import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CURRENT_PANEL_TARGET,
  FALLBACK_PANEL_TARGET,
  LEGACY_PANEL_TARGET,
  PANEL_TARGET_CANDIDATES,
  PANEL_TARGET_SELECTOR,
  resolvePanelTarget,
} from '../../src/components/seeliePanelTargets';

/** 极简 ParentNode 替身：按选择器命中表返回元素 */
function createRoot(hits: Record<string, string>): Pick<ParentNode, 'querySelector'> {
  return {
    querySelector: ((selector: string) =>
      (hits[selector] as unknown as Element) ?? null) as ParentNode['querySelector'],
  };
}

test('PANEL_TARGET_CANDIDATES: 顺序为精确 → 宽松 → 历史，且无重复', () => {
  assert.deepEqual(PANEL_TARGET_CANDIDATES, [
    CURRENT_PANEL_TARGET,
    FALLBACK_PANEL_TARGET,
    LEGACY_PANEL_TARGET,
  ]);
  assert.equal(new Set(PANEL_TARGET_CANDIDATES).size, PANEL_TARGET_CANDIDATES.length);
});

test('CURRENT_PANEL_TARGET: 对齐站点当前底部区块（mt-4 pt-4），不含易变的 border 类', () => {
  assert.ok(CURRENT_PANEL_TARGET.includes('.mt-4.pt-4'));
  assert.ok(!CURRENT_PANEL_TARGET.includes('border'));
});

test('PANEL_TARGET_SELECTOR: 合并为逗号并列，供存在性判断使用', () => {
  assert.equal(PANEL_TARGET_SELECTOR, PANEL_TARGET_CANDIDATES.join(', '));
});

test('resolvePanelTarget: 优先命中当前版本挂载点', () => {
  const root = createRoot({
    [CURRENT_PANEL_TARGET]: 'current',
    [FALLBACK_PANEL_TARGET]: 'fallback',
    [LEGACY_PANEL_TARGET]: 'legacy',
  });

  assert.equal(resolvePanelTarget(root) as unknown as string, 'current');
});

test('resolvePanelTarget: 当前挂载点缺失时按顺序降级', () => {
  const fallbackOnly = createRoot({
    [FALLBACK_PANEL_TARGET]: 'fallback',
    [LEGACY_PANEL_TARGET]: 'legacy',
  });
  assert.equal(resolvePanelTarget(fallbackOnly) as unknown as string, 'fallback');

  const legacyOnly = createRoot({ [LEGACY_PANEL_TARGET]: 'legacy' });
  assert.equal(resolvePanelTarget(legacyOnly) as unknown as string, 'legacy');
});

test('resolvePanelTarget: 全部候选未命中时返回 null（悬浮窗兜底的触发条件）', () => {
  assert.equal(resolvePanelTarget(createRoot({})), null);
});
