# useDOMInjector 通用 DOM 注入管理器使用文档

## 概述

`useDOMInjector` 是一个通用的 DOM 注入管理器，用于统一管理多种组件的 DOM 注入、路由监听和生命周期。它采用事件驱动的设计，完全基于 DOM Observer 和路由监听，没有轮询和重试机制。

## 主要特性

- **多组件管理**: 统一管理多种需要 DOM 注入的组件
- **事件驱动**: 完全基于 DOM Observer 和路由监听，无轮询机制
- **动态注册**: 支持在管理器初始化后动态注册新组件
- **自定义插入**: 组件自己决定如何插入 DOM，提供最大灵活性
- **路由回调**: 提供路由变化回调，组件可根据路由信息自定义行为
- **DOM 回调**: 提供 DOM 变化回调，组件可精确响应相关变化
- **条件注入**: 支持条件检查，只在满足条件时创建组件

## 基本用法

```typescript
import { useDOMInjector } from "@/utils/useDOMInjector";
import { SeeliePanel } from "@/components/SeeliePanel";

// 创建 DOM 注入管理器
const injectorManager = useDOMInjector();

// 初始化管理器
injectorManager.init();

// 注册组件（可以在初始化后注册）
injectorManager.register({
  id: "seelie-panel",
  componentFactory: () => new SeeliePanel(),
  inserter: async (component, targetContainer) => {
    // 组件自己决定如何插入
    // SeeliePanel 在构造函数中已处理插入逻辑
  },
  existenceChecker: () =>
    document.querySelector('[data-seelie-panel="true"]') !== null,
  condition: () => document.querySelector(".target-container") !== null,
});

// 销毁（清理资源）
injectorManager.destroy();
```

## 核心设计理念

### 1. 事件驱动，无轮询

- 完全基于 `MutationObserver` 监听 DOM 变化
- 使用 `useRouterWatcher` 监听路由变化
- 没有 `setTimeout` 轮询和重试机制
- 响应式地处理页面变化

### 2. 组件自主插入

- 组件通过 `inserter` 函数自己决定如何插入 DOM
- 支持任意复杂的插入逻辑
- 不限制插入位置和方式

### 3. 动态注册支持

- 可以在管理器初始化后随时注册新组件
- 新注册的组件会立即尝试创建
- 支持运行时动态管理组件

## 组件接口

所有需要被管理的组件都必须实现 `InjectableComponent` 接口：

```typescript
interface InjectableComponent {
  /** 销毁组件 */
  destroy(): void;
  /** 刷新组件（可选） */
  refresh?(): Promise<void> | void;
}
```

## 注入器配置

```typescript
interface InjectorConfig<T extends InjectableComponent = InjectableComponent> {
  /** 注入器唯一标识 */
  id: string;
  /** 组件工厂函数 */
  componentFactory: ComponentFactory<T>;
  /** 组件插入函数，由组件自己决定如何插入 */
  inserter: ComponentInserter;
  /** 检查组件是否已存在的函数 */
  existenceChecker: () => boolean;
  /** 条件检查函数，返回 false 时不创建组件 */
  condition?: () => boolean;
  /** 路由变化回调函数 */
  onRouteChange?: RouteChangeCallback;
  /** DOM 变化回调函数 */
  onDOMChange?: DOMChangeCallback;
}
```

### 回调函数类型

```typescript
// 路由变化回调函数类型
type RouteChangeCallback = (
  to: RouteLocation,
  from: RouteLocation | null
) => void | Promise<void>;

// DOM 变化回调函数类型
type DOMChangeCallback = (mutations: MutationRecord[]) => void | Promise<void>;

// 组件插入函数类型
type ComponentInserter = (
  component: InjectableComponent,
  targetContainer: Element
) => void | Promise<void>;
```

## 高级用法

### 1. 路由感知组件

```typescript
injectorManager.register({
  id: "route-aware-component",
  componentFactory: () => new RouteAwareComponent(),
  inserter: async (component) => {
    // 组件自己处理插入
  },
  existenceChecker: () =>
    document.querySelector('[data-route-aware="true"]') !== null,
  condition: () => {
    // 只在特定路由显示
    return window.location.pathname.includes("/characters");
  },
  onRouteChange: async (to, from) => {
    console.log(`路由变化: ${from?.path} -> ${to.path}`);

    // 根据路由信息决定组件行为
    if (to.path.includes("/characters")) {
      // 进入角色页面，可能需要加载数据
    } else {
      // 离开角色页面，可能需要清理数据
    }
  },
});
```

### 2. DOM 变化响应组件

```typescript
injectorManager.register({
  id: "dom-reactive-component",
  componentFactory: () => new DOMReactiveComponent(),
  inserter: async (component) => {
    // 组件自己处理插入
  },
  existenceChecker: () =>
    document.querySelector('[data-dom-reactive="true"]') !== null,
  onDOMChange: async (mutations) => {
    // 精确响应相关的 DOM 变化
    const hasRelevantChanges = mutations.some((mutation) => {
      if (mutation.type === "childList") {
        return Array.from(mutation.addedNodes).some((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            return element.classList.contains("target-class");
          }
          return false;
        });
      }
      return false;
    });

    if (hasRelevantChanges) {
      console.log("检测到相关 DOM 变化，更新组件");
      // 执行相应的更新逻辑
    }
  },
});
```

### 3. 复杂插入逻辑

```typescript
injectorManager.register({
  id: "complex-insertion-component",
  componentFactory: () => new ComplexComponent(),
  inserter: async (component, _targetContainer) => {
    // 复杂的插入逻辑
    const header = document.querySelector(".page-header");
    const sidebar = document.querySelector(".sidebar");

    if (header && sidebar) {
      // 在多个位置插入组件的不同部分
      const headerPart = component.getHeaderPart();
      const sidebarPart = component.getSidebarPart();

      header.appendChild(headerPart);
      sidebar.appendChild(sidebarPart);
    }
  },
  existenceChecker: () => {
    // 检查组件的多个部分是否都存在
    return (
      document.querySelector('[data-header-part="true"]') !== null &&
      document.querySelector('[data-sidebar-part="true"]') !== null
    );
  },
});
```

### 4. 条件动态组件

```typescript
injectorManager.register({
  id: "conditional-component",
  componentFactory: () => new ConditionalComponent(),
  inserter: async (component) => {
    // 组件自己处理插入
  },
  existenceChecker: () =>
    document.querySelector('[data-conditional="true"]') !== null,
  condition: () => {
    // 复杂的条件检查
    const user = getCurrentUser();
    const route = getCurrentRoute();

    return (
      user?.hasPermission("advanced_features") &&
      route?.path.includes("/dashboard") &&
      document.querySelector(".dashboard-container") !== null
    );
  },
  onRouteChange: async (to, from) => {
    // 路由变化时重新检查条件
    console.log("路由变化，重新检查组件条件");
  },
});
```

## 管理器选项

```typescript
interface DOMInjectorOptions {
  /** DOM 观察配置，默认: { childList: true, subtree: true } */
  observerConfig?: MutationObserverInit;
  /** 是否启用全局路由监听，默认 true */
  enableGlobalRouterWatch?: boolean;
  /** 路由监听延迟时间，默认 100ms */
  routerDelay?: number;
}

// 自定义配置
const injectorManager = useDOMInjector({
  enableGlobalRouterWatch: true,
  routerDelay: 200,
  observerConfig: {
    childList: true,
    subtree: true,
    attributes: true, // 额外监听属性变化
    attributeFilter: ["class", "data-*"], // 只监听特定属性
  },
});
```

## API 参考

### DOMInjectorManager 方法

```typescript
// 注册组件注入器（支持动态注册）
register<T>(config: InjectorConfig<T>): ComponentInjector<T>

// 注销组件注入器
unregister(id: string): boolean

// 获取注入器
getInjector<T>(id: string): ComponentInjector<T> | null

// 初始化管理器
init(): void

// 刷新所有组件
refreshAllComponents(): Promise<void>

// 刷新指定组件
refreshComponent(id: string): Promise<void>

// 销毁管理器
destroy(): void

// 获取所有注入器 ID
getInjectorIds(): string[]

// 获取注入器数量
getInjectorCount(): number

// 检查是否已初始化
isInit(): boolean
```

### ComponentInjector 方法

```typescript
// 尝试创建组件
tryCreate(): Promise<void>

// 检查并重新创建组件
checkAndRecreate(): Promise<void>

// 销毁组件
destroyComponent(): void

// 刷新组件
refreshComponent(): Promise<void>

// 处理路由变化
handleRouteChange(to: RouteLocation, from: RouteLocation | null): Promise<void>

// 处理 DOM 变化
handleDOMChange(mutations: MutationRecord[]): Promise<void>

// 清理资源
cleanup(): void

// 获取组件实例
getComponent(): T | null

// 检查组件是否存在
hasComponent(): boolean

// 获取配置
getConfig(): InjectorConfig<T>
```

## 工作原理

### 1. 事件驱动架构

```
DOM 变化 → MutationObserver → 通知所有注入器 → 检查条件 → 创建/销毁组件
路由变化 → useRouterWatcher → 通知所有注入器 → 执行回调 → 检查条件 → 创建/销毁组件
```

### 2. 组件生命周期

```
注册 → 条件检查 → 创建组件 → 插入 DOM → 监听变化 → 响应变化 → 销毁组件
```

### 3. 动态注册流程

```
register() → 立即检查条件 → 如果满足则创建组件 → 加入监听队列
```

## 实际应用示例

### app.ts 中的完整使用

```typescript
import { useDOMInjector } from "@/utils/useDOMInjector";
import { SeeliePanel } from "@/components/SeeliePanel";

let domInjectorManager: ReturnType<typeof useDOMInjector> | null = null;

function initDOMInjector(): void {
  // 创建管理器
  domInjectorManager = useDOMInjector({
    enableGlobalRouterWatch: true,
    routerDelay: 200,
  });

  // 初始化
  domInjectorManager.init();

  // 注册 Seelie 面板
  domInjectorManager.register({
    id: "seelie-panel",
    componentFactory: () => new SeeliePanel(),
    inserter: async (_component) => {
      // SeeliePanel 在构造函数中已处理插入逻辑
    },
    existenceChecker: () =>
      document.querySelector('[data-seelie-panel="true"]') !== null,
    condition: () => {
      const targetContainer = document.querySelector(
        "div.flex.flex-col.items-center.justify-center.w-full.mt-3"
      );
      return targetContainer !== null;
    },
    onRouteChange: async (to, from) => {
      console.log(`Seelie 面板路由变化: ${from?.path} -> ${to.path}`);
    },
    onDOMChange: async (mutations) => {
      // 检查相关 DOM 变化
      const hasRelevantChanges = mutations.some((mutation) => {
        // 检查逻辑...
      });
      if (hasRelevantChanges) {
        console.log("检测到 Seelie 面板相关的 DOM 变化");
      }
    },
  });
}

// 动态注册新组件
function registerNewComponent() {
  domInjectorManager?.register({
    id: "dynamic-component",
    componentFactory: () => ({ destroy: () => {} }),
    inserter: async () => {
      // 插入逻辑
    },
    existenceChecker: () =>
      document.querySelector('[data-dynamic="true"]') !== null,
  });
}
```

## 最佳实践

1. **事件驱动**: 充分利用路由和 DOM 回调，避免轮询检查
2. **组件自主**: 让组件自己决定插入逻辑，提供最大灵活性
3. **条件精确**: 使用精确的条件检查函数，避免不必要的组件创建
4. **回调高效**: 在回调函数中只处理相关的变化，避免性能问题
5. **动态管理**: 利用动态注册功能，根据需要添加或移除组件
6. **资源清理**: 确保组件正确实现 `destroy()` 方法

## 与旧版本的区别

### 旧版本问题

- 使用 selector + timeout + retry 的轮询模式
- 预设的插入位置限制了灵活性
- 路由变化只能简单重新创建组件
- 必须先注册再初始化

### 新版本优势

- 完全事件驱动，无轮询机制
- 组件自主决定插入逻辑
- 提供路由和 DOM 变化回调
- 支持动态注册组件
- 更高的性能和灵活性

这个新设计完全解决了你提到的所有问题，提供了一个真正灵活、高效的 DOM 注入管理系统。
