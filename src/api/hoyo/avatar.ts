// 米哈游绝区零角色相关API

import type {
  AvatarBasicInfo,
  AvatarDetailRequest
} from './types';
import type { CharacterDataInput } from '@/utils/seelie';
import { request, NAP_CULTIVATE_TOOL_URL } from './client';
import { resolveUserInfo, processBatches } from './utils';

/**
 * 获取角色基础列表
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param region 服务器区域，默认国服
 */
export async function getAvatarBasicList(
  uid?: string | number,
  region?: string
): Promise<AvatarBasicInfo[]> {
  const userInfo = await resolveUserInfo(uid, region);

  const response = await request<{ list: AvatarBasicInfo[] }>('/user/avatar_basic_list', NAP_CULTIVATE_TOOL_URL, {
    method: 'GET',
    params: { uid: userInfo.uid, region: userInfo.region }
  });

  return response.data.list.filter(avatar => avatar.unlocked === true);
}

/**
 * 批量获取角色详细信息
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param avatarList 角色请求列表
 * @param region 服务器区域，默认国服
 */
export async function batchGetAvatarDetail(
  avatarList: AvatarDetailRequest[] | number[],
  uid: string | number | undefined,
  region?: string
): Promise<CharacterDataInput[]> {
  const userInfo = await resolveUserInfo(uid, region);
  // 判断数组类型并进行相应处理
  const processedAvatarList: AvatarDetailRequest[] = typeof avatarList[0] === 'number'
    ? (avatarList as number[]).map(id => ({
      avatar_id: id,
      is_teaser: false,
      teaser_need_weapon: false,
      teaser_sp_skill: false
    }))
    : avatarList as AvatarDetailRequest[];
  // 使用通用分批处理函数
  return processBatches(
    processedAvatarList,
    10,
    async (batch) => {
      const response = await request<{ list: CharacterDataInput[] }>('/user/batch_avatar_detail_v2', NAP_CULTIVATE_TOOL_URL, {
        method: 'POST',
        params: { uid: userInfo.uid, region: userInfo.region },
        body: { avatar_list: batch }
      });
      return response.data.list;
    }
  );
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
  region?: string,
  options: {
    is_teaser?: boolean;
    teaser_need_weapon?: boolean;
    teaser_sp_skill?: boolean;
  } = {}
): Promise<CharacterDataInput> {
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

  const details = await batchGetAvatarDetail(avatarList, uid, region);

  if (details.length === 0) {
    throw new Error(`未找到角色 ${avatarId} 的详细信息`);
  }

  return details[0];
}
