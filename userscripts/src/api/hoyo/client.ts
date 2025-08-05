// 米哈游绝区零API客户端核心

import GM_fetch from '@trim21/gm-fetch';
import type {
  ApiResponse,
  UserInfo,
  DeviceInfo,
  DeviceFpRequest
} from './types';

// 设备信息存储key
const DEVICE_INFO_KEY = 'zzz_device_info';

// 基础配置
export const AVATAR_URL = 'https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool';
export const GAME_RECORD_URL = 'https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz';
export const DEVICE_FP_URL = 'https://public-data-api.mihoyo.com/device-fp/api';

// 初始化请求标记
let NapTokenInitialized = false;

// 用户信息缓存
let userInfoCache: UserInfo | null = null;

// 设备信息缓存，避免重复获取
let deviceInfoCache: DeviceInfo | null = null;
let deviceInfoPromise: Promise<DeviceInfo> | null = null;

// 异步获取通用请求头
async function getDefaultHeaders(): Promise<Record<string, string>> {
  const deviceInfo = await getDeviceInfo();

  return {
    'content-type': 'application/json',
    'x-rpc-device_fp': deviceInfo.deviceFp,
    'x-rpc-device_id': deviceInfo.deviceId,
  };
}

/**
 * 获取nap_token并缓存用户信息
 */
async function initializeNapToken(): Promise<void> {
  if (NapTokenInitialized) {
    return;
  }

  console.log('🔄 初始化 nap_token cookie...');

  try {
    // 第一步：获取用户游戏角色信息
    const rolesResponse = await GM_fetch('https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=nap_cn', {
      method: 'GET'
    });

    if (!rolesResponse.ok) {
      throw new Error(`获取用户角色失败: HTTP ${rolesResponse.status}`);
    }

    const rolesData = await rolesResponse.json();

    if (rolesData.retcode !== 0) {
      throw new Error(`获取用户角色失败: ${rolesData.message}`);
    }

    if (!rolesData.data?.list || rolesData.data.list.length === 0) {
      throw new Error('未找到绝区零游戏角色');
    }

    // 获取第一个角色信息
    const roleInfo = rolesData.data.list[0];
    console.log(`🎮 找到角色: ${roleInfo.nickname} (UID: ${roleInfo.game_uid}, 等级: ${roleInfo.level})`);

    // 第二步：使用角色信息设置 nap_token
    const tokenResponse = await GM_fetch('https://api-takumi.mihoyo.com/common/badge/v1/login/account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        region: roleInfo.region,
        uid: roleInfo.game_uid,
        game_biz: roleInfo.game_biz
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`设置 nap_token 失败: HTTP ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.retcode !== 0) {
      throw new Error(`设置 nap_token 失败: ${tokenData.message}`);
    }

    // 缓存用户信息
    userInfoCache = {
      uid: roleInfo.game_uid,
      nickname: roleInfo.nickname,
      level: roleInfo.level,
      region: roleInfo.region,
      accountId: roleInfo.game_uid // 使用 game_uid 作为 accountId
    };

    console.log('✅ nap_token cookie 初始化完成');
    console.log(`👤 用户信息: ${userInfoCache.nickname} (UID: ${userInfoCache.uid}, 等级: ${userInfoCache.level})`);

    NapTokenInitialized = true;
  } catch (error) {
    console.error('❌ 初始化 nap_token 失败:', error);
    // 即使初始化失败也标记为已尝试，避免重复请求
    // NapTokenInitialized = true;
    throw error;
  }
}
/**
 * 确保用户信息已初始化
 * 如果没有用户信息缓存，会自动调用初始化
 */
export async function ensureUserInfo(): Promise<void> {
  if (!userInfoCache) {
    await initializeNapToken();
  }
}

// 通用请求函数
export async function request<T = any>(
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

  // 如果是 AVATAR_URL 的请求，先进行初始化
  if (baseUrl === AVATAR_URL) {
    await initializeNapToken();
  }

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

// 设备和用户信息管理函数
export function getUserInfo(): UserInfo | null {
  return userInfoCache;
}

export function clearUserInfo(): void {
  userInfoCache = null;
  NapTokenInitialized = false;
  console.log('🗑️ 已清除用户信息缓存');
}

export async function initializeUserInfo(): Promise<UserInfo | null> {
  await ensureUserInfo();
  return userInfoCache;
}

export function clearDeviceInfo(): void {
  localStorage.removeItem(DEVICE_INFO_KEY);
  deviceInfoCache = null;
  deviceInfoPromise = null;
  NapTokenInitialized = false;
  console.log('🗑️ 已清除localStorage设备信息和缓存');
}

export async function getCurrentDeviceInfo(): Promise<DeviceInfo> {
  return await getDeviceInfo();
}

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
    deviceInfoCache = updatedInfo;
    console.log('✅ 设备指纹刷新完成:', updatedInfo);
  } catch (error) {
    console.error('❌ 刷新设备指纹失败:', error);
    throw error;
  }
}

export function resetNapTokenlInitialization(): void {
  NapTokenInitialized = false;
  console.log('🔄 已重置 AVATAR_URL 初始化状态');
}