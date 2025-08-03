# 开发指南

## 开发环境设置

### 前置要求

- Node.js 16+
- pnpm 包管理器
- 支持油猴脚本的浏览器扩展（如 Tampermonkey）

### 安装依赖

```bash
cd userscripts
pnpm install
```

### 开发模式

```bash
pnpm dev
```

- 启动开发服务器
- 支持热重载
- 自动在浏览器中打开脚本安装页面

### 构建生产版本

```bash
pnpm build
```

- 生成 `dist/zzz-seelie-sync.user.js` 文件
- 可直接安装到油猴扩展

---

## 项目架构

### 文件结构说明

```
src/
├── main.ts                 # 入口文件，负责启动应用
├── app.ts                  # 应用主逻辑，协调各个模块
├── utils/
│   ├── vnodeTraverser.ts   # VNode 遍历核心逻辑
│   ├── useRouterWatcher.ts # 路由监听 Hook
│   └── buttonInjector.ts   # 按钮注入系统
└── vite-env.d.ts          # TypeScript 类型声明
```

### 模块职责分离

#### `main.ts` - 入口文件

- 最小化的入口点
- 只负责调用 `initApp()`
- 保持简洁，便于维护

#### `app.ts` - 应用协调器

- 初始化各个功能模块
- 协调模块间的交互
- 管理全局状态和调试函数

#### `vnodeTraverser.ts` - VNode 遍历引擎

- 专注于 Vue 3 VNode 树的遍历
- 处理 `__vue__` 属性的挂载
- 性能优化和错误处理

#### `useRouterWatcher.ts` - 路由监听 Hook

- 提供可复用的路由监听功能
- 智能查找 Vue Router 实例
- 支持多种使用模式

#### `buttonInjector.ts` - UI 增强系统

- 动态按钮注入和管理
- 样式处理和冲突解决
- 路由感知的 UI 增强

---

## 开发最佳实践

### 1. 代码组织

#### 功能模块化

```typescript
// ✅ 好的做法：功能独立，职责单一
export function useRouterWatcher(callback, options) {
  // 专注于路由监听逻辑
}

// ❌ 避免：功能混杂
export function useRouterWatcherAndInjectButton(callback, buttonConfig) {
  // 混合了路由监听和按钮注入逻辑
}
```

#### 类型安全

```typescript
// ✅ 好的做法：明确的类型定义
interface ButtonConfig {
  text?: string;
  className?: string;
  onClick?: () => void;
  position?: "before" | "after";
}

export function injectButton(config: ButtonConfig): HTMLElement | null {
  // 类型安全的实现
}

// ❌ 避免：使用 any 类型
export function injectButton(config: any): any {
  // 缺乏类型安全
}
```

### 2. 错误处理

#### 防御性编程

```typescript
// ✅ 好的做法：完善的错误处理
export function startVNodeTraversal(): void {
  const appElement = document.querySelector("#app") as HTMLElement;

  if (!appElement) {
    console.error("❌ 未找到 #app 元素");
    return;
  }

  if (!appElement._vnode) {
    console.error("❌ #app 元素没有 _vnode 属性");
    console.log("可用属性:", Object.keys(appElement));
    return;
  }

  try {
    // 核心逻辑
    traverseVNode(appElement._vnode);
  } catch (error) {
    console.error("VNode 遍历时出错:", error);
  }
}
```

#### 优雅降级

```typescript
// ✅ 好的做法：功能降级而不是完全失败
function findVueRouter(): any {
  // 主要方法
  const router = findFromProvides();
  if (router) return router;

  // 备用方法
  const globalRouter = findFromGlobal();
  if (globalRouter) return globalRouter;

  // 最后的降级处理
  console.warn("未找到 Router，某些功能可能不可用");
  return null;
}
```

### 3. 性能优化

#### 避免重复操作

```typescript
// ✅ 好的做法：使用 WeakSet 避免重复处理
let processedElements = new WeakSet<HTMLElement>();

function traverseVNode(vnode: VNode): void {
  if (vnode.el && !processedElements.has(vnode.el)) {
    // 处理元素
    processedElements.add(vnode.el);
  }
}
```

#### 延迟执行

```typescript
// ✅ 好的做法：使用适当的延迟确保 DOM 就绪
setTimeout(() => {
  startVNodeTraversal();
}, 100); // 给 Vue 应用足够的初始化时间
```

### 4. 调试支持

#### 详细的日志输出

```typescript
// ✅ 好的做法：分级日志和详细信息
console.log("🔍 开始查找 #app 元素...");
console.log("✓ 找到 #app 元素:", appElement);
console.log("🚀 开始遍历 Vue 3 VNode 树...");
console.log(`🎉 遍历完成！耗时: ${time}ms，处理了 ${count} 个元素`);
```

#### 全局调试函数

```typescript
// ✅ 好的做法：提供调试接口
if (typeof window !== "undefined") {
  (window as any).debugVNodeTraverser = {
    start: startVNodeTraversal,
    clear: clearAllVueInstances,
    getStats: () => ({
      mountedCount,
      processedElements: processedElements.size,
    }),
  };
}
```

---

## 扩展开发

### 添加新的路由功能

1. **在 `RouteButtonManager` 中添加路由处理**

```typescript
onRouteChange(currentPath: string): void {
  this.clearButtons();

  // 现有的 planner 路由
  if (currentPath === '/planner') {
    // ... 现有逻辑
  }

  // 新增路由处理
  if (currentPath === '/inventory') {
    this.addButton('button.inventory-btn', {
      text: '📦',
      className: 'ml-2',
      onClick: () => {
        console.log('库存管理功能被触发！');
        // 自定义库存管理逻辑
      }
    });
  }
}
```

2. **创建专门的功能模块**

```typescript
// src/features/inventoryManager.ts
export class InventoryManager {
  private buttons: HTMLElement[] = [];

  init(): void {
    this.injectButtons();
    this.setupEventListeners();
  }

  private injectButtons(): void {
    // 按钮注入逻辑
  }

  private setupEventListeners(): void {
    // 事件监听逻辑
  }

  destroy(): void {
    // 清理逻辑
  }
}
```

3. **在 `app.ts` 中集成**

```typescript
import { InventoryManager } from "./features/inventoryManager";

const inventoryManager = new InventoryManager();

const { unwatch } = useRouterWatcher((to, from) => {
  // 现有逻辑...

  // 新功能集成
  if (to.path === "/inventory") {
    inventoryManager.init();
  } else {
    inventoryManager.destroy();
  }
});
```

### 创建自定义 Hook

```typescript
// src/utils/useCustomHook.ts
export function useCustomHook(options: CustomOptions) {
  // Hook 逻辑

  return {
    // 返回的 API
  };
}
```

### 扩展 VNode 遍历

```typescript
// 在 traverseVNode 函数中添加自定义处理
function traverseVNode(vnode: VNode, vueInstance?: any, depth = 0): void {
  // 现有逻辑...

  // 自定义扩展点
  if (vnode.el && vnode.el instanceof HTMLElement) {
    // 挂载 __vue__ 属性
    Object.defineProperty(vnode.el, "__vue__", {
      /* ... */
    });

    // 自定义扩展：添加调试信息
    if (process.env.NODE_ENV === "development") {
      vnode.el.dataset.vueUid = targetInstance?.uid?.toString();
      vnode.el.dataset.vueType = targetInstance?.type?.name || "unknown";
    }

    // 自定义扩展：特殊元素处理
    if (vnode.el.classList.contains("special-component")) {
      handleSpecialComponent(vnode.el, targetInstance);
    }
  }
}
```

---

## 测试策略

### 手动测试

1. **基础功能测试**

```javascript
// 在浏览器控制台中执行
console.log("测试 VNode 遍历...");
window.startVNodeTraversal();

console.log("测试路由获取...");
const route = window.getCurrentRoute();
console.log("当前路由:", route?.path);

console.log("测试按钮注入...");
window.buttonManager.addButton("button", {
  text: "测试",
  onClick: () => console.log("测试成功！"),
});
```

2. **路由切换测试**

- 手动切换到不同路由
- 观察控制台日志输出
- 检查按钮是否正确插入/移除
- 验证 `__vue__` 属性是否重新挂载

3. **性能测试**

```javascript
// 测试遍历性能
console.time("VNode遍历");
window.startVNodeTraversal();
console.timeEnd("VNode遍历");

// 检查内存使用
console.log(
  "已处理元素数量:",
  document.querySelectorAll("[data-vue-uid]").length
);
```

### 调试技巧

1. **使用浏览器开发者工具**

- Elements 面板：检查元素的 `__vue__` 属性
- Console 面板：查看日志输出和错误信息
- Network 面板：监控脚本加载情况

2. **Vue DevTools**

- 安装 Vue DevTools 浏览器扩展
- 对比脚本挂载的实例与 DevTools 显示的组件

3. **断点调试**

```typescript
function traverseVNode(vnode: VNode, vueInstance?: any, depth = 0): void {
  // 添加条件断点
  if (depth > 5) {
    debugger; // 深度过大时暂停
  }

  // 特定元素断点
  if (vnode.el?.classList.contains("debug-target")) {
    debugger;
  }
}
```

---

## 部署和发布

### 构建配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "Vue 3 VNode 遍历器",
        version: "1.0.0",
        description: "为 Vue 3 应用提供 VNode 遍历和路由监听功能",
        author: "Your Name",
        match: ["https://zzz.seelie.me/*"],
        icon: "https://vitejs.dev/logo.svg",
        namespace: "vue3-vnode-traverser",
        "run-at": "document-end",
        grant: ["none"],
      },
      build: {
        autoGrant: true,
        externalGlobals: {
          vue: cdn.jsdelivr("Vue", "dist/vue.global.prod.js"),
        },
      },
    }),
  ],
});
```

### 版本管理

1. **语义化版本控制**

- `1.0.0` - 主要版本，不兼容的 API 更改
- `1.1.0` - 次要版本，向后兼容的功能添加
- `1.1.1` - 补丁版本，向后兼容的错误修复

2. **更新 UserScript 头部**

```javascript
// ==UserScript==
// @name       Vue 3 VNode 遍历器
// @version    1.0.0
// @updateURL  https://your-domain.com/script.user.js
// @downloadURL https://your-domain.com/script.user.js
// ==/UserScript==
```

### 发布检查清单

- [ ] 代码通过 TypeScript 类型检查
- [ ] 所有功能在目标网站上测试通过
- [ ] 控制台无错误输出
- [ ] 性能测试通过（遍历时间 < 100ms）
- [ ] 文档更新完整
- [ ] 版本号正确更新

---

## 故障排除

### 常见开发问题

1. **热重载不工作**

```bash
# 清除缓存重新启动
rm -rf node_modules/.cache
pnpm dev
```

2. **TypeScript 类型错误**

```typescript
// 确保类型声明文件正确
/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
```

3. **构建失败**

```bash
# 检查依赖版本兼容性
pnpm list
pnpm update
```

### 运行时问题诊断

1. **VNode 遍历失败**

- 检查 Vue 版本兼容性
- 确认 `#app` 元素存在
- 验证 Vue 应用已完全挂载

2. **路由监听不工作**

- 检查 Vue Router 版本
- 确认 Router 实例正确注册
- 查看控制台是否有相关错误

3. **按钮注入失败**

- 验证目标选择器是否正确
- 检查目标元素是否存在
- 确认 Tailwind CSS 类名可用

### 性能问题优化

1. **遍历速度慢**

- 减少日志输出
- 优化遍历算法
- 使用 `requestIdleCallback` 分批处理

2. **内存泄漏**

- 确保事件监听器正确清理
- 检查 WeakSet 使用是否正确
- 监控 DOM 元素引用

---

## 贡献指南

### 代码风格

- 使用 2 空格缩进
- 优先使用 `const` 和 `let`
- 函数和变量使用 camelCase
- 类名使用 PascalCase
- 文件名使用 camelCase

### 提交规范

```
feat: 添加新功能
fix: 修复错误
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建工具或辅助工具的变动
```

### Pull Request 流程

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 添加测试和文档
5. 提交 Pull Request

---

## 参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vue Router 官方文档](https://router.vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [vite-plugin-monkey 文档](https://github.com/lisonge/vite-plugin-monkey)
- [Tampermonkey 文档](https://www.tampermonkey.net/documentation.php)
