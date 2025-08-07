// Seelie 计算工具函数

import type { CharacterDataInput, WeaponData } from './types'
import {
  ASCENSIONS,
  getCharacterStats,
  getWeaponStats,
  getWeaponStatsCommon
} from './constants'
import { logger } from '../logger'

/**
 * 计算角色突破等级
 */
export async function calculateCharacterAsc(character: CharacterDataInput['avatar']): Promise<number> {
  try {
    const characterStats = await getCharacterStats()
    const stats = characterStats.find(s => s.id === character.id)
    if (!stats) {
      logger.warn(`⚠️ 未找到角色 ${character.name_mi18n} 的统计数据`)
      return ASCENSIONS.findIndex(level => level >= character.level)
    }

    const hpProperty = character.properties.find(p => p.property_id === 1)
    if (!hpProperty) {
      logger.warn(`⚠️ 角色 ${character.name_mi18n} 缺少生命值属性`)
      return ASCENSIONS.findIndex(level => level >= character.level)
    }

    const actualHP = parseInt(hpProperty.base || hpProperty.final)
    const baseHP = stats.base
    const growthHP = (character.level - 1) * stats.growth / 10000
    const coreSkill = character.skills.find(s => s.skill_type === 5)
    const coreHP = (coreSkill && stats.core) ? (stats.core[coreSkill.level - 2] || 0) : 0
    const calculatedBaseHP = baseHP + growthHP + coreHP

    // 查找匹配的突破等级
    for (let i = 0; i < stats.ascHP.length; i++) {
      const ascHP = stats.ascHP[i]
      if (Math.floor(calculatedBaseHP + ascHP) === actualHP) {
        return i
      }
    }

    logger.debug(`HP error: ${character.name_mi18n}, base: ${baseHP}, growth: ${growthHP}, core: ${coreHP}, fixed: ${calculatedBaseHP}, target: ${actualHP}`)
    return ASCENSIONS.findIndex(level => level >= character.level)
  } catch (error) {
    logger.error('❌ 计算角色突破等级失败:', error)
    return ASCENSIONS.findIndex(level => level >= character.level)
  }
}

/**
 * 计算武器突破等级
 */
export async function calculateWeaponAsc(weapon: WeaponData): Promise<number> {
  try {
    const weaponStatsCommon = await getWeaponStatsCommon()
    const weaponStats = await getWeaponStats()

    const levelRate = weaponStatsCommon.rate[weapon.level] || 0
    const atkProperty = weapon.main_properties.find(p => p.property_id === 12101)
    if (!atkProperty) {
      logger.warn(`⚠️ 武器 ${weapon.name} 缺少攻击力属性`)
      return ASCENSIONS.findIndex(level => level >= weapon.level)
    }

    const actualATK = parseInt(atkProperty.base)
    const baseATK = weaponStats[weapon.id] || 48
    const growthATK = baseATK * levelRate / 10000
    const calculatedBaseATK = baseATK + growthATK

    // 查找匹配的突破等级
    for (let i = 0; i < weaponStatsCommon.ascRate.length; i++) {
      const ascRate = weaponStatsCommon.ascRate[i]
      const ascATK = baseATK * ascRate / 10000
      if (Math.floor(calculatedBaseATK + ascATK) === actualATK) {
        return i
      }
    }
    
    logger.debug(`ATK error: ${weapon.name}, base: ${baseATK}, growth: ${growthATK}, fixed: ${calculatedBaseATK}, target: ${actualATK}`)
    return ASCENSIONS.findIndex(level => level >= weapon.level)
  } catch (error) {
    logger.error('❌ 计算武器突破等级失败:', error)
    return ASCENSIONS.findIndex(level => level >= weapon.level)
  }
}

/**
 * 计算技能等级（考虑命座加成）
 */
export function calculateSkillLevel(skillLevel: number, skillType: string, characterRank: number): number {
  let currentLevel = skillLevel

  if (skillType === 'core') {
    currentLevel-- // 核心被动等级减1
  } else if (characterRank >= 5) {
    currentLevel -= 4 // 5命以上减4
  } else if (characterRank >= 3) {
    currentLevel -= 2 // 3命以上减2
  }

  return Math.max(1, currentLevel) // 确保等级不小于1
}