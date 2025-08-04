// 米哈游绝区零API请求工具

import GM_fetch from '@trim21/gm-fetch';

// 本地存储键名
const STORAGE_KEYS = {
  DEVICE_ID: 'zzz_device_id',
  DEVICE_FP: 'zzz_device_fp'
} as const;

// 基础配置
const AVATAR_URL = 'https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool';
const GAME_RECORD_URL = 'https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz';
const DEVICE_FP_URL = 'https://public-data-api.mihoyo.com/device-fp/api';

// 通用请求头
const DEFAULT_HEADERS = {
  'content-type': 'application/json',
  'x-rpc-device_fp': '38d80df42ad79',
  'x-rpc-device_id': '4ce52304-b4d5-48b4-88a3-f471c7e1164c',
};

// 类型定义
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
}

export interface Equipment {
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
}

export enum AvatarProfession {
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

// 通用请求函数
async function request<T = any>(
  endpoint: string,
  baseUrl: string,
  options: {
    method?: 'GET' | 'POST';
    params?: Record<string, string | number>;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', params = {}, body, headers = {} } = options;

  // 构建URL
  let url = `${baseUrl}${endpoint}`;
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  // 合并请求头
  const finalHeaders = {
    ...DEFAULT_HEADERS,
    ...headers
  };

  console.log(`🌐 请求 ${method} ${url}`);

  try {
    const response = await GM_fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<T> = await response.json();

    if (data.retcode !== 0) {
      throw new Error(`API Error ${data.retcode}: ${data.message}`);
    }

    console.log(`✅ 请求成功:`, data.message);
    return data;

  } catch (error) {
    console.error(`❌ 请求失败:`, error);
    throw error;
  }
}

// API 方法

/**
 * 获取角色基础列表
 * @param uid 用户UID
 * @param region 服务器区域，默认国服
 */
export async function getAvatarBasicList(
  uid: string | number,
  region: string = 'prod_gf_cn'
): Promise<AvatarBasicInfo[]> {
  const response = await request<{ list: AvatarBasicInfo[] }>('/user/avatar_basic_list', AVATAR_URL, {
    method: 'GET',
    params: { uid: String(uid), region }
  });

  return response.data.list;
}

/**
 * 批量获取角色详细信息
 * @param uid 用户UID
 * @param avatarList 角色请求列表
 * @param region 服务器区域，默认国服
 */
export async function batchGetAvatarDetail(
  uid: string | number,
  avatarList: AvatarDetailRequest[],
  region: string = 'prod_gf_cn'
): Promise<AvatarDetail[]> {
  const response = await request<{ list: AvatarDetail[] }>('/user/batch_avatar_detail_v2', AVATAR_URL, {
    method: 'POST',
    params: { uid: String(uid), region },
    body: { avatar_list: avatarList }
  });

  return response.data.list;
}

/**
 * 获取单个角色详细信息
 * @param uid 用户UID
 * @param avatarId 角色ID
 * @param region 服务器区域，默认国服
 * @param options 额外选项
 */
export async function getAvatarDetail(
  uid: string | number,
  avatarId: number,
  region: string = 'prod_gf_cn',
  options: {
    is_teaser?: boolean;
    teaser_need_weapon?: boolean;
    teaser_sp_skill?: boolean;
  } = {}
): Promise<AvatarDetail> {
  const {
    is_teaser = false,
    teaser_need_weapon = false,
    teaser_sp_skill = false
  } = options;

  const avatarList: AvatarDetailRequest[] = [{
    avatar_id: avatarId,
    is_teaser,
    teaser_need_weapon,
    teaser_sp_skill
  }];

  const details = await batchGetAvatarDetail(uid, avatarList, region);

  if (details.length === 0) {
    throw new Error(`未找到角色 ${avatarId} 的详细信息`);
  }

  return details[0];
}

/**
 * 获取绝区零游戏便笺信息（体力等）
 * @param roleId 角色ID
 * @param server 服务器，默认国服
 */
export async function getGameNote(
  roleId: string | number,
  server: string = 'prod_gf_cn'
): Promise<GameNoteData> {
  const response = await request<GameNoteData>('/note', GAME_RECORD_URL, {
    method: 'GET',
    params: {
      server,
      role_id: String(roleId)
    }
  });

  return response.data;
}

/**
 * 获取体力信息
 * @param roleId 角色ID
 * @param server 服务器，默认国服
 */
export async function getEnergyInfo(
  roleId: string | number,
  server: string = 'prod_gf_cn'
): Promise<EnergyInfo> {
  const gameNote = await getGameNote(roleId, server);
  return gameNote.energy;
}

/**
 * 获取设备指纹
 * @param deviceId 设备ID
 * @returns 设备指纹信息
 */
export async function getDeviceFingerprint(deviceId: string): Promise<string> {

  const requestBody: DeviceFpRequest = {
    device_id: deviceId,
    seed_id: generateUUID(),
    seed_time: Date.now().toString(),
    platform: '4',
    device_fp: generateHexString(13),
    app_name: 'bbs_cn',
    ext_fields: JSON.stringify({
      userAgent: navigator.userAgent
    })
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  console.log(`🔐 获取设备指纹，设备ID: ${deviceId}`);

  try {
    const response = await GM_fetch(`${DEVICE_FP_URL}/getFp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiResponse<{ device_fp: string }> = await response.json();

    if (data.retcode !== 0) {
      throw new Error(`设备指纹获取失败 ${data.retcode}: ${data.message}`);
    }

    console.log(`✅ 设备指纹获取成功: ${data.data.device_fp}`);
    return data.data.device_fp;

  } catch (error) {
    console.error(`❌ 设备指纹获取失败:`, error);
    throw error;
  }
}

// 工具函数

/**
 * 生成 UUID v4 字符串
 * @returns UUID v4 格式的字符串
 */
export function generateUUID(): string {
  // 使用 crypto.randomUUID() 如果可用（现代浏览器）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // 回退方案：手动生成 UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成指定长度的十六进制字符串
 * @param length 字符串长度
 * @returns 十六进制字符串
 */
export function generateHexString(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 获取属性类型名称
 */
export function getElementName(elementType: number): string {
  const elementNames: Record<number, string> = {
    [ElementType.Physical]: '物理',
    [ElementType.Fire]: '火',
    [ElementType.Ice]: '冰',
    [ElementType.Electric]: '电',
    [ElementType.Ether]: '以太'
  };
  return elementNames[elementType] || '未知';
}

/**
 * 获取职业类型名称
 */
export function getProfessionName(profession: number): string {
  const professionNames: Record<number, string> = {
    [AvatarProfession.Attack]: '攻击',
    [AvatarProfession.Stun]: '击破',
    [AvatarProfession.Anomaly]: '异常',
    [AvatarProfession.Support]: '支援',
    [AvatarProfession.Defense]: '防护',
    [AvatarProfession.Rupture]: '命破'
  };
  return professionNames[profession] || '未知';
}

/**
 * 获取技能类型名称
 */
export function getSkillTypeName(skillType: number): string {
  const skillTypeNames: Record<number, string> = {
    [SkillType.NormalAttack]: '普通攻击',
    [SkillType.SpecialSkill]: '特殊技',
    [SkillType.Dodge]: '闪避技能',
    [SkillType.Chain]: '连携技',
    [SkillType.CorePassive]: '核心被动',
    [SkillType.SupportSkill]: '支援技能'
  };
  return skillTypeNames[skillType] || '未知技能';
}

/**
 * 获取装备位置名称
 */
export function getEquipmentSlotName(slotType: number): string {
  const slotNames: Record<number, string> = {
    [EquipmentType.Slot1]: '1号位驱动盘',
    [EquipmentType.Slot2]: '2号位驱动盘',
    [EquipmentType.Slot3]: '3号位驱动盘',
    [EquipmentType.Slot4]: '4号位驱动盘',
    [EquipmentType.Slot5]: '5号位驱动盘',
    [EquipmentType.Slot6]: '6号位驱动盘'
  };
  return slotNames[slotType] || '未知位置';
}

/**
 * 筛选已解锁的角色
 */
export function filterUnlockedAvatars(avatarList: AvatarBasicInfo[]): AvatarBasicInfo[] {
  return avatarList.filter(item => item.unlocked);
}

/**
 * 按属性分组角色
 */
export function groupAvatarsByElement(avatarList: AvatarBasicInfo[]): Record<string, AvatarBasicInfo[]> {
  const groups: Record<string, AvatarBasicInfo[]> = {};

  avatarList.forEach(item => {
    if (item.unlocked) {
      const elementName = getElementName(item.avatar.element_type);
      if (!groups[elementName]) {
        groups[elementName] = [];
      }
      groups[elementName].push(item);
    }
  });

  return groups;
}

/**
 * 按职业分组角色
 */
export function groupAvatarsByProfession(avatarList: AvatarBasicInfo[]): Record<string, AvatarBasicInfo[]> {
  const groups: Record<string, AvatarBasicInfo[]> = {};

  avatarList.forEach(item => {
    if (item.unlocked) {
      const professionName = getProfessionName(item.avatar.avatar_profession);
      if (!groups[professionName]) {
        groups[professionName] = [];
      }
      groups[professionName].push(item);
    }
  });

  return groups;
}

/**
 * 获取S级角色列表
 */
export function getSRankAvatars(avatarList: AvatarBasicInfo[]): AvatarBasicInfo[] {
  return avatarList.filter(item => item.unlocked && item.avatar.rarity === 'S');
}

/**
 * 获取A级角色列表
 */
export function getARankAvatars(avatarList: AvatarBasicInfo[]): AvatarBasicInfo[] {
  return avatarList.filter(item => item.unlocked && item.avatar.rarity === 'A');
}

/**
 * 格式化体力恢复时间
 * @param energy 体力信息
 */
export function formatEnergyRestoreTime(energy: EnergyInfo): string {
  const { hour, minute } = energy;
  if (hour === 0 && minute === 0) {
    return '体力已满';
  }
  return `${hour}小时${minute}分钟后恢复满`;
}

/**
 * 获取体力恢复进度百分比
 * @param energy 体力信息
 */
export function getEnergyProgress(energy: EnergyInfo): number {
  const { progress } = energy;
  return Math.round((progress.current / progress.max) * 100);
}

// 将主要函数挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).ZZZApi = {
    getAvatarBasicList,
    batchGetAvatarDetail,
    getAvatarDetail,
    getGameNote,
    getEnergyInfo,
    getDeviceFingerprint,
    generateUUID,
    generateHexString,
    getElementName,
    getProfessionName,
    getSkillTypeName,
    getEquipmentSlotName,
    filterUnlockedAvatars,
    groupAvatarsByElement,
    groupAvatarsByProfession,
    getSRankAvatars,
    getARankAvatars,
    formatEnergyRestoreTime,
    getEnergyProgress
  };
}