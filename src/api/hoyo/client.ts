// 米哈游绝区零 API 客户端请求编排

import GM_fetch from '@/utils/gmFetch';
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
import {
  ensurePassportCookieHeader,
  hasPersistedStoken,
  isPassportAuthHttpStatus,
  isPassportAuthRetcode,
} from './passportService';

export { generateUUID, generateHexString } from './deviceUtils';
export { NAP_CULTIVATE_TOOL_URL, GAME_RECORD_URL, DEVICE_FP_URL } from './config';
export { getDeviceFingerprint, getCurrentDeviceInfo, refreshDeviceInfo } from './deviceService';
export {
  ensureUserInfo,
  getUserInfo,
  clearUserInfo,
  initializeUserInfo,
  hydrateUserInfoFromRole,
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
  const requestLabel = `${method} ${endpoint}`;

  // 执行请求的内部函数
  const executeRequest = async (
    isRetry = false,
    isAuthRetry = false
  ): Promise<ApiResponse<T>> => {
    // 异步获取并合并请求头
    const zzzHeaders = await getZZZHeaderWithDevice();
    const finalHeaders: Record<string, string> = {
      ...zzzHeaders,
      ...headers
    };

    const persistedStokenAvailable = await hasPersistedStoken();

    if (finalHeaders['x-rpc-device_fp'] === '0000000000000') {
      throw new InvalidDeviceFingerprintError();
    }

    logger.debug(`🌐 发起请求 ${requestLabel}${isRetry ? ' (重试)' : ''}`, {
      endpoint,
      baseUrl,
      isRetry
    });

    try {
      const payload = [url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined
      }] as const;
      const response = await GM_fetch(...payload);

      if (!response.ok) {
        if (!isAuthRetry && persistedStokenAvailable && isPassportAuthHttpStatus(response.status)) {
          logger.warn(`⚠️ 鉴权失败，尝试刷新 cookie_token 并重试 ${requestLabel}`, {
            status: response.status,
            statusText: response.statusText,
          });

          await ensurePassportCookieHeader(true);
          return await executeRequest(isRetry, true);
        }

        throw new HttpRequestError(response.status, response.statusText);
      }

      const data = await response.json() as ApiResponse<T>;

      if (data.retcode !== 0) {
        // 检查是否为设备指纹相关错误码
        if (deviceFpErrorCodes.includes(data.retcode) && !isRetry) {
          logger.warn(`⚠️ 设备指纹错误，准备刷新并重试 ${requestLabel}`, {
            retcode: data.retcode,
            message: data.message
          });

          try {
            // 刷新设备指纹
            await getDeviceFingerprint();
            logger.info(`✅ 设备指纹刷新完成，重试 ${requestLabel}`);

            // 重试请求
            return await executeRequest(true);
          } catch (fpError) {
            logger.error(`❌ 设备指纹刷新失败，无法重试 ${requestLabel}`, fpError);
            throw new DeviceFingerprintRefreshError(data.retcode, data.message, fpError);
          }
        }

        if (!isAuthRetry && persistedStokenAvailable && isPassportAuthRetcode(data.retcode, data.message)) {
          logger.warn(`⚠️ 业务鉴权失败，尝试刷新 cookie_token 并重试 ${requestLabel}`, {
            retcode: data.retcode,
            message: data.message,
          });

          await ensurePassportCookieHeader(true);
          return await executeRequest(isRetry, true);
        }

        logger.error(`❌ 请求失败 ${requestLabel}`, {
          retcode: data.retcode,
          message: data.message,
          status: response.status
        });
        throw new ApiResponseError(data.retcode, data.message);
      }

      logger.debug(`✅ 请求成功 ${requestLabel}`, {
        retcode: data.retcode,
        message: data.message,
        retried: isRetry
      });
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

      logger.error(`❌ 请求异常 ${requestLabel}`, error);
      throw error;
    }
  };

  // 执行请求
  return await executeRequest();
}
