// Vue API 通过 auto-import 自动导入，无需手动 import
// import './style.css'; // 注释掉样式导入，避免影响目标网站
// import App from './App.vue'; // 暂时不需要 App 组件

// Vue 3 VNode 遍历功能
interface VNode {
  el?: HTMLElement;
  component?: {
    subTree?: VNode;
    [key: string]: any;
  };
  children?: VNode[];
  dynamicChildren?: VNode[];
  [key: string]: any;
}

/**
 * 递归遍历 VNode 树，为每个有 el 的节点挂载 _vue 属性
 */
function traverseVNode(vnode: VNode, vueInstance?: any): void {
  if (!vnode) return;

  // 如果当前 vnode 有 el 元素，挂载 _vue 属性
  if (vnode.el && vnode.el instanceof HTMLElement) {
    const targetInstance = vueInstance || vnode.component || vnode;
    vnode.el._vue = targetInstance;
    // console.log('挂载 _vue 属性到元素:', vnode.el.tagName, vnode.el);
  }

  // 如果有 component，递归遍历其 subTree
  if (vnode.component?.subTree) {
    traverseVNode(vnode.component.subTree, vnode.component);
  }

  // 遍历 dynamicChildren
  if (vnode.dynamicChildren && Array.isArray(vnode.dynamicChildren)) {
    vnode.dynamicChildren.forEach((child, index) => {
      traverseVNode(child, child.component || vueInstance);
    });
  }

  // 遍历普通 children
  if (vnode.children && Array.isArray(vnode.children)) {
    vnode.children.forEach((child) => {
      if (typeof child === 'object' && child !== null) {
        traverseVNode(child as VNode, vueInstance);
      }
    });
  }
}

/**
 * 启动 VNode 遍历
 */
function startVNodeTraversal(): void {
  const appElement = document.querySelector('#app') as any;

  if (!appElement) {
    console.error('未找到 #app 元素');
    return;
  }

  if (!appElement._vnode) {
    console.error('#app 元素没有 _vnode 属性');
    return;
  }

  console.log('开始遍历 Vue 3 VNode 树，起点:', appElement._vnode);

  // 从 #app._vnode.component 开始遍历
  if (appElement._vnode.component) {
    traverseVNode(appElement._vnode, appElement._vnode.component);
  } else {
    traverseVNode(appElement._vnode);
  }

  console.log('VNode 遍历完成');
}

// 等待页面加载完成后启动 VNode 遍历
function initVNodeTraversal(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(startVNodeTraversal, 0);
    });
  } else {
    setTimeout(startVNodeTraversal, 0);
  }
}

// 启动 VNode 遍历功能
console.log('Vue 3 VNode 遍历脚本已加载');
initVNodeTraversal();

// 原有的 Vue 应用创建逻辑保持不变
// createApp(App).mount(
//   (() => {
//     const app = document.createElement('div');
//     document.body.append(app);
//     return app;
//   })(),
// );
