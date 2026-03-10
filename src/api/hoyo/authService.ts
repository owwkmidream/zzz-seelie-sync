import GM_fetch from '@/utils/gmFetch';
import type { ApiResponse, LoginInfoResponse, UserGameRole, UserInfo } from './types';
import { logger } from '@/utils/logger';
import { NAP_LOGIN_INFO_URL } from './config';
import { ApiResponseError, HttpRequestError } from './errors';
import { buildNapCookie } from './cookieJar';
import { buildNapSessionHeaders } from './headerProfiles';
import { hasNapToken, readAuthBundle } from './authStore';
import { ensureNapBusinessToken, getPrimaryGameRole } from './passportService';

let userInfoCache: UserInfo | null = null;
let initializePromise: Promise<UserInfo | null> | null = null;

function cacheUserInfoFromRole(role: Pick<UserGameRole, 'game_uid' | 'nickname' | 'level' | 'region'>): void {
  userInfoCache = {
    uid: role.game_uid,
    nickname: role.nickname,
    level: role.level,
    region: role.region,
  };
}

function cacheUserInfoFromLogin(profile: Pick<LoginInfoResponse, 'game_uid' | 'nickname' | 'level' | 'region'>): void {
  userInfoCache = {
    uid: profile.game_uid,
    nickname: profile.nickname,
    level: profile.level,
    region: profile.region,
  };
}

async function requestLoginInfo(forceRefresh = false): Promise<ApiResponse<LoginInfoResponse>> {
  if (forceRefresh) {
    await ensureNapBusinessToken(true);
  }

  const bundle = await readAuthBundle();
  if (!hasNapToken(bundle)) {
    await ensureNapBusinessToken(false);
  }

  const latest = await readAuthBundle();
  if (!hasNapToken(latest)) {
    throw new Error('未找到 e_nap_token，无法请求登录信息');
  }

  const response = await GM_fetch(`${NAP_LOGIN_INFO_URL}&ts=${Date.now()}`, {
    method: 'GET',
    anonymous: true,
    cookie: buildNapCookie(latest),
    headers: buildNapSessionHeaders(),
  });

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, '获取登录信息失败');
  }

  const data = await response.json() as ApiResponse<LoginInfoResponse>;
  if (data.retcode !== 0) {
    throw new ApiResponseError(data.retcode, data.message, '获取登录信息失败');
  }

  return data;
}

export async function ensureUserInfo(): Promise<void> {
  if (!userInfoCache) {
    await initializeUserInfo();
  }
}

export function getUserInfo(): UserInfo | null {
  return userInfoCache;
}

export function clearUserInfo(): void {
  userInfoCache = null;
  logger.info('🗑️ 已清除用户信息缓存');
}

export async function initializeUserInfo(): Promise<UserInfo | null> {
  if (userInfoCache) {
    return userInfoCache;
  }

  if (!initializePromise) {
    initializePromise = (async () => {
      const bundle = await readAuthBundle();
      if (bundle.selectedRole) {
        cacheUserInfoFromRole(bundle.selectedRole);
        return userInfoCache;
      }

      try {
        const role = await getPrimaryGameRole(false);
        cacheUserInfoFromRole(role);
        return userInfoCache;
      } catch (roleError) {
        logger.warn('⚠️ 通过角色发现初始化用户缓存失败，降级尝试 login/info', roleError);
      }

      const loginInfo = await requestLoginInfo(false);
      cacheUserInfoFromLogin(loginInfo.data);
      return userInfoCache;
    })().finally(() => {
      initializePromise = null;
    });
  }

  return await initializePromise;
}

export function hydrateUserInfoFromRole(
  role: Pick<UserGameRole, 'game_uid' | 'nickname' | 'level' | 'region'>,
): void {
  if (!role.game_uid || !role.region) {
    throw new Error('角色信息不完整，无法写入用户缓存');
  }

  cacheUserInfoFromRole(role);
  logger.info(`👤 已使用角色信息更新用户缓存: ${role.nickname} (UID: ${role.game_uid})`);
}

export function resetNapTokenlInitialization(): void {
  userInfoCache = null;
  logger.info('🔄 已重置绝区零用户态缓存');
}
