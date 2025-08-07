# 组件注册中心使用文档

## 概述

`componentRegistry.ts` 是一个统一的组件注册中心，用于管理所有需要 DOM 注入的组件注册逻辑，保持 `app.ts` 的结构清晰。

## 文件结构

```
userscripts/src/
├── app.ts                    # 应用主逻辑，保持简洁
├── utils/
│   ├── componentRegistry.ts  # 组件注册中心
│   └── useDOMInjector.ts     # DOM 注入管理器
└── components/
    └── SeeliePanel.ts        # 具体组件实现
```

## 主要功能

### 1. 统一注册管理

所有组件的注册逻辑都集中在 `componentRegistry.ts` 中：

```typescript
// app.ts - 保持简洁
import { registerAllComponents } from "./utils/componentRegistry";

function initDOMInjector(): void {
  const manager = useDOMInjector();
  manager.init();

  // 一行代码注册所有组件
  registerAllComponents(manager);
}
```

### 2. 模块化组件注册

每个组件都有独立的注册函数：

```typescript
// componentRegistry.ts
function registerSeeliePanel(manager: DOMInjectorManager): void {
  manager.register({
    id: "seelie-panel",
    componentFactory: () => new SeeliePanel(),
    // ... 其他配置
  });
}

function registerCustomToolbar(manager: DOMInjectorManager): void {
  manager.register({
    id: "custom-toolbar",
    // ... 配置
  });
}
```

### 3. 按需注册支持

支持按需注册特定组件：

```typescript
import {
  registerComponents,
  componentRegisters,
} from "./utils/componentRegistry";

// 只注册指定的组件
registerComponents(manager, ["seeliePanel", "customToolbar"]);

// 或者单独注册
componentRegisters.seeliePanel(manager);
```

### 4. 动态注册支持

支持运行时动态注册组件：

```typescript
import { registerDynamicComponent } from "./utils/componentRegistry";

// 动态注册新组件
registerDynamicComponent(manager, "my-dynamic-component");
```

## 组件注册模板

### 基础组件注册

```typescript
function registerMyComponent(manager: DOMInjectorManager): void {
  manager.register({
    id: "my-component",
    componentFactory: () => new MyComponent(),
    inserter: async (_component) => {
      // 组件自己处理插入逻辑
      logger.debug("我的组件插入完成");
    },
    existenceChecker: () =>
      document.querySelector('[data-my-component="true"]') !== null,
    condition: () => {
      // 检查创建条件
      return document.querySelector(".target-container") !== null;
    },
    onRouteChange: async (to, from) => {
      logger.debug(`我的组件路由变化: ${from?.path} -> ${to?.path}`);
      // 路由变化处理逻辑
    },
    onDOMChange: async (mutations) => {
      // DOM 变化处理逻辑
      const hasRelevantChanges = mutations.some((mutation) => {
        // 检查相关变化
        return false;
      });

      if (hasRelevantChanges) {
        logger.debug("检测到我的组件相关的 DOM 变化");
      }
    },
  });

  logger.debug("📝 我的组件注册完成");
}
```

### 条件组件注册

```typescript
function registerConditionalComponent(manager: DOMInjectorManager): void {
  manager.register({
    id: "conditional-component",
    componentFactory: () => new ConditionalComponent(),
    inserter: async (_component) => {
      // 插入逻辑
    },
    existenceChecker: () =>
      document.querySelector('[data-conditional="true"]') !== null,
    condition: () => {
      // 复杂条件检查
      const isCharacterPage = window.location.pathname.includes("/characters");
      const hasPermission =
        getCurrentUser()?.hasPermission("advanced_features");
      const hasContainer =
        document.querySelector(".character-container") !== null;

      return isCharacterPage && hasPermission && hasContainer;
    },
    onRouteChange: async (to, from) => {
      // 根据路由决定组件行为
      if (to?.path?.includes("/characters")) {
        logger.debug("进入角色页面，组件应该激活");
      } else {
        logger.debug("离开角色页面，组件应该停用");
      }
    },
  });
}
```

## 添加新组件的步骤

### 1. 创建组件类

```typescript
// src/components/MyNewComponent.ts
export class MyNewComponent {
  private container: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // 组件初始化逻辑
    this.createComponent();
  }

  private createComponent(): void {
    // 创建 DOM 元素
    this.container = document.createElement("div");
    this.container.setAttribute("data-my-new-component", "true");
    this.container.textContent = "我的新组件";

    // 插入到目标位置
    const target = document.querySelector(".target-container");
    if (target) {
      target.appendChild(this.container);
    }
  }

  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  public async refresh(): Promise<void> {
    // 刷新逻辑
    if (this.container) {
      this.container.textContent = `我的新组件 - 更新于 ${new Date().toLocaleTimeString()}`;
    }
  }
}
```

### 2. 在注册中心添加注册函数

```typescript
// src/utils/componentRegistry.ts
import { MyNewComponent } from "@/components/MyNewComponent";

function registerMyNewComponent(manager: DOMInjectorManager): void {
  manager.register({
    id: "my-new-component",
    componentFactory: () => new MyNewComponent(),
    inserter: async (_component) => {
      // MyNewComponent 在构造函数中已处理插入
      logger.debug("我的新组件插入完成");
    },
    existenceChecker: () =>
      document.querySelector('[data-my-new-component="true"]') !== null,
    condition: () => document.querySelector(".target-container") !== null,
  });

  logger.debug("📝 我的新组件注册完成");
}

// 更新 componentRegisters 对象
export const componentRegisters = {
  seeliePanel: registerSeeliePanel,
  customToolbar: registerCustomToolbar,
  myNewComponent: registerMyNewComponent, // 添加新组件
  dynamic: registerDynamicComponent,
} as const;
```

### 3. 在 registerAllComponents 中添加调用

```typescript
export function registerAllComponents(manager: DOMInjectorManager): void {
  logger.debug("🎯 开始注册所有组件");

  registerSeeliePanel(manager);
  registerMyNewComponent(manager); // 添加新组件注册
  // registerCustomToolbar(manager); // 可选组件

  logger.debug("✅ 所有组件注册完成");
}
```

## 最佳实践

### 1. 组件命名规范

- 组件 ID 使用 kebab-case：`my-component`
- 注册函数使用 camelCase：`registerMyComponent`
- 存在性检查器使用统一的 data 属性：`[data-my-component="true"]`

### 2. 日志记录

- 每个注册函数都应该记录注册完成的日志
- 使用统一的日志格式：`📝 组件名注册完成`
- 在关键操作处添加调试日志

### 3. 错误处理

```typescript
function registerMyComponent(manager: DOMInjectorManager): void {
  try {
    manager.register({
      // 配置...
    });
    logger.debug("📝 我的组件注册完成");
  } catch (error) {
    logger.error("❌ 注册我的组件失败:", error);
  }
}
```

### 4. 条件检查优化

```typescript
condition: () => {
  // 缓存 DOM 查询结果
  const targetContainer = document.querySelector(".target-container");
  const userPermission = getCurrentUser()?.hasPermission("feature");
  const routeMatch = window.location.pathname.includes("/target-page");

  return targetContainer !== null && userPermission && routeMatch;
};
```

## 调试功能

### 查看已注册的组件

```javascript
// 浏览器控制台
const manager = getDOMInjectorManager();
console.log("已注册的组件:", manager.getInjectorIds());
console.log("组件数量:", manager.getInjectorCount());
```

### 获取特定组件实例

```javascript
// 获取 Seelie 面板实例
const seeliePanel = getSeeliePanel();
console.log("Seelie 面板:", seeliePanel);

// 获取任意组件实例
const myComponent = manager.getInjector("my-component")?.getComponent();
console.log("我的组件:", myComponent);
```

### 动态注册测试

```javascript
// 动态注册测试组件
registerNewComponent("test-component-" + Date.now());
```

## 总结

组件注册中心的设计优势：

1. **结构清晰**: `app.ts` 保持简洁，所有注册逻辑集中管理
2. **模块化**: 每个组件都有独立的注册函数，易于维护
3. **灵活性**: 支持全量注册、按需注册和动态注册
4. **可扩展**: 添加新组件只需要三个简单步骤
5. **易调试**: 统一的日志格式和调试接口

这种设计让组件管理变得更加有序和可维护。
