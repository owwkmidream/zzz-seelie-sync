// Seelie 计算工具函数

import type { CharacterDataInput, WeaponData } from '../../types/seelie'
import { CHARACTERS_STATS, ASCENSIONS, WEAPONS_STATS_COMMON, WEAPONS_STATS } from './constants'

/**
 * 计算角色突破等级
 */
export function calculateCharacterAsc(character: CharacterDataInput['avatar']): number {
  const stats = CHARACTERS_STATS.find(s => s.id === character.id)
  if (!stats) {
    console.warn(`⚠️ 未找到角色 ${character.name_mi18n} 的统计数据`)
    return ASCENSIONS.findIndex(level => level >= character.level)
  }

  const hpProperty = character.properties.find(p => p.property_id === 1)
  if (!hpProperty) {
    console.warn(`⚠️ 角色 ${character.name_mi18n} 缺少生命值属性`)
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

  console.log(`HP error: ${character.name_mi18n}, base: ${baseHP}, growth: ${growthHP}, core: ${coreHP}, fixed: ${calculatedBaseHP}, target: ${actualHP}`)
  return ASCENSIONS.findIndex(level => level >= character.level)
}

/**
 * 计算武器突破等级
 */
export function calculateWeaponAsc(weapon: WeaponData): number {
  const levelRate = WEAPONS_STATS_COMMON.rate[weapon.level] || 0
  const atkProperty = weapon.main_properties.find(p => p.property_id === 12101)
  if (!atkProperty) {
    console.warn(`⚠️ 武器 ${weapon.name} 缺少攻击力属性`)
    return ASCENSIONS.findIndex(level => level >= weapon.level)
  }

  const actualATK = parseInt(atkProperty.base)
  const baseATK = WEAPONS_STATS[weapon.id] || 500
  const growthATK = baseATK * levelRate / 10000
  const calculatedBaseATK = baseATK + growthATK

  // 查找匹配的突破等级
  for (let i = 0; i < WEAPONS_STATS_COMMON.ascRate.length; i++) {
    const ascRate = WEAPONS_STATS_COMMON.ascRate[i]
    const ascATK = baseATK * ascRate / 10000
    if (Math.floor(calculatedBaseATK + ascATK) === actualATK) {
      return i
    }
  }

  console.log(`ATK error: ${weapon.name}, base: ${baseATK}, growth: ${growthATK}, fixed: ${calculatedBaseATK}, target: ${actualATK}`)
  return ASCENSIONS.findIndex(level => level >= weapon.level)
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