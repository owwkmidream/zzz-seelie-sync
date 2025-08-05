// Seelie 工具类主入口文件

import type { ResinDataInput, CharacterDataInput, SyncResult, BatchSyncResult, ToastType } from './types'
import { CharacterManager } from './managers'
import {
  getLanguageData,
  getStatsData,
  getCharacterStats,
  getWeaponStats,
  getWeaponStatsCommon,
  clearRuntimeDataCache,
  isDataLoaded
} from './constants'

/**
 * Seelie 数据操作工具类
 * 提供对 Vue 应用中数据的完整操作接口
 */
export class SeelieDataManager extends CharacterManager {
  // 继承所有功能，无需额外实现
}

// 创建全局实例
export const seelieDataManager = new SeelieDataManager()

/**
 * 设置树脂数据的便捷函数
 */
export const setResinData = (data: ResinDataInput): boolean => {
  return seelieDataManager.setAccountResin(data)
}

/**
 * 设置 Toast 消息的便捷函数
 */
export const setToast = (message: string, type: ToastType = 'success'): boolean => {
  return seelieDataManager.setToast(message, type)
}

/**
 * 设置角色数据的便捷函数
 */
export const setCharacter = (data: CharacterDataInput): boolean => {
  return seelieDataManager.setCharacter(data)
}

/**
 * 设置角色天赋数据的便捷函数
 */
export const setTalents = (data: CharacterDataInput): boolean => {
  return seelieDataManager.setTalents(data)
}

/**
 * 设置武器数据的便捷函数
 */
export const setWeapon = async (data: CharacterDataInput): Promise<boolean> => {
  return await seelieDataManager.setWeapon(data)
}

/**
 * 同步单个角色完整数据的便捷函数
 */
export const syncCharacter = async (data: CharacterDataInput): Promise<SyncResult> => {
  return await seelieDataManager.syncCharacter(data)
}

/**
 * 同步多个角色完整数据的便捷函数
 */
export const syncAllCharacters = async (dataList: CharacterDataInput[]): Promise<BatchSyncResult> => {
  return await seelieDataManager.syncAllCharacters(dataList)
}

// 挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).setResinData = setResinData;
  (window as any).setToast = setToast;
  (window as any).setCharacter = setCharacter;
  (window as any).setTalents = setTalents;
  (window as any).setWeapon = setWeapon;
  (window as any).syncCharacter = syncCharacter;
  (window as any).syncAllCharacters = syncAllCharacters;

  // 挂载 constants 中的调试函数
  (window as any).getLanguageData = getLanguageData;
  (window as any).getStatsData = getStatsData;
  (window as any).getCharacterStats = getCharacterStats;
  (window as any).getWeaponStats = getWeaponStats;
  (window as any).getWeaponStatsCommon = getWeaponStatsCommon;
  (window as any).clearRuntimeDataCache = clearRuntimeDataCache;
  (window as any).isDataLoaded = isDataLoaded;
}

// 导出类型
export type {
  ResinDataInput,
  CharacterDataInput,
  SyncResult,
  BatchSyncResult,
  ToastType
} from './types'