import GM_fetch from '@trim21/gm-fetch';
import type {
  ApiResponse,
  UserInfo,
  LoginInfoResponse
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

async function requestLoginInfo(cookieHeader?: string): Promise<ApiResponse<LoginInfoResponse>> {
  const headers: Record<string, string> = {
    ...defaultHeaders,
    Accept: '*/*',
    Referer: 'https://act.mihoyo.com/',
  };

  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

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

      // 带持久化 cookie 再次获取 login/info
      const cookieHeader = await ensurePassportCookieHeader();
      loginInfoData = await requestLoginInfo(cookieHeader);
    }

    if (!loginInfoData.data?.game_uid || !loginInfoData.data.region) {
      logger.warn('⚠️ 登录信息缺少必要字段，无法初始化用户态');
      throw new Error('登录信息不完整，未找到绝区零角色信息');
    }

    const loginInfo = loginInfoData.data;
    logger.info(`🎮 登录角色: ${loginInfo.nickname} (UID: ${loginInfo.game_uid}, 等级: ${loginInfo.level})`);

    // 缓存用户信息
    userInfoCache = {
      uid: loginInfo.game_uid,
      nickname: loginInfo.nickname,
      level: loginInfo.level,
      region: loginInfo.region,
      accountId: loginInfo.account_id || loginInfo.game_uid
    };

    logger.info('✅ nap_token 初始化完成');
    logger.info(`👤 用户信息: ${userInfoCache.nickname} (UID: ${userInfoCache.uid}, 等级: ${userInfoCache.level}, 区服: ${userInfoCache.region})`);

    napTokenInitialized = true;
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

export function resetNapTokenlInitialization(): void {
  napTokenInitialized = false;
  logger.info('🔄 已重置 NapToken 初始化状态');
}
