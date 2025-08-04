// 米哈游绝区零角色相关API

import type {
  AvatarBasicInfo,
  AvatarDetail,
  AvatarDetailRequest
} from './types';
import { request, ensureUserInfo, getUserInfo, AVATAR_URL } from './client';

/**
 * 获取角色基础列表
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param region 服务器区域，默认国服
 */
export async function getAvatarBasicList(
  uid?: string | number,
  region: string = 'prod_gf_cn'
): Promise<AvatarBasicInfo[]> {
  // 如果没有提供 uid，确保用户信息已初始化并使用缓存的用户信息
  if (!uid) {
    await ensureUserInfo();
    const userInfoCache = getUserInfo();
    if (userInfoCache) {
      uid = userInfoCache.uid;
      region = userInfoCache.region;
    } else {
      throw new Error('❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社');
    }
  }
  const response = await request<{ list: AvatarBasicInfo[] }>('/user/avatar_basic_list', AVATAR_URL, {
    method: 'GET',
    params: { uid: String(uid), region }
  });

  return response.data.list;
}

/**
 * 批量获取角色详细信息
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param avatarList 角色请求列表
 * @param region 服务器区域，默认国服
 */
export async function batchGetAvatarDetail(
  uid: string | number | undefined,
  avatarList: AvatarDetailRequest[],
  region: string = 'prod_gf_cn'
): Promise<AvatarDetail[]> {
  // 如果没有提供 uid，确保用户信息已初始化并使用缓存的用户信息
  if (!uid) {
    await ensureUserInfo();
    const userInfoCache = getUserInfo();
    if (userInfoCache) {
      uid = userInfoCache.uid;
      region = userInfoCache.region;
    } else {
      throw new Error('❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社');
    }
  }
  const batchSize = 10;
  // 如果列表长度大于10，分批处理
  if (avatarList.length > batchSize) {
    const results: AvatarDetail[] = [];

    for (let i = 0; i < avatarList.length; i += batchSize) {
      const batch = avatarList.slice(i, i + batchSize);
      const response = await request<{ list: AvatarDetail[] }>('/user/batch_avatar_detail_v2', AVATAR_URL, {
        method: 'POST',
        params: { uid: String(uid), region },
        body: { avatar_list: batch }
      });
      results.push(...response.data.list);
    }

    return results;
  }

  const response = await request<{ list: AvatarDetail[] }>('/user/batch_avatar_detail_v2', AVATAR_URL, {
    method: 'POST',
    params: { uid: String(uid), region },
    body: { avatar_list: avatarList }
  });

  return response.data.list;
}

/**
 * 获取单个角色详细信息
 * @param avatarId 角色ID
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param region 服务器区域，默认国服
 * @param options 额外选项
 */
export async function getAvatarDetail(
  avatarId: number,
  uid?: string | number,
  region: string = 'prod_gf_cn',
  options: {
    is_teaser?: boolean;
    teaser_need_weapon?: boolean;
    teaser_sp_skill?: boolean;
  } = {}
): Promise<AvatarDetail> {
  // 如果没有提供 uid，确保用户信息已初始化并使用缓存的用户信息
  if (!uid) {
    await ensureUserInfo();
    const userInfoCache = getUserInfo();
    if (userInfoCache) {
      uid = userInfoCache.uid;
      region = userInfoCache.region;
    } else {
      throw new Error('❌ 未提供 UID 且无法从缓存获取用户信息，请确保已登录米游社');
    }
  }
  const {
    is_teaser = false,
    teaser_need_weapon = false,
    teaser_sp_skill = false
  } = options;

  const avatarList: AvatarDetailRequest[] = [{
    avatar_id: avatarId,
    is_teaser,
    teaser_need_weapon,
    teaser_sp_skill
  }];

  const details = await batchGetAvatarDetail(uid, avatarList, region);

  if (details.length === 0) {
    throw new Error(`未找到角色 ${avatarId} 的详细信息`);
  }

  return details[0];
}