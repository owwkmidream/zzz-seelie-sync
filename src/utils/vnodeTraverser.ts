// Vue 3 VNode 遍历工具
import { logger } from "./logger";
import { exposeDevGlobals } from "./devGlobals";
// 扩展 HTMLElement 类型
declare global {
  interface HTMLElement {
    __vue__?: VueComponentInstance;
    _vnode?: VNode;
  }
}

interface VueComponentInstance {
  subTree?: VNode;
  uid?: number;
  [key: string]: unknown;
}

interface VNode {
  el?: HTMLElement;
  component?: VueComponentInstance;
  children?: VNode[];
  dynamicChildren?: VNode[];
  type?: unknown;
  [key: string]: unknown;
}

let mountedCount = 0;
let processedElements = new WeakSet<HTMLElement>();

// 防抖定时器
let debounceTimer: number | null = null;

/**
 * 递归遍历 VNode 树，为每个有 el 的节点挂载 __vue__ 属性
 * @param vnode 当前 VNode
 * @param vueInstance 对应的 Vue 组件实例
 * @param depth 遍历深度，用于调试
 */
function traverseVNode(vnode: VNode, vueInstance?: VueComponentInstance, depth = 0): void {
  if (!vnode) return;

  // const indent = '  '.repeat(depth); // 用于调试输出，暂时注释

  // 如果当前 vnode 有 el 元素，挂载 __vue__ 属性
  if (vnode.el && vnode.el instanceof HTMLElement) {
    // 避免重复处理同一个元素
    if (!processedElements.has(vnode.el)) {
      const targetInstance = vueInstance || vnode.component || vnode;

      // 方法1：使用不可枚举属性，直接挂载完整实例但避免 JSON.stringify 遍历到
      Object.defineProperty(vnode.el, '__vue__', {
        value: targetInstance,           // 直接挂载完整实例
        writable: true,                  // 可写
        enumerable: false,               // 不可枚举，JSON.stringify 会跳过
        configurable: true               // 可配置
      });
      processedElements.add(vnode.el);
      mountedCount++;

      // logger.debug(`${indent}✓ 挂载 __vue__ 到元素:`,
      //   vnode.el.tagName,
      //   `(uid: ${safeVueRef.uid || 'none'})`,
      //   `(class: ${vnode.el.className || 'none'})`);
    } else {
      // logger.debug(`${indent}⚠️ 跳过已处理的元素:`, vnode.el.tagName);
    }
  }

  // 如果有 component，递归遍历其 subTree
  if (vnode.component?.subTree) {
    // logger.debug(`${indent}→ 遍历组件 subTree (uid: ${vnode.component.uid})`);
    traverseVNode(vnode.component.subTree, vnode.component, depth + 1);
  }

  // 遍历 dynamicChildren
  if (vnode.dynamicChildren && Array.isArray(vnode.dynamicChildren)) {
    // logger.debug(`${indent}→ 遍历 dynamicChildren (${vnode.dynamicChildren.length} 个)`);
    vnode.dynamicChildren.forEach((child) => {
      if (child) {
        // logger.debug(`${indent}  [${index}]:`, child.type?.name || child.type || 'unknown');
        traverseVNode(child, child.component || vueInstance, depth + 1);
      }
    });
  }

  // 遍历普通 children
  if (vnode.children && Array.isArray(vnode.children)) {
    // logger.debug(`${indent}→ 遍历 children (${vnode.children.length} 个)`);
    vnode.children.forEach((child) => {
      if (typeof child === 'object' && child !== null) {
        // logger.debug(`${indent}  [${index}]:`, (child as VNode).type?.name || (child as VNode).type || 'unknown');
        traverseVNode(child as VNode, vueInstance, depth + 1);
      }
    });
  }
}

/**
 * 启动 VNode 遍历
 */
interface AppElementWithVNode extends HTMLElement {
  _vnode?: VNode;
}

export function startVNodeTraversal(): void {
  logger.debug('🔍 开始查找 #app 元素...');

  const appElement = document.querySelector('#app') as AppElementWithVNode;

  if (!appElement) {
    logger.error('❌ 未找到 #app 元素');
    return;
  }

  logger.debug('✓ 找到 #app 元素:', appElement);

  if (!appElement._vnode) {
    logger.error('❌ #app 元素没有 _vnode 属性');
    logger.debug('appElement 的所有属性:', Object.keys(appElement));
    return;
  }

  logger.debug('✓ 找到 _vnode 属性:', appElement._vnode);
  logger.debug('🚀 开始遍历 Vue 3 VNode 树...');

  // 重置计数器和已处理元素集合
  mountedCount = 0;
  processedElements = new WeakSet<HTMLElement>(); // 重新创建 WeakSet 来清空

  const startTime = performance.now();

  // 从 #app._vnode.component 开始遍历
  if (appElement._vnode.component) {
    logger.debug('✓ 找到根组件 (uid:', appElement._vnode.component.uid, ')');
    traverseVNode(appElement._vnode, appElement._vnode.component);
  } else {
    logger.debug('⚠️ 没有找到根组件，直接从 _vnode 开始遍历');
    traverseVNode(appElement._vnode);
  }

  const endTime = performance.now();
  logger.debug(`🎉 VNode 遍历完成！耗时: ${(endTime - startTime).toFixed(2)}ms`);
  logger.debug(`📊 共为 ${mountedCount} 个元素挂载了 __vue__ 属性`);

  // 验证挂载结果
  const elementsWithVue = document.querySelectorAll('*');
  let verifyCount = 0;
  elementsWithVue.forEach(el => {
    if ((el as HTMLElement).__vue__) {
      verifyCount++;
    }
  });
  logger.debug(`✓ 验证结果: ${verifyCount} 个元素拥有 __vue__ 属性`);
}

/**
 * 防抖执行 VNode 遍历
 */
function debounceVNodeTraversal(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    logger.debug('🔄 防抖触发 VNode 遍历...');
    startVNodeTraversal();
    debounceTimer = null;
  }, 50); // 50ms 防抖延迟
}

/**
 * 初始化 VNode 遍历 - 通过全局 mixin 自动处理
 */
interface VueApp {
  mixin: (options: { mounted?: () => void }) => void;
}

interface AppElementWithApp extends HTMLElement {
  __vue_app__?: VueApp;
}

export function initVNodeTraversal(): void {
  logger.debug('🔧 Vue 3 VNode 遍历器初始化...');

  const setupMixin = () => {
    const appElement = document.querySelector('#app') as AppElementWithApp;

    if (!appElement) {
      logger.error('❌ 未找到 #app 元素');
      return;
    }

    if (!appElement.__vue_app__) {
      logger.error('❌ #app 元素没有 __vue_app__ 属性');
      return;
    }

    logger.debug('✓ 找到 Vue 应用实例:', appElement.__vue_app__);

    // 添加全局 mixin
    appElement.__vue_app__.mixin({
      mounted(this: {
        $?: { vnode?: VNode; type?: { name?: string } };
        $nextTick?: (callback: () => void) => void;
      }) {
        // 在组件挂载时触发防抖遍历
        const vueInstance = this;

        if (vueInstance.$ && vueInstance.$.vnode) {
          // logger.debug('🔄 组件挂载，触发防抖遍历:', vueInstance.$.type?.name || 'Anonymous');

          // 使用 nextTick 确保组件完全挂载后再遍历
          if (vueInstance.$nextTick) {
            vueInstance.$nextTick(() => {
              debounceVNodeTraversal();
            });
          } else {
            // 如果没有 $nextTick，直接执行
            debounceVNodeTraversal();
          }
        }
      }
    });

    logger.debug('✅ 全局 mixin 已注册，将在每个组件挂载时自动触发防抖遍历');

    // 注册 mixin 后立即进行第一次完整遍历，处理已经挂载的组件
    logger.debug('🔄 注册 mixin 后立即进行第一次完整遍历...');
    startVNodeTraversal();
  };

  if (document.readyState === 'loading') {
    logger.debug('⏳ 等待 DOM 加载完成...');
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupMixin, 100);
    });
  } else {
    logger.debug('✓ DOM 已加载完成');
    setTimeout(setupMixin, 100);
  }
}

/**
 * 手动触发重新遍历（用于调试）
 */
export function retraverseVNodes(): void {
  logger.debug('🔄 手动重新遍历 VNode 树...');
  startVNodeTraversal();
}



/**
 * 清除所有元素的 __vue__ 属性（可选，用于完全重新挂载）
 */
export function clearAllVueInstances(): void {
  logger.debug('🧹 清除所有 __vue__ 属性...');

  const allElements = document.querySelectorAll('*');
  let clearedCount = 0;

  allElements.forEach(el => {
    if ((el as HTMLElement).__vue__) {
      delete (el as HTMLElement).__vue__;
      clearedCount++;
    }
  });

  logger.debug(`✓ 已清除 ${clearedCount} 个元素的 __vue__ 属性`);
}

/**
 * 获取元素的 Vue 实例
 * @param element DOM 元素
 * @returns Vue 实例或 null
 */
export function getVueInstance(element: HTMLElement): VueComponentInstance | undefined {
  return element.__vue__;
}

// 将函数挂载到全局对象，方便调试
exposeDevGlobals({
  retraverseVNodes,
  startVNodeTraversal,
  getVueInstance,
  clearAllVueInstances,
  debounceVNodeTraversal
});
