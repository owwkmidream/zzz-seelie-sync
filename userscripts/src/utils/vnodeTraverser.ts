// Vue 3 VNode 遍历工具

// 扩展 HTMLElement 类型
declare global {
  interface HTMLElement {
    _vue?: any;
    _vnode?: any;
  }
}

interface VNode {
  el?: HTMLElement;
  component?: {
    subTree?: VNode;
    uid?: number;
    [key: string]: any;
  };
  children?: VNode[];
  dynamicChildren?: VNode[];
  type?: any;
  [key: string]: any;
}

let mountedCount = 0;
let processedElements = new WeakSet<HTMLElement>();

/**
 * 递归遍历 VNode 树，为每个有 el 的节点挂载 _vue 属性
 * @param vnode 当前 VNode
 * @param vueInstance 对应的 Vue 组件实例
 * @param depth 遍历深度，用于调试
 */
function traverseVNode(vnode: VNode, vueInstance?: any, depth = 0): void {
  if (!vnode) return;

  const indent = '  '.repeat(depth);

  // 如果当前 vnode 有 el 元素，挂载 _vue 属性
  if (vnode.el && vnode.el instanceof HTMLElement) {
    // 避免重复处理同一个元素
    if (!processedElements.has(vnode.el)) {
      const targetInstance = vueInstance || vnode.component || vnode;
      vnode.el._vue = targetInstance;
      processedElements.add(vnode.el);
      mountedCount++;

      console.log(`${indent}✓ 挂载 _vue 到元素:`,
        vnode.el.tagName,
        `(uid: ${targetInstance?.uid || 'none'})`,
        `(class: ${vnode.el.className || 'none'})`);
    } else {
      console.log(`${indent}⚠️ 跳过已处理的元素:`, vnode.el.tagName);
    }
  }

  // 如果有 component，递归遍历其 subTree
  if (vnode.component?.subTree) {
    console.log(`${indent}→ 遍历组件 subTree (uid: ${vnode.component.uid})`);
    traverseVNode(vnode.component.subTree, vnode.component, depth + 1);
  }

  // 遍历 dynamicChildren
  if (vnode.dynamicChildren && Array.isArray(vnode.dynamicChildren)) {
    console.log(`${indent}→ 遍历 dynamicChildren (${vnode.dynamicChildren.length} 个)`);
    vnode.dynamicChildren.forEach((child, index) => {
      if (child) {
        console.log(`${indent}  [${index}]:`, child.type?.name || child.type || 'unknown');
        traverseVNode(child, child.component || vueInstance, depth + 1);
      }
    });
  }

  // 遍历普通 children
  if (vnode.children && Array.isArray(vnode.children)) {
    console.log(`${indent}→ 遍历 children (${vnode.children.length} 个)`);
    vnode.children.forEach((child, index) => {
      if (typeof child === 'object' && child !== null) {
        console.log(`${indent}  [${index}]:`, (child as VNode).type?.name || (child as VNode).type || 'unknown');
        traverseVNode(child as VNode, vueInstance, depth + 1);
      }
    });
  }
}

/**
 * 启动 VNode 遍历
 */
export function startVNodeTraversal(): void {
  console.log('🔍 开始查找 #app 元素...');

  const appElement = document.querySelector('#app') as HTMLElement & { _vnode?: VNode };

  if (!appElement) {
    console.error('❌ 未找到 #app 元素');
    return;
  }

  console.log('✓ 找到 #app 元素:', appElement);

  if (!appElement._vnode) {
    console.error('❌ #app 元素没有 _vnode 属性');
    console.log('appElement 的所有属性:', Object.keys(appElement));
    return;
  }

  console.log('✓ 找到 _vnode 属性:', appElement._vnode);
  console.log('🚀 开始遍历 Vue 3 VNode 树...');

  // 重置计数器和已处理元素集合
  mountedCount = 0;
  processedElements = new WeakSet<HTMLElement>(); // 重新创建 WeakSet 来清空

  const startTime = performance.now();

  // 从 #app._vnode.component 开始遍历
  if (appElement._vnode.component) {
    console.log('✓ 找到根组件 (uid:', appElement._vnode.component.uid, ')');
    traverseVNode(appElement._vnode, appElement._vnode.component);
  } else {
    console.log('⚠️ 没有找到根组件，直接从 _vnode 开始遍历');
    traverseVNode(appElement._vnode);
  }

  const endTime = performance.now();
  console.log(`🎉 VNode 遍历完成！耗时: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📊 共为 ${mountedCount} 个元素挂载了 _vue 属性`);

  // 验证挂载结果
  const elementsWithVue = document.querySelectorAll('*');
  let verifyCount = 0;
  elementsWithVue.forEach(el => {
    if ((el as HTMLElement)._vue) {
      verifyCount++;
    }
  });
  console.log(`✓ 验证结果: ${verifyCount} 个元素拥有 _vue 属性`);
}

/**
 * 初始化 VNode 遍历
 */
export function initVNodeTraversal(): void {
  console.log('🔧 Vue 3 VNode 遍历器初始化...');

  const tryStart = () => {
    console.log(`📄 页面状态: ${document.readyState}`);
    startVNodeTraversal();
  };

  if (document.readyState === 'loading') {
    console.log('⏳ 等待 DOM 加载完成...');
    document.addEventListener('DOMContentLoaded', tryStart);
  } else {
    console.log('✓ DOM 已加载完成');
    // 使用 requestAnimationFrame 确保在下一帧执行，让 Vue 有时间完成挂载
    requestAnimationFrame(() => {
      setTimeout(tryStart, 100); // 稍微延迟一点确保 Vue 完全挂载
    });
  }
}

/**
 * 手动触发重新遍历（用于调试）
 */
export function retraverseVNodes(): void {
  console.log('🔄 手动重新遍历 VNode 树...');
  startVNodeTraversal();
}

// 将函数挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).retraverseVNodes = retraverseVNodes;
  (window as any).startVNodeTraversal = startVNodeTraversal;
}