# Seelie 工具类 API 文档 (v2.0)

## 概述

Seelie 工具类是一个用于与 Seelie 网站 Vue 应用交互的 TypeScript 工具库。经过重构后，代码结构更加清晰，功能更加完善，提供了完整的类型安全和错误处理。

## 架构设计

### 模块结构

```
utils/seelie/
├── index.ts           # 主入口，导出所有公共 API
├── core.ts            # 核心功能类，处理 Vue 组件访问
├── constants.ts       # 常量定义（角色数据、武器数据等）
├── calculators.ts     # 计算工具函数
└── managers.ts        # 数据管理器，处理角色、天赋、武器数据

types/
└── seelie.ts          # 所有 Seelie 相关的类型定义
```

### 继承关系

```
SeelieCore (核心功能)
    ↓
CharacterManager (角色管理)
    ↓
SeelieDataManager (完整功能)
```

## 快速开始

### 基础用法

```typescript
import { setResinData, syncAllCharacters } from "@/utils/seelie";

// 设置树脂数据
const resinData = {
  progress: { max: 240, current: 120 },
  restore: 3600,
  day_type: 1,
  hour: 1,
  minute: 0,
};
setResinData(resinData);

// 同步角色数据
const result = syncAllCharacters(characterList);
console.log(`同步完成: ${result.success}/${result.total} 个角色`);
```

### 高级用法

```typescript
import { seelieDataManager } from "@/utils/seelie";

// 使用管理器实例
const manager = seelieDataManager;

// 单独设置角色数据
manager.setCharacter(characterData);
manager.setTalents(characterData);
manager.setWeapon(characterData);

// 获取组件信息（调试用）
const info = manager.getContextInfo();
console.log("组件信息:", info);
```

## API 参考

### 便捷函数

#### `setResinData(data: ResinDataInput): boolean`

设置树脂数据到 Seelie 应用中。

**参数:**

- `data: ResinDataInput` - 树脂数据对象

**返回值:**

- `boolean` - 设置是否成功

**示例:**

```typescript
const success = setResinData({
  progress: { max: 240, current: 120 },
  restore: 3600,
  day_type: 1,
  hour: 1,
  minute: 0,
});
```

#### `setToast(message: string, type?: ToastType): boolean`

显示 Toast 消息。

**参数:**

- `message: string` - 消息内容
- `type?: ToastType` - 消息类型，可选值: `'success'` | `'warning'` | `'error'`

**返回值:**

- `boolean` - 设置是否成功

**示例:**

```typescript
setToast("操作成功", "success");
setToast("警告信息", "warning");
setToast("错误信息", "error");
```

#### `setCharacter(data: CharacterDataInput): boolean`

设置角色基础数据。

**参数:**

- `data: CharacterDataInput` - 角色数据对象

**返回值:**

- `boolean` - 设置是否成功

#### `setTalents(data: CharacterDataInput): boolean`

设置角色天赋数据。

**参数:**

- `data: CharacterDataInput` - 角色数据对象

**返回值:**

- `boolean` - 设置是否成功

#### `setWeapon(data: CharacterDataInput): boolean`

设置武器数据。

**参数:**

- `data: CharacterDataInput` - 角色数据对象（包含武器信息）

**返回值:**

- `boolean` - 设置是否成功

#### `syncCharacter(data: CharacterDataInput): SyncResult`

同步单个角色的完整数据（角色、天赋、武器）。

**参数:**

- `data: CharacterDataInput` - 角色数据对象

**返回值:**

- `SyncResult` - 同步结果统计

**示例:**

```typescript
const result = syncCharacter(characterData);
console.log(`同步结果: 成功 ${result.success}, 失败 ${result.failed}`);
if (result.errors.length > 0) {
  console.log("错误信息:", result.errors);
}
```

#### `syncAllCharacters(dataList: CharacterDataInput[]): BatchSyncResult`

批量同步多个角色的完整数据。

**参数:**

- `dataList: CharacterDataInput[]` - 角色数据数组

**返回值:**

- `BatchSyncResult` - 批量同步结果统计

**示例:**

```typescript
const result = syncAllCharacters(characterList);
console.log(`批量同步完成: ${result.success}/${result.total} 个角色`);

// 查看详细结果
result.details.forEach((detail) => {
  console.log(
    `${detail.character}: 成功 ${detail.result.success}, 失败 ${detail.result.failed}`
  );
});
```

### 管理器类

#### `SeelieDataManager`

完整功能的数据管理器类，继承自 `CharacterManager`。

**属性:**

- 继承所有父类方法和属性

**方法:**

- 所有便捷函数的底层实现
- `getContextInfo()` - 获取组件上下文信息（调试用）
- `refresh()` - 重新初始化（页面路由变化时使用）

### 计算工具函数

可以单独导入使用的纯函数计算工具。

```typescript
import {
  calculateCharacterAsc,
  calculateWeaponAsc,
  calculateSkillLevel,
} from "@/utils/seelie/calculators";
```

#### `calculateCharacterAsc(character: Avatar): number`

计算角色突破等级。

**参数:**

- `character: Avatar` - 角色数据

**返回值:**

- `number` - 突破等级 (0-6)

#### `calculateWeaponAsc(weapon: WeaponData): number`

计算武器突破等级。

**参数:**

- `weapon: WeaponData` - 武器数据

**返回值:**

- `number` - 突破等级 (0-6)

#### `calculateSkillLevel(skillLevel: number, skillType: string, characterRank: number): number`

计算技能等级（考虑命座加成）。

**参数:**

- `skillLevel: number` - 原始技能等级
- `skillType: string` - 技能类型
- `characterRank: number` - 角色命座等级

**返回值:**

- `number` - 实际技能等级

## 类型定义

### 主要接口

#### `ResinDataInput`

树脂数据输入格式。

```typescript
interface ResinDataInput {
  progress: {
    max: number; // 最大树脂值
    current: number; // 当前树脂值
  };
  restore: number; // 恢复时间（秒）
  day_type: number; // 日期类型
  hour: number; // 小时
  minute: number; // 分钟
}
```

#### `CharacterDataInput`

角色数据输入格式。

```typescript
interface CharacterDataInput {
  avatar: {
    id: number; // 角色ID
    level: number; // 角色等级
    name_mi18n: string; // 角色名称
    full_name_mi18n: string; // 角色全名
    element_type: number; // 元素类型
    camp_name_mi18n: string; // 阵营名称
    avatar_profession: number; // 角色职业
    rarity: string; // 稀有度
    group_icon_path: string; // 组图标路径
    hollow_icon_path: string; // 空洞图标路径
    properties: CharacterProperty[]; // 角色属性
    skills: CharacterSkill[]; // 角色技能
    rank: number; // 命座等级
    ranks: Array<{
      // 命座信息
      id: number;
      name: string;
      desc: string;
      pos: number;
      is_unlocked: boolean;
    }>;
    sub_element_type: number; // 子元素类型
    signature_weapon_id: number; // 专武ID
    awaken_state: string; // 觉醒状态
    skill_upgrade: {
      // 技能升级信息
      first: number[];
      second: number[];
      third: number[];
    };
    promotes: number; // 突破次数
    unlock: boolean; // 是否解锁
  };
  weapon?: WeaponData; // 武器数据（可选）
}
```

#### `SyncResult`

同步结果统计。

```typescript
interface SyncResult {
  success: number; // 成功数量
  failed: number; // 失败数量
  errors: string[]; // 错误信息列表
}
```

#### `BatchSyncResult`

批量同步结果统计。

```typescript
interface BatchSyncResult extends SyncResult {
  total: number; // 总数量
  details: Array<{
    // 详细结果
    character: string;
    result: SyncResult;
  }>;
}
```

### 辅助类型

#### `ToastType`

Toast 消息类型。

```typescript
type ToastType = "error" | "warning" | "success";
```

#### `CharacterProperty`

角色属性信息。

```typescript
interface CharacterProperty {
  property_name: string; // 属性名称
  property_id: number; // 属性ID
  base: string; // 基础值
  add: string; // 附加值
  final: string; // 最终值
  final_val: string; // 最终值（格式化）
}
```

#### `CharacterSkill`

角色技能信息。

```typescript
interface CharacterSkill {
  level: number; // 技能等级
  skill_type: number; // 技能类型
  items: Array<{
    // 技能项目
    title: string;
    text: string;
    awaken: boolean;
  }>;
}
```

#### `WeaponData`

武器数据。

```typescript
interface WeaponData {
  id: number; // 武器ID
  level: number; // 武器等级
  name: string; // 武器名称
  star: number; // 星级
  icon: string; // 图标
  rarity: string; // 稀有度
  properties: WeaponProperty[]; // 武器属性
  main_properties: WeaponProperty[]; // 主属性
  talent_title: string; // 天赋标题
  talent_content: string; // 天赋内容
  profession: number; // 适用职业
}
```

## 错误处理

### 常见错误

1. **组件未找到错误**

   ```
   ⚠️ SeelieCore: 未找到 #app 元素
   ```

   - 原因：页面中没有 `#app` 元素
   - 解决：确保在正确的页面使用，或等待页面加载完成

2. **角色数据错误**

   ```
   ❌ 设置角色数据失败: Character not found.
   ```

   - 原因：角色 ID 在常量数据中不存在
   - 解决：检查角色 ID 是否正确，或更新常量数据

3. **武器数据错误**
   ```
   ❌ 设置武器数据失败: Weapon not found.
   ```
   - 原因：武器 ID 在常量数据中不存在
   - 解决：检查武器 ID 是否正确，或更新常量数据

### 调试方法

1. **获取组件信息**

   ```typescript
   const info = seelieDataManager.getContextInfo();
   console.log("组件信息:", info);
   ```

2. **查看详细日志**

   - 所有操作都有详细的控制台日志
   - 成功操作显示 ✓ 标记
   - 失败操作显示 ❌ 标记
   - 警告信息显示 ⚠️ 标记

3. **重新初始化**
   ```typescript
   seelieDataManager.refresh();
   ```

## 全局对象

为了方便调试，所有主要函数都挂载到了全局对象：

```javascript
// 在浏览器控制台中可以直接使用
setResinData(resinData);
syncAllCharacters(characterList);
setToast("测试消息", "success");
```

## 性能优化

### 按需导入

```typescript
// 只导入需要的函数
import { setResinData, syncCharacter } from "@/utils/seelie";

// 只导入计算函数
import { calculateCharacterAsc } from "@/utils/seelie/calculators";
```

### 批量操作

```typescript
// 推荐：使用批量同步
const result = syncAllCharacters(characterList);

// 不推荐：逐个同步
characterList.forEach((char) => syncCharacter(char));
```

## 向后兼容性

- 所有原有的公共 API 保持不变
- 全局对象挂载依然有效
- 现有代码无需修改即可使用重构后的版本

## 更新日志

### v2.0.0

- 重构代码结构，拆分为多个模块
- 添加完整的 TypeScript 类型定义
- 改进错误处理和日志记录
- 添加批量同步功能
- 优化性能和内存使用

### v1.x

- 原始单文件实现
- 基础功能支持
