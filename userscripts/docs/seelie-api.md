# Seelie API 使用文档

## 概述

Seelie API 提供了对 Vue 应用中 `#app._vnode.component.ctx.accountResin` 属性的读写操作。这个 API 专门为操作 Seelie 网站中的账户树脂数据而设计。

## 核心功能

### 1. 基本读写操作

```typescript
import { getAccountResin, setAccountResin } from "./utils/seelie";

// 获取当前 accountResin 值
const resin = getAccountResin();
console.log("当前树脂数据:", resin);

// 设置新的 accountResin 值
const newResinData = {
  current: 160,
  max: 160,
  recoveryTime: Date.now() + 8 * 60 * 60 * 1000,
};
setAccountResin(newResinData);
```

### 2. 属性级操作

```typescript
import {
  getAccountResinProperty,
  updateAccountResinProperty,
} from "./utils/seelie";

// 获取特定属性
const currentAmount = getAccountResinProperty("current");
console.log("当前树脂数量:", currentAmount);

// 更新特定属性
updateAccountResinProperty("current", 120);
```

### 3. 高级操作

```typescript
import { seelieDataManager } from "./utils/seelie";

// 获取组件上下文信息
const contextInfo = seelieDataManager.getContextInfo();
console.log("上下文信息:", contextInfo);

// 手动刷新管理器
seelieDataManager.refresh();
```

## API 参考

### 全局函数

#### `getAccountResin(): any`

获取完整的 accountResin 对象。

**返回值**: accountResin 对象或 null

#### `setAccountResin(value: any): boolean`

设置完整的 accountResin 对象。

**参数**:

- `value`: 要设置的新值

**返回值**: 是否设置成功

#### `getAccountResinProperty(property: string): any`

获取 accountResin 的特定属性。

**参数**:

- `property`: 属性名

**返回值**: 属性值

#### `updateAccountResinProperty(property: string, value: any): boolean`

更新 accountResin 的特定属性。

**参数**:

- `property`: 属性名
- `value`: 新值

**返回值**: 是否更新成功

### SeelieDataManager 类

#### 方法

- `getAccountResin()`: 获取 accountResin 值
- `setAccountResin(value)`: 设置 accountResin 值
- `getAccountResinProperty(property)`: 获取特定属性
- `updateAccountResinProperty(property, value)`: 更新特定属性
- `getContextInfo()`: 获取上下文信息（调试用）
- `refresh()`: 重新初始化管理器

## 实用工具类

### SeelieResinHelper

提供了一系列便捷的树脂操作方法：

```typescript
import { SeelieResinHelper } from "./examples/seelie-usage";

// 检查树脂是否已满
const isFull = SeelieResinHelper.isResinFull();

// 计算恢复时间
const recoveryTime = SeelieResinHelper.getResinRecoveryTime();

// 使用树脂
SeelieResinHelper.useResin(20);

// 添加树脂
SeelieResinHelper.addResin(60);

// 获取状态摘要
const summary = SeelieResinHelper.getResinSummary();
console.log(summary); // "树脂: 140/160 (87%)"
```

## 控制台调试

所有 API 都已挂载到全局对象，可以直接在浏览器控制台中使用：

```javascript
// 基本操作
getAccountResin();
setAccountResin({ current: 160, max: 160 });

// 属性操作
getAccountResinProperty("current");
updateAccountResinProperty("current", 100);

// 工具类
SeelieResinHelper.getResinSummary();
SeelieResinHelper.useResin(20);

// 示例函数
basicUsageExample();
advancedUsageExample();

// 管理器实例
seelieDataManager.getContextInfo();
```

## 注意事项

1. **初始化时机**: API 会在应用启动时自动初始化，但如果页面路由发生变化，会自动重新初始化。

2. **响应式更新**: 修改数据后会尝试触发 Vue 的响应式更新，确保界面同步更新。

3. **错误处理**: 所有操作都包含错误处理，失败时会在控制台输出警告信息。

4. **类型安全**: 虽然 API 接受 `any` 类型，但建议根据实际的 accountResin 数据结构来使用。

## 常见用法示例

### 模拟树脂消耗

```typescript
// 模拟做一次副本（消耗20树脂）
if (SeelieResinHelper.useResin(20)) {
  console.log("副本完成！");
} else {
  console.log("树脂不足！");
}
```

### 使用脆弱树脂

```typescript
// 使用脆弱树脂恢复60点
SeelieResinHelper.addResin(60);
```

### 监控树脂状态

```typescript
// 定期检查树脂状态
setInterval(() => {
  const summary = SeelieResinHelper.getResinSummary();
  console.log("当前状态:", summary);

  if (SeelieResinHelper.isResinFull()) {
    console.log("⚠️ 树脂已满！");
  }
}, 60000); // 每分钟检查一次
```

## 故障排除

### 常见问题

1. **获取不到数据**: 确保页面已完全加载，Vue 应用已挂载
2. **设置失败**: 检查控制台错误信息，可能是数据格式不正确
3. **界面未更新**: 尝试手动刷新页面或调用 `seelieDataManager.refresh()`

### 调试方法

```typescript
// 检查管理器状态
seelieDataManager.getContextInfo();

// 重新初始化
seelieDataManager.refresh();

// 查看完整的组件上下文
console.log(document.querySelector("#app")._vnode.component.ctx);
```
