# API 参考文档

## VNode 遍历 API (`vnodeTraverser.ts`)

### `startVNodeTraversal(): void`

启动一次 VNode 遍历，为所有 DOM 元素挂载 `__vue__` 属性。

**示例：**

```typescript
import { startVNodeTraversal } from "./utils/vnodeTraverser";

startVNodeTraversal();
```

**输出：**

- 控制台日志显示遍历进度
- 统计挂载的元素数量和耗时

---

### `initVNodeTraversal(): void`

初始化 VNode 遍历，在页面加载完成后自动执行。

**示例：**

```typescript
import { initVNodeTraversal } from "./utils/vnodeTraverser";

initVNodeTraversal();
```

**特性：**

- 自动检测页面加载状态
- 使用 `requestAnimationFrame` 优化执行时机
- 延迟执行确保 Vue 应用完全挂载

---

### `retraverseVNodes(): void`

手动触发重新遍历，用于调试或特殊场景。

**示例：**

```typescript
// 在控制台中使用
window.retraverseVNodes();
```

---

### `getVueInstance(element: HTMLElement): any`

获取 DOM 元素对应的 Vue 组件实例。

**参数：**

- `element: HTMLElement` - 目标 DOM 元素

**返回值：**

- `any` - Vue 组件实例，如果不存在则返回 `undefined`

**示例：**

```typescript
const element = document.querySelector(".some-component");
const vueInstance = getVueInstance(element);

if (vueInstance) {
  console.log("组件 UID:", vueInstance.uid);
  console.log("组件 props:", vueInstance.props);
  console.log("组件状态:", vueInstance.setupState);
}
```

---

### `clearAllVueInstances(): void`

清除所有元素的 `__vue__` 属性。

**示例：**

```typescript
clearAllVueInstances();
```

**用途：**

- 内存清理
- 重新初始化前的准备
- 调试和测试

---

## 路由监听 API (`useRouterWatcher.ts`)

### `getCurrentRoute(): any`

获取当前路由信息。

**返回值：**

- `any` - 当前路由对象，包含 `path`、`params`、`query` 等信息

**示例：**

```typescript
import { getCurrentRoute } from "./utils/useRouterWatcher";

const route = getCurrentRoute();
console.log("当前路径:", route?.path);
console.log("路由参数:", route?.params);
console.log("查询参数:", route?.query);
```

---

### `useRouterWatcher(callback, options): WatcherResult`

路由监听 Hook，监听路由变化并执行回调。

**参数：**

- `callback: (to: any, from: any) => void` - 路由变化时的回调函数
  - `to` - 目标路由对象
  - `from` - 来源路由对象
- `options?: RouterWatcherOptions` - 配置选项
  - `delay?: number` - 回调延迟时间（毫秒），默认 100
  - `immediate?: boolean` - 是否立即执行一次回调，默认 false

**返回值：**

```typescript
interface WatcherResult {
  router: any; // Vue Router 实例
  unwatch: () => void; // 取消监听函数
  getCurrentRoute: () => any; // 获取当前路由函数
}
```

**示例：**

```typescript
import { useRouterWatcher } from "./utils/useRouterWatcher";

const { unwatch, getCurrentRoute } = useRouterWatcher(
  (to, from) => {
    console.log(`路由从 ${from?.path} 变化到 ${to?.path}`);

    // 根据路由执行不同逻辑
    if (to.path === "/dashboard") {
      console.log("进入仪表板页面");
    }
  },
  {
    delay: 200,
    immediate: true,
  }
);

// 停止监听
// unwatch();
```

---

### `useRouterRerun(fn, options): WatcherResult`

简化版路由监听，专门用于在路由变化时重新执行某个函数。

**参数：**

- `fn: () => void` - 要重新执行的函数
- `options?: RouterRerunOptions` - 配置选项
  - `delay?: number` - 延迟时间（毫秒），默认 100
  - `immediate?: boolean` - 是否立即执行一次，默认 true

**示例：**

```typescript
import { useRouterRerun } from "./utils/useRouterWatcher";
import { startVNodeTraversal } from "./utils/vnodeTraverser";

// 路由变化时重新遍历 VNode 树
const { unwatch } = useRouterRerun(startVNodeTraversal, {
  delay: 100,
  immediate: false,
});
```

---

## 按钮注入 API (`buttonInjector.ts`)

### `injectButtonOnRoute(targetPath, selector, buttonConfig): HTMLElement | null`

在指定路由下插入自定义按钮。

**参数：**

- `targetPath: string` - 目标路由路径（当前实现中未使用，保留用于扩展）
- `selector: string` - 目标元素的 CSS 选择器
- `buttonConfig?: ButtonConfig` - 按钮配置选项

```typescript
interface ButtonConfig {
  text?: string; // 按钮文本，默认 '测试按钮'
  className?: string; // 额外的 CSS 类名
  onClick?: () => void; // 点击事件处理函数
  position?: "before" | "after"; // 插入位置，默认 'after'
}
```

**返回值：**

- `HTMLElement | null` - 插入的按钮元素，失败时返回 null

**示例：**

```typescript
import { injectButtonOnRoute } from "./utils/buttonInjector";

const button = injectButtonOnRoute("", "button.target-btn", {
  text: "自定义功能",
  className: "ml-2 px-4",
  position: "after",
  onClick: () => {
    console.log("自定义功能被触发！");
    // 执行自定义逻辑
  },
});

if (button) {
  console.log("按钮插入成功:", button);
}
```

---

### `removeInjectedButtons(): void`

移除所有通过脚本注入的按钮。

**示例：**

```typescript
import { removeInjectedButtons } from "./utils/buttonInjector";

removeInjectedButtons();
```

---

### `RouteButtonManager`

路由特定的按钮管理器类。

#### 构造函数

```typescript
const buttonManager = new RouteButtonManager();
```

#### `clearButtons(): void`

清除当前管理器管理的所有按钮。

**示例：**

```typescript
buttonManager.clearButtons();
```

#### `addButton(selector, config): HTMLElement | null`

在当前路由添加按钮。

**参数：**

- `selector: string` - 目标元素选择器
- `config?: ButtonConfig` - 按钮配置

**示例：**

```typescript
const button = buttonManager.addButton("button.h-7.w-7", {
  text: "✨",
  className: "ml-2",
  onClick: () => console.log("按钮被点击！"),
});
```

#### `onRouteChange(currentPath): void`

处理路由变化事件。

**参数：**

- `currentPath: string` - 当前路由路径

**示例：**

```typescript
buttonManager.onRouteChange("/planner");
```

**内置路由处理：**

- `/planner` - 自动在 `button.h-7.w-7` 后插入绿色按钮

---

## 全局调试 API

脚本会在 `window` 对象上挂载以下调试函数：

### VNode 遍历相关

```javascript
window.startVNodeTraversal(); // 手动开始遍历
window.retraverseVNodes(); // 重新遍历
window.getVueInstance(element); // 获取元素的 Vue 实例
window.clearAllVueInstances(); // 清除所有 __vue__ 属性
```

### 路由监听相关

```javascript
window.getCurrentRoute(); // 获取当前路由
window.useRouterWatcher(callback); // 设置路由监听
window.useRouterRerun(fn); // 路由变化时重新执行函数
window.unwatchRouter(); // 停止路由监听（需要先设置监听）
```

### 按钮注入相关

```javascript
window.buttonManager; // 按钮管理器实例
window.injectButtonOnRoute(); // 手动注入按钮
window.removeInjectedButtons(); // 移除所有注入的按钮
window.RouteButtonManager; // 按钮管理器构造函数
```

---

## 类型定义

### VNode 接口

```typescript
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
```

### HTMLElement 扩展

```typescript
declare global {
  interface HTMLElement {
    __vue__?: any; // Vue 组件实例
    _vnode?: any; // VNode 对象
  }
}
```

### 路由监听选项

```typescript
interface RouterWatcherOptions {
  delay?: number; // 回调延迟时间（毫秒）
  immediate?: boolean; // 是否立即执行一次回调
}

interface RouterRerunOptions {
  delay?: number; // 延迟时间（毫秒）
  immediate?: boolean; // 是否立即执行一次
}
```

### 按钮配置

```typescript
interface ButtonConfig {
  text?: string; // 按钮文本
  className?: string; // 额外的 CSS 类名
  onClick?: () => void; // 点击事件处理函数
  position?: "before" | "after"; // 插入位置
}
```

---

## 错误处理

### 常见错误类型

1. **ElementNotFoundError**

   ```
   ❌ 未找到目标元素: selector
   ```

   - 原因：指定的选择器在 DOM 中不存在
   - 解决：检查选择器是否正确，确保元素已渲染

2. **RouterNotFoundError**

   ```
   ❌ 未找到 Vue Router 实例
   ```

   - 原因：无法找到 Vue Router 实例
   - 解决：确保网站使用 Vue Router 且正确初始化

3. **VNodeNotFoundError**
   ```
   ❌ #app 元素没有 _vnode 属性
   ```
   - 原因：Vue 应用未正确挂载或版本不兼容
   - 解决：确保使用 Vue 3 且应用已完全加载

### 错误处理最佳实践

```typescript
// 安全地获取 Vue 实例
function safeGetVueInstance(element: HTMLElement) {
  try {
    const instance = getVueInstance(element);
    if (!instance) {
      console.warn("元素没有关联的 Vue 实例:", element);
      return null;
    }
    return instance;
  } catch (error) {
    console.error("获取 Vue 实例时出错:", error);
    return null;
  }
}

// 安全地注入按钮
function safeInjectButton(selector: string, config: ButtonConfig) {
  try {
    const button = injectButtonOnRoute("", selector, config);
    if (!button) {
      console.warn("按钮注入失败，可能是目标元素不存在");
    }
    return button;
  } catch (error) {
    console.error("按钮注入时出错:", error);
    return null;
  }
}
```
