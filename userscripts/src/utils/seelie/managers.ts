// Seelie 数据管理器

import type { CharacterDataInput, SyncResult, BatchSyncResult } from '../../types/seelie'
import { SeelieCore } from './core'
import { calculateCharacterAsc, calculateWeaponAsc, calculateSkillLevel } from './calculators'
import { SKILLS, WEAPONS } from './constants'

/**
 * 角色数据管理器
 */
export class CharacterManager extends SeelieCore {
  /**
   * 设置角色基础数据
   */
  setCharacter(data: CharacterDataInput): boolean {
    try {
      const character = data.avatar || data
      const characterKey = this.findCharacterKey(character.id)

      if (!characterKey) {
        throw new Error("Character not found.")
      }

      const existingGoal = this.findExistingGoal(characterKey, "character")
      const currentAsc = calculateCharacterAsc(character)

      let targetLevel = existingGoal?.goal?.level
      if (!targetLevel || targetLevel < character.level) {
        targetLevel = character.level
      }

      let targetAsc = existingGoal?.goal?.asc
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
        console.log('✓ 角色数据设置成功:', {
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
      console.error('❌ 设置角色数据失败:', error)
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
      const talents: any = {}

      character.skills.forEach(skill => {
        const skillType = SKILLS[skill.skill_type]
        if (!skillType) return

        const currentLevel = calculateSkillLevel(skill.level, skillType, character.rank)
        let targetLevel = existingGoal?.[skillType]?.goal
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
        console.log('✓ 角色天赋数据设置成功:', { character: characterKey, talents })
        return true
      }

      return false
    } catch (error) {
      console.error('❌ 设置角色天赋数据失败:', error)
      return false
    }
  }

  /**
   * 设置武器数据
   */
  setWeapon(data: CharacterDataInput): boolean {
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
          console.log('✓ 移除武器目标成功')
        }
        return true
      }

      const weaponKey = this.findWeaponKey(weapon.id)
      if (!weaponKey) {
        throw new Error("Weapon not found.")
      }

      const currentAsc = calculateWeaponAsc(weapon)
      const current = {
        level: weapon.level,
        asc: currentAsc
      }

      let goal = {
        level: current.level,
        asc: current.asc
      }

      // 处理现有目标
      const existingWeapon = existingGoal ? WEAPONS[existingGoal.weapon] : null
      const newWeapon = WEAPONS[weaponKey]

      if (existingWeapon?.id === newWeapon?.id) {
        // 同一把武器，保持现有目标
        goal.level = Math.max(existingGoal.goal.level, current.level)
        goal.asc = Math.max(existingGoal.goal.asc, current.asc)

        if (newWeapon?.craftable) {
          (current as any).craft = weapon.star;
          (goal as any).craft = Math.max(existingGoal.goal.craft || weapon.star, weapon.star)
        }
      } else {
        // 不同武器，处理可锻造武器
        if (newWeapon?.craftable) {
          (current as any).craft = weapon.star;
          (goal as any).craft = weapon.star
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
        console.log('✓ 武器数据设置成功:', {
          character: characterKey,
          weapon: weaponKey,
          current,
          goal
        })
        return true
      }

      return false
    } catch (error) {
      console.error('❌ 设置武器数据失败:', error)
      return false
    }
  }

  /**
   * 同步单个角色的完整数据
   */
  syncCharacter(data: CharacterDataInput): SyncResult {
    const result: SyncResult = {
      success: 0,
      failed: 0,
      errors: []
    }

    const character = data.avatar || data
    const characterName = character.name_mi18n || `角色ID:${character.id}`

    console.log(`🔄 开始同步角色: ${characterName}`)

    const operations = [
      { name: '角色数据', fn: () => this.setCharacter(data) },
      { name: '天赋数据', fn: () => this.setTalents(data) },
      { name: '武器数据', fn: () => this.setWeapon(data) }
    ]

    operations.forEach(({ name, fn }) => {
      try {
        if (fn()) {
          result.success++
          console.log(`✓ ${characterName} - ${name}同步成功`)
        } else {
          result.failed++
          result.errors.push(`${characterName} - ${name}同步失败`)
        }
      } catch (error) {
        result.failed++
        const errorMsg = `${characterName} - ${name}同步错误: ${error}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    })

    console.log(`✅ ${characterName} 同步完成 - 成功: ${result.success}, 失败: ${result.failed}`)
    return result
  }

  /**
   * 同步多个角色的完整数据
   */
  syncAllCharacters(dataList: CharacterDataInput[]): BatchSyncResult {
    const overallResult: BatchSyncResult = {
      total: dataList.length,
      success: 0,
      failed: 0,
      errors: [],
      details: []
    }

    console.log(`🚀 开始批量同步 ${dataList.length} 个角色`)

    dataList.forEach((data, index) => {
      const character = data.avatar || data
      const characterName = character.name_mi18n || `角色ID:${character.id}`

      console.log(`📝 [${index + 1}/${dataList.length}] 同步角色: ${characterName}`)

      try {
        const result = this.syncCharacter(data)

        overallResult.details.push({
          character: characterName,
          result
        })

        if (result.failed === 0) {
          overallResult.success++
        } else {
          overallResult.failed++
          overallResult.errors.push(...result.errors)
        }
      } catch (error) {
        overallResult.failed++
        const errorMsg = `${characterName} - 批量同步失败: ${error}`
        overallResult.errors.push(errorMsg)
        overallResult.details.push({
          character: characterName,
          result: { success: 0, failed: 1, errors: [errorMsg] }
        })
        console.error(`❌ ${errorMsg}`)
      }
    })

    this.logBatchResult(overallResult)
    this.showBatchToast(overallResult)

    return overallResult
  }

  /**
   * 查找角色键名
   */
  private findCharacterKey(characterId: number): string | null {
    const characters = this.getCharacters()
    return Object.keys(characters).find(key => characters[key].id === characterId) || null
  }

  /**
   * 查找武器键名
   */
  private findWeaponKey(weaponId: number): string | null {
    return Object.keys(WEAPONS).find(key => WEAPONS[key].id === weaponId) || null
  }

  /**
   * 查找现有目标
   */
  private findExistingGoal(characterKey: string, type: string): any {
    const goals = this.getGoals()
    return goals.find((goal: any) => goal.character === characterKey && goal.type === type)
  }

  /**
   * 记录批量同步结果
   */
  private logBatchResult(result: BatchSyncResult): void {
    console.log(`🎯 批量同步完成:`)
    console.log(`   总计: ${result.total} 个角色`)
    console.log(`   成功: ${result.success} 个角色`)
    console.log(`   失败: ${result.failed} 个角色`)

    if (result.errors.length > 0) {
      console.log(`   错误详情:`)
      result.errors.forEach(error => console.log(`     - ${error}`))
    }
  }

  /**
   * 显示批量同步 Toast
   */
  private showBatchToast(result: BatchSyncResult): void {
    if (result.success > 0) {
      this.setToast(
        `成功同步 ${result.success}/${result.total} 个角色`,
        result.failed === 0 ? 'success' : 'warning'
      )
    }

    if (result.failed > 0) {
      this.setToast(
        `${result.failed} 个角色同步失败，请查看控制台`,
        'error'
      )
    }
  }
}