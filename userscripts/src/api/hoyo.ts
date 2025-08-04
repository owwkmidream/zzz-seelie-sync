// 米哈游绝区零API请求工具

import GM_fetch from '@trim21/gm-fetch';

// 设备信息存储key
const DEVICE_INFO_KEY = 'zzz_device_info';

// 基础配置
const AVATAR_URL = 'https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool';
const GAME_RECORD_URL = 'https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz';
const DEVICE_FP_URL = 'https://public-data-api.mihoyo.com/device-fp/api';

// 异步获取通用请求头
async function getDefaultHeaders(): Promise<Record<string, string>> {
  const deviceInfo = await getDeviceInfo();

  return {
    'content-type': 'application/json',
    'x-rpc-device_fp': deviceInfo.deviceFp,
    'x-rpc-device_id': deviceInfo.deviceId,
  };
}

// 类型定义

// 设备信息接口
interface DeviceInfo {
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

  // 异步获取并合并请求头
  const defaultHeaders = await getDefaultHeaders();
  const finalHeaders = {
    ...defaultHeaders,
    ...headers
  };

  if (finalHeaders['x-rpc-device_fp'] === '0000000000000') {
    throw new Error('❌ 设备指纹有误，请检查');
  }
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
  // 如果列表长度大于9，分批处理
  if (avatarList.length > 9) {
    const results: AvatarDetail[] = [];
    const batchSize = 9;

    for (let i = 0; i < avatarList.length; i += batchSize) {
      const batch = avatarList.slice(i, i + batchSize);
      const response = await request<{ list: AvatarDetail[] }>('/user/batch_avatar_detail_v2', AVATAR_URL, {
        method: 'POST',
        params: { uid: String(uid), region },
        body: { avatar_list: batch }
      });
      results.push(...response.data.list);
    }

    return results;
  }

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
    platform: '2',
    device_fp: generateHexString(13),
    app_name: 'bbs_cn',
    ext_fields: `{"proxyStatus":0,"isRoot":0,"romCapacity":"512","deviceName":"Pixel5","productName":"${generateHexString(6).toUpperCase()}","romRemain":"512","hostname":"db1ba5f7c000000","screenSize":"1080x2400","isTablet":0,"aaid":"","model":"Pixel5","brand":"google","hardware":"windows_x86_64","deviceType":"redfin","devId":"REL","serialNumber":"unknown","sdCapacity":125943,"buildTime":"1704316741000","buildUser":"cloudtest","simState":0,"ramRemain":"124603","appUpdateTimeDiff":1716369357492,"deviceInfo":"google\\/${generateHexString(6).toUpperCase()}\\/redfin:13\\/TQ3A.230901.001\\/2311.40000.5.0:user\\/release-keys","vaid":"","buildType":"user","sdkVersion":"33","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"chargeStatus":3,"manufacturer":"Google","emulatorStatus":0,"appMemory":"512","osVersion":"13","vendor":"unknown","accelerometer":"","sdRemain":123276,"buildTags":"release-keys","packageName":"com.mihoyo.hyperion","networkType":"WiFi","oaid":"","debugStatus":1,"ramCapacity":"125943","magnetometer":"","display":"TQ3A.230901.001","appInstallTimeDiff":1706444666737,"packageVersion":"2.20.2","gyroscope":"","batteryStatus":85,"hasKeyboard":10,"board":"windows"}`
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

// 设备信息缓存，避免重复获取
let deviceInfoCache: DeviceInfo | null = null;
let deviceInfoPromise: Promise<DeviceInfo> | null = null;

/**
 * 获取或生成设备信息（异步）
 */
async function getDeviceInfo(): Promise<DeviceInfo> {
  // 如果已有缓存，直接返回
  if (deviceInfoCache) {
    return deviceInfoCache;
  }

  // 如果正在获取中，等待现有的 Promise
  if (deviceInfoPromise) {
    return deviceInfoPromise;
  }

  // 创建新的获取 Promise
  deviceInfoPromise = (async () => {
    // 尝试从localStorage获取完整设备信息
    const stored = localStorage.getItem(DEVICE_INFO_KEY);
    if (stored) {
      try {
        const deviceInfo: DeviceInfo = JSON.parse(stored);
        console.log('📱 从localStorage获取设备信息:', deviceInfo);

        // 检查设备指纹是否有效
        if (deviceInfo.deviceFp && deviceInfo.deviceFp !== '0000000000000') {
          deviceInfoCache = deviceInfo;
          return deviceInfo;
        }
      } catch (error) {
        console.warn('⚠️ 解析设备信息失败，将重新生成:', error);
      }
    }

    // 生成新的设备信息
    const newDeviceId = generateUUID();
    console.log('🔄 生成新设备ID:', newDeviceId);

    try {
      // 异步获取真实设备指纹
      const realFp = await getDeviceFingerprint(newDeviceId);

      const deviceInfo: DeviceInfo = {
        deviceId: newDeviceId,
        deviceFp: realFp,
        timestamp: Date.now()
      };

      // 保存到localStorage
      localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
      console.log('📱 生成新设备信息:', deviceInfo);

      deviceInfoCache = deviceInfo;
      return deviceInfo;
    } catch (error) {
      console.error('❌ 获取设备指纹失败:', error);

      // 如果获取失败，使用临时设备信息
      const fallbackInfo: DeviceInfo = {
        deviceId: newDeviceId,
        deviceFp: '0000000000000',
        timestamp: Date.now()
      };

      deviceInfoCache = fallbackInfo;
      return fallbackInfo;
    }
  })();

  return deviceInfoPromise;
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

/**
 * 清除本地存储的设备信息（用于重置）
 */
export function clearDeviceInfo(): void {
  localStorage.removeItem(DEVICE_INFO_KEY);
  // 清除缓存
  deviceInfoCache = null;
  deviceInfoPromise = null;
  console.log('🗑️ 已清除localStorage设备信息和缓存');
}

/**
 * 获取当前设备信息（用于调试）
 */
export async function getCurrentDeviceInfo(): Promise<DeviceInfo> {
  return await getDeviceInfo();
}

/**
 * 强制刷新设备指纹
 */
export async function refreshDeviceFingerprint(): Promise<void> {
  const deviceInfo = await getDeviceInfo();
  console.log('🔄 开始刷新设备指纹...');

  try {
    const newFp = await getDeviceFingerprint(deviceInfo.deviceId);
    const updatedInfo: DeviceInfo = {
      ...deviceInfo,
      deviceFp: newFp,
      timestamp: Date.now()
    };

    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(updatedInfo));
    // 更新缓存
    deviceInfoCache = updatedInfo;
    console.log('✅ 设备指纹刷新完成:', updatedInfo);
  } catch (error) {
    console.error('❌ 刷新设备指纹失败:', error);
    throw error;
  }
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
    getEnergyProgress,
    clearDeviceInfo,
    getCurrentDeviceInfo,
    refreshDeviceFingerprint
  };
}