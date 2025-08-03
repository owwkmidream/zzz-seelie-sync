# Vue 3 VNode 遍历与路由监听脚本

## 项目概述

这是一个专为 `https://zzz.seelie.me/*` 网站开发的油猴脚本，主要功能包括：

1. **VNode 遍历**：为 Vue 3 应用中的每个 DOM 元素挂载 `__vue__` 属性，方便访问对应的 Vue 组件实例
2. **路由监听**：监听 Vue Router 路由变化，在路由切换时自动重新遍历
3. **按钮注入**：在特定路由下动态插入自定义按钮

## 技术栈

- **vite-plugin-monkey**: 油猴脚本开发框架
- **TypeScript**: 类型安全的 JavaScript
- **Vue 3**: 目标网站使用的前端框架
- **Vue Router**: 路由管理
- **Tailwind CSS**: 样式框架（目标网站使用）

## 项目结构

```
userscripts/
├── src/
│   ├── main.ts                    # 入口文件
│   ├── app.ts                     # 应用主逻辑
│   └── utils/
│       ├── vnodeTraverser.ts      # VNode 遍历工具
│       ├── useRouterWatcher.ts    # 路由监听 Hook
│       └── buttonInjector.ts      # 按钮注入工具
├── docs/
│   └── README.md                  # 项目文档
└── vite.config.ts                 # Vite 配置
```

## 核心功能

### 1. VNode 遍历 (`vnodeTraverser.ts`)

#### 主要功能

- 递归遍历 Vue 3 的 VNode 树
- 为每个有 `el` 属性的 VNode 对应的 DOM 元素挂载 `__vue__` 属性
- 使用不可枚举属性避免 JSON 序列化时的循环引用错误

#### 核心 API

```typescript
// 启动一次 VNode 遍历
startVNodeTraversal(): void

// 初始化遍历（页面加载时）
initVNodeTraversal(): void

// 手动重新遍历
retraverseVNodes(): void

// 获取元素的 Vue 实例
getVueInstance(element: HTMLElement): any

// 清除所有 __vue__ 属性
clearAllVueInstances(): void
```

#### 遍历逻辑

1. 从 `#app._vnode.component` 开始遍历
2. 递归遍历 `component.subTree`
3. 遍历 `dynamicChildren` 数组
4. 遍历普通 `children` 数组
5. 使用 `WeakSet` 避免重复处理同一元素

#### 属性挂载方式

```typescript
// 使用不可枚举属性，避免 JSON.stringify 报错
Object.defineProperty(element, "__vue__", {
  value: vueInstance, // 完整的 Vue 组件实例
  writable: true, // 可写
  enumerable: false, // 不可枚举
  configurable: true, // 可配置
});
```

### 2. 路由监听 (`useRouterWatcher.ts`)

#### 主要功能

- 智能查找 Vue Router 实例
- 提供路由变化监听 Hook
- 支持获取当前路由信息

#### 核心 API

```typescript
// 获取当前路由
getCurrentRoute(): any

// 路由监听 Hook
useRouterWatcher(
  callback: (to: any, from: any) => void,
  options?: {
    delay?: number;        // 回调延迟时间，默认 100ms
    immediate?: boolean;   // 是否立即执行，默认 false
  }
): { router: any, unwatch: () => void, getCurrentRoute: () => any }

// 简化版：路由变化时重新执行函数
useRouterRerun(
  fn: () => void,
  options?: { delay?: number; immediate?: boolean }
): { router: any, unwatch: () => void }
```

#### Router 查找逻辑

1. 从 `#app.__vue_app__._context.provides` 中查找
2. 遍历所有 Symbol 属性
3. 检查对象是否有 `afterEach`、`beforeEach`、`push` 等 Router 方法
4. 备用方案：从全局对象 `window.$router` 或 `window.router` 查找

### 3. 按钮注入 (`buttonInjector.ts`)

#### 主要功能

- 在指定路由下动态插入自定义按钮
- 智能克隆目标按钮样式
- 自动处理样式冲突
- 路由变化时自动清理

#### 核心 API

```typescript
// 注入按钮
injectButtonOnRoute(
  targetPath: string,
  selector: string,
  buttonConfig?: {
    text?: string;
    className?: string;
    onClick?: () => void;
    position?: 'before' | 'after';
  }
): HTMLElement | null

// 移除所有注入的按钮
removeInjectedButtons(): void

// 路由按钮管理器
class RouteButtonManager {
  clearButtons(): void
  addButton(selector: string, config?: ButtonConfig): HTMLElement | null
  onRouteChange(currentPath: string): void
}
```

#### 按钮注入特性

- **深度克隆**：使用 `cloneNode(true)` 完整复制目标按钮
- **样式智能处理**：自动添加绿色文字样式，移除冲突样式
- **防重复插入**：检查是否已存在相同按钮
- **自动清理**：路由变化时清除旧按钮

## 使用示例

### 基础使用

```typescript
import { initApp } from "./app";

// 启动应用（包含所有功能）
initApp();
```

### 单独使用 VNode 遍历

```typescript
import { startVNodeTraversal, getVueInstance } from "./utils/vnodeTraverser";

// 遍历并挂载 __vue__ 属性
startVNodeTraversal();

// 获取元素的 Vue 实例
const element = document.querySelector(".some-element");
const vueInstance = getVueInstance(element);
console.log(vueInstance);
```

### 单独使用路由监听

```typescript
import { useRouterWatcher, getCurrentRoute } from "./utils/useRouterWatcher";

// 监听路由变化
const { unwatch } = useRouterWatcher(
  (to, from) => {
    console.log("路由从", from?.path, "变化到", to?.path);
  },
  { delay: 100 }
);

// 获取当前路由
const currentRoute = getCurrentRoute();
console.log("当前路由:", currentRoute?.path);
```

### 单独使用按钮注入

```typescript
import { RouteButtonManager } from "./utils/buttonInjector";

const buttonManager = new RouteButtonManager();

// 在当前路由添加按钮
buttonManager.addButton("button.target-button", {
  text: "自定义按钮",
  className: "ml-2",
  onClick: () => console.log("按钮被点击！"),
});
```

## 配置说明

### Vite 配置 (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        match: ["https://zzz.seelie.me/*"],
        name: "Vue 3 VNode 遍历器",
        // ...其他配置
      },
    }),
  ],
});
```

### 目标网站要求

- 使用 Vue 3 框架
- 使用 Vue Router 进行路由管理
- 根元素为 `#app`
- 支持 Tailwind CSS 样式

## 调试功能

脚本会在全局对象上挂载以下调试函数：

```javascript
// VNode 遍历相关
window.startVNodeTraversal(); // 手动开始遍历
window.retraverseVNodes(); // 重新遍历
window.getVueInstance(element); // 获取元素的 Vue 实例
window.clearAllVueInstances(); // 清除所有 __vue__ 属性

// 路由监听相关
window.getCurrentRoute(); // 获取当前路由
window.unwatchRouter(); // 停止路由监听

// 按钮注入相关
window.buttonManager; // 按钮管理器实例
window.injectButtonOnRoute(); // 手动注入按钮
window.removeInjectedButtons(); // 移除所有注入的按钮
```

## 实际应用场景

### 当前实现的功能

在 `/planner` 路由下：

1. 自动查找 `button.h-7.w-7` 元素
2. 在其后插入一个绿色的自定义按钮（显示 ✨ 图标）
3. 点击按钮时在控制台输出测试信息

### 扩展可能性

- **元素调试**：通过 `__vue__` 属性快速访问组件实例进行调试
- **功能增强**：在特定页面添加自定义功能按钮
- **数据监控**：监听路由变化，收集用户行为数据
- **UI 优化**：动态调整页面元素样式或布局

## 性能考虑

### 优化措施

1. **WeakSet 去重**：避免重复处理同一元素
2. **不可枚举属性**：避免 JSON 序列化性能问题
3. **延迟执行**：路由变化后延迟执行，确保页面渲染完成
4. **智能清理**：路由变化时自动清理旧资源

### 性能监控

- 遍历耗时统计
- 挂载元素数量统计
- 内存使用监控

## 故障排除

### 常见问题

1. **未找到 #app 元素**

   - 确保目标网站使用 Vue 3
   - 检查根元素 ID 是否为 `app`

2. **未找到 Router 实例**

   - 确保网站使用 Vue Router
   - 检查 Router 是否正确注册到 Vue 应用

3. **按钮插入失败**

   - 检查目标选择器是否正确
   - 确保目标元素在 DOM 中存在
   - 检查路由路径是否匹配

4. **样式不生效**
   - 确保目标网站使用 Tailwind CSS
   - 检查样式类名是否正确
   - 查看是否有样式冲突

### 调试步骤

1. 打开浏览器开发者工具
2. 查看控制台输出日志
3. 使用全局调试函数进行测试
4. 检查元素的 `__vue__` 属性是否正确挂载

## 开发指南

### 添加新的路由功能

```typescript
// 在 RouteButtonManager.onRouteChange 中添加
if (currentPath === "/new-route") {
  this.addButton("target-selector", {
    text: "新功能",
    onClick: () => {
      // 自定义逻辑
    },
  });
}
```

### 扩展 VNode 遍历

```typescript
// 在 traverseVNode 函数中添加自定义逻辑
if (vnode.el && vnode.el instanceof HTMLElement) {
  // 挂载 __vue__ 属性
  Object.defineProperty(vnode.el, "__vue__", {
    /* ... */
  });

  // 添加自定义属性或逻辑
  vnode.el.dataset.vueUid = targetInstance?.uid;
}
```

### 自定义路由监听

```typescript
import { useRouterWatcher } from "./utils/useRouterWatcher";

useRouterWatcher((to, from) => {
  // 自定义路由变化处理逻辑
  if (to.path === "/special-page") {
    // 特殊页面处理
  }
});
```

## 更新日志

### v1.0.0 (当前版本)

- ✅ 实现 VNode 遍历功能
- ✅ 实现路由监听 Hook
- ✅ 实现按钮注入系统
- ✅ 解决循环引用问题
- ✅ 添加完整的调试功能
- ✅ 优化代码结构和性能

### 计划功能

- 🔄 支持更多路由的自定义功能
- 🔄 添加配置文件支持
- 🔄 支持主题切换
- 🔄 添加用户设置面板

## 许可证

本项目仅供学习和研究使用，请遵守目标网站的使用条款。
