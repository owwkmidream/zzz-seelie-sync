# 绝区零 API 使用指南

## 概述

本项目提供了完整的绝区零角色数据 API 封装，支持获取角色基础信息和详细数据。API 基于米哈游官方接口，使用 `@trim21/gm-fetch` 进行跨域请求。

## 快速开始

### 1. 基础使用

```typescript
import { getAvatarBasicList, getAvatarDetail } from "./api/hoyo";

// 获取角色基础列表
const uid = "10946813";
const avatarList = await getAvatarBasicList(uid);
console.log(`获取到 ${avatarList.length} 个角色`);

// 获取单个角色详情
const detail = await getAvatarDetail(uid, 1021); // 1021是猫又的ID
console.log(`角色名称: ${detail.avatar.name_mi18n}`);
```

### 2. 在控制台中使用

脚本会自动将 API 函数挂载到全局对象，可以直接在浏览器控制台中使用：

```javascript
// 获取角色列表
const avatars = await window.ZZZApi.getAvatarBasicList("10946813");

// 获取角色详情
const detail = await window.ZZZApi.getAvatarDetail("10946813", 1021);

// 使用工具函数
console.log(window.ZZZApi.getElementName(200)); // 输出: "物理"
console.log(window.ZZZApi.getProfessionName(1)); // 输出: "攻击"
```

### 3. 运行示例

```javascript
// 基础使用示例
await window.ZZZExamples.basicUsage();

// 获取角色详情示例
await window.ZZZExamples.getCharacterDetail();

// 批量获取角色详情
await window.ZZZExamples.batchGetCharacterDetails();

// 数据分析示例
await window.ZZZExamples.analyzeCharacterData();

// 队伍搭配建议
await window.ZZZExamples.teamComposition();
```

## API 参考

### 核心函数

#### `getAvatarBasicList(uid, region?)`

获取用户的角色基础列表。

**参数:**

- `uid: string | number` - 用户 UID
- `region?: string` - 服务器区域，默认 'prod_gf_cn'

**返回:** `Promise<AvatarBasicInfo[]>`

**示例:**

```typescript
const avatars = await getAvatarBasicList("10946813");
avatars.forEach((item) => {
  if (item.unlocked) {
    console.log(`${item.avatar.name_mi18n} - Lv.${item.avatar.level}`);
  }
});
```

#### `getAvatarDetail(uid, avatarId, region?, options?)`

获取单个角色的详细信息。

**参数:**

- `uid: string | number` - 用户 UID
- `avatarId: number` - 角色 ID
- `region?: string` - 服务器区域，默认 'prod_gf_cn'
- `options?: object` - 额外选项

**返回:** `Promise<AvatarDetail>`

**示例:**

```typescript
const detail = await getAvatarDetail("10946813", 1021);
console.log(`角色: ${detail.avatar.name_mi18n}`);
console.log(`等级: ${detail.avatar.level}`);
console.log(`属性: ${getElementName(detail.avatar.element_type)}`);

// 查看属性
detail.properties.forEach((prop) => {
  console.log(`${prop.property_name}: ${prop.final}`);
});

// 查看装备
detail.equip.forEach((equip) => {
  console.log(`${equip.equipment_type}号位: ${equip.name}`);
});
```

#### `batchGetAvatarDetail(uid, avatarList, region?)`

批量获取多个角色的详细信息。

**参数:**

- `uid: string | number` - 用户 UID
- `avatarList: AvatarDetailRequest[]` - 角色请求列表
- `region?: string` - 服务器区域

**返回:** `Promise<AvatarDetail[]>`

**示例:**

```typescript
const requests = [
  {
    avatar_id: 1021,
    is_teaser: false,
    teaser_need_weapon: false,
    teaser_sp_skill: false,
  },
  {
    avatar_id: 1041,
    is_teaser: false,
    teaser_need_weapon: false,
    teaser_sp_skill: false,
  },
];

const details = await batchGetAvatarDetail("10946813", requests);
details.forEach((detail) => {
  console.log(`${detail.avatar.name_mi18n}: Lv.${detail.avatar.level}`);
});
```

### 工具函数

#### `getElementName(elementType)`

获取属性类型的中文名称。

```typescript
console.log(getElementName(200)); // "物理"
console.log(getElementName(201)); // "火"
console.log(getElementName(202)); // "冰"
console.log(getElementName(203)); // "电"
console.log(getElementName(205)); // "以太"
```

#### `getProfessionName(profession)`

获取职业类型的中文名称。

```typescript
console.log(getProfessionName(1)); // "攻击"
console.log(getProfessionName(2)); // "击破"
console.log(getProfessionName(3)); // "异常"
console.log(getProfessionName(4)); // "支援"
console.log(getProfessionName(5)); // "防护"
```

#### `filterUnlockedAvatars(avatarList)`

筛选已解锁的角色。

```typescript
const allAvatars = await getAvatarBasicList("10946813");
const unlockedAvatars = filterUnlockedAvatars(allAvatars);
console.log(`已解锁 ${unlockedAvatars.length} 个角色`);
```

#### `groupAvatarsByElement(avatarList)`

按属性分组角色。

```typescript
const avatars = await getAvatarBasicList("10946813");
const groups = groupAvatarsByElement(avatars);

Object.entries(groups).forEach(([element, avatars]) => {
  console.log(`${element}属性: ${avatars.length}个`);
  avatars.forEach((item) => {
    console.log(`  - ${item.avatar.name_mi18n}`);
  });
});
```

#### `groupAvatarsByProfession(avatarList)`

按职业分组角色。

```typescript
const avatars = await getAvatarBasicList("10946813");
const groups = groupAvatarsByProfession(avatars);

Object.entries(groups).forEach(([profession, avatars]) => {
  console.log(`${profession}职业: ${avatars.length}个`);
});
```

#### `getSRankAvatars(avatarList)` / `getARankAvatars(avatarList)`

获取指定稀有度的角色。

```typescript
const avatars = await getAvatarBasicList("10946813");
const sRankAvatars = getSRankAvatars(avatars);
const aRankAvatars = getARankAvatars(avatars);

console.log(`S级角色: ${sRankAvatars.length}个`);
console.log(`A级角色: ${aRankAvatars.length}个`);
```

## 数据结构

### AvatarBasicInfo

角色基础信息结构：

```typescript
interface AvatarBasicInfo {
  avatar: Avatar; // 角色基础信息
  unlocked: boolean; // 是否已解锁
  is_up: boolean; // 是否为UP角色
  is_teaser: boolean; // 是否为预告角色
  is_top: boolean; // 是否置顶
}
```

### Avatar

角色详细信息结构：

```typescript
interface Avatar {
  id: number; // 角色ID
  level: number; // 角色等级
  name_mi18n: string; // 角色名称
  full_name_mi18n: string; // 角色全名
  element_type: number; // 属性类型
  camp_name_mi18n: string; // 阵营名称
  avatar_profession: number; // 职业类型
  rarity: string; // 稀有度 ("S", "A")
  rank: number; // 影级 (0-6)
  // ... 更多字段
}
```

### AvatarDetail

角色完整详情结构：

```typescript
interface AvatarDetail {
  avatar: Avatar; // 角色基础信息
  properties: Property[]; // 角色属性
  skills: Skill[]; // 技能信息
  ranks: Rank[]; // 影级信息
  equip: Equipment[]; // 装备信息
  weapon: Weapon; // 武器信息
  plan?: any; // 配装方案
}
```

## 枚举值

### 属性类型 (ElementType)

```typescript
enum ElementType {
  Physical = 200, // 物理
  Fire = 201, // 火
  Ice = 202, // 冰
  Electric = 203, // 电
  Ether = 205, // 以太
}
```

### 职业类型 (AvatarProfession)

```typescript
enum AvatarProfession {
  Attack = 1, // 攻击
  Stun = 2, // 击破
  Anomaly = 3, // 异常
  Support = 4, // 支援
  Defense = 5, // 防护
  Special = 6, // 特殊
}
```

### 技能类型 (SkillType)

```typescript
enum SkillType {
  NormalAttack = 0, // 普通攻击
  SpecialSkill = 1, // 特殊技
  Dodge = 2, // 闪避技能
  Chain = 3, // 连携技
  CorePassive = 5, // 核心被动
  SupportSkill = 6, // 支援技能
}
```

## 实际应用示例

### 1. 角色收集统计

```typescript
async function getCollectionStats(uid: string) {
  const avatars = await getAvatarBasicList(uid);
  const unlocked = filterUnlockedAvatars(avatars);

  const stats = {
    total: avatars.length,
    unlocked: unlocked.length,
    sRank: getSRankAvatars(avatars).length,
    aRank: getARankAvatars(avatars).length,
    completion: ((unlocked.length / avatars.length) * 100).toFixed(1),
  };

  console.log(
    `收集进度: ${stats.unlocked}/${stats.total} (${stats.completion}%)`
  );
  console.log(`S级角色: ${stats.sRank}个`);
  console.log(`A级角色: ${stats.aRank}个`);

  return stats;
}
```

### 2. 培养建议

```typescript
async function getTrainingRecommendations(uid: string) {
  const avatars = await getAvatarBasicList(uid);
  const unlocked = filterUnlockedAvatars(avatars);

  // 找出低等级的S级角色
  const lowLevelSRank = unlocked.filter(
    (item) => item.avatar.rarity === "S" && item.avatar.level < 50
  );

  // 找出低影级的角色
  const lowRankCharacters = unlocked.filter(
    (item) => item.avatar.rarity === "S" && item.avatar.rank < 3
  );

  console.log("🎯 培养建议:");

  if (lowLevelSRank.length > 0) {
    console.log("优先升级的S级角色:");
    lowLevelSRank.forEach((item) => {
      console.log(`  - ${item.avatar.name_mi18n} (Lv.${item.avatar.level})`);
    });
  }

  if (lowRankCharacters.length > 0) {
    console.log("优先提升影级的角色:");
    lowRankCharacters.forEach((item) => {
      console.log(`  - ${item.avatar.name_mi18n} (${item.avatar.rank}影)`);
    });
  }
}
```

### 3. 队伍搭配分析

```typescript
async function analyzeTeamComposition(uid: string) {
  const avatars = await getAvatarBasicList(uid);
  const professionGroups = groupAvatarsByProfession(avatars);

  console.log("⚔️ 队伍搭配分析:");

  // 检查各职业的可用角色
  const professions = ["攻击", "击破", "异常", "支援", "防护"];
  professions.forEach((profession) => {
    const count = professionGroups[profession]?.length || 0;
    console.log(`${profession}: ${count}个`);

    if (professionGroups[profession]) {
      professionGroups[profession].forEach((item) => {
        console.log(`  - ${item.avatar.name_mi18n} (Lv.${item.avatar.level})`);
      });
    }
  });

  // 推荐队伍配置
  const hasAttacker = (professionGroups["攻击"]?.length || 0) > 0;
  const hasStunner = (professionGroups["击破"]?.length || 0) > 0;
  const hasSupport = (professionGroups["支援"]?.length || 0) > 0;
  const hasAnomaly = (professionGroups["异常"]?.length || 0) > 0;

  console.log("\n💡 推荐队伍配置:");
  if (hasAttacker && hasStunner && hasSupport) {
    console.log("✅ 标准配置: 攻击 + 击破 + 支援");
  } else if (hasAnomaly && hasSupport) {
    console.log("✅ 异常配置: 异常 + 支援 + 自由位");
  } else {
    console.log("⚠️ 建议补充缺失的职业角色");
  }
}
```

## 注意事项

1. **认证要求**: API 需要有效的用户认证，确保在已登录的米哈游网站页面中使用
2. **请求频率**: 避免过于频繁的请求，建议添加适当的延迟
3. **错误处理**: 所有 API 调用都应该包含适当的错误处理
4. **数据缓存**: 基础数据变化较少，可以考虑缓存策略
5. **UID 获取**: 需要用户提供正确的游戏 UID

## 故障排除

### 常见错误

1. **网络错误**: 检查网络连接和 API 地址
2. **认证失败**: 确保在已登录的页面中使用
3. **UID 错误**: 确认 UID 格式正确
4. **数据为空**: 检查用户是否有角色数据

### 调试技巧

```typescript
// 启用详细日志
console.log("开始请求API...");
try {
  const result = await getAvatarBasicList(uid);
  console.log("请求成功:", result);
} catch (error) {
  console.error("请求失败:", error);
  // 检查错误详情
  if (error.message.includes("API Error")) {
    console.log("这是API返回的错误，检查参数是否正确");
  } else {
    console.log("这是网络或其他错误");
  }
}
```

这个 API 封装提供了完整的绝区零角色数据访问能力，可以用于构建各种角色管理、数据分析和游戏辅助功能。
