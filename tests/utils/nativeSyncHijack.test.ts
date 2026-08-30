import assert from 'node:assert/strict';
import test from 'node:test';
import { classifySyncComponent, collectSyncInstances } from '../../src/utils/nativeSyncTree';

/** 造一个同步按钮组件实例：三个特征方法齐全 */
function syncInstance(character?: string) {
  return {
    proxy: {
      sync: () => undefined,
      getCookie: () => undefined,
      getAccounts: () => undefined,
      character,
    },
  };
}

/** 造一个普通组件实例 */
function plainInstance(subTree?: unknown) {
  return { proxy: { foo: () => undefined }, subTree };
}

test('collectSyncInstances: 能穿过 subTree 和 children 数组找到深层同步按钮', () => {
  const target = syncInstance('ellen');
  const root = plainInstance({
    children: [
      { component: plainInstance({ children: [{ component: target }] }) },
      { component: plainInstance() },
    ],
  });

  const found = collectSyncInstances(root);

  assert.equal(found.length, 1);
  assert.equal(found[0], target);
});

test('collectSyncInstances: 特征方法不全的组件不算同步按钮', () => {
  const partial = { proxy: { sync: () => undefined } };
  const root = plainInstance({ children: [{ component: partial }] });

  assert.deepEqual(collectSyncInstances(root), []);
});

test('collectSyncInstances: 材料组件没有 clickedSync 也要能识别', () => {
  // 判定条件误加 clickedSync 会让材料组件整体漏掉
  const items = syncInstance();
  const root = plainInstance({ children: [{ component: items }] });

  assert.equal(collectSyncInstances(root).length, 1);
});

test('classifySyncComponent: 按独占字段区分三类同步组件', () => {
  assert.equal(classifySyncComponent({ noteUrl: '/note', currentEnergyPath: 'a' }), 'resin');
  assert.equal(classifySyncComponent({ results: [], progress: 0 }), 'items');
  assert.equal(classifySyncComponent({ iconOnly: true, character: 'ellen' }), 'characters');
  // 材料组件也有 character，不能靠它判角色
  assert.equal(classifySyncComponent({ results: [], progress: 0, character: 'x' }), 'items');
});

test('collectSyncInstances: 循环引用不会死循环', () => {
  const root: Record<string, unknown> = { proxy: { foo: () => undefined } };
  const node: Record<string, unknown> = { component: root };
  root.subTree = { children: [node, node] };

  assert.deepEqual(collectSyncInstances(root), []);
});

test('collectSyncInstances: root 为 null 时返回空数组', () => {
  assert.deepEqual(collectSyncInstances(null), []);
});
