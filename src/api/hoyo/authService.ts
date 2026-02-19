import GM_fetch from '@trim21/gm-fetch';
import type {
  ApiResponse,
  UserInfo,
  LoginInfoResponse,
  UserGameRole,
} from './types';
import { logger } from '../../utils/logger';
import {
  NAP_LOGIN_INFO_URL,
  defaultHeaders
} from './config';
import { ApiResponseError, HttpRequestError } from './errors';
import {
  ensurePassportCookieHeader,
  hasPersistedStoken,
  initializeNapToken as initializePassportNapToken,
  isPassportAuthHttpStatus,
  isPassportAuthRetcode,
} from './passportService';

// 初始化请求标记
let napTokenInitialized = false;

// 用户信息缓存
let userInfoCache: UserInfo | null = null;

function cacheUserInfo(profile: Pick<LoginInfoResponse, 'game_uid' | 'nickname' | 'level' | 'region'>): void {
  userInfoCache = {
    uid: profile.game_uid,
    nickname: profile.nickname,
    level: profile.level,
    region: profile.region,
  };

  napTokenInitialized = true;
}

function shouldFallbackToPersistedStoken(error: unknown): boolean {
  if (error instanceof HttpRequestError) {
    return isPassportAuthHttpStatus(error.status);
  }

  if (error instanceof ApiResponseError) {
    return isPassportAuthRetcode(error.retcode, error.apiMessage);
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('登录') || msg.includes('token') || msg.includes('cookie');
  }

  return false;
}

async function requestLoginInfo(): Promise<ApiResponse<LoginInfoResponse>> {
  const headers: Record<string, string> = {
    ...defaultHeaders,
    Accept: '*/*',
    Referer: 'https://act.mihoyo.com/',
  };

  const loginInfoResponse = await GM_fetch(`${NAP_LOGIN_INFO_URL}&ts=${Date.now()}`, {
    method: 'GET',
    headers,
  });

  if (!loginInfoResponse.ok) {
    throw new HttpRequestError(loginInfoResponse.status, loginInfoResponse.statusText, '获取登录信息失败');
  }

  const loginInfoData = await loginInfoResponse.json() as ApiResponse<LoginInfoResponse>;
  if (loginInfoData.retcode !== 0) {
    throw new ApiResponseError(loginInfoData.retcode, loginInfoData.message, '获取登录信息失败');
  }

  return loginInfoData;
}

/**
 * 获取 nap_token 并缓存用户信息
 */
async function initializeNapToken(): Promise<void> {
  if (napTokenInitialized) {
    return;
  }

  logger.info('🔄 开始初始化 nap_token 与用户信息...');

  try {
    let loginInfoData: ApiResponse<LoginInfoResponse>;

    try {
      // 优先尝试使用现有浏览器登录态
      loginInfoData = await requestLoginInfo();
    } catch (primaryError) {
      if (!await hasPersistedStoken() || !shouldFallbackToPersistedStoken(primaryError)) {
        throw primaryError;
      }

      logger.warn('⚠️ 现有登录态不可用，尝试使用持久化 stoken 刷新登录态');

      // 用持久化 stoken -> cookie_token -> login/account 刷新 nap 相关登录态
      await initializePassportNapToken();

      // 刷新后重试 login/info（cookie 由浏览器自动携带）
      await ensurePassportCookieHeader();
      loginInfoData = await requestLoginInfo();
    }

    if (!loginInfoData.data?.game_uid || !loginInfoData.data.region) {
      logger.warn('⚠️ 登录信息缺少必要字段，无法初始化用户态');
      throw new Error('登录信息不完整，未找到绝区零角色信息');
    }

    const loginInfo = loginInfoData.data;
    logger.info(`🎮 登录角色: ${loginInfo.nickname} (UID: ${loginInfo.game_uid}, 等级: ${loginInfo.level})`);

    // 缓存用户信息
    cacheUserInfo(loginInfo);

    logger.info('✅ nap_token 初始化完成');
    logger.info(`👤 用户信息: ${loginInfo.nickname} (UID: ${loginInfo.game_uid}, 等级: ${loginInfo.level}, 区服: ${loginInfo.region})`);
  } catch (error) {
    logger.error('❌ 初始化 nap_token 失败:', error);
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

export function getUserInfo(): UserInfo | null {
  return userInfoCache;
}

export function clearUserInfo(): void {
  userInfoCache = null;
  napTokenInitialized = false;
  logger.info('🗑️ 已清除用户信息缓存');
}

export async function initializeUserInfo(): Promise<UserInfo | null> {
  await ensureUserInfo();
  return userInfoCache;
}

export function hydrateUserInfoFromRole(
  role: Pick<UserGameRole, 'game_uid' | 'nickname' | 'level' | 'region'>
): void {
  if (!role.game_uid || !role.region) {
    throw new Error('角色信息不完整，无法写入用户缓存');
  }

  cacheUserInfo(role);
  logger.info(`👤 已使用角色信息更新用户缓存: ${role.nickname} (UID: ${role.game_uid})`);
}

export function resetNapTokenlInitialization(): void {
  napTokenInitialized = false;
  logger.info('🔄 已重置 NapToken 初始化状态');
}
