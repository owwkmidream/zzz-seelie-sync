// Seelie 相关常量定义

import type {
  CharacterStats,
  WeaponStatsCommon,
  SeelieLanguageData,
  SeelieStatsData
} from './types'
import { SeelieDataUpdater } from './dataUpdater'
import { logger } from '../logger'

/**
 * 突破等级数组
 */
export const ASCENSIONS: number[] = [1, 10, 20, 30, 40, 50, 60]

/**
 * 技能类型映射
 */
export const SKILLS: { [key: number]: string } = {
  0: 'basic',    // 普通攻击
  1: 'special',  // 特殊技
  2: 'dodge',    // 闪避
  3: 'chain',    // 连携技
  5: 'core',     // 核心被动
  6: 'assist'    // 支援技
}

/**
 * 树脂恢复间隔（秒）
 */
export const RESIN_INTERVAL = 360

// ===== 动态数据懒加载功能 =====

/**
 * 脚本生命周期内的数据缓存
 * 只在第一次调用时请求网络，后续使用内存缓存
 */
let runtimeDataCache: {
  languageData?: SeelieLanguageData
  statsData?: SeelieStatsData
  loaded?: boolean
  loading?: Promise<void>
} = {}

/**
 * 懒加载 Seelie 数据
 * 脚本生命周期内只请求一次，优先网络请求，失败时使用缓存
 */
export async function lazyLoadSeelieData(): Promise<void> {
  // 如果已经加载过，直接返回
  if (runtimeDataCache.loaded) {
    return
  }

  // 如果正在加载中，等待加载完成
  if (runtimeDataCache.loading) {
    await runtimeDataCache.loading
    return
  }

  // 开始加载数据
  runtimeDataCache.loading = (async () => {
    try {
      logger.debug('🔄 懒加载 Seelie 数据...')
      const { languageData, statsData } = await SeelieDataUpdater.getLatestData()

      runtimeDataCache.languageData = languageData
      runtimeDataCache.statsData = statsData
      runtimeDataCache.loaded = true

      logger.debug('✅ Seelie 数据加载完成')
    } catch (error) {
      logger.error('❌ Seelie 数据加载失败:', error)
      // 即使失败也标记为已尝试，避免重复请求
      // runtimeDataCache.loaded = true
      throw error
    } finally {
      runtimeDataCache.loading = undefined
    }
  })()

  await runtimeDataCache.loading
}

/**
 * 获取语言数据
 */
export async function getLanguageData(): Promise<SeelieLanguageData | undefined> {
  await lazyLoadSeelieData()
  return runtimeDataCache.languageData
}

/**
 * 获取统计数据
 */
export async function getStatsData(): Promise<SeelieStatsData | undefined> {
  await lazyLoadSeelieData()
  return runtimeDataCache.statsData
}

/**
 * 获取角色统计数据
 */
export async function getCharacterStats(): Promise<CharacterStats[]> {
  try {
    const statsData = await getStatsData()
    if (statsData?.charactersStats && Array.isArray(statsData.charactersStats)) {
      logger.debug('✅ 使用动态角色统计数据')
      return statsData.charactersStats
    }
  } catch (error) {
    logger.warn('⚠️ 获取角色统计数据失败:', error)
  }

  throw new Error('无法获取角色统计数据')
}

/**
 * 获取武器统计数据
 */
export async function getWeaponStats(): Promise<{ [id: number]: number }> {
  try {
    const statsData = await getStatsData()
    if (statsData?.weaponsStats && typeof statsData.weaponsStats === 'object') {
      logger.debug('✅ 使用动态武器统计数据')
      return statsData.weaponsStats
    }
  } catch (error) {
    logger.warn('⚠️ 获取武器统计数据失败:', error)
  }

  throw new Error('无法获取武器统计数据')
}

/**
 * 获取武器通用统计数据
 */
export async function getWeaponStatsCommon(): Promise<WeaponStatsCommon> {
  try {
    const statsData = await getStatsData()
    if (statsData?.weaponsStatsCommon && typeof statsData.weaponsStatsCommon === 'object') {
      logger.debug('✅ 使用动态武器通用统计数据')
      return statsData.weaponsStatsCommon
    }
  } catch (error) {
    logger.warn('⚠️ 获取武器通用统计数据失败:', error)
  }

  throw new Error('无法获取武器通用统计数据')
}

/**
 * 清除运行时数据缓存（用于调试）
 */
export function clearRuntimeDataCache(): void {
  runtimeDataCache = {}
  logger.debug('🗑️ 已清除运行时数据缓存')
}

/**
 * 检查数据是否已加载
 */
export function isDataLoaded(): boolean {
  return !!runtimeDataCache.loaded
}