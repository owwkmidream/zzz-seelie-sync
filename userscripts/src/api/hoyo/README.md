# 米哈游绝区零 API 模块

## 概述

这个模块提供了完整的绝区零 API 访问功能，已按功能拆分为多个子模块，便于维护和使用。

## 模块结构

```
src/api/hoyo/
├── index.ts          # 主入口，导出所有API
├── types.ts          # 所有类型定义和枚举
├── client.ts         # 核心客户端和设备管理
├── avatar.ts         # 角色相关API
├── game-note.ts      # 游戏便笺API（体力等）
└── utils.ts          # 工具函数和格式化方法
```

## 使用方法

### 基础导入

```typescript
// 导入所有API（推荐）
import * as ZZZApi from "@/api/hoyo";

// 或者按需导入
import { getAvatarBasicList, getEnergyInfo, getElementName } from "@/api/hoyo";

// 导入类型
import type { AvatarBasicInfo, EnergyInfo, UserInfo } from "@/api/hoyo";
```

### 角色相关 API

```typescript
// 获取角色基础列表
const avatarList = await ZZZApi.getAvatarBasicList();

// 获取单个角色详细信息
const avatarDetail = await ZZZApi.getAvatarDetail(1021);

// 批量获取角色详细信息
const avatarDetails = await ZZZApi.batchGetAvatarDetail(undefined, [
  {
    avatar_id: 1021,
    is_teaser: false,
    teaser_need_weapon: false,
    teaser_sp_skill: false,
  },
]);
```

### 游戏便笺 API

```typescript
// 获取体力信息
const energyInfo = await ZZZApi.getEnergyInfo();

// 获取完整游戏便笺
const gameNote = await ZZZApi.getGameNote();

// 格式化体力恢复时间
const restoreTime = ZZZApi.formatEnergyRestoreTime(energyInfo);
```

### 工具函数

```typescript
// 获取属性名称
const elementName = ZZZApi.getElementName(201); // "火"

// 获取职业名称
const professionName = ZZZApi.getProfessionName(1); // "攻击"

// 筛选已解锁角色
const unlockedAvatars = ZZZApi.filterUnlockedAvatars(avatarList);

// 按属性分组角色
const groupedByElement = ZZZApi.groupAvatarsByElement(avatarList);
```

### 设备和用户管理

```typescript
// 获取用户信息
const userInfo = ZZZApi.getUserInfo();

// 初始化用户信息
await ZZZApi.initializeUserInfo();

// 清除设备信息（重置）
ZZZApi.clearDeviceInfo();

// 刷新设备指纹
await ZZZApi.refreshDeviceFingerprint();
```

## 全局调试

所有 API 函数都会自动挂载到 `window.ZZZApi` 对象上，方便在浏览器控制台中调试：

```javascript
// 在浏览器控制台中使用
window.ZZZApi.getAvatarBasicList().then(console.log);
window.ZZZApi.getEnergyInfo().then(console.log);
```

## 注意事项

1. **自动用户信息**: 大部分 API 都支持自动使用缓存的用户信息，无需手动传入 UID
2. **设备指纹管理**: 设备信息会自动缓存到 localStorage，避免重复获取
3. **错误处理**: 所有 API 都包含完整的错误处理和日志输出
4. **批量处理**: 角色详情 API 支持自动分批处理，避免单次请求过多数据

## 类型支持

所有 API 都提供完整的 TypeScript 类型支持，包括：

- 请求参数类型检查
- 返回数据类型推导
- 枚举值自动补全
- 接口属性提示

这样可以在开发时获得更好的 IDE 支持和类型安全保障。
