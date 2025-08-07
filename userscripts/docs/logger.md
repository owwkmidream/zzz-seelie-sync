# Logger 工具使用指南

## 概述

Logger 工具提供了对 console 方法的统一封装，支持自定义前缀、时间戳、颜色等功能，并提供了仅在开发环境下输出的 debug 功能。

## 基础使用

### 导入方式

```typescript
// 导入默认 logger 实例和便捷函数
import { logger, debug, log, info, warn, error } from "./utils/logger";

// 导入 Logger 类用于自定义
import { Logger } from "./utils/logger";
```

### 基础日志输出

```typescript
// 使用默认 logger 实例
logger.log("普通日志");
logger.info("信息日志");
logger.warn("警告日志");
logger.error("错误日志");
logger.debug("调试日志 - 仅在开发环境显示");

// 使用便捷函数
log("普通日志");
info("信息日志");
warn("警告日志");
error("错误日志");
debug("调试日志 - 仅在开发环境显示");
```

### Debug 功能

`debug` 函数和 `logger.debug()` 方法只在 `__DEV__` 为 `true` 时才会输出，适合用于开发时的调试信息：

```typescript
// 这些只在开发环境下输出
debug("调试信息:", { data: "some data" });
logger.debug("组件状态:", componentState);
```

## 高级功能

### 表格输出

```typescript
const data = [
  { name: "张三", age: 25 },
  { name: "李四", age: 30 },
];
logger.table(data);
```

### 分组输出

```typescript
logger.group("操作日志");
logger.info("步骤 1 完成");
logger.info("步骤 2 完成");
logger.groupEnd();

// 折叠分组
logger.groupCollapsed("详细信息");
logger.debug("详细数据...");
logger.groupEnd();
```

### 计时功能

```typescript
logger.time("处理耗时");
// 执行一些操作...
logger.timeEnd("处理耗时");
```

## 自定义 Logger

### 创建自定义 Logger

```typescript
const apiLogger = new Logger({
  prefix: "[API]",
  timestamp: true,
  colors: {
    log: "#00BCD4",
    info: "#4CAF50",
    warn: "#FFC107",
    error: "#E91E63",
    debug: "#673AB7",
  },
});

apiLogger.info("API 请求开始");
```

### 创建子 Logger

```typescript
const userApiLogger = apiLogger.createChild("User", {
  colors: {
    info: "#2196F3",
  },
});

// 输出: [时间戳] [API]:User [INFO] 获取用户信息
userApiLogger.info("获取用户信息");
```

## 配置选项

### LoggerOptions

```typescript
interface LoggerOptions {
  prefix?: string; // 日志前缀，默认 '[UserScript]'
  timestamp?: boolean; // 是否显示时间戳，默认 true
  colors?: {
    // 各级别日志的颜色配置
    log?: string;
    info?: string;
    warn?: string;
    error?: string;
    debug?: string;
  };
}
```

## 迁移现有代码

将现有的 console 调用替换为 logger：

```typescript
// 之前
console.log("🔍 开始查找 #app 元素...");
console.error("❌ 未找到 #app 元素");
console.log("调试信息:", debugData);

// 之后
logger.info("🔍 开始查找 #app 元素...");
logger.error("❌ 未找到 #app 元素");
debug("调试信息:", debugData); // 仅在开发环境输出
```

## 最佳实践

1. **使用合适的日志级别**：

   - `log`: 一般信息
   - `info`: 重要信息
   - `warn`: 警告信息
   - `error`: 错误信息
   - `debug`: 调试信息（仅开发环境）

2. **使用分组组织相关日志**：

   ```typescript
   logger.group("用户登录流程");
   logger.info("验证用户凭据");
   logger.info("获取用户信息");
   logger.info("设置用户会话");
   logger.groupEnd();
   ```

3. **为不同模块创建专用 Logger**：

   ```typescript
   const apiLogger = logger.createChild("API");
   const uiLogger = logger.createChild("UI");
   const dataLogger = logger.createChild("Data");
   ```

4. **使用 debug 替代临时的 console.log**：

   ```typescript
   // 避免
   console.log("临时调试信息");

   // 推荐
   debug("临时调试信息"); // 生产环境自动移除
   ```
