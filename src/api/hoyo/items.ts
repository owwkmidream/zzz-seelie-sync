// 材料相关API

import { ASCENSIONS } from "../../utils/seelie/constants";
import { NAP_CULTIVATE_TOOL_URL, request } from "./client";
import { AvatarCalcData, AvatarCalcRequest, SkillType } from "./types";
import { resolveUserInfo } from "./utils";

/**
 * 养成材料计算API
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param region 服务器区域，默认国服
 */
export async function getAvatarItemCalc(
  avatar_id: number,
  weapon_id: number,
  uid?: string | number,
  region?: string,
): Promise<AvatarCalcData> {
  const userInfo = await resolveUserInfo(uid, region);

  // 构建body
  const body: AvatarCalcRequest = {
    avatar_id: Number(avatar_id),
    avatar_level: ASCENSIONS[ASCENSIONS.length - 1], // 最大等级
    avatar_current_level: 1,
    avatar_current_promotes: 1,
    skills: Object.values(SkillType).filter(value => typeof value !== 'string').map(skillType => ({
      skill_type: skillType as SkillType,
      level: skillType === SkillType.CorePassive ? 7 : 12,
      init_level: 1 // 初始
    })),
    weapon_info: {
      weapon_id: Number(weapon_id),
      weapon_level: ASCENSIONS[ASCENSIONS.length - 1],
      weapon_promotes: 0,
      weapon_init_level: 0,
    }
  }

  const response = await request<AvatarCalcData>('/user/avatar_calc', NAP_CULTIVATE_TOOL_URL, {
    method: 'POST',
    params: { uid: userInfo.uid, region: userInfo.region },
    body: body
  });

  return response.data;
}

/**
 * 批量计算角色养成材料
 * @param calcItems 计算项目数组，包含角色ID和武器ID
 * @param uid 用户UID，如果不提供则使用缓存的用户UID
 * @param region 服务器区域，默认国服
 */
export async function batchGetAvatarItemCalc(
  calcAvatars: Array<{ avatar_id: number; weapon_id: number }>,
  uid?: string | number,
  region?: string,
): Promise<AvatarCalcData[]> {

  const promises = calcAvatars.map(item =>
    getAvatarItemCalc(item.avatar_id, item.weapon_id, uid, region)
  );

  return await Promise.all(promises);
}
