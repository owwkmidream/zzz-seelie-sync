// Seelie 计算工具函数

import type { CharacterDataInput, WeaponData, CharacterInfo, WeaponInfo } from './types'
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

/**
 * 使用贪心算法找到最小集合覆盖的角色ID列表
 * 目标是用最少的角色覆盖所有属性组合（属性、风格、模拟材料、周本）
 */
export function findMinimumSetCoverIds(charactersData: Record<string, CharacterInfo>): string[] {
  // 将对象转换为数组，以便于迭代
  const charactersArray = Object.values(charactersData)

  // 步骤 1: 提取所有唯一的属性值，构建"全集"
  const universeOfAttributes = new Set<string>()
  for (const char of charactersArray) {
    universeOfAttributes.add(char.attribute)
    universeOfAttributes.add(char.style)
    universeOfAttributes.add(char.boss)
    universeOfAttributes.add(char.boss_weekly)
  }

  // 初始化
  const attributesToCover = new Set(universeOfAttributes)
  const resultIds: string[] = []
  const usedCharacterIds = new Set<number>() // 跟踪已选择的角色，避免重复选择

  // 步骤 2 & 3: 循环迭代，直到所有属性都被覆盖
  while (attributesToCover.size > 0) {
    let bestCharacter: CharacterInfo | null = null
    let maxCoveredCount = 0

    // 寻找能覆盖最多"未覆盖"属性的角色
    for (const char of charactersArray) {
      // 如果角色已被选择，则跳过
      if (usedCharacterIds.has(char.id)) {
        continue
      }

      const characterAttributes = new Set([
        char.attribute,
        char.style,
        char.boss,
        char.boss_weekly,
      ])

      // 计算当前角色能覆盖的"未覆盖"属性数量
      let currentCoverCount = 0
      for (const attr of characterAttributes) {
        if (attributesToCover.has(attr)) {
          currentCoverCount++
        }
      }

      if (currentCoverCount > maxCoveredCount) {
        maxCoveredCount = currentCoverCount
        bestCharacter = char
      }
    }

    // 如果找不到能覆盖任何新属性的角色，则退出以避免死循环
    if (bestCharacter === null) {
      logger.warn("⚠️ 无法覆盖所有属性，可能缺少某些属性的组合")
      break
    }

    // 将找到的最佳角色添加到结果中，并更新"未覆盖属性"集合
    resultIds.push(bestCharacter.id.toString())
    usedCharacterIds.add(bestCharacter.id)

    const bestCharacterAttributes = new Set([
      bestCharacter.attribute,
      bestCharacter.style,
      bestCharacter.boss,
      bestCharacter.boss_weekly,
    ])

    for (const attr of bestCharacterAttributes) {
      attributesToCover.delete(attr)
    }

    logger.debug(`✅ 选择角色 ${bestCharacter.id}，覆盖 ${maxCoveredCount} 个属性`)
  }

  logger.debug(`🎯 最小集合覆盖完成，共选择 ${resultIds.length} 个角色: ${resultIds.join(', ')}`)
  return resultIds
}


/**
 * 返回每个职业对应一个武器
 */
export function findMinimumSetWeapons(weaponsData: Record<string, WeaponInfo>): Record<string, string> {
  // 将对象转换为数组，以便于迭代
  const weaponsArray = Object.values(weaponsData);
  const result: Record<string, string> = {}; // 用于存储 style -> id 的映射

  for (const weapon of weaponsArray) {
    if (weapon.tier === 5 && !result[weapon.style]) {
      result[weapon.style] = weapon.id.toString();
    }
  }

  return result;
}
