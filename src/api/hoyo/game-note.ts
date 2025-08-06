// 米哈游绝区零游戏便笺API

import type { GameNoteData, EnergyInfo } from './types';
import { request, GAME_RECORD_URL } from './client';
import { resolveUserInfo } from './utils';

/**
 * 获取绝区零游戏便笺信息（体力等）
 * @param roleId 角色ID，如果不提供则使用缓存的用户UID
 * @param server 服务器，默认国服
 */
export async function getGameNote(
  roleId?: string | number,
  server?: string
): Promise<GameNoteData> {
  const userInfo = await resolveUserInfo(roleId, server);

  const response = await request<GameNoteData>('/note', GAME_RECORD_URL, {
    method: 'GET',
    params: {
      server: userInfo.region,
      role_id: userInfo.uid
    }
  });

  return response.data;
}

/**
 * 获取体力信息
 * @param roleId 角色ID，如果不提供则使用缓存的用户UID
 * @param server 服务器，默认国服
 */
export async function getEnergyInfo(
  roleId?: string | number,
  server?: string
): Promise<EnergyInfo> {
  const gameNote = await getGameNote(roleId, server);
  return gameNote.energy;
}
