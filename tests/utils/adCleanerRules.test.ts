import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEGACY_AD_CONTAINER_SELECTOR,
  MODERN_AD_CONTAINER_SELECTOR,
  ORPHAN_DIVIDER_SELECTOR,
  ORPHAN_DIVIDER_SELECTORS,
  SIDEBAR_DIVIDER_SELECTOR,
  SIGNAL_TRACKER_SELECTOR,
  SIGNAL_TRACKER_WRAPPER_SELECTOR,
  SIMPLE_DIVIDER_SELECTOR,
  THEMATIC_DIVIDER_SELECTOR,
  buildEarlyHideStyle,
  buildUBlockRules,
} from '../../src/utils/adCleanerRules';

test('SIGNAL_TRACKER_WRAPPER_SELECTOR: 靠 :has() 区分只装 Signal Tracker 的导航分组', () => {
  // 与主导航分组 class 完全相同，仅凭 class 无法区分
  assert.match(SIGNAL_TRACKER_WRAPPER_SELECTOR, /^div\.flex\.flex-col\.gap-1:has\(> /);
  assert.ok(SIGNAL_TRACKER_WRAPPER_SELECTOR.includes(SIGNAL_TRACKER_SELECTOR));
});

test('ORPHAN_DIVIDER_SELECTORS: 两种形态 × 分组前后两条 = 4 条', () => {
  assert.equal(ORPHAN_DIVIDER_SELECTORS.length, 4);

  for (const divider of [THEMATIC_DIVIDER_SELECTOR, SIMPLE_DIVIDER_SELECTOR]) {
    // 前一条：分割线在选择器开头
    assert.ok(ORPHAN_DIVIDER_SELECTORS.some((s) => s.startsWith(divider)), divider);
    // 后一条：分割线在选择器末尾
    assert.ok(ORPHAN_DIVIDER_SELECTORS.some((s) => s.endsWith(`+ ${divider}`)), divider);
  }
});

test('分割线选择器不再使用已下线的 zzz-divider', () => {
  // 旧 class 在站点 bundle 里已不存在，留着等于选择器永不命中
  assert.ok(!ORPHAN_DIVIDER_SELECTOR.includes('zzz-divider'));
  assert.ok(!SIDEBAR_DIVIDER_SELECTOR.includes('zzz-divider'));
});

test('uBlock 规则逐条列出分割线，不塞逗号列表', () => {
  const rules = buildUBlockRules([], []);

  for (const selector of ORPHAN_DIVIDER_SELECTORS) {
    assert.ok(rules.includes(`zzz.seelie.me##${selector}`), selector);
  }

  // uBlock 单条规则里出现逗号会被整条丢弃
  for (const rule of rules) {
    if (rule.startsWith('!')) {
      continue;
    }
    const body = rule.slice('zzz.seelie.me##'.length);
    const outsideBrackets = body.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
    assert.ok(!outsideBrackets.includes(','), `规则含裸逗号会被丢弃: ${rule}`);
  }
});

test('ORPHAN_DIVIDER_SELECTORS: 每条都不嵌套 :has()', () => {
  // CSS 规范禁止 :has() 嵌套。非法选择器会让 matches() 抛 SyntaxError，
  // 且逗号列表里一条非法会导致整条 CSS 规则失效，去广告样式会整体失灵。
  for (const selector of ORPHAN_DIVIDER_SELECTORS) {
    const hasCount = (selector.match(/:has\(/g) ?? []).length;
    assert.equal(hasCount, 1, `不应嵌套 :has()，实际: ${selector}`);
  }
});

/**
 * 找出文本中嵌套的 :has()，返回外层片段（无嵌套时返回 null）
 */
function findNestedHas(text: string): string | null {
  const token = ':has(';

  for (let start = text.indexOf(token); start !== -1; start = text.indexOf(token, start + 1)) {
    let depth = 0;

    for (let i = start + token.length - 1; i < text.length; i += 1) {
      const char = text[i];

      if (char === '(') {
        depth += 1;
        continue;
      }

      if (char === ')') {
        depth -= 1;
        if (depth === 0) {
          const inner = text.slice(start + token.length, i);
          return inner.includes(token) ? text.slice(start, i + 1) : null;
        }
      }
    }
  }

  return null;
}

test('早期隐藏样式与 uBlock 规则中没有嵌套的 :has()', () => {
  // CSS 规范禁止 :has() 嵌套。非法选择器会让 matches() 抛 SyntaxError，
  // 且逗号列表里一条非法会导致整条 CSS 规则失效，去广告样式会整体失灵。
  const css = buildEarlyHideStyle(
    [LEGACY_AD_CONTAINER_SELECTOR, MODERN_AD_CONTAINER_SELECTOR],
    SIGNAL_TRACKER_SELECTOR
  );
  assert.equal(findNestedHas(css), null, '早期隐藏样式里存在嵌套 :has()');

  const rulesText = buildUBlockRules([], []).join('\n');
  assert.equal(findNestedHas(rulesText), null, 'uBlock 规则里存在嵌套 :has()');
});

test('buildUBlockRules: 覆盖广告位、Signal Tracker 分组与悬空分割线', () => {
  const rules = buildUBlockRules([], []);

  assert.ok(rules.includes(`zzz.seelie.me##${SIGNAL_TRACKER_WRAPPER_SELECTOR}`));
  assert.ok(rules.includes('zzz.seelie.me###leaderboard-target'));
});

test('buildUBlockRules: 合并动态选择器且去重', () => {
  const rules = buildUBlockRules(
    [MODERN_AD_CONTAINER_SELECTOR, 'div.custom-ad'],
    [SIGNAL_TRACKER_SELECTOR]
  );

  const modernRuleCount = rules.filter(
    (rule) => rule === `zzz.seelie.me##${MODERN_AD_CONTAINER_SELECTOR}`
  ).length;

  assert.equal(modernRuleCount, 1, '已在基础规则中的选择器不应重复');
  assert.ok(rules.includes('zzz.seelie.me##div.custom-ad'));
  assert.ok(rules.includes(`zzz.seelie.me##${SIGNAL_TRACKER_SELECTOR}`));
});

test('buildEarlyHideStyle: 同时隐藏 Signal Tracker 分组和其前置分割线', () => {
  const css = buildEarlyHideStyle([LEGACY_AD_CONTAINER_SELECTOR], SIGNAL_TRACKER_SELECTOR);

  assert.ok(css.includes(SIGNAL_TRACKER_WRAPPER_SELECTOR));
  assert.ok(css.includes(LEGACY_AD_CONTAINER_SELECTOR));
  assert.ok(css.includes('display: none !important'));

  for (const selector of ORPHAN_DIVIDER_SELECTORS) {
    assert.ok(css.includes(selector), selector);
  }
});

test('buildEarlyHideStyle: 无 Signal Tracker 选择器时不产生空选择器片段', () => {
  const css = buildEarlyHideStyle([], '');

  assert.ok(!css.includes(',\n {'));
  assert.ok(!/,\s*\{/.test(css), '不应出现尾随逗号导致整段样式失效');
});
