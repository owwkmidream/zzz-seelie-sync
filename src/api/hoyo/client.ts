// 米哈游绝区零 API 客户端请求编排

import GM_fetch from '@/utils/gmFetch';
import type { ApiResponse } from './types';
import { logger } from '../../utils/logger';
import { buildLTokenCookie, buildNapCookie } from './cookieJar';
import { resolveHoyoAuthRoute, type HoyoAuthRoute } from './authRouter';
import { buildGameRecordHeaders, buildNapCultivateHeaders } from './headerProfiles';
import { NAP_CULTIVATE_TOOL_URL } from './config';
import { ensureUserInfo } from './authService';
import {
  getDeviceFingerprint,
} from './deviceService';
import { ensureDeviceProfile, getCurrentDeviceProfile } from './deviceProfile';
import { ensureLToken, ensureNapBusinessToken, hasPersistedStoken, isPassportAuthHttpStatus, isPassportAuthRetcode } from './passportService';
import { hasLToken, hasNapToken, readAuthBundle } from './authStore';
import { createRouteRequestCore } from './requestCore';

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
  endpoint: string,
  forceAuthRefresh = false,
): Promise<{ headers: Record<string, string>; cookie: string }> {
  if (route === 'nap_cultivate') {
    const device = await ensureDeviceProfile();
    await ensureNapBusinessToken(forceAuthRefresh);
    const bundle = await readAuthBundle();
    if (!hasNapToken(bundle)) {
      throw new Error('未找到 e_nap_token，请先完成扫码登录');
    }

    return {
      headers: buildNapCultivateHeaders(endpoint, device),
      cookie: buildNapCookie(bundle),
    };
  }

  await ensureLToken(forceAuthRefresh);
  const bundle = await readAuthBundle();
  if (!hasLToken(bundle)) {
    throw new Error('未找到 ltoken/ltuid，请先完成扫码登录');
  }

  const device = await getCurrentDeviceProfile();
  return {
    headers: buildGameRecordHeaders(device),
    cookie: buildLTokenCookie(bundle),
  };
}

async function triggerRouteAuthRefresh(route: HoyoAuthRoute): Promise<void> {
  if (route === 'nap_cultivate') {
    await ensureNapBusinessToken(true);
    return;
  }

  await ensureLToken(true);
}

const routeRequestCore = createRouteRequestCore({
  fetch: GM_fetch,
  logger,
  buildRouteRequestContext,
  triggerRouteAuthRefresh,
  hasPersistedStoken,
  isPassportAuthHttpStatus,
  isPassportAuthRetcode,
  getDeviceFingerprint,
});

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

  return await routeRequestCore.execute<T>({
    url,
    endpoint,
    route,
    method,
    body,
    headers,
    requestLabel,
  });
}
