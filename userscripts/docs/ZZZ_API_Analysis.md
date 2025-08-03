# 绝区零角色详情API分析文档

## API概述

**接口地址**: `https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/batch_avatar_detail_v2`

**请求方法**: POST

**功能**: 批量获取绝区零游戏角色的详细信息，包括角色属性、技能、装备、武器等完整数据

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
  "content-type": "application/json",
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

### 请求体 (Body)
```json
{
  "avatar_list": [
    {
      "avatar_id": 1021,
      "is_teaser": false,
      "teaser_need_weapon": false,
      "teaser_sp_skill": false
    }
    // ... 更多角色
  ]
}
```

## 响应数据结构

### 基础响应格式
```json
{
  "retcode": 0,
  "message": "OK",
  "data": {
    "list": [...] // 角色详情列表
  }
}
```

### 角色详情数据结构

#### 1. 角色基础信息 (avatar)
```typescript
interface Avatar {
  id: number;                    // 角色ID
  level: number;                 // 角色等级
  name_mi18n: string;           // 角色名称
  full_name_mi18n: string;      // 角色全名
  element_type: number;         // 属性类型 (200:物理, 201:火, 202:冰, 203:电, 205:以太)
  camp_name_mi18n: string;      // 阵营名称
  avatar_profession: number;    // 职业类型 (1:攻击, 2:击破, 3:异常, 4:支援, 5:防护)
  rarity: string;               // 稀有度 ("S", "A")
  group_icon_path: string;      // 团队图标路径
  hollow_icon_path: string;     // 空洞图标路径
  rank: number;                 // 影级 (0-6)
  sub_element_type: number;     // 子属性类型
  signature_weapon_id: number;  // 专属武器ID
  awaken_state: string;         // 觉醒状态
  promotes: number;             // 突破等级
  unlock: boolean;              // 是否解锁
}
```

#### 2. 角色属性 (properties)
```typescript
interface Property {
  property_name: string;    // 属性名称 (生命值、攻击力、防御力等)
  property_id: number;      // 属性ID
  base: string;            // 基础值
  add: string;             // 附加值
  final: string;           // 最终值
  final_val: string;       // 最终数值
}
```

#### 3. 技能信息 (skills)
```typescript
interface Skill {
  level: number;           // 技能等级
  skill_type: number;      // 技能类型 (0:普攻, 1:特殊技, 2:闪避, 3:连携技, 5:核心被动, 6:支援技)
  items: SkillItem[];      // 技能详情列表
}

interface SkillItem {
  title: string;           // 技能标题
  text: string;            // 技能描述 (包含HTML标签)
  awaken: boolean;         // 是否为觉醒技能
}
```

#### 4. 影级信息 (ranks)
```typescript
interface Rank {
  id: number;              // 影级ID (1-6)
  name: string;            // 影级名称
  desc: string;            // 影级描述
  pos: number;             // 位置
  is_unlocked: boolean;    // 是否已解锁
}
```

#### 5. 装备信息 (equip)
```typescript
interface Equipment {
  id: number;              // 装备ID
  level: number;           // 装备等级
  name: string;            // 装备名称
  icon: string;            // 装备图标URL
  rarity: string;          // 稀有度
  properties: Property[];   // 副属性列表
  main_properties: Property[]; // 主属性列表
  equip_suit: EquipSuit;   // 套装信息
  equipment_type: number;   // 装备位置 (1-6)
  invalid_property_cnt: number; // 无效属性数量
  all_hit: boolean;        // 是否全部命中
}

interface EquipSuit {
  suit_id: number;         // 套装ID
  name: string;            // 套装名称
  own: number;             // 拥有数量
  desc1: string;           // 2件套效果
  desc2: string;           // 4件套效果
  icon: string;            // 套装图标
  cnt: number;             // 计数
  rarity: string;          // 稀有度
}
```

#### 6. 武器信息 (weapon)
```typescript
interface Weapon {
  id: number;              // 武器ID
  level: number;           // 武器等级
  name: string;            // 武器名称
  star: number;            // 精炼等级
  icon: string;            // 武器图标URL
  rarity: string;          // 稀有度
  properties: Property[];   // 武器属性
  main_properties: Property[]; // 主属性
  talent_title: string;    // 天赋标题
  talent_content: string;  // 天赋描述
  profession: number;      // 适用职业
}
```

#### 7. 配装方案 (plan)
```typescript
interface Plan {
  id: string;              // 方案ID
  name: string;            // 方案名称
  desc: string;            // 方案描述
  released_at: string;     // 发布时间戳
  item: PlanItem;          // 方案详情
}

interface PlanItem {
  avatar: AvatarPlan[];    // 角色面板要求
  weapon: WeaponPlan;      // 武器推荐
  equip: EquipPlan;        // 装备推荐
  skill: SkillPlan[];      // 技能升级推荐
  team: TeamPlan;          // 队伍搭配
}
```

## 数据字段说明

### 属性类型映射
- `200`: 物理属性
- `201`: 火属性  
- `202`: 冰属性
- `203`: 电属性
- `205`: 以太属性

### 职业类型映射
- `1`: 攻击 (Attack)
- `2`: 击破 (Stun)
- `3`: 异常 (Anomaly)
- `4`: 支援 (Support)
- `5`: 防护 (Defense)

### 技能类型映射
- `0`: 普通攻击
- `1`: 特殊技
- `2`: 闪避技能
- `3`: 连携技/终结技
- `5`: 核心被动
- `6`: 支援技能

### 装备位置映射
- `1`: 1号位驱动盘 (生命值主属性)
- `2`: 2号位驱动盘 (攻击力主属性)
- `3`: 3号位驱动盘 (防御力主属性)
- `4`: 4号位驱动盘 (生攻防/异常精通/暴击率/暴击伤害)
- `5`: 5号位驱动盘 (生攻防/穿透率/属性加成)
- `6`: 6号位驱动盘 (生攻防/冲击力/异常掌控/能量自动回复)
## 使用示例

### 请求示例
```javascript
const response = await fetch("https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool/user/batch_avatar_detail_v2?uid=10946813&region=prod_gf_cn", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-rpc-lang": "zh-cn",
    // ... 其他必要headers
  },
  body: JSON.stringify({
    "avatar_list": [
      {
        "avatar_id": 1021,
        "is_teaser": false,
        "teaser_need_weapon": false,
        "teaser_sp_skill": false
      }
    ]
  })
});
```

### 响应处理示例
```javascript
const data = await response.json();
if (data.retcode === 0) {
  const characters = data.data.list;
  characters.forEach(char => {
    console.log(`角色: ${char.avatar.name_mi18n}`);
    console.log(`等级: ${char.avatar.level}`);
    console.log(`属性: ${getElementName(char.avatar.element_type)}`);
    console.log(`职业: ${getProfessionName(char.avatar.avatar_profession)}`);
  });
}
```

## 注意事项

1. **认证要求**: 需要有效的cookie信息进行用户认证
2. **设备指纹**: 需要提供有效的device_fp和device_id
3. **请求频率**: 建议控制请求频率，避免触发反爬机制
4. **数据时效性**: 角色数据会随游戏更新而变化
5. **区域限制**: 不同服务器区域的数据格式可能略有差异

## 错误处理

建议在实际使用中添加适当的错误处理和重试机制。