import GM_fetch from '@/utils/gmFetch';
import type {
  ApiResponse,
  DeviceInfo,
  DeviceFpRes
} from './types';
import { logger } from '../../utils/logger';
import { GM } from '$';
import {
  APP_VERSION,
  DEVICE_FP_URL,
  defaultHeaders
} from './config';
import { generateUUID } from './deviceUtils';
import { buildDeviceFpRequest } from './devicePayload';
import { ApiResponseError, HttpRequestError } from './errors';

// 设备信息存储 key
const DEVICE_INFO_KEY = 'zzz_device_info';

// 设备信息缓存，避免重复获取
let deviceInfoCache: DeviceInfo = {
  deviceId: generateUUID(),
  deviceFp: '0000000000000',
  timestamp: Date.now()
};
let deviceInfoPromise: Promise<DeviceInfo> | null = null;

// 异步获取 device 请求头
export async function getZZZHeaderWithDevice(): Promise<Record<string, string>> {
  const deviceInfo = await getDeviceInfo();

  return {
    ...defaultHeaders,
    Referer: 'https://act.mihoyo.com/',
    'x-rpc-app_version': APP_VERSION,
    'x-rpc-client_type': '5',
    'x-rpc-device_fp': deviceInfo.deviceFp,
    'x-rpc-device_id': deviceInfo.deviceId
  };
}

/**
 * 获取设备指纹并更新缓存
 * 使用缓存中的设备信息进行请求，并将获取到的指纹更新到缓存中
 */
export async function getDeviceFingerprint(): Promise<void> {
  // 尝试获取米游社 deviceId
  const mysCookies = await GM.cookie.list({ url: 'https://do-not-exist.mihoyo.com/' });
  if (mysCookies.length !== 0) {
    for (const ck of mysCookies) {
      if (ck.name === '_MHYUUID') {
        logger.debug('🔐 从米游社获取到UUID', ck.value);
        deviceInfoCache.deviceId = ck.value;
      }
    }
  }

  const requestBody = buildDeviceFpRequest(deviceInfoCache.deviceId, deviceInfoCache.deviceFp);

  logger.info(`🔐 开始获取设备指纹，设备ID: ${deviceInfoCache.deviceId}`);

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
      throw new HttpRequestError(response.status, response.statusText, '设备指纹获取失败');
    }

    const data = await response.json() as ApiResponse<DeviceFpRes>;

    if (data.retcode !== 0 || data.data.code !== 200) {
      throw new ApiResponseError(data.retcode, data.message, '设备指纹获取失败');
    }

    // 更新缓存中的设备指纹
    deviceInfoCache.deviceFp = data.data.device_fp;
    deviceInfoCache.timestamp = Date.now();

    // 保存到 localStorage
    localStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfoCache));

    logger.info('✅ 设备指纹获取成功并更新缓存');
  } catch (error) {
    logger.error('❌ 设备指纹获取失败:', error);
    throw error;
  }
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
    // 尝试从 localStorage 获取完整设备信息
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
      logger.info('📱 强制刷新设备指纹');
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
        logger.info('✅ 设备指纹刷新完成');
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

export async function getCurrentDeviceInfo(): Promise<DeviceInfo> {
  return await getDeviceInfo();
}

export async function refreshDeviceInfo(): Promise<void> {
  logger.info('🔄 开始刷新设备信息...');

  // 强制刷新设备信息
  const newDeviceInfo = await getDeviceInfo(true);

  logger.info('✅ 设备信息刷新完成');
  logger.debug('设备信息详情:', newDeviceInfo);
}
