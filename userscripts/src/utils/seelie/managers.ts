// Seelie 数据管理器

import type { CharacterDataInput, SyncResult, BatchSyncResult, CharacterInfo, WeaponInfo } from './types'
import { SeelieCore } from './core'
import { calculateCharacterAsc, calculateWeaponAsc, calculateSkillLevel } from './calculators'
import { SKILLS } from './constants'
import { logger } from '../logger'

/**
 * 角色数据管理器
 */
export class CharacterManager extends SeelieCore {
  /**
   * 设置角色基础数据
   */
  async setCharacter(data: CharacterDataInput): Promise<boolean> {
    try {
      const character = data.avatar || data
      const characterKey = this.findCharacterKey(character.id)

      if (!characterKey) {
        throw new Error("Character not found.")
      }

      const existingGoal = this.findExistingGoal(characterKey, "character")
      const currentAsc = await calculateCharacterAsc(character)

      const existingGoalData = existingGoal as { goal?: { level?: number; asc?: number } } | undefined
      let targetLevel = existingGoalData?.goal?.level
      if (!targetLevel || targetLevel < character.level) {
        targetLevel = character.level
      }

      let targetAsc = existingGoalData?.goal?.asc
      if (!targetAsc || targetAsc < currentAsc) {
        targetAsc = currentAsc
      }

      const goal = {
        type: "character",
        character: characterKey,
        cons: character.rank,
        current: {
          level: character.level,
          asc: currentAsc
        },
        goal: {
          level: targetLevel || character.level,
          asc: targetAsc || currentAsc
        }
      }

      if (this.addGoal(goal)) {
        logger.debug('✓ 角色数据设置成功:', {
          character: characterKey,
          level: character.level,
          rank: character.rank,
          currentAsc,
          targetLevel,
          targetAsc
        })
        return true
      }

      return false
    } catch (error) {
      logger.error('❌ 设置角色数据失败:', error)
      return false
    }
  }

  /**
   * 设置角色天赋数据
   */
  setTalents(data: CharacterDataInput): boolean {
    try {
      const character = data.avatar || data
      const characterKey = this.findCharacterKey(character.id)

      if (!characterKey) {
        throw new Error("Character not found.")
      }

      const existingGoal = this.findExistingGoal(characterKey, "talent")
      const talents: Record<string, { current: number; goal: number }> = {}

      character.skills.forEach(skill => {
        const skillType = SKILLS[skill.skill_type]
        if (!skillType) return

        const currentLevel = calculateSkillLevel(skill.level, skillType, character.rank)
        const existingSkillGoal = existingGoal as Record<string, { goal?: number }> | undefined
        let targetLevel = existingSkillGoal?.[skillType]?.goal
        if (!targetLevel || targetLevel < currentLevel) {
          targetLevel = currentLevel
        }

        talents[skillType] = {
          current: currentLevel,
          goal: targetLevel || currentLevel
        }
      })

      const goal = {
        type: "talent",
        character: characterKey,
        ...talents
      }

      if (this.addGoal(goal)) {
        logger.debug('✓ 角色天赋数据设置成功:', { character: characterKey, talents })
        return true
      }

      return false
    } catch (error) {
      logger.error('❌ 设置角色天赋数据失败:', error)
      return false
    }
  }

  /**
   * 设置武器数据
   */
  async setWeapon(data: CharacterDataInput): Promise<boolean> {
    try {
      const character = data.avatar || data
      const weapon = data.weapon
      const characterKey = this.findCharacterKey(character.id)

      if (!characterKey) {
        throw new Error("Character not found.")
      }

      const existingGoal = this.findExistingGoal(characterKey, "weapon")

      // 如果没有武器数据，移除现有目标
      if (!weapon) {
        if (existingGoal && this.removeGoal(existingGoal)) {
          logger.debug('✓ 移除武器目标成功')
        }
        return true
      }

      const weaponKey = this.findWeaponKey(weapon.id)
      if (!weaponKey) {
        throw new Error("Weapon not found.")
      }

      const currentAsc = await calculateWeaponAsc(weapon)
      const current = {
        level: weapon.level,
        asc: currentAsc
      }

      let goal = {
        level: current.level,
        asc: current.asc
      }

      // 处理现有目标
      const weapons: Record<string, WeaponInfo> = this.getWeapons()
      const existingGoalData = existingGoal as { weapon?: string; goal?: { level?: number; asc?: number; craft?: number } } | undefined
      const existingWeapon: WeaponInfo | null = existingGoalData?.weapon ? weapons[existingGoalData.weapon] : null
      const newWeapon: WeaponInfo = weapons[weaponKey]

      if (existingWeapon?.id === newWeapon?.id && existingGoalData?.goal) {
        // 同一把武器，保持现有目标
        goal.level = Math.max(existingGoalData.goal.level || current.level, current.level)
        goal.asc = Math.max(existingGoalData.goal.asc || current.asc, current.asc)

        if (newWeapon.craftable) {
          (current as Record<string, unknown>).craft = weapon.star;
          (goal as Record<string, unknown>).craft = Math.max(existingGoalData.goal.craft || weapon.star, weapon.star)
        }
      } else {
        // 不同武器，处理可锻造武器
        if (newWeapon.craftable) {
          (current as Record<string, unknown>).craft = weapon.star;
          (goal as Record<string, unknown>).craft = weapon.star
        }
      }

      const weaponGoal = {
        type: "weapon",
        character: characterKey,
        weapon: weaponKey,
        current,
        goal
      }

      if (this.addGoal(weaponGoal)) {
        logger.debug('✓ 武器数据设置成功:', {
          character: characterKey,
          weapon: weaponKey,
          current,
          goal
        })
        return true
      }

      return false
    } catch (error) {
      logger.error('❌ 设置武器数据失败:', error)
      return false
    }
  }

  /**
   * 同步单个角色的完整数据
   */
  async syncCharacter(data: CharacterDataInput): Promise<SyncResult> {
    const result: SyncResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    const character = data.avatar || data
    const characterName = character.name_mi18n || `角色ID:${character.id}`

    logger.debug(`🔄 开始同步角色: ${characterName}`)

    const operations = [
      { name: '角色数据', fn: () => this.setCharacter(data) },
      { name: '天赋数据', fn: () => this.setTalents(data) },
      { name: '武器数据', fn: () => this.setWeapon(data) }
    ]

    const operationPromises = operations.map(async ({ name, fn }) => {
      try {
        const success = await fn()
        if (success) {
          logger.debug(`✓ ${characterName} - ${name}同步成功`)
          return { success: true, error: null }
        } else {
          const errorMsg = `${characterName} - ${name}同步失败`
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        const errorMsg = `${characterName} - ${name}同步错误: ${error}`
        logger.error(`❌ ${errorMsg}`)
        return { success: false, error: errorMsg }
      }
    })

    const results = await Promise.all(operationPromises)

    results.forEach(({ success, error }) => {
      if (success) {
        result.success++
      } else {
        result.failed++
        if (error) {
          result.errors.push(error)
        }
      }
    })

    logger.debug(`✅ ${characterName} 同步完成 - 成功: ${result.success}, 失败: ${result.failed}`)
    return result
  }

  /**
   * 同步多个角色的完整数据
   */
  async syncAllCharacters(dataList: CharacterDataInput[]): Promise<BatchSyncResult> {
    const overallResult: BatchSyncResult = {
      total: dataList.length,
      success: 0,
      failed: 0,
      errors: [],
      details: []
    }

    logger.debug(`🚀 开始批量同步 ${dataList.length} 个角色`)

    const syncPromises = dataList.map(async (data, index) => {
      const character = data.avatar || data
      const characterName = character.name_mi18n || `角色ID:${character.id}`

      logger.debug(`📝 [${index + 1}/${dataList.length}] 同步角色: ${characterName}`)

      try {
        const result = await this.syncCharacter(data)
        return {
          character: characterName,
          result,
          success: result.failed === 0
        }
      } catch (error) {
        const errorMsg = `${characterName} - 批量同步失败: ${error}`
        logger.error(`❌ ${errorMsg}`)
        return {
          character: characterName,
          result: { success: 0, failed: 1, errors: [errorMsg] },
          success: false
        }
      }
    })

    const results = await Promise.all(syncPromises)

    results.forEach(({ character, result, success }) => {
      overallResult.details.push({
        character,
        result
      })

      if (success) {
        overallResult.success++
      } else {
        overallResult.failed++
        overallResult.errors.push(...result.errors)
      }
    })

    this.logBatchResult(overallResult)
    // this.showBatchToast(overallResult)

    return overallResult
  }

  /**
   * 查找角色键名
   */
  private findCharacterKey(characterId: number): string | null {
    const characters: Record<string, CharacterInfo> = this.getCharacters()
    return Object.keys(characters).find(key => characters[key].id === characterId) || null
  }

  /**
   * 查找武器键名
   */
  private findWeaponKey(weaponId: number): string | null {
    const weapons: Record<string, WeaponInfo> = this.getWeapons()
    return Object.keys(weapons).find(key => weapons[key].id === weaponId) || null
  }

  /**
   * 查找现有目标
   */
  private findExistingGoal(characterKey: string, type: string): Record<string, unknown> | undefined {
    const goals = this.getGoals()
    return goals.find((goal: unknown) => {
      const g = goal as Record<string, unknown>
      return g.character === characterKey && g.type === type
    }) as Record<string, unknown> | undefined
  }

  /**
   * 记录批量同步结果
   */
  private logBatchResult(result: BatchSyncResult): void {
    logger.debug(`🎯 批量同步完成:`)
    logger.debug(`   总计: ${result.total} 个角色`)
    logger.debug(`   成功: ${result.success} 个角色`)
    logger.debug(`   失败: ${result.failed} 个角色`)

    if (result.errors.length > 0) {
      logger.debug(`   错误详情:`)
      result.errors.forEach(error => logger.debug(`     - ${error}`))
    }
  }

  /**
   * 显示批量同步 Toast
   */
  // private showBatchToast(result: BatchSyncResult): void {
  //   if (result.success > 0) {
  //     this.setToast(
  //       `成功同步 ${result.success}/${result.total} 个角色`,
  //       result.failed === 0 ? 'success' : 'warning'
  //     )
  //   }

  //   if (result.failed > 0) {
  //     this.setToast(
  //       `${result.failed} 个角色同步失败，请查看控制台`,
  //       'error'
  //     )
  //   }
  // }
}