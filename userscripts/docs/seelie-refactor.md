# Seelie 工具类重构文档

## 重构概述

原来的 `seelie.ts` 文件过于庞大（约 600+ 行），包含了类型定义、常量、计算逻辑、数据管理等多种职责。按照 DRY（Don't Repeat Yourself）原则，我们将其拆分为多个模块，提高代码的可维护性和可读性。

## 新的文件结构

```
userscripts/src/
├── types/
│   └── seelie.ts              # 所有 Seelie 相关的类型定义
└── utils/seelie/
    ├── index.ts               # 主入口文件，导出所有公共 API
    ├── core.ts                # 核心功能类，处理 Vue 组件访问
    ├── constants.ts           # 常量定义（角色数据、武器数据等）
    ├── calculators.ts         # 计算工具函数
    └── managers.ts            # 数据管理器，处理角色、天赋、武器数据
```

## 模块职责分工

### 1. `types/seelie.ts`

- 包含所有 Seelie 相关的 TypeScript 类型定义
- 接口定义：`ResinDataInput`、`CharacterDataInput`、`WeaponData` 等
- 结果类型：`SyncResult`、`BatchSyncResult` 等

### 2. `utils/seelie/constants.ts`

- 静态数据常量：角色统计数据、武器数据、技能映射等
- 配置常量：树脂恢复间隔、突破等级数组等
- 所有硬编码的数据都集中在这里，便于维护

### 3. `utils/seelie/core.ts`

- `SeelieCore` 类：提供对 Vue 应用组件的基础访问
- 处理 `#app` 元素和根组件的获取
- 提供基础的数据读写方法（`getAccountResin`、`setAccountResin`、`setToast` 等）
- 封装对 Vue 组件 `addGoal`、`removeGoal` 方法的调用

### 4. `utils/seelie/calculators.ts`

- 纯函数计算工具
- `calculateCharacterAsc`：计算角色突破等级
- `calculateWeaponAsc`：计算武器突破等级
- `calculateSkillLevel`：计算技能等级（考虑命座加成）

### 5. `utils/seelie/managers.ts`

- `CharacterManager` 类：继承自 `SeelieCore`
- 处理角色、天赋、武器数据的设置和同步
- 批量同步功能和结果统计
- 错误处理和用户反馈

### 6. `utils/seelie/index.ts`

- 主入口文件，导出所有公共 API
- `SeelieDataManager` 类：最终的完整功能类
- 便捷函数：`setResinData`、`setCharacter`、`syncAllCharacters` 等
- 全局对象挂载，保持向后兼容

## 重构优势

### 1. 职责分离

- 每个文件都有明确的职责
- 类型定义、常量、计算逻辑、数据管理分别独立
- 便于单独测试和维护

### 2. 代码复用

- 计算函数可以独立使用
- 核心功能类可以被其他管理器继承
- 常量定义集中管理，避免重复

### 3. 可维护性

- 文件大小合理（每个文件 100-200 行）
- 依赖关系清晰
- 修改某个功能时影响范围小

### 4. 类型安全

- 所有类型定义集中管理
- 严格的 TypeScript 类型检查
- 接口定义清晰，便于 IDE 提示

## 使用方式

### 基本用法（保持不变）

```typescript
import { setResinData, syncAllCharacters } from "@/utils/seelie";

// 设置树脂数据
setResinData(resinData);

// 同步所有角色
const result = syncAllCharacters(characterList);
```

### 高级用法

```typescript
import { seelieDataManager } from "@/utils/seelie";

// 直接使用管理器实例
const manager = seelieDataManager;
manager.setCharacter(characterData);
manager.setTalents(characterData);
manager.setWeapon(characterData);
```

### 单独使用计算函数

```typescript
import {
  calculateCharacterAsc,
  calculateWeaponAsc,
} from "@/utils/seelie/calculators";

const characterAsc = calculateCharacterAsc(character);
const weaponAsc = calculateWeaponAsc(weapon);
```

## 向后兼容性

- 所有原有的公共 API 保持不变
- 全局对象挂载依然有效
- 现有代码无需修改即可使用

## 性能优化

- 按需导入：只导入需要的模块
- 懒加载：某些计算函数可以独立导入
- 内存优化：避免重复创建大对象

## 未来扩展

- 可以轻松添加新的管理器类（如装备管理器）
- 计算函数可以独立优化和测试
- 常量数据可以从外部配置文件加载
