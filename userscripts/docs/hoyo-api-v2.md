# 米哈游绝区零 API 文档 (v2.0)

## 概述

米哈游绝区零 API 是一个用于访问绝区零游戏数据的 TypeScript 客户端库。它提供了完整的角色信息、游戏便笺、设备管理等功能，支持自动设备指纹管理和用户信息缓存。

## 架构设计

### 模块结构

```
api/hoyo/
├── index.ts           # 主入口，导出所有公共 API
├── client.ts          # 客户端核心功能，设备管理
├── avatar.ts          # 角色相关API
├── game-note.ts       # 游戏便笺API
├── utils.ts           # 工具函数
└── types.ts           # 类型定义
```

### 核心特性

- **自动设备指纹管理**: 自动生成和缓存设备指纹
- **用户信息缓存**: 自动获取和缓存用户信息
- **批量请求支持**: 支持批量获取角色详细信息
- **错误处理**: 完善的错误处理和重试机制
- **类型安全**: 完整的 TypeScript 类型定义

## 快速开始

### 基础用法

```typescript
import {
  getAvatarBasicList,
  batchGetAvatarDetail,
  getGameNote,
} from "@/api/hoyo";

// 获取角色基础列表
const avatarList = await getAvatarBasicList();
console.log("角色列表:", avatarList);

// 批量获取角色详细信息
const detailRequests = avatarList.map((item) => ({
  avatar_id: item.avatar.id,
  is_teaser: false,
  teaser_need_weapon: false,
  teaser_sp_skill: false,
}));
const avatarDetails = await batchGetAvatarDetail(undefined, detailRequests);

// 获取游戏便笺
const gameNote = await getGameNote();
console.log("体力信息:", gameNote.energy);
```

### 指定用户信息

```typescript
// 使用指定的 UID 和区域
const avatarList = await getAvatarBasicList("123456789", "prod_gf_cn");
const gameNote = await getGameNote("123456789", "prod_gf_cn");
```

## API 参考

### 角色相关 API

#### `getAvatarBasicList(uid?, region?): Promise<AvatarBasicInfo[]>`

获取角色基础列表。

**参数:**

- `uid?: string | number` - 用户 UID，可选，不提供则使用缓存的用户 UID
- `region?: string` - 服务器区域，默认 `'prod_gf_cn'`

**返回值:**

- `Promise<AvatarBasicInfo[]>` - 角色基础信息数组

**示例:**

```typescript
// 使用缓存的用户信息
const avatarList = await getAvatarBasicList();

// 指定用户信息
const avatarList = await getAvatarBasicList("123456789", "prod_gf_cn");

// 遍历角色列表
avatarList.forEach((item) => {
  const avatar = item.avatar;
  console.log(`${avatar.name_mi18n} (ID: ${avatar.id}, 等级: ${avatar.level})`);
});
```

#### `batchGetAvatarDetail(uid, avatarList, region?): Promise<AvatarDetail[]>`

批量获取角色详细信息。

**参数:**

- `uid: string | number | undefined` - 用户 UID
- `avatarList: AvatarDetailRequest[]` - 角色请求列表
- `region?: string` - 服务器区域，默认 `'prod_gf_cn'`

**返回值:**

- `Promise<AvatarDetail[]>` - 角色详细信息数组

**示例:**

```typescript
const detailRequests = [
  {
    avatar_id: 1011,
    is_teaser: false,
    teaser_need_weapon: true,
    teaser_sp_skill: false,
  },
  {
    avatar_id: 1021,
    is_teaser: false,
    teaser_need_weapon: true,
    teaser_sp_skill: false,
  },
];

const avatarDetails = await batchGetAvatarDetail(undefined, detailRequests);

avatarDetails.forEach((detail) => {
  const avatar = detail.avatar;
  console.log(`${avatar.name_mi18n}:`);
  console.log(`  等级: ${avatar.level}`);
  console.log(`  命座: ${avatar.rank}`);
  console.log(`  武器: ${detail.weapon.name} (等级 ${detail.weapon.level})`);
});
```

#### `getAvatarDetail(avatarId, uid?, region?, options?): Promise<AvatarDetail>`

获取单个角色详细信息。

**参数:**

- `avatarId: number` - 角色 ID
- `uid?: string | number` - 用户 UID，可选
- `region?: string` - 服务器区域，默认 `'prod_gf_cn'`
- `options?: object` - 额外选项
  - `is_teaser?: boolean` - 是否为预览模式，默认 `false`
  - `teaser_need_weapon?: boolean` - 预览模式是否需要武器，默认 `false`
  - `teaser_sp_skill?: boolean` - 预览模式是否需要特殊技能，默认 `false`

**返回值:**

- `Promise<AvatarDetail>` - 角色详细信息

**示例:**

```typescript
const avatarDetail = await getAvatarDetail(1011, undefined, undefined, {
  teaser_need_weapon: true,
});

console.log(`角色: ${avatarDetail.avatar.name_mi18n}`);
console.log(`武器: ${avatarDetail.weapon.name}`);
```

### 游戏便笺 API

#### `getGameNote(uid?, region?): Promise<GameNoteData>`

获取游戏便笺信息。

**参数:**

- `uid?: string | number` - 用户 UID，可选
- `region?: string` - 服务器区域，默认 `'prod_gf_cn'`

**返回值:**

- `Promise<GameNoteData>` - 游戏便笺数据

**示例:**

```typescript
const gameNote = await getGameNote();
console.log("游戏便笺:", gameNote);
```

#### `getEnergyInfo(uid?, region?): Promise<EnergyInfo>`

获取体力信息。

**参数:**

- `uid?: string | number` - 用户 UID，可选
- `region?: string` - 服务器区域，默认 `'prod_gf_cn'`

**返回值:**

- `Promise<EnergyInfo>` - 体力信息

**示例:**

```typescript
const energyInfo = await getEnergyInfo();
console.log(`体力: ${energyInfo.progress.current}/${energyInfo.progress.max}`);
console.log(`恢复时间: ${energyInfo.restore} 秒`);
```

#### `formatEnergyRestoreTime(energyInfo): string`

格式化体力恢复时间。

**参数:**

- `energyInfo: EnergyInfo` - 体力信息

**返回值:**

- `string` - 格式化的时间字符串

**示例:**

```typescript
const energyInfo = await getEnergyInfo();
const restoreTime = formatEnergyRestoreTime(energyInfo);
console.log(`体力将在 ${restoreTime} 后恢复满`);
```

#### `getEnergyProgress(energyInfo): number`

获取体力恢复进度百分比。

**参数:**

- `energyInfo: EnergyInfo` - 体力信息

**返回值:**

- `number` - 进度百分比 (0-100)

**示例:**

```typescript
const energyInfo = await getEnergyInfo();
const progress = getEnergyProgress(energyInfo);
console.log(`体力恢复进度: ${progress.toFixed(1)}%`);
```

### 客户端核心功能

#### `ensureUserInfo(): Promise<void>`

确保用户信息已初始化。

**返回值:**

- `Promise<void>`

**示例:**

```typescript
await ensureUserInfo();
const userInfo = getUserInfo();
console.log("用户信息:", userInfo);
```

#### `getUserInfo(): UserInfo | null`

获取缓存的用户信息。

**返回值:**

- `UserInfo | null` - 用户信息或 null

#### `clearUserInfo(): void`

清除用户信息缓存。

#### `initializeUserInfo(): Promise<UserInfo | null>`

初始化用户信息。

**返回值:**

- `Promise<UserInfo | null>` - 用户信息或 null

### 设备管理功能

#### `getDeviceFingerprint(deviceId): Promise<string>`

获取设备指纹。

**参数:**

- `deviceId: string` - 设备 ID

**返回值:**

- `Promise<string>` - 设备指纹

#### `generateUUID(): string`

生成 UUID v4 字符串。

**返回值:**

- `string` - UUID 字符串

#### `generateHexString(length): string`

生成指定长度的十六进制字符串。

**参数:**

- `length: number` - 字符串长度

**返回值:**

- `string` - 十六进制字符串

#### `getCurrentDeviceInfo(): Promise<DeviceInfo>`

获取当前设备信息。

**返回值:**

- `Promise<DeviceInfo>` - 设备信息

#### `clearDeviceInfo(): void`

清除设备信息缓存。

#### `refreshDeviceFingerprint(): Promise<void>`

刷新设备指纹。

**返回值:**

- `Promise<void>`

### 工具函数

#### `resolveUserInfo(uid?, region?): Promise<{uid: string, region: string}>`

解析用户信息的通用处理函数。

**参数:**

- `uid?: string | number` - 用户 UID
- `region?: string` - 区域

**返回值:**

- `Promise<{uid: string, region: string}>` - 处理后的用户信息

#### `processBatches<T, R>(items, batchSize, processor): Promise<R[]>`

分批处理数组的通用函数。

**参数:**

- `items: T[]` - 要处理的数组
- `batchSize: number` - 每批的大小
- `processor: (batch: T[]) => Promise<R[]>` - 处理函数

**返回值:**

- `Promise<R[]>` - 所有批次的处理结果

## 类型定义

### 主要接口

#### `UserInfo`

用户信息接口。

```typescript
interface UserInfo {
  uid: string; // 用户UID
  nickname: string; // 昵称
  level: number; // 等级
  region: string; // 区域
  accountId: string; // 账户ID
}
```

#### `DeviceInfo`

设备信息接口。

```typescript
interface DeviceInfo {
  deviceId: string; // 设备ID
  deviceFp: string; // 设备指纹
  timestamp: number; // 时间戳
}
```

#### `AvatarBasicInfo`

角色基础信息。

```typescript
interface AvatarBasicInfo {
  avatar: Avatar; // 角色信息
  unlocked: boolean; // 是否解锁
  is_up: boolean; // 是否UP
  is_teaser: boolean; // 是否为预览
  is_top: boolean; // 是否置顶
}
```

#### `Avatar`

角色信息。

```typescript
interface Avatar {
  id: number; // 角色ID
  level: number; // 等级
  name_mi18n: string; // 名称
  full_name_mi18n: string; // 全名
  element_type: number; // 元素类型
  camp_name_mi18n: string; // 阵营名称
  avatar_profession: number; // 职业
  rarity: string; // 稀有度
  group_icon_path: string; // 组图标路径
  hollow_icon_path: string; // 空洞图标路径
  rank: number; // 命座等级
  sub_element_type: number; // 子元素类型
  awaken_state: string; // 觉醒状态
  promotes?: number; // 突破次数
  signature_weapon_id?: number; // 专武ID
  unlock?: boolean; // 是否解锁
}
```

#### `AvatarDetail`

角色详细信息。

```typescript
interface AvatarDetail {
  avatar: Avatar; // 角色基础信息
  properties: Property[]; // 属性列表
  skills: Skill[]; // 技能列表
  ranks: Rank[]; // 命座列表
  equip: Equipment[]; // 装备列表
  weapon: Weapon; // 武器信息
  plan?: any; // 配装方案
}
```

#### `EnergyInfo`

体力信息。

```typescript
interface EnergyInfo {
  progress: {
    max: number; // 最大体力
    current: number; // 当前体力
  };
  restore: number; // 恢复时间（秒）
  day_type: number; // 日期类型
  hour: number; // 小时
  minute: number; // 分钟
}
```

#### `Weapon`

武器信息。

```typescript
interface Weapon {
  id: number; // 武器ID
  level: number; // 等级
  name: string; // 名称
  star: number; // 星级
  icon: string; // 图标
  rarity: string; // 稀有度
  properties: Property[]; // 属性列表
  main_properties: Property[]; // 主属性列表
  talent_title: string; // 天赋标题
  talent_content: string; // 天赋内容
  profession: number; // 适用职业
}
```

### 枚举定义

#### `ElementType`

元素类型枚举。

```typescript
enum ElementType {
  Physical = 200, // 物理
  Fire = 201, // 火
  Ice = 202, // 冰
  Electric = 203, // 雷
  Ether = 205, // 以太
}
```

#### `AvatarProfession`

角色职业枚举。

```typescript
enum AvatarProfession {
  Attack = 1, // 强攻
  Stun = 2, // 眩晕
  Anomaly = 3, // 异常
  Support = 4, // 支援
  Defense = 5, // 防护
  Rupture = 6, // 破坏
}
```

#### `SkillType`

技能类型枚举。

```typescript
enum SkillType {
  NormalAttack = 0, // 普通攻击
  SpecialSkill = 1, // 特殊技能
  Dodge = 2, // 闪避
  Chain = 3, // 连携技
  CorePassive = 5, // 核心被动
  SupportSkill = 6, // 支援技能
}
```

## 错误处理

### 常见错误

1. **设备指纹错误**

   ```
   ❌ 设备指纹有误，请检查
   ```

   - 原因：设备指纹为默认值 `'0000000000000'`
   - 解决：调用 `refreshDeviceFingerprint()` 重新获取

2. **用户信息错误**

   ```
   ❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社
   ```

   - 原因：没有提供 UID 且缓存中没有用户信息
   - 解决：提供 UID 参数或确保已登录米游社

3. **API 请求错误**
   ```
   API Error 1001: 请求参数错误
   ```
   - 原因：请求参数不正确
   - 解决：检查参数格式和值

### 调试方法

1. **查看设备信息**

   ```typescript
   const deviceInfo = await getCurrentDeviceInfo();
   console.log("设备信息:", deviceInfo);
   ```

2. **查看用户信息**

   ```typescript
   const userInfo = getUserInfo();
   console.log("用户信息:", userInfo);
   ```

3. **重新初始化**
   ```typescript
   clearDeviceInfo();
   clearUserInfo();
   await ensureUserInfo();
   ```

## 全局对象

为了方便调试，所有主要函数都挂载到了全局对象 `ZZZApi`：

```javascript
// 在浏览器控制台中可以直接使用
ZZZApi.getAvatarBasicList().then(console.log);
ZZZApi.getGameNote().then(console.log);
ZZZApi.getCurrentDeviceInfo().then(console.log);
```

## 配置说明

### 基础 URL 配置

```typescript
export const AVATAR_URL =
  "https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool";
export const GAME_RECORD_URL =
  "https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz";
export const DEVICE_FP_URL = "https://public-data-api.mihoyo.com/device-fp/api";
```

### 存储配置

- 设备信息存储在 `localStorage` 中，键名为 `'zzz_device_info'`
- 用户信息缓存在内存中，页面刷新后需要重新获取

## 性能优化

### 缓存机制

- **设备信息缓存**: 设备 ID 和指纹会缓存到 localStorage，避免重复生成
- **用户信息缓存**: 用户信息会缓存到内存，避免重复请求
- **请求头缓存**: 通用请求头会缓存，提高请求效率

### 批量请求

```typescript
// 推荐：使用批量请求
const avatarDetails = await batchGetAvatarDetail(uid, detailRequests);

// 不推荐：逐个请求
const avatarDetails = await Promise.all(
  detailRequests.map((req) => getAvatarDetail(req.avatar_id, uid))
);
```

### 按需导入

```typescript
// 只导入需要的函数
import { getAvatarBasicList, getGameNote } from "@/api/hoyo";

// 只导入类型
import type { AvatarDetail, EnergyInfo } from "@/api/hoyo";
```

## 更新日志

### v2.0.0

- 重构代码结构，拆分为多个模块
- 添加完整的 TypeScript 类型定义
- 改进设备指纹管理机制
- 添加用户信息自动缓存
- 优化批量请求处理
- 改进错误处理和日志记录

### v1.x

- 原始实现
- 基础 API 功能支持
