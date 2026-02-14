// 米哈游绝区零 API 客户端请求编排

import GM_fetch from '@trim21/gm-fetch';
import type { ApiResponse } from './types';
import { logger } from '../../utils/logger';
import {
  getZZZHeaderWithDevice,
  getDeviceFingerprint
} from './deviceService';
import { NAP_CULTIVATE_TOOL_URL } from './config';
import { ensureUserInfo } from './authService';
import {
  ApiResponseError,
  DeviceFingerprintRefreshError,
  HttpRequestError,
  InvalidDeviceFingerprintError
} from './errors';

export { generateUUID, generateHexString } from './deviceUtils';
export { NAP_CULTIVATE_TOOL_URL, GAME_RECORD_URL, DEVICE_FP_URL } from './config';
export { getDeviceFingerprint, getCurrentDeviceInfo, refreshDeviceInfo } from './deviceService';
export {
  ensureUserInfo,
  getUserInfo,
  clearUserInfo,
  initializeUserInfo,
  resetNapTokenlInitialization
} from './authService';

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

  // 如果是 NAP_CULTIVATE_TOOL_URL 的请求，先进行用户初始化
  if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
    await ensureUserInfo();
  }

  // 构建 URL
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
      throw new InvalidDeviceFingerprintError();
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
        throw new HttpRequestError(response.status, response.statusText);
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
            throw new DeviceFingerprintRefreshError(data.retcode, data.message, fpError);
          }
        }

        logger.error('❌ 请求失败\n请求:', payload, '\n响应：', response, data);
        throw new ApiResponseError(data.retcode, data.message);
      }

      logger.debug(`✅ 请求成功: ${payload[0]}, ${data.retcode}: ${data.message}`);
      return data;
    } catch (error) {
      if (
        error instanceof ApiResponseError ||
        error instanceof HttpRequestError ||
        error instanceof DeviceFingerprintRefreshError ||
        error instanceof InvalidDeviceFingerprintError
      ) {
        throw error;
      }

      logger.error('❌ 请求失败:', error);
      throw error;
    }
  };

  // 执行请求
  return await executeRequest();
}
