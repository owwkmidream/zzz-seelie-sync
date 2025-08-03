# 绝区零角色基础列表API分析文档

## API概述

**接口地址**: `https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/avatar_basic_list`

**请求方法**: GET

**功能**: 获取用户拥有的所有角色的基础信息列表，包括角色基本属性、等级、影级、解锁状态等

## 请求参数

### URL参数
- `uid`: 用户游戏UID (如: 10946813)
- `region`: 服务器区域 (如: prod_gf_cn - 国服)

### 请求头 (Headers)
```javascript
{
  "accept": "application/json, text/plain, */*",
  "accept-language": "zh-CN,zh;q=0.9,ru;q=0.8,en;q=0.7,ee;q=0.6",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "x-rpc-cultivate_source": "pc",
  "x-rpc-device_fp": "38d7fb92a9195",
  "x-rpc-device_id": "d9845d41-f76e-40b9-a2c7-fd7cec16f6d8",
  "x-rpc-geetest_ext": "{\"gameId\":8,\"page\":\"v2.1.0_apps-h_#\",\"viewSource\":1,\"actionSource\":132}",
  "x-rpc-is_teaser": "1",
  "x-rpc-lang": "zh-cn",
  "x-rpc-page": "v2.1.0_apps-h_#",
  "x-rpc-platform": "4",
  "cookie": "..." // 包含认证信息的完整cookie
}
```

### 请求体
无需请求体 (GET请求)

## 响应数据结构

### 基础响应格式
```json
{
  "retcode": 0,
  "message": "OK",
  "data": {
    "list": [...] // 角色基础信息列表
  }
}
```

### 角色基础信息数据结构

#### TypeScript接口定义
```typescript
interface AvatarBasicInfo {
  avatar: Avatar;           // 角色基础信息
  unlocked: boolean;        // 是否已解锁
  is_up: boolean;          // 是否为UP角色
  is_teaser: boolean;      // 是否为预告角色
  is_top: boolean;         // 是否置顶
}

interface Avatar {
  id: number;                    // 角色ID
  level: number;                 // 角色等级
  name_mi18n: string;           // 角色名称
  full_name_mi18n: string;      // 角色全名
  element_type: number;         // 属性类型
  camp_name_mi18n: string;      // 阵营名称
  avatar_profession: number;    // 职业类型
  rarity: string;               // 稀有度 ("S", "A")
  group_icon_path: string;      // 团队图标路径
  hollow_icon_path: string;     // 空洞图标路径
  rank: number;                 // 影级 (0-6)
  sub_element_type: number;     // 子属性类型
  awaken_state: string;         // 觉醒状态
}
```

## 数据字段详解

### 1. 角色基础属性 (avatar)

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `id` | number | 角色唯一ID | 1021 |
| `level` | number | 角色当前等级 | 60 |
| `name_mi18n` | string | 角色显示名称 | "猫又" |
| `full_name_mi18n` | string | 角色全名 | "猫宫 又奈" |
| `element_type` | number | 属性类型编码 | 200 |
| `camp_name_mi18n` | string | 所属阵营 | "狡兔屋" |
| `avatar_profession` | number | 职业类型编码 | 1 |
| `rarity` | string | 稀有度等级 | "S" |
| `group_icon_path` | string | 团队图标URL | "https://..." |
| `hollow_icon_path` | string | 空洞图标URL | "https://..." |
| `rank` | number | 影级等级 | 2 |
| `sub_element_type` | number | 子属性类型 | 0 |
| `awaken_state` | string | 觉醒状态 | "AwakenStateNotVisible" |

### 2. 角色状态标识

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `unlocked` | boolean | 是否已解锁该角色 |
| `is_up` | boolean | 是否为当前UP池角色 |
| `is_teaser` | boolean | 是否为预告/测试角色 |
| `is_top` | boolean | 是否在列表中置顶显示 |

## 枚举值映射

### 属性类型 (element_type)
```typescript
enum ElementType {
  Physical = 200,    // 物理属性
  Fire = 201,        // 火属性
  Ice = 202,         // 冰属性
  Electric = 203,    // 电属性
  Ether = 205        // 以太属性
}
```

### 职业类型 (avatar_profession)
```typescript
enum AvatarProfession {
  Attack = 1,        // 攻击
  Stun = 2,          // 击破
  Anomaly = 3,       // 异常
  Support = 4,       // 支援
  Defense = 5,       // 防护
  Special = 6        // 特殊职业 (如仪玄)
}
```

### 觉醒状态 (awaken_state)
```typescript
enum AwakenState {
  NotVisible = "AwakenStateNotVisible",      // 未觉醒
  Activated = "AwakenStateActivated"         // 已觉醒
}
```

### 稀有度 (rarity)
```typescript
enum Rarity {
  A = "A",           // A级角色
  S = "S"            // S级角色
}
```

## 数据分析示例

### 按属性分类统计
```javascript
function analyzeByElement(avatarList) {
  const elementStats = {};
  const elementNames = {
    200: '物理',
    201: '火',
    202: '冰', 
    203: '电',
    205: '以太'
  };
  
  avatarList.forEach(item => {
    if (item.unlocked) {
      const element = item.avatar.element_type;
      const elementName = elementNames[element];
      elementStats[elementName] = (elementStats[elementName] || 0) + 1;
    }
  });
  
  return elementStats;
}
```

### 按职业分类统计
```javascript
function analyzeByProfession(avatarList) {
  const professionStats = {};
  const professionNames = {
    1: '攻击',
    2: '击破',
    3: '异常',
    4: '支援',
    5: '防护',
    6: '特殊'
  };
  
  avatarList.forEach(item => {
    if (item.unlocked) {
      const profession = item.avatar.avatar_profession;
      const professionName = professionNames[profession];
      professionStats[professionName] = (professionStats[professionName] || 0) + 1;
    }
  });
  
  return professionStats;
}
```

### 影级分布统计
```javascript
function analyzeRankDistribution(avatarList) {
  const rankStats = {};
  
  avatarList.forEach(item => {
    if (item.unlocked) {
      const rank = item.avatar.rank;
      rankStats[`${rank}影`] = (rankStats[`${rank}影`] || 0) + 1;
    }
  });
  
  return rankStats;
}
```

## 使用场景

### 1. 角色收集展示
```javascript
// 获取已解锁的S级角色
const sRankCharacters = data.data.list.filter(item => 
  item.unlocked && item.avatar.rarity === 'S'
);

// 按等级排序
sRankCharacters.sort((a, b) => b.avatar.level - a.avatar.level);
```

### 2. 队伍搭配分析
```javascript
// 获取不同属性的角色用于队伍搭配
const charactersByElement = {};
data.data.list.forEach(item => {
  if (item.unlocked) {
    const element = item.avatar.element_type;
    if (!charactersByElement[element]) {
      charactersByElement[element] = [];
    }
    charactersByElement[element].push(item.avatar);
  }
});
```

### 3. 培养优先级建议
```javascript
// 找出低等级的S级角色，建议优先培养
const lowLevelSRank = data.data.list.filter(item => 
  item.unlocked && 
  item.avatar.rarity === 'S' && 
  item.avatar.level < 50
);
```

## 请求示例

### JavaScript/TypeScript
```javascript
async function getAvatarBasicList(uid: string, region: string = 'prod_gf_cn') {
  const url = `https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/avatar_basic_list?uid=${uid}&region=${region}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'x-rpc-lang': 'zh-cn',
      'x-rpc-cultivate_source': 'pc',
      // ... 其他必要headers
    }
  });
  
  const data = await response.json();
  
  if (data.retcode === 0) {
    return data.data.list;
  } else {
    throw new Error(`API Error: ${data.message}`);
  }
}

// 使用示例
try {
  const avatarList = await getAvatarBasicList('10946813');
  console.log(`共有 ${avatarList.length} 个角色`);
  
  const unlockedCount = avatarList.filter(item => item.unlocked).length;
  console.log(`已解锁 ${unlockedCount} 个角色`);
  
} catch (error) {
  console.error('获取角色列表失败:', error);
}
```

## 与详情API的关系

这个基础列表API通常与之前分析的详情API配合使用：

1. **第一步**: 使用 `avatar_basic_list` 获取所有角色的基础信息
2. **第二步**: 根据需要，使用 `batch_avatar_detail_v2` 获取特定角色的详细信息

```javascript
// 组合使用示例
async function getCharacterDetails(uid: string, characterIds: number[]) {
  // 1. 获取基础列表
  const basicList = await getAvatarBasicList(uid);
  
  // 2. 筛选需要详情的角色
  const targetCharacters = basicList
    .filter(item => characterIds.includes(item.avatar.id) && item.unlocked)
    .map(item => ({
      avatar_id: item.avatar.id,
      is_teaser: item.is_teaser,
      teaser_need_weapon: false,
      teaser_sp_skill: false
    }));
  
  // 3. 获取详细信息
  const detailResponse = await fetch(detailApiUrl, {
    method: 'POST',
    body: JSON.stringify({ avatar_list: targetCharacters }),
    // ... headers
  });
  
  return await detailResponse.json();
}
```

## 注意事项

1. **数据时效性**: 角色列表会随游戏版本更新而变化
2. **权限验证**: 需要有效的用户认证信息
3. **请求频率**: 建议适当控制请求频率
4. **数据缓存**: 基础信息变化较少，可以考虑缓存策略
5. **错误处理**: 需要处理网络错误和API错误响应

## 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 0 | 请求成功 | - |
| -1 | 参数错误 | 检查uid和region参数 |
| -100 | 用户未登录 | 更新cookie认证信息 |
| -101 | 用户不存在 | 确认UID是否正确 |
| 1009 | 请求过于频繁 | 增加请求间隔 |

这个API是构建绝区零相关应用的基础接口，适合用于角色管理、收集展示、队伍搭配等功能的开发。