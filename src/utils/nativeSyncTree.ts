/**
 * Vue 组件树遍历：找出站点原生同步按钮组件（纯逻辑，便于单测）
 */

/**
 * 组件实例上用于识别「同步按钮组件」的特征方法。
 *
 * 站点共 3 类同步组件，只有这三个方法是它们共有的：
 * 材料组件没有 clickedSync（弹窗由模板内联 isVisible=true 打开），
 * 所以不能把 clickedSync 列入判定条件，否则材料组件会漏掉。
 */
const SYNC_COMPONENT_MARKERS = ['sync', 'getCookie', 'getAccounts'] as const;

/** 同步组件类型 */
export type SyncComponentKind = 'resin' | 'items' | 'characters';

/**
 * 判定同步组件类型
 *
 * 各类型的独占字段（实测自 index-f49199de.js）：
 *   电量：noteUrl / currentEnergyPath / accountResin
 *   材料：results / progress
 *   角色：iconOnly / character（character 材料组件也有，不能单独用）
 */
export function classifySyncComponent(proxy: Record<string, unknown>): SyncComponentKind {
  if ('noteUrl' in proxy || 'currentEnergyPath' in proxy) {
    return 'resin';
  }

  if ('results' in proxy && 'progress' in proxy) {
    return 'items';
  }

  return 'characters';
}

export interface VueInstance {
  proxy?: Record<string, unknown> | null;
  subTree?: VueSubTree | null;
  [key: string]: unknown;
}

export interface VueSubTree {
  component?: VueInstance | null;
  children?: unknown;
  [key: string]: unknown;
}

/**
 * 判断是否为站点的同步按钮组件
 */
export function isSyncComponent(proxy: Record<string, unknown>): boolean {
  return SYNC_COMPONENT_MARKERS.every((marker) => typeof proxy[marker] === 'function');
}

/**
 * 遍历 Vue 组件树，收集所有同步按钮组件的实例
 *
 * Vue 3 的组件树挂在 instance.subTree 上，子组件可能在 subTree.component，
 * 也可能散落在 subTree.children 数组里（Fragment / 多根节点）。
 */
export function collectSyncInstances(root: VueInstance | null): VueInstance[] {
  const found: VueInstance[] = [];
  const visited = new Set<unknown>();

  const walkVNode = (vnode: unknown): void => {
    if (!vnode || typeof vnode !== 'object' || visited.has(vnode)) {
      return;
    }
    visited.add(vnode);

    const node = vnode as VueSubTree;

    if (node.component) {
      walk(node.component);
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child) => walkVNode(child));
    }
  };

  const walk = (instance: VueInstance | null | undefined): void => {
    if (!instance || visited.has(instance)) {
      return;
    }
    visited.add(instance);

    if (instance.proxy && isSyncComponent(instance.proxy)) {
      found.push(instance);
    }

    if (instance.subTree) {
      walkVNode(instance.subTree);
    }
  };

  walk(root);
  return found;
}
