// 米哈游绝区零API客户端核心

import GM_fetch from '@trim21/gm-fetch';
import type {
  ApiResponse,
  UserInfo,
  DeviceInfo,
  DeviceFpRequest,
  UserGameRolesResponse,
  LoginAccountResponse,
  DeviceFpRes
} from './types';
import { logger } from '../../utils/logger';
import { GM } from '$';

// 设备信息存储key
const DEVICE_INFO_KEY = 'zzz_device_info';

// 基础配置
export const NAP_CULTIVATE_TOOL_URL = 'https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool';
export const GAME_RECORD_URL = 'https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz';
export const DEVICE_FP_URL = 'https://public-data-api.mihoyo.com/device-fp/api/getFp';
const GAME_ROLE_URL = 'https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=nap_cn'
const NAP_TOEKN_URL = 'https://api-takumi.mihoyo.com/common/badge/v1/login/account'

// 初始化请求标记
let NapTokenInitialized = false;

// 用户信息缓存
let userInfoCache: UserInfo | null = null;

// 设备信息缓存，避免重复获取
let deviceInfoCache: DeviceInfo = {
  deviceId: generateUUID(),
  deviceFp: '0000000000000',
  timestamp: Date.now()
};
let deviceInfoPromise: Promise<DeviceInfo> | null = null;

const appVer = "2.85.1";
// UA请求头
const defaultHeaders = {
  'Accept': 'application/json',
  'User-Agent': `Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 miHoYoBBS/${appVer}`
};

// 异步获取device请求头
async function getZZZHeaderWithDevice(): Promise<Record<string, string>> {
  const deviceInfo = await getDeviceInfo();

  return {
    ...defaultHeaders,
    'Referer': 'https://act.mihoyo.com/',
    'x-rpc-app_version': appVer,
    'x-rpc-client_type': "5",
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

  logger.debug('🔄 初始化 nap_token cookie...');

  try {
    // 第一步：获取用户游戏角色信息
    const rolesResponse = await GM_fetch(GAME_ROLE_URL, {
      method: 'GET',
      headers: defaultHeaders,
    });

    if (!rolesResponse.ok) {
      throw new Error(`获取用户角色失败: HTTP ${rolesResponse.status}`);
    }

    const rolesData = await rolesResponse.json() as ApiResponse<UserGameRolesResponse>;

    if (rolesData.retcode !== 0) {
      throw new Error(`获取用户角色失败: ${rolesData.message}`);
    }

    if (!rolesData.data?.list || rolesData.data.list.length === 0) {
      throw new Error('未找到绝区零游戏角色');
    }

    // 获取第一个角色信息
    const roleInfo = rolesData.data.list[0];
    logger.debug(`🎮 找到角色: ${roleInfo.nickname} (UID: ${roleInfo.game_uid}, 等级: ${roleInfo.level})`);

    // 第二步：使用角色信息设置 nap_token
    const tokenResponse = await GM_fetch(NAP_TOEKN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders
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

    const tokenData = await tokenResponse.json() as ApiResponse<LoginAccountResponse>;

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

    logger.debug('✅ nap_token cookie 初始化完成');
    logger.info(`👤 用户信息: ${userInfoCache.nickname} (UID: ${userInfoCache.uid}, 等级: ${userInfoCache.level})`);

    NapTokenInitialized = true;
  } catch (error) {
    logger.error('❌ 初始化 nap_token 失败:', error);
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
export async function request<T = unknown>(
  endpoint: string,
  baseUrl: string,
  options: {
    method?: 'GET' | 'POST';
    params?: Record<string, string | number>;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', params = {}, body, headers = {} } = options;

  // 如果是 NAP_CULTIVATE_TOOL_URL 的请求，先进行初始化
  if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
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

  // 设备指纹相关错误码，需要刷新设备指纹并重试
  const deviceFpErrorCodes = [1034, 5003, 10035, 10041, 10053];

  // 执行请求的内部函数
  const executeRequest = async (isRetry = false): Promise<ApiResponse<T>> => {
    // 异步获取并合并请求头
    const zzzHeaders = await getZZZHeaderWithDevice();
    const finalHeaders = {
      ...zzzHeaders,
      ...headers
    };

    if (finalHeaders['x-rpc-device_fp'] === '0000000000000') {
      throw new Error('❌ 设备指纹有误，请检查');
    }

    logger.debug(`🌐 请求 ${method} ${url}${isRetry ? ' (重试)' : ''}`);

    try {
      const payload = [url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined
      }] as const;
      const response = await GM_fetch(...payload);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as ApiResponse<T>;

      if (data.retcode !== 0) {
        // 检查是否为设备指纹相关错误码
        if (deviceFpErrorCodes.includes(data.retcode) && !isRetry) {
          logger.warn(`⚠️ 检测到设备指纹错误码 ${data.retcode}: ${data.message}，正在刷新设备指纹...`);

          try {
            // 刷新设备指纹
            await getDeviceFingerprint();
            logger.debug('✅ 设备指纹刷新完成，准备重试请求');

            // 重试请求
            return await executeRequest(true);
          } catch (fpError) {
            logger.error('❌ 设备指纹刷新失败:', fpError);
            throw new Error(`设备指纹刷新失败，原始错误: API Error ${data.retcode}: ${data.message}`);
          }
        }

        // 打印请求和响应

        logger.error('❌ 请求失败\n请求:', payload, '\n响应：', response, data);
        throw new Error(`API Error ${data.retcode}: ${data.message}`);
      }

      logger.debug(`✅ 请求成功: ${payload[0]}, ${data.retcode}: ${data.message}`);
      return data;

    } catch (error) {
      // 如果是我们抛出的 API Error，直接重新抛出
      if (error instanceof Error && error.message.includes('API Error')) {
        throw error;
      }

      logger.error(`❌ 请求失败:`, error);
      throw error;
    }
  };

  // 执行请求
  return await executeRequest();
}

/**
 * 获取设备指纹并更新缓存
 * 使用缓存中的设备信息进行请求，并将获取到的指纹更新到缓存中
 */
export async function getDeviceFingerprint(): Promise<void> {
  // 尝试获取米游社deviceId
  const mysCookies = await GM.cookie.list({ url: 'https://do-not-exist.mihoyo.com/' });
  if (mysCookies.length !== 0) {
    for (const ck of mysCookies) {
      if (ck.name === '_MHYUUID') {
        logger.debug('🔐 从米游社获取到UUID', ck.value);
        deviceInfoCache.deviceId = ck.value;
      }
    }
  }

  if (!deviceInfoCache) {
    throw new Error('设备信息缓存未初始化');
  }
  const productName = generateProductName();
  const requestBody: DeviceFpRequest = {
    device_id: generateSeedId(),
    seed_id: generateUUID(),
    seed_time: Date.now().toString(),
    platform: '2',
    device_fp: deviceInfoCache.deviceFp,
    app_name: 'bbs_cn',
    ext_fields: `{"proxyStatus":0,"isRoot":0,"romCapacity":"512","deviceName":"Pixel5","productName":"${productName}","romRemain":"512","hostname":"db1ba5f7c000000","screenSize":"1080x2400","isTablet":0,"aaid":"","model":"Pixel5","brand":"google","hardware":"windows_x86_64","deviceType":"redfin","devId":"REL","serialNumber":"unknown","sdCapacity":125943,"buildTime":"1704316741000","buildUser":"cloudtest","simState":0,"ramRemain":"124603","appUpdateTimeDiff":1716369357492,"deviceInfo":"google\\/${productName}\\/redfin:13\\/TQ3A.230901.001\\/2311.40000.5.0:user\\/release-keys","vaid":"","buildType":"user","sdkVersion":"33","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"chargeStatus":3,"manufacturer":"Google","emulatorStatus":0,"appMemory":"512","osVersion":"13","vendor":"unknown","accelerometer":"","sdRemain":123276,"buildTags":"release-keys","packageName":"com.mihoyo.hyperion","networkType":"WiFi","oaid":"","debugStatus":1,"ramCapacity":"125943","magnetometer":"","display":"TQ3A.230901.001","appInstallTimeDiff":1706444666737,"packageVersion":"2.20.2","gyroscope":"","batteryStatus":85,"hasKeyboard":10,"board":"windows"}`,
    bbs_device_id: deviceInfoCache.deviceId
  };

  logger.debug(`🔐 获取设备指纹，设备ID: ${deviceInfoCache.deviceId}`);

  try {
    const response = await GM_fetch(`${DEVICE_FP_URL}`, {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as ApiResponse<DeviceFpRes>;

    if (data.retcode !== 0 || data.data.code !== 200) {
      throw new Error(`设备指纹获取失败 ${data.retcode}: ${data.message}`);
    }

    // 更新缓存中的设备指纹
    deviceInfoCache.deviceFp = data.data.device_fp;
    deviceInfoCache.timestamp = Date.now();

    // 保存到localStorage
    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfoCache));

    logger.debug(`✅ 设备指纹获取成功并更新缓存: ${data.data.device_fp}`);

  } catch (error) {
    logger.error(`❌ 设备指纹获取失败:`, error);
    throw error;
  }
}

/**
 * 生成产品名称 (6位大写字母数字组合)
 * @returns 产品名称字符串
 */
function generateProductName(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 生成 UUID v4 字符串 (带连字符格式)
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
 * 生成 Seed ID (16位十六进制字符串，对齐 C# 版本)
 * @returns 16位十六进制字符串
 */
function generateSeedId(): string {
  return generateHexString(16);
}

/**
 * 生成指定长度的十六进制字符串 (对齐 C# 版本的随机生成逻辑)
 * @param length 字符串长度
 * @returns 十六进制字符串
 */
export function generateHexString(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));

  // 使用 crypto.getRandomValues() 如果可用
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // 回退方案：使用 Math.random()
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // 转换为十六进制字符串
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

  // 如果需要奇数长度，截取到指定长度
  return hex.substring(0, length);
}

/**
 * 获取或生成设备信息（异步）
 * @param refresh 可选参数，是否强制刷新设备指纹。如果未定义，则根据时间戳自动判断是否需要刷新
 */
async function getDeviceInfo(refresh?: boolean): Promise<DeviceInfo> {
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
        const storedDeviceInfo: DeviceInfo = JSON.parse(stored);
        logger.debug('📱 从localStorage获取设备信息:', storedDeviceInfo);

        // 更新缓存
        deviceInfoCache = storedDeviceInfo;
      } catch (error) {
        logger.warn('⚠️ 解析设备信息失败，将重新生成:', error);
      }
    }

    // 检查是否需要刷新设备指纹
    let needRefresh = false;

    if (refresh === true) {
      // 强制刷新
      needRefresh = true;
      logger.debug('📱 强制刷新设备指纹');
    } else if (refresh === false) {
      // 强制不刷新
      needRefresh = false;
      logger.debug('📱 跳过设备指纹刷新');
    } else {
      // 自动判断是否需要刷新（根据时间戳）
      const now = Date.now();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3天的毫秒数

      if (deviceInfoCache.deviceFp === '0000000000000') {
        // 如果设备指纹是初始值，需要获取真实指纹
        needRefresh = true;
        logger.debug('📱 设备指纹为初始值，需要获取真实指纹');
      } else if (now - deviceInfoCache.timestamp > threeDaysInMs) {
        // 如果超过3天，需要刷新
        needRefresh = true;
        logger.debug('📱 设备信息超过3天，需要刷新');
      } else {
        logger.debug('📱 设备信息仍在有效期内');
      }
    }

    // 如果需要刷新设备指纹
    if (needRefresh) {
      try {
        await getDeviceFingerprint();
        logger.debug('✅ 设备指纹刷新完成');
      } catch (error) {
        logger.error('❌ 设备指纹刷新失败:', error);
        throw error;
      }
    }

    return deviceInfoCache;
  })();

  const result = await deviceInfoPromise;
  deviceInfoPromise = null; // 清除 Promise 缓存
  return result;
}

// 设备和用户信息管理函数
export function getUserInfo(): UserInfo | null {
  return userInfoCache;
}

export function clearUserInfo(): void {
  userInfoCache = null;
  NapTokenInitialized = false;
  logger.debug('🗑️ 已清除用户信息缓存');
}

export async function initializeUserInfo(): Promise<UserInfo | null> {
  await ensureUserInfo();
  return userInfoCache;
}

export async function getCurrentDeviceInfo(): Promise<DeviceInfo> {
  return await getDeviceInfo();
}

export async function refreshDeviceInfo(): Promise<void> {
  logger.debug('🔄 开始刷新设备信息...');

  // 强制刷新设备信息
  const newDeviceInfo = await getDeviceInfo(true);

  logger.debug('✅ 设备信息刷新完成:', newDeviceInfo);
}

export function resetNapTokenlInitialization(): void {
  NapTokenInitialized = false;
  logger.debug('🔄 已重置 NapToken 初始化状态');
}