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
export const setCharacter = async (data: CharacterDataInput): Promise<boolean> => {
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

/**
 * 设置库存的便捷函数
 */
export const setInventory = (type: string, item: string, tier: number, value: number): boolean => {
  return seelieDataManager.setInventory(type, item, tier, value)
}

/**
 * 使用贪心算法找到最小集合覆盖的角色ID列表
 * 目标是用最少的角色覆盖所有属性组合（属性、风格、模拟材料、周本）
 */
export const findMinimumSetCoverIds = (): {id: number, style: string}[] => {
  return seelieDataManager.findMinimumSetCoverIds()
}

/**
 * 返回每个职业对应一个武器
 */
export const findMinimumSetWeapons = (): Record<string, number> => {
  return seelieDataManager.findMinimumSetWeapons()
}

/**
 * 获取items数据
 */
export const getItems = (): unknown => {
  return seelieDataManager.getItems()
}

// 挂载到全局对象，方便调试
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const globalWindow = window as unknown as Record<string, unknown>;
  globalWindow.setResinData = setResinData;
  globalWindow.setToast = setToast;
  globalWindow.setCharacter = setCharacter;
  globalWindow.setTalents = setTalents;
  globalWindow.setWeapon = setWeapon;
  globalWindow.setInventory = setInventory;
  globalWindow.syncCharacter = syncCharacter;
  globalWindow.syncAllCharacters = syncAllCharacters;
  globalWindow.findMinimumSetCoverIds = findMinimumSetCoverIds;
  globalWindow.findMinimumSetWeapons = findMinimumSetWeapons;

  // 挂载 constants 中的调试函数
  globalWindow.getLanguageData = getLanguageData;
  globalWindow.getStatsData = getStatsData;
  globalWindow.getCharacterStats = getCharacterStats;
  globalWindow.getWeaponStats = getWeaponStats;
  globalWindow.getWeaponStatsCommon = getWeaponStatsCommon;
  globalWindow.clearRuntimeDataCache = clearRuntimeDataCache;
  globalWindow.isDataLoaded = isDataLoaded;
}

// 导出类型
export type {
  ResinDataInput,
  CharacterDataInput,
  SyncResult,
  BatchSyncResult,
  ToastType
} from './types'