/**
 * 通行证扫码与 token 派生服务
 * 主链路：扫码 -> stoken/mid -> cookie_token -> 角色 -> e_nap_token
 */

import GM_fetch from '@/utils/gmFetch';
import { logger } from '@/utils/logger';
import {
  ApiResponse,
  CookieTokenData,
  LTokenData,
  LoginAccountResponse,
  QRLoginData,
  QRLoginStatusData,
  UserGameRole,
  UserGameRolesResponse,
} from './types';
import { buildCookieTokenCookie, buildStokenCookie, getCookieValueFromResponse } from './cookieJar';
import {
  buildCookieTokenExchangeHeaders,
  buildNapBootstrapHeaders,
  buildQrHeaders,
  buildRoleByCookieTokenHeaders,
  buildStokenExchangeHeaders,
  buildVerifyCookieTokenHeaders,
} from './headerProfiles';
import {
  COOKIE_TOKEN_TTL_MS,
  COOKIE_TOKEN_URL,
  CREATE_QR_LOGIN_URL,
  GAME_ROLE_BY_COOKIE_TOKEN_URL,
  LTOKEN_URL,
  NAP_TOKEN_URL,
  QUERY_QR_LOGIN_STATUS_URL,
  VERIFY_COOKIE_TOKEN_URL,
} from './config';
import { generateDS } from './ds';
import { ensureDeviceProfile, getCurrentDeviceProfile } from './deviceProfile';
import {
  clearAuthBundle,
  hasLToken,
  hasRootTokens,
  patchAuthBundle,
  persistCookieTokenV2,
  persistLToken,
  persistNapToken,
  persistRootTokens,
  persistSelectedRole,
  readAuthBundle,
} from './authStore';
import { ApiResponseError, HttpRequestError } from './errors';
import { createPassportNapCore } from './passportCore';

const QR_EXPIRED_RETCODE = -106;
let lTokenRefreshPromise: Promise<void> | null = null;

async function requestApi<T>(
  url: string,
  init: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
    anonymous?: boolean;
    cookie?: string;
  },
  context: string,
): Promise<{ response: Response; data: ApiResponse<T> }> {
  const response = await GM_fetch(url, init);
  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, context);
  }

  const data = await response.json() as ApiResponse<T>;
  if (data.retcode !== 0) {
    throw new ApiResponseError(data.retcode, data.message, context);
  }

  return { response, data };
}

export function isPassportAuthHttpStatus(status: number): boolean {
  return status === 401 || status === 403;
}

export function isPassportAuthRetcode(retcode: number, message = ''): boolean {
  const normalized = message.toLowerCase();
  if ([-100, 10001, 10002, 10101, -3101].includes(retcode)) {
    return true;
  }

  return normalized.includes('登录')
    || normalized.includes('未登录')
    || normalized.includes('token')
    || normalized.includes('cookie');
}

export async function hasPersistedStoken(): Promise<boolean> {
  return hasRootTokens(await readAuthBundle());
}

export async function clearPersistedPassportTokens(): Promise<void> {
  lTokenRefreshPromise = null;
  passportNapCore.reset();
  await clearAuthBundle();
}

function isAuthRefreshableError(error: unknown): boolean {
  if (error instanceof ApiResponseError) {
    return isPassportAuthRetcode(error.retcode, error.apiMessage);
  }

  if (error instanceof HttpRequestError) {
    return isPassportAuthHttpStatus(error.status);
  }

  return false;
}

async function requestCookieTokenV2ByStoken(): Promise<{ uid?: string; cookieTokenV2: string }> {
  const bundle = await readAuthBundle();
  const { response, data } = await requestApi<CookieTokenData>(
    `${COOKIE_TOKEN_URL}?stoken=${encodeURIComponent(bundle.stoken ?? '')}`,
    {
      method: 'GET',
      anonymous: true,
      cookie: buildStokenCookie(bundle),
      headers: buildCookieTokenExchangeHeaders(),
    },
    '获取 cookie_token_v2 失败',
  );

  const cookieTokenV2 = getCookieValueFromResponse(response, 'cookie_token_v2');
  if (!cookieTokenV2) {
    throw new Error('获取 cookie_token_v2 失败：响应中未返回 cookie_token_v2');
  }

  return {
    uid: data.data.uid,
    cookieTokenV2,
  };
}

async function exchangeLTokenByStoken(): Promise<LTokenData> {
  const bundle = await readAuthBundle();
  if (!hasRootTokens(bundle)) {
    throw new Error('未找到 stoken/mid，请先扫码登录');
  }

  const device = await ensureDeviceProfile();
  const query = { stoken: bundle.stoken };
  const { data } = await requestApi<LTokenData>(
    `${LTOKEN_URL}?stoken=${encodeURIComponent(bundle.stoken)}`,
    {
      method: 'GET',
      anonymous: true,
      cookie: buildStokenCookie(bundle),
      headers: buildStokenExchangeHeaders(device, generateDS('X4', 'GET', query)),
    },
    '获取 ltoken 失败',
  );

  return data.data;
}

async function requestGameRolesByCookieToken(cookie: string): Promise<UserGameRole[]> {
  const { data } = await requestApi<UserGameRolesResponse>(
    GAME_ROLE_BY_COOKIE_TOKEN_URL,
    {
      method: 'GET',
      anonymous: true,
      cookie,
      headers: buildRoleByCookieTokenHeaders(),
    },
    '获取绝区零角色失败',
  );

  if (!data.data.list?.length) {
    throw new Error('未找到绝区零角色');
  }

  return data.data.list;
}

async function verifyCookieToken(cookie: string): Promise<void> {
  await requestApi(
    VERIFY_COOKIE_TOKEN_URL,
    {
      method: 'POST',
      anonymous: true,
      cookie,
      headers: buildVerifyCookieTokenHeaders(),
    },
    '校验 cookie_token 失败',
  );
}

async function requestNapBootstrap(role: UserGameRole, cookie: string): Promise<string> {
  const { response } = await requestApi<LoginAccountResponse>(
    NAP_TOKEN_URL,
    {
      method: 'POST',
      anonymous: true,
      cookie,
      headers: {
        ...buildNapBootstrapHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_biz: role.game_biz,
        lang: 'zh-cn',
        region: role.region,
        uid: role.game_uid,
      }),
    },
    '初始化绝区零业务态失败',
  );

  const eNapToken = getCookieValueFromResponse(response, 'e_nap_token');
  if (!eNapToken) {
    throw new Error('初始化绝区零业务态失败：响应中未返回 e_nap_token');
  }

  return eNapToken;
}

const passportNapCore = createPassportNapCore({
  now: () => Date.now(),
  logger,
  readAuthBundle,
  patchAuthBundle,
  persistCookieTokenV2,
  persistSelectedRole,
  persistNapToken,
  requestCookieTokenByStoken: requestCookieTokenV2ByStoken,
  verifyCookieToken,
  requestGameRolesByCookieToken,
  requestNapBootstrap,
  buildCookieTokenCookie: buildCookieTokenCookie as (bundle: { mid: string; cookieTokenV2: string }) => string,
  isAuthRefreshableError,
  cookieTokenTtlMs: COOKIE_TOKEN_TTL_MS,
});

export async function ensureLToken(forceRefresh = false): Promise<void> {
  const current = await readAuthBundle();
  if (!forceRefresh && hasLToken(current)) {
    return;
  }

  if (lTokenRefreshPromise) {
    logger.debug(`🔁 复用进行中的 ltoken 刷新${forceRefresh ? '（强制）' : ''}`);
    await lTokenRefreshPromise;
    return;
  }

  const refreshPromise = (async () => {
    const latestBeforeRefresh = await readAuthBundle();
    if (!forceRefresh && hasLToken(latestBeforeRefresh)) {
      return;
    }

    const data = await exchangeLTokenByStoken();
    const latest = await readAuthBundle();
    const accountId = latest.accountId || latest.stuid;
    await persistLToken(data.ltoken, accountId);
    logger.info('🔐 已刷新 ltoken');
  })();

  lTokenRefreshPromise = refreshPromise;
  try {
    await refreshPromise;
  } finally {
    if (lTokenRefreshPromise === refreshPromise) {
      lTokenRefreshPromise = null;
    }
  }
}

export async function ensureCookieToken(forceRefresh = false): Promise<void> {
  await passportNapCore.ensureCookieToken(forceRefresh);
}

export async function ensurePassportCookieHeader(forceRefresh = false): Promise<void> {
  await ensureCookieToken(forceRefresh);
}

export async function getPrimaryGameRole(forceRefresh = false): Promise<UserGameRole> {
  return await passportNapCore.getPrimaryGameRole(forceRefresh);
}

export async function initializeNapToken(): Promise<UserGameRole> {
  return await passportNapCore.initializeNapToken();
}

export async function ensureNapBusinessToken(forceRefresh = false): Promise<void> {
  await passportNapCore.ensureNapBusinessToken(forceRefresh);
}

/** Step 1: 创建二维码 */
export async function createQRLogin(): Promise<QRLoginData> {
  const device = await getCurrentDeviceProfile();
  const { data } = await requestApi<QRLoginData>(
    CREATE_QR_LOGIN_URL,
    {
      method: 'POST',
      headers: buildQrHeaders(device.deviceId),
      body: JSON.stringify({}),
    },
    '创建二维码失败',
  );

  return data.data;
}

/** Step 2: 查询扫码状态 */
export async function queryQRLoginStatus(ticket: string): Promise<QRLoginStatusData> {
  const device = await getCurrentDeviceProfile();
  const response = await GM_fetch(
    QUERY_QR_LOGIN_STATUS_URL,
    {
      method: 'POST',
      headers: buildQrHeaders(device.deviceId),
      body: JSON.stringify({ ticket }),
    },
  );

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, '查询扫码状态失败');
  }

  const data = await response.json() as ApiResponse<QRLoginStatusData>;
  if (data.retcode === QR_EXPIRED_RETCODE) {
    throw new ApiResponseError(data.retcode, data.message, '二维码已过期');
  }

  if (data.retcode !== 0) {
    throw new ApiResponseError(data.retcode, data.message, '查询扫码状态失败');
  }

  return data.data;
}

// ── 轮询编排 ──

export interface QRLoginCallbacks {
  onStatusChange: (status: QRLoginStatusData['status']) => void;
  onQRExpired: (newData: QRLoginData) => void;
  onComplete: (roleInfo: UserGameRole) => void;
  onError: (error: unknown) => void;
}

export function startQRLoginPolling(
  ticket: string,
  callbacks: QRLoginCallbacks,
): () => void {
  let cancelled = false;
  let currentTicket = ticket;

  const cancel = () => {
    cancelled = true;
  };

  const poll = async () => {
    while (!cancelled) {
      await sleep(1000);
      if (cancelled) {
        return;
      }

      try {
        const statusData = await queryQRLoginStatus(currentTicket);
        if (cancelled) {
          return;
        }

        callbacks.onStatusChange(statusData.status);

        if (statusData.status === 'Confirmed') {
          const stoken = statusData.tokens?.[0]?.token;
          const mid = statusData.user_info?.mid;
          const stuid = statusData.user_info?.aid;

          if (!stoken || !mid) {
            callbacks.onError(new Error('扫码成功但缺少 stoken/mid'));
            return;
          }

          await persistRootTokens({ stoken, mid, stuid });
          const roleInfo = await initializeNapToken();
          callbacks.onComplete(roleInfo);
          return;
        }
      } catch (error) {
        if (error instanceof ApiResponseError && error.retcode === QR_EXPIRED_RETCODE) {
          try {
            const newData = await createQRLogin();
            currentTicket = newData.ticket;
            callbacks.onQRExpired(newData);
            continue;
          } catch (refreshError) {
            callbacks.onError(refreshError);
            return;
          }
        }

        callbacks.onError(error);
        return;
      }
    }
  };

  void poll();
  return cancel;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
