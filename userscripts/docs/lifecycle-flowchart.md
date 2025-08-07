# 组件生命周期流程图

## 整体架构调用关系

```mermaid
graph TB
    %% 应用启动阶段
    subgraph "应用启动"
        A[应用启动] --> B[调用 registerAllComponents]
        B --> C[registerSeeliePanel]
        C --> D[创建 ComponentConfig]
        D --> E[domInjector.register]
        E --> F[创建 ComponentInjector]
        F --> G[domInjector.init]
    end

    %% 管理器初始化阶段
    subgraph "管理器初始化"
        G --> H[设置路由监听]
        G --> I[设置 DOM 观察器]
        G --> J[createAllComponents]
        J --> K[遍历所有注入器]
        K --> L[injector.tryCreate]
    end

    %% 组件创建阶段
    subgraph "组件创建流程"
        L --> M{检查创建条件}
        M -->|条件不满足| N[跳过创建]
        M -->|条件满足| O{检查组件是否存在}
        O -->|已存在| P[跳过创建]
        O -->|不存在| Q[createComponent]
        Q --> R[调用工厂函数]
        R --> S[new SeeliePanel]
        S --> T[component.init]
        T --> U[createPanel]
        U --> V[插入到 DOM]
    end

    %% 运行时监听阶段
    subgraph "运行时监听"
        W[路由变化] --> X[handleRouteChange]
        Y[DOM 变化] --> Z[handleDOMChange]
        X --> AA[checkAndRecreate]
        Z --> AA
        AA --> BB{应该存在但不存在?}
        BB -->|是| CC[重新创建组件]
        BB -->|否| DD{不应该存在但存在?}
        DD -->|是| EE[销毁组件]
        DD -->|否| FF[无操作]
    end

    %% 组件销毁阶段
    subgraph "组件销毁"
        GG[销毁触发] --> HH[component.destroy]
        HH --> II[清理 DOM 元素]
        II --> JJ[清理事件监听器]
        JJ --> KK[重置内部状态]
    end

    %% 连接各个阶段
    V --> W
    V --> Y
    CC --> Q
    EE --> GG
```

## 详细生命周期时序图

```mermaid
sequenceDiagram
    participant App as 应用入口
    participant Registry as ComponentRegistry
    participant Manager as DOMInjectorManager
    participant Injector as ComponentInjector
    participant Component as SeeliePanel
    participant DOM as DOM

    %% 1. 应用启动和注册阶段
    Note over App,DOM: 1. 应用启动和组件注册阶段
    App->>Registry: registerAllComponents()
    Registry->>Registry: registerSeeliePanel()
    Registry->>Manager: domInjector.register(config, factory)
    Manager->>Injector: new ComponentInjector(config, factory)
    Manager->>Manager: injectors.set(id, injector)

    %% 2. 管理器初始化阶段
    Note over App,DOM: 2. 管理器初始化阶段
    App->>Manager: domInjector.init()
    Manager->>Manager: setupGlobalRouterWatcher()
    Manager->>Manager: setupDOMObserver()
    Manager->>Manager: createAllComponents()

    %% 3. 组件创建阶段
    Note over App,DOM: 3. 组件创建阶段
    Manager->>Injector: injector.tryCreate()
    Injector->>Injector: checkCondition()
    Injector->>DOM: querySelector(targetSelector)
    DOM-->>Injector: 目标容器存在
    Injector->>Injector: checkExistence()
    Injector->>DOM: querySelector(componentSelector)
    DOM-->>Injector: 组件不存在
    Injector->>Injector: createComponent()
    Injector->>Component: factory() -> new SeeliePanel()
    Component-->>Injector: 组件实例
    Injector->>Component: component.init()
    Component->>Component: createPanel()
    Component->>DOM: 插入面板元素
    DOM-->>Component: 插入成功
    Component-->>Injector: 初始化完成

    %% 4. 运行时监听阶段
    Note over App,DOM: 4. 运行时监听阶段
    DOM->>Manager: DOM 变化事件
    Manager->>Injector: handleDOMChange(mutations)
    Injector->>Injector: checkAndRecreate()
    Injector->>Injector: checkCondition() & checkExistence()

    %% 路由变化
    DOM->>Manager: 路由变化事件
    Manager->>Injector: handleRouteChange(to, from)
    Injector->>Injector: checkAndRecreate()

    %% 5. 组件刷新阶段
    Note over App,DOM: 5. 组件刷新阶段（可选）
    App->>Manager: refreshComponent(id)
    Manager->>Injector: refreshComponent()
    Injector->>Component: component.refresh()
    Component->>Component: refreshUserInfo()
    Component->>Component: 重新创建面板

    %% 6. 组件销毁阶段
    Note over App,DOM: 6. 组件销毁阶段
    Manager->>Injector: destroyComponent()
    Injector->>Component: component.destroy()
    Component->>DOM: 移除面板元素
    Component->>Component: 清理内部状态
    DOM-->>Component: 清理完成
```

## 关键调用路径说明

### 1. 启动流程

```
应用启动
  → registerAllComponents()
  → registerSeeliePanel()
  → domInjector.register(config, factory)
  → domInjector.init()
  → 设置监听器 + 创建所有组件
```

### 2. 组件创建流程

```
injector.tryCreate()
  → checkCondition() (检查目标容器、自定义条件、路由匹配)
  → checkExistence() (检查组件是否已在 DOM 中)
  → createComponent()
  → factory() (创建 SeeliePanel 实例)
  → component.init()
  → createPanel() (创建并插入 DOM 元素)
```

### 3. 运行时监听流程

```
DOM/路由变化
  → Manager 接收事件
  → 通知所有 Injector
  → checkAndRecreate()
  → 根据条件决定创建/销毁/无操作
```

### 4. 组件销毁流程

```
销毁触发
  → component.destroy()
  → 移除 DOM 元素
  → 清理事件监听器
  → 重置内部状态
```

## 状态转换图

```mermaid
stateDiagram-v2
    [*] --> 未注册
    未注册 --> 已注册: register()
    已注册 --> 检查中: tryCreate()
    检查中 --> 创建中: 条件满足且不存在
    检查中 --> 已存在: 组件已存在
    检查中 --> 等待中: 条件不满足
    创建中 --> 运行中: init() 成功
    创建中 --> 创建失败: init() 失败
    创建失败 --> 检查中: 重试
    运行中 --> 刷新中: refresh()
    刷新中 --> 运行中: 刷新完成
    运行中 --> 销毁中: destroy()
    销毁中 --> 已销毁: 清理完成
    已销毁 --> 检查中: 重新创建
    等待中 --> 检查中: 条件变化
    已存在 --> 检查中: DOM/路由变化
```

## 核心设计特点

1. **分层架构**：Registry → Manager → Injector → Component
2. **事件驱动**：通过路由变化和 DOM 变化驱动组件生命周期
3. **条件检查**：多层条件检查确保组件在合适时机创建
4. **防重复机制**：通过状态标记防止重复创建
5. **异步支持**：全流程支持异步操作
6. **错误处理**：每个环节都有错误处理和日志记录
