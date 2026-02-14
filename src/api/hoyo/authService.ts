import GM_fetch from '@trim21/gm-fetch';
import type {
  ApiResponse,
  UserInfo,
  UserGameRolesResponse,
  LoginAccountResponse
} from './types';
import { logger } from '../../utils/logger';
import {
  GAME_ROLE_URL,
  NAP_TOKEN_URL,
  defaultHeaders
} from './config';
import { ApiResponseError, HttpRequestError } from './errors';

// 初始化请求标记
let napTokenInitialized = false;

// 用户信息缓存
let userInfoCache: UserInfo | null = null;

/**
 * 获取 nap_token 并缓存用户信息
 */
async function initializeNapToken(): Promise<void> {
  if (napTokenInitialized) {
    return;
  }

  logger.info('🔄 开始初始化 nap_token 与用户信息...');

  try {
    // 第一步：获取用户游戏角色信息
    const rolesResponse = await GM_fetch(GAME_ROLE_URL, {
      method: 'GET',
      headers: defaultHeaders
    });

    if (!rolesResponse.ok) {
      throw new HttpRequestError(rolesResponse.status, rolesResponse.statusText, '获取用户角色失败');
    }

    const rolesData = await rolesResponse.json() as ApiResponse<UserGameRolesResponse>;

    if (rolesData.retcode !== 0) {
      throw new ApiResponseError(rolesData.retcode, rolesData.message, '获取用户角色失败');
    }

    if (!rolesData.data?.list || rolesData.data.list.length === 0) {
      logger.warn('⚠️ 未获取到任何角色信息，无法初始化用户态');
      throw new Error('未找到绝区零游戏角色');
    }

    // 获取第一个角色信息
    const roleInfo = rolesData.data.list[0];
    logger.info(`🎮 选取角色: ${roleInfo.nickname} (UID: ${roleInfo.game_uid}, 等级: ${roleInfo.level})`);

    // 第二步：使用角色信息设置 nap_token
    const tokenResponse = await GM_fetch(NAP_TOKEN_URL, {
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
      throw new HttpRequestError(tokenResponse.status, tokenResponse.statusText, '设置 nap_token 失败');
    }

    const tokenData = await tokenResponse.json() as ApiResponse<LoginAccountResponse>;

    if (tokenData.retcode !== 0) {
      throw new ApiResponseError(tokenData.retcode, tokenData.message, '设置 nap_token 失败');
    }

    // 缓存用户信息
    userInfoCache = {
      uid: roleInfo.game_uid,
      nickname: roleInfo.nickname,
      level: roleInfo.level,
      region: roleInfo.region,
      accountId: roleInfo.game_uid // 使用 game_uid 作为 accountId
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
