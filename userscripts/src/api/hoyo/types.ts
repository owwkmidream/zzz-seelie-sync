// 米哈游绝区零API类型定义

// 用户信息缓存
export interface UserInfo {
  uid: string;
  nickname: string;
  level: number;
  region: string;
  accountId: string;
}

// 设备信息接口
export interface DeviceInfo {
  deviceId: string;
  deviceFp: string;
  timestamp: number; // 添加时间戳，用于判断是否需要更新
}

export interface ApiResponse<T = any> {
  retcode: number;
  message: string;
  data: T;
}

export interface AvatarBasicInfo {
  avatar: Avatar;
  unlocked: boolean;
  is_up: boolean;
  is_teaser: boolean;
  is_top: boolean;
}

export interface Avatar {
  id: number;
  level: number;
  name_mi18n: string;
  full_name_mi18n: string;
  element_type: number;
  camp_name_mi18n: string;
  avatar_profession: number;
  rarity: string;
  group_icon_path: string;
  hollow_icon_path: string;
  rank: number;
  sub_element_type: number;
  awaken_state: string;
  promotes?: number;
  signature_weapon_id?: number;
  unlock?: boolean;
}

export interface AvatarDetailRequest {
  avatar_id: number;
  is_teaser: boolean;
  teaser_need_weapon: boolean;
  teaser_sp_skill: boolean;
}

// 绝区零体力信息类型定义
export interface EnergyInfo {
  progress: {
    max: number;
    current: number;
  };
  restore: number;
  day_type: number;
  hour: number;
  minute: number;
}

export interface GameNoteData {
  energy: EnergyInfo;
  // 可以根据实际返回数据添加更多字段
}

// 设备指纹相关类型定义
export interface DeviceFpRequest {
  device_id: string;
  seed_id: string;
  seed_time: string;
  platform: string;
  device_fp: string;
  app_name: string;
  ext_fields: string;
}

export interface Property {
  property_name: string;
  property_id: number;
  base: string;
  add: string;
  final: string;
  final_val: string;
}

export interface Skill {
  level: number;
  skill_type: number;
  items: SkillItem[];
}

export interface SkillItem {
  title: string;
  text: string;
  awaken: boolean;
}

export interface Rank {
  id: number;
  name: string;
  desc: string;
  pos: number;
  is_unlocked: boolean;
}export
  interface Equipment {
  id: number;
  level: number;
  name: string;
  icon: string;
  rarity: string;
  properties: Property[];
  main_properties: Property[];
  equip_suit: EquipSuit;
  equipment_type: number;
  invalid_property_cnt: number;
  all_hit: boolean;
}

export interface EquipSuit {
  suit_id: number;
  name: string;
  own: number;
  desc1: string;
  desc2: string;
  icon: string;
  cnt: number;
  rarity: string;
}

export interface Weapon {
  id: number;
  level: number;
  name: string;
  star: number;
  icon: string;
  rarity: string;
  properties: Property[];
  main_properties: Property[];
  talent_title: string;
  talent_content: string;
  profession: number;
}

export interface AvatarDetail {
  avatar: Avatar;
  properties: Property[];
  skills: Skill[];
  ranks: Rank[];
  equip: Equipment[];
  weapon: Weapon;
  plan?: any; // 配装方案，结构复杂，可根据需要详细定义
}

// 枚举定义
export enum ElementType {
  Physical = 200,
  Fire = 201,
  Ice = 202,
  Electric = 203,
  Ether = 205
} export
  enum AvatarProfession {
  Attack = 1,
  Stun = 2,
  Anomaly = 3,
  Support = 4,
  Defense = 5,
  Rupture = 6
}

export enum SkillType {
  NormalAttack = 0,
  SpecialSkill = 1,
  Dodge = 2,
  Chain = 3,
  CorePassive = 5,
  SupportSkill = 6
}

export enum EquipmentType {
  Slot1 = 1, // 生命值主属性
  Slot2 = 2, // 攻击力主属性
  Slot3 = 3, // 防御力主属性
  Slot4 = 4, // 生攻防/异常精通/暴击率/暴击伤害
  Slot5 = 5, // 生攻防/穿透率/属性加成
  Slot6 = 6  // 生攻防/冲击力/异常掌控/能量自动回复
}