# Seelie 数据集成指南 v2.0

## 概述

本指南介绍如何将 `scripts/update-and-restore.js` 的数据提取逻辑集成到油猴脚本中，实现动态数据更新功能。

## 设计原则

1. **网络优先**: 每次脚本启动都尝试获取最新数据
2. **缓存降级**: 网络请求失败时使用 localStorage 缓存
3. **懒加载**: 只在需要时才请求数据
4. **单次请求**: 脚本生命周期内只请求一次
5. **无静态数据**: 移除所有 mock 数据，完全依赖动态数据

## 架构设计

### 文件结构

```
userscripts/src/utils/seelie/
├── constants.ts        # 基础常量 + 懒加载数据接口
├── dataUpdater.ts      # 数据更新核心逻辑
├── calculators.ts      # 计算函数（使用动态数据）
├── types.ts           # 类型定义
└── example.ts         # 使用示例
```

### 核心特性

- **懒加载机制**: 只在首次调用时请求数据
- **网络优先策略**: 优先获取最新数据，失败时使用缓存
- **GM_fetch 支持**: 使用 @trim21/gm-fetch 处理网络请求
- **生命周期缓存**: 脚本运行期间数据保存在内存中
- **错误处理**: 完善的错误处理和日志记录

## 快速开始

### 1. 基础使用

```typescript
import { getCharacterStats, getLanguageData } from "@/utils/seelie/constants";
import { calculateCharacterAsc } from "@/utils/seelie/calculators";

// 获取角色统计数据（首次调用会自动请求网络）
const characterStats = await getCharacterStats();

// 获取语言数据
const languageData = await getLanguageData();

// 计算角色突破等级（会自动加载所需数据）
const ascLevel = await calculateCharacterAsc(characterData.avatar);
```

### 2. 简单初始化

```typescript
import { simpleInit } from "@/utils/seelie/example";

// 在脚本启动时调用
async function initApp() {
  // 简单初始化（不预加载数据）
  await simpleInit();

  // 其他初始化逻辑...
}
```

### 3. 预加载数据（可选）

```typescript
import { preloadData } from "@/utils/seelie/example";

// 如果想要预加载数据以提升用户体验
async function initApp() {
  await simpleInit();

  // 预加载数据（可选）
  await preloadData();
}
```

## API 参考

### 数据获取函数

```typescript
// 获取语言数据
const languageData = await getLanguageData();

// 获取统计数据
const statsData = await getStatsData();

// 获取角色统计数据
const characterStats = await getCharacterStats();

// 获取武器统计数据
const weaponStats = await getWeaponStats();

// 获取武器通用统计数据
const weaponStatsCommon = await getWeaponStatsCommon();
```

### 计算函数

```typescript
// 计算角色突破等级
const characterAsc = await calculateCharacterAsc(character);

// 计算武器突破等级
const weaponAsc = await calculateWeaponAsc(weapon);

// 计算技能等级（同步函数）
const skillLevel = calculateSkillLevel(level, type, rank);
```

### 工具函数

```typescript
// 检查数据是否已加载
const loaded = isDataLoaded();

// 清除运行时缓存（调试用）
clearRuntimeDataCache();
```

## 数据流程

### 1. 懒加载机制

```
首次调用 getCharacterStats()
    ↓
检查是否已加载 (runtimeDataCache.loaded)
    ↓ (未加载)
检查是否正在加载 (runtimeDataCache.loading)
    ↓ (未在加载)
开始网络请求
    ↓
请求成功 → 缓存到 localStorage + 内存
    ↓
返回数据
```

### 2. 网络请求失败处理

```
网络请求失败
    ↓
尝试从 localStorage 获取缓存
    ↓
缓存存在 → 使用缓存数据
    ↓
缓存不存在 → 抛出错误
```

### 3. 生命周期内缓存

```
第一次调用 → 网络请求 → 内存缓存
第二次调用 → 直接使用内存缓存
第三次调用 → 直接使用内存缓存
...
```

## 配置选项

### 缓存键名

- `seelie_language_data`: 语言数据
- `seelie_stats_data`: 统计数据
- `seelie_data_timestamp`: 数据时间戳

### 网络请求配置

```typescript
// dataUpdater.ts 中的配置
private static readonly SEELIE_BASE_URL = 'https://zzz.seelie.me'
private static readonly UNIQUE_ZZZ_KEYS = ['denny', 'w_engine', 'drive_disc']
private static readonly STATS_FILE_PATTERNS = [
  { name: 'charactersStats', pattern: /stats-characters-[a-f0-9]+\.js/ },
  { name: 'weaponsStats', pattern: /stats-weapons-[a-f0-9]+\.js/ },
  { name: 'weaponsStatsCommon', pattern: /stats-weapons-common-[a-f0-9]+\.js/ }
]
```

## 错误处理

### 网络错误

```typescript
try {
  const characterStats = await getCharacterStats();
} catch (error) {
  console.error("获取角色数据失败:", error);
  // 处理错误情况
}
```

### 数据解析错误

系统会自动处理数据解析错误，并在控制台输出详细日志。

## 调试功能

### 开发环境调试

```typescript
import { addDebugCommands } from "@/utils/seelie/example";

// 添加调试命令
addDebugCommands();

// 在浏览器控制台中使用
window.seelieDebug.getCachedData(); // 查看缓存数据
window.seelieDebug.getCharacterStats(); // 获取角色数据
window.seelieDebug.clearCache(); // 清除缓存
window.seelieDebug.isDataLoaded(); // 检查加载状态
```

### 日志级别

- `🔄` 数据加载相关
- `✅` 成功操作
- `⚠️` 警告信息
- `❌` 错误信息
- `🛠️` 调试相关

## 性能优化

### 1. 懒加载

数据只在首次使用时才加载，避免不必要的网络请求。

### 2. 内存缓存

加载后的数据保存在内存中，后续调用无需重复请求。

### 3. 并发控制

多个并发调用会等待同一个加载 Promise，避免重复请求。

### 4. 错误缓存

即使加载失败也会标记为已尝试，避免重复失败请求。

## 使用示例

### 基础使用

```typescript
import { getCharacterStats } from "@/utils/seelie/constants";
import { calculateCharacterAsc } from "@/utils/seelie/calculators";

async function processCharacter(characterData: any) {
  try {
    // 自动懒加载数据并计算
    const ascLevel = await calculateCharacterAsc(characterData.avatar);
    console.log(`角色突破等级: ${ascLevel}`);
  } catch (error) {
    console.error("处理失败:", error);
  }
}
```

### 批量处理

```typescript
async function processBatchCharacters(characters: any[]) {
  // 第一个角色会触发数据加载
  for (const character of characters) {
    const ascLevel = await calculateCharacterAsc(character.avatar);
    console.log(`${character.avatar.name_mi18n}: ${ascLevel}`);
  }
}
```

### 预检查数据

```typescript
import { isDataLoaded, preloadData } from "@/utils/seelie/example";

async function smartProcess() {
  if (!isDataLoaded()) {
    console.log("预加载数据以提升体验...");
    await preloadData();
  }

  // 后续操作会使用已加载的数据
  const stats = await getCharacterStats();
}
```

## 迁移指南

### 从旧版本迁移

1. **移除静态数据引用**:

   ```typescript
   // 旧的
   import { CHARACTERS_STATS } from "./constants";

   // 新的
   import { getCharacterStats } from "./constants";
   ```

2. **更新函数调用**:

   ```typescript
   // 旧的（同步）
   const stats = CHARACTERS_STATS.find((s) => s.id === characterId);

   // 新的（异步）
   const characterStats = await getCharacterStats();
   const stats = characterStats.find((s) => s.id === characterId);
   ```

3. **更新计算函数**:

   ```typescript
   // 旧的
   const ascLevel = calculateCharacterAsc(character);

   // 新的
   const ascLevel = await calculateCharacterAsc(character);
   ```

## 最佳实践

1. **在应用启动时调用 simpleInit()**
2. **使用异步函数处理数据获取**
3. **适当处理网络错误**
4. **开发环境启用调试命令**
5. **避免在循环中重复调用数据获取函数**

## 故障排除

### 常见问题

1. **网络请求失败**

   - 检查网络连接
   - 查看控制台错误日志
   - 检查是否有缓存数据可用

2. **CORS 错误**

   - 确保油猴脚本有 `@connect zzz.seelie.me` 权限

3. **数据解析失败**
   - 检查 seelie.me 网站是否正常
   - 查看详细的错误日志

### 调试步骤

1. 打开浏览器控制台
2. 运行 `window.seelieDebug.getCachedData()` 检查缓存
3. 运行 `window.seelieDebug.isDataLoaded()` 检查加载状态
4. 查看详细的日志输出

## 总结

这个新版本的集成方案提供了：

- ✅ 网络优先的数据获取策略
- ✅ 懒加载机制，按需获取数据
- ✅ 完善的错误处理和缓存降级
- ✅ 脚本生命周期内的高效缓存
- ✅ 简洁的 API 和使用方式
- ✅ 强大的调试功能

数据会在首次使用时自动获取最新版本，无需手动维护静态数据。
