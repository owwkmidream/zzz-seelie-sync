// 米哈游绝区零 API 客户端请求编排

import GM_fetch from '@/utils/gmFetch';
import type { ApiResponse } from './types';
import { logger } from '../../utils/logger';
import { buildLTokenCookie, buildNapCookie } from './cookieJar';
import { resolveHoyoAuthRoute, type HoyoAuthRoute } from './authRouter';
import { buildGameRecordHeaders, buildNapCultivateHeaders } from './headerProfiles';
import { NAP_CULTIVATE_TOOL_URL, DEVICE_FP_ERROR_CODES } from './config';
import { ensureUserInfo } from './authService';
import {
  ApiResponseError,
  DeviceFingerprintRefreshError,
  HttpRequestError,
} from './errors';
import {
  getDeviceFingerprint,
} from './deviceService';
import { ensureDeviceProfile } from './deviceProfile';
import { ensureLToken, ensureNapBusinessToken, hasPersistedStoken, isPassportAuthHttpStatus, isPassportAuthRetcode } from './passportService';
import { hasLToken, hasNapToken, readAuthBundle } from './authStore';

export { generateUUID, generateHexString } from './deviceUtils';
export { NAP_CULTIVATE_TOOL_URL, GAME_RECORD_URL, DEVICE_FP_URL } from './config';
export { getDeviceFingerprint, getCurrentDeviceInfo, refreshDeviceInfo } from './deviceService';
export {
  ensureUserInfo,
  getUserInfo,
  clearUserInfo,
  initializeUserInfo,
  hydrateUserInfoFromRole,
  resetNapTokenlInitialization,
} from './authService';

async function buildRouteRequestContext(
  route: HoyoAuthRoute,
  forceAuthRefresh = false,
): Promise<{ headers: Record<string, string>; cookie: string }> {
  const device = await ensureDeviceProfile();

  if (route === 'nap_cultivate') {
    await ensureNapBusinessToken(forceAuthRefresh);
    const bundle = await readAuthBundle();
    if (!hasNapToken(bundle)) {
      throw new Error('未找到 e_nap_token，请先完成扫码登录');
    }

    return {
      headers: buildNapCultivateHeaders(device),
      cookie: buildNapCookie(bundle),
    };
  }

  await ensureLToken(forceAuthRefresh);
  const bundle = await readAuthBundle();
  if (!hasLToken(bundle)) {
    throw new Error('未找到 ltoken/ltuid，请先完成扫码登录');
  }

  return {
    headers: buildGameRecordHeaders(device),
    cookie: buildLTokenCookie(bundle),
  };
}

async function refreshRouteAuth(route: HoyoAuthRoute): Promise<void> {
  if (route === 'nap_cultivate') {
    await ensureNapBusinessToken(true);
    return;
  }

  await ensureLToken(true);
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
  } = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', params = {}, body, headers = {} } = options;
  const route = resolveHoyoAuthRoute(baseUrl, endpoint);

  if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
    await ensureUserInfo();
  }

  let url = `${baseUrl}${endpoint}`;
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  const requestLabel = `${method} ${endpoint}`;

  const executeRequest = async (
    authRetried = false,
    deviceRetried = false,
  ): Promise<ApiResponse<T>> => {
    const routeContext = await buildRouteRequestContext(route, authRetried);
    const finalHeaders: Record<string, string> = {
      ...routeContext.headers,
      ...headers,
    };

    if (body !== undefined && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    logger.debug(`🌐 发起请求 ${requestLabel}${authRetried || deviceRetried ? ' (重试)' : ''}`, {
      baseUrl,
      endpoint,
      route,
      authRetried,
      deviceRetried,
    });

    try {
      const response = await GM_fetch(url, {
        method,
        anonymous: true,
        cookie: routeContext.cookie,
        headers: finalHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        if (!authRetried && await hasPersistedStoken() && isPassportAuthHttpStatus(response.status)) {
          logger.warn(`⚠️ 鉴权失败，准备刷新路由凭证后重试 ${requestLabel}`);
          await refreshRouteAuth(route);
          return await executeRequest(true, deviceRetried);
        }

        throw new HttpRequestError(response.status, response.statusText);
      }

      const data = await response.json() as ApiResponse<T>;
      if (data.retcode !== 0) {
        if (DEVICE_FP_ERROR_CODES.has(data.retcode) && !deviceRetried) {
          logger.warn(`⚠️ 设备指纹错误，准备刷新后重试 ${requestLabel}`, {
            retcode: data.retcode,
            message: data.message,
          });

          try {
            await getDeviceFingerprint();
            return await executeRequest(authRetried, true);
          } catch (error) {
            throw new DeviceFingerprintRefreshError(data.retcode, data.message, error);
          }
        }

        if (!authRetried && await hasPersistedStoken() && isPassportAuthRetcode(data.retcode, data.message)) {
          logger.warn(`⚠️ 业务鉴权失败，准备刷新路由凭证后重试 ${requestLabel}`, {
            retcode: data.retcode,
            message: data.message,
          });
          await refreshRouteAuth(route);
          return await executeRequest(true, deviceRetried);
        }

        throw new ApiResponseError(data.retcode, data.message);
      }

      return data;
    } catch (error) {
      if (
        error instanceof ApiResponseError
        || error instanceof HttpRequestError
        || error instanceof DeviceFingerprintRefreshError
      ) {
        throw error;
      }

      logger.error(`❌ 请求异常 ${requestLabel}`, error);
      throw error;
    }
  };

  return await executeRequest();
}
