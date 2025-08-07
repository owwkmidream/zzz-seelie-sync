# 组件架构设计文档

## 设计原则

本次重构遵循以下设计原则：

1. **单一职责原则**：每个类只负责一个明确的职责
2. **依赖倒置原则**：高层模块不依赖低层模块，都依赖抽象
3. **开闭原则**：对扩展开放，对修改关闭
4. **接口隔离原则**：使用小而专一的接口
5. **简化配置**：减少不必要的配置项，提供合理的默认值

## 架构概览

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  SeeliePanel    │    │ DOMInjectorManager│    │ ComponentRegistry│
│  (UI Component) │    │  (Core Manager)   │    │  (Registration)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│InjectableComponent│    │ComponentInjector │    │ ComponentConfig │
│   (Interface)    │    │   (Injector)     │    │ (Configuration) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 核心组件

### 1. InjectableComponent 接口

```typescript
export interface InjectableComponent {
  init(): Promise<void> | void; // 初始化组件
  destroy(): void; // 销毁组件
  refresh?(): Promise<void> | void; // 刷新组件（可选）
}
```

**职责**：定义所有可注入组件必须实现的基本方法。

### 2. ComponentConfig 配置

```typescript
export interface ComponentConfig {
  id: string; // 组件唯一标识
  targetSelector: string; // 目标容器选择器
  componentSelector: string; // 组件元素选择器
  condition?: () => boolean; // 条件检查函数
  routePattern?: string | RegExp; // 路由匹配模式
}
```

**职责**：简化的组件配置，只包含必要的配置项。

### 3. ComponentInjector 注入器

**职责**：

- 管理单个组件的生命周期
- 处理组件的创建、销毁和刷新
- 响应路由变化和 DOM 变化

**关键特性**：

- 防重复创建机制
- 条件检查和路由匹配
- 异步创建支持

### 4. DOMInjectorManager 管理器

**职责**：

- 统一管理多个组件注入器
- 提供全局的路由监听和 DOM 观察
- 协调各组件的生命周期

**关键特性**：

- 全局路由监听
- DOM 变化观察
- 批量组件管理

### 5. SeeliePanel 组件

**职责**：

- 纯粹的 UI 组件，负责面板的创建和交互
- 实现 InjectableComponent 接口
- 不再包含注册逻辑

**关键改进**：

- 移除静态注册方法
- 简化初始化流程
- 职责更加明确

### 6. ComponentRegistry 注册中心

**职责**：

- 统一管理所有组件的注册配置
- 提供组件注册的统一入口
- 解耦组件实现和注册逻辑

## 使用示例

### 注册组件

```typescript
import { registerAllComponents } from "@/utils/componentRegistry";

// 注册所有组件
registerAllComponents();

// 或按需注册
registerComponents(["seeliePanel"]);
```

### 创建新组件

1. 实现 `InjectableComponent` 接口：

```typescript
export class MyComponent implements InjectableComponent {
  public static readonly TARGET_SELECTOR = ".my-target";
  public static readonly COMPONENT_SELECTOR = "[data-my-component]";

  async init(): Promise<void> {
    // 初始化逻辑
  }

  destroy(): void {
    // 清理逻辑
  }

  async refresh(): Promise<void> {
    // 刷新逻辑
  }
}
```

2. 在注册中心添加注册函数：

```typescript
function registerMyComponent(): void {
  const config: ComponentConfig = {
    id: "my-component",
    targetSelector: MyComponent.TARGET_SELECTOR,
    componentSelector: MyComponent.COMPONENT_SELECTOR,
    routePattern: "/my-page",
  };

  domInjector.register(config, () => new MyComponent());
}
```

## 优化效果

### 代码质量提升

1. **职责清晰**：每个类都有明确的单一职责
2. **耦合度降低**：组件不再直接依赖注入器
3. **可测试性增强**：接口化设计便于单元测试
4. **可维护性提高**：配置简化，逻辑清晰

### 开发体验改善

1. **配置简化**：从 7 个配置项减少到 5 个必要配置项
2. **类型安全**：更严格的类型定义
3. **扩展性好**：新增组件只需实现接口和添加注册配置
4. **调试友好**：清晰的日志和错误处理

### 性能优化

1. **防重复创建**：避免组件重复创建的开销
2. **条件检查优化**：内置的条件检查逻辑
3. **批量处理**：DOM 变化的批量处理机制

## 最佳实践

1. **组件设计**：

   - 保持组件的纯粹性，只关注 UI 逻辑
   - 使用常量定义选择器，便于复用
   - 实现完整的生命周期方法

2. **配置管理**：

   - 在注册中心统一管理配置
   - 使用有意义的组件 ID
   - 合理设置路由匹配模式

3. **错误处理**：

   - 在 init 方法中抛出明确的错误
   - 在 destroy 方法中进行完整的清理
   - 使用 logger 记录关键操作

4. **性能考虑**：
   - 避免在条件检查中执行重操作
   - 合理使用 refresh 方法
   - 注意内存泄漏的防范
