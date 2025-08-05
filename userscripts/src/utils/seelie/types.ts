// Seelie 相关类型定义

/**
 * 树脂数据输入格式
 */
export interface ResinDataInput {
  progress: {
    max: number;
    current: number;
  };
  restore: number;
  day_type: number;
  hour: number;
  minute: number;
}

/**
 * AccountResin 格式
 */
export interface AccountResin {
  amount: number;
  time: string;
}

/**
 * 角色属性信息
 */
export interface CharacterProperty {
  property_name: string;
  property_id: number;
  base: string;
  add: string;
  final: string;
  final_val: string;
}

/**
 * 角色技能信息
 */
export interface CharacterSkill {
  level: number;
  skill_type: number;
  items: Array<{
    title: string;
    text: string;
    awaken: boolean;
  }>;
}

/**
 * 武器属性信息
 */
export interface WeaponProperty {
  property_name: string;
  property_id: number;
  base: string;
  level: number;
  valid: boolean;
  system_id: number;
  add: number;
}

/**
 * 武器数据
 */
export interface WeaponData {
  id: number;
  level: number;
  name: string;
  star: number;
  icon: string;
  rarity: string;
  properties: WeaponProperty[];
  main_properties: WeaponProperty[];
  talent_title: string;
  talent_content: string;
  profession: number;
}

/**
 * 角色数据输入格式
 */
export interface CharacterDataInput {
  avatar: {
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
    properties: CharacterProperty[];
    skills: CharacterSkill[];
    rank: number;
    ranks: Array<{
      id: number;
      name: string;
      desc: string;
      pos: number;
      is_unlocked: boolean;
    }>;
    sub_element_type: number;
    signature_weapon_id: number;
    awaken_state: string;
    skill_upgrade: {
      first: number[];
      second: number[];
      third: number[];
    };
    promotes: number;
    unlock: boolean;
  };
  weapon?: WeaponData;
}

/**
 * 角色统计数据
 */
export interface CharacterStats {
  id: number;
  name: string;
  base: number;
  growth: number;
  core: number[];
  ascHP: number[];
}

/**
 * 武器统计数据通用配置
 */
export interface WeaponStatsCommon {
  ascRate: number[];
  rate: number[];
}

/**
 * 武器信息
 */
export interface WeaponInfo {
  id: number;
  tier: number;
  style: string;
  dim_hash: string;
  craftable?: boolean;
}

/**
 * 角色信息
 */
export interface CharacterInfo {
  id: number;
  release: string;
  tier: number;
  attribute: string;
  style: string;
  faction: string;
  boss: string;
  boss_weekly: string;
  dim_hash: string;
}

/**
 * 目标数据格式
 */
export interface Goal {
  type: string;
  character: string;
  cons?: number;
  weapon?: string;
  current: {
    level: number;
    asc: number;
    craft?: number;
  };
  goal: {
    level: number;
    asc: number;
    craft?: number;
  };
  [key: string]: any; // 用于天赋数据
}

/**
 * 同步结果统计
 */
export interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * 批量同步结果统计
 */
export interface BatchSyncResult extends SyncResult {
  total: number;
  details: Array<{ character: string; result: SyncResult }>;
}

/**
 * Toast 类型
 */
export type ToastType = 'error' | 'warning' | 'success' | '';

/**
 * Seelie 统计数据结构
 */
export interface SeelieStatsData {
  charactersStats: CharacterStats[];
  weaponsStats: { [weaponId: string]: number };
  weaponsStatsCommon: WeaponStatsCommon;
}

/**
 * Seelie 语言数据结构（根据实际数据结构定义）
 */
export interface SeelieLanguageData {
  [key: string]: unknown; // 由于语言数据结构复杂且可变，使用 unknown 类型
}

/**
 * Seelie 完整数据结构
 */
export interface SeelieData {
  languageData: SeelieLanguageData;
  statsData: SeelieStatsData;
}