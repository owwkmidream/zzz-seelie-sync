import { logger } from '@logger'
import {
  getAvatarBasicList,
  batchGetAvatarDetail,
  getGameNote,
  AvatarCalcData
} from '@/api/hoyo'
import {
  setResinData,
  setToast,
  syncCharacter,
  syncAllCharacters as seelieSync,
  type CharacterDataInput,
  type ResinDataInput,
  type SyncResult,
  type BatchSyncResult,
  findMinimumSetCoverIds,
  findMinimumSetWeapons,
  getItems,
  setInventory
} from '@/utils/seelie'
import { batchGetAvatarItemCalc } from '../api/hoyo/items'
import { ItemsData, SeelieLanguageData } from '../utils/seelie/types'
import { getLanguageData } from '../utils/seelie/constants'

/**
 * 同步服务类
 * 负责协调 API 层和 Seelie 工具层之间的数据同步
 */
export class SyncService {

  /**
   * 同步电量（树脂）数据
   */
  async syncResinData(): Promise<boolean> {
    try {
      logger.debug('🔋 开始同步电量数据...')

      // 获取游戏便笺数据
      const gameNote = await getGameNote()
      if (!gameNote) {
        logger.error('❌ 获取游戏便笺失败')
        setToast('获取游戏便笺失败', 'error')
        return false
      }

      // 构造树脂数据
      const resinData: ResinDataInput = gameNote.energy;

      // 设置到 Seelie
      const success = setResinData(resinData)

      if (success) {
        logger.debug('✅ 电量数据同步成功')
        setToast(`电量同步成功: ${resinData.progress.current}/${resinData.progress.max}`, 'success')
      } else {
        logger.error('❌ 电量数据设置失败')
        setToast('电量数据设置失败', 'error')
      }

      return success
    } catch (error) {
      logger.error('❌ 电量数据同步失败:', error)
      setToast('电量数据同步失败', 'error')
      return false
    }
  }

  /**
   * 同步单个角色数据
   */
  async syncSingleCharacter(avatarId: number): Promise<SyncResult> {
    try {
      logger.debug(`👤 开始同步角色数据: ${avatarId}`)

      // 获取角色详细信息
      const avatarDetails = await batchGetAvatarDetail([avatarId], undefined)
      if (!avatarDetails || avatarDetails.length === 0) {
        const message = '获取角色详细信息失败'
        logger.error(`❌ ${message}`)
        setToast(message, 'error')
        return { success: 0, failed: 1, errors: [message] }
      }

      const avatarDetail = avatarDetails[0]

      // 同步角色数据
      const result = await syncCharacter(avatarDetail as unknown as CharacterDataInput)

      if (result.success > 0) {
        logger.debug(`✅ 角色 ${avatarDetail.avatar.name_mi18n} 同步成功`)
        setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步成功`, 'success')
      } else {
        logger.error(`❌ 角色 ${avatarDetail.avatar.name_mi18n} 同步失败`)
        setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步失败`, 'error')
      }

      return result
    } catch (error) {
      const message = `角色 ${avatarId} 同步失败`
      logger.error(`❌ ${message}:`, error)
      setToast(message, 'error')
      return { success: 0, failed: 1, errors: [String(error)] }
    }
  }

  /**
   * 同步所有角色数据
   */
  async syncAllCharacters(): Promise<BatchSyncResult> {
    try {
      logger.debug('👥 开始同步所有角色数据...')

      // 获取角色基础列表
      const avatarList = await getAvatarBasicList()
      if (!avatarList || avatarList.length === 0) {
        const message = '获取角色列表失败或角色列表为空'
        logger.error(`❌ ${message}`)
        setToast(message, 'error')
        return {
          success: 0,
          failed: 1,
          errors: [message],
          total: 0,
          details: []
        }
      }

      logger.debug(`📋 找到 ${avatarList.length} 个角色`)
      setToast(`开始同步 ${avatarList.length} 个角色...`, '')

      // 获取所有角色的详细信息
      const avatarIds = avatarList.map(avatar => avatar.avatar.id)
      const avatarDetails = await batchGetAvatarDetail(avatarIds, undefined)

      if (!avatarDetails || avatarDetails.length === 0) {
        const message = '获取角色详细信息失败'
        logger.error(`❌ ${message}`)
        setToast(message, 'error')
        return {
          success: 0,
          failed: 1,
          errors: [message],
          total: 0,
          details: []
        }
      }

      // 批量同步角色数据
      const batchResult = await seelieSync(avatarDetails as unknown as CharacterDataInput[])

      if (batchResult.success > 0) {
        logger.debug(`✅ 所有角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`)
        setToast(`角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, 'success')
      } else {
        logger.error(`❌ 角色批量同步失败`)
        setToast('角色批量同步失败', 'error')
      }

      return batchResult
    } catch (error) {
      const message = '所有角色同步失败'
      logger.error(`❌ ${message}:`, error)
      setToast(message, 'error')
      return {
        success: 0,
        failed: 1,
        errors: [String(error)],
        total: 0,
        details: []
      }
    }
  }

  /**
   * 同步养成材料数据
   */
  async syncItemsData(): Promise<boolean> {
    try {
      logger.debug('🔋 开始始同步养成材料数据...')

      // 获取最小集合数据
      const minSetChar = findMinimumSetCoverIds()
      const minSetWeapon = findMinimumSetWeapons()

      // 构建请求参数
      const calcParams = minSetChar.map(item => ({
        avatar_id: item.id,
        weapon_id: minSetWeapon[item.style]
      }))

      // 获取养成材料数据
      const itemsData = await batchGetAvatarItemCalc(calcParams)
      if (!itemsData) {
        const message = '获取养成材料数据失败'
        logger.error(`❌ ${message}`)
        setToast(message, 'error')
        return false
      }

      // 收集所有物品信息
      const allItemsInfo = this.collectAllItemsInfo(itemsData)

      // 构建物品数据映射
      const itemsInventory = this.buildItemsInventory(itemsData, allItemsInfo)

      // 获取语言数据和物品信息
      const seelieItems = getItems() as ItemsData
      seelieItems["denny"] = {type: "denny"}
      const i18nData = await getLanguageData()

      if (!i18nData) {
        const message = '获取语言数据失败'
        logger.error(`❌ ${message}`)
        setToast(message, 'error')
        return false
      }

      // 构建中文名称到 Seelie 物品名称的映射
      const cnName2SeelieItemName = this.buildCnToSeelieNameMapping(i18nData)

      // 同步到 Seelie
      const { successNum, failNum } = this.syncItemsToSeelie(
        itemsInventory,
        cnName2SeelieItemName,
        seelieItems
      )

      const success = successNum > 0
      const total = successNum + failNum

      if (success) {
        logger.debug(`✅ 养成材料同步成功: ${successNum}/${total}`)
        const toastType = failNum === 0 ? 'success' : 'warning'
        setToast(`养成材料同步成功: ${successNum}/${total}`, toastType)
      } else {
        logger.error('❌ 养成材料同步失败')
        setToast('养成材料同步失败', 'error')
      }

      return success
    } catch (error) {
      const message = '养成材料同步失败'
      logger.error(`❌ ${message}:`, error)
      setToast(message, 'error')
      return false
    }
  }

  /**
   * 收集所有物品信息（从所有消耗类型中获取完整的物品信息）
   */
  private collectAllItemsInfo(itemsData: AvatarCalcData[]): Record<string, { id: number; name: string }> {
    const allItemsInfo: Record<string, { id: number; name: string }> = {}

    for (const data of itemsData) {
      // 从所有消耗类型中收集物品信息
      const allConsumes = [
        ...data.avatar_consume,
        ...data.weapon_consume,
        ...data.skill_consume,
        ...data.need_get
      ]

      for (const item of allConsumes) {
        const id = item.id.toString()
        if (!(id in allItemsInfo)) {
          allItemsInfo[id] = {
            id: item.id,
            name: item.name
          }
        }
      }
    }

    return allItemsInfo
  }

  /**
   * 构建物品库存数据（名称到数量的映射）
   */
  private buildItemsInventory(
    itemsData: AvatarCalcData[],
    allItemsInfo: Record<string, { id: number; name: string }>
  ): Record<string, number> {
    const inventory: Record<string, number> = {}

    // 合并所有用户拥有的材料
    const userOwnItems: Record<string, number> = {}
    for (const data of itemsData) {
      Object.assign(userOwnItems, data.user_owns_materials)
    }

    // 为所有物品构建名称到数量的映射
    for (const [id, itemInfo] of Object.entries(allItemsInfo)) {
      const count = userOwnItems[id] || 0 // 如果用户没有该物品，数量为0
      inventory[itemInfo.name] = count
    }

    return inventory
  }

  /**
   * 构建中文名称到 Seelie 物品名称的映射
   */
  private buildCnToSeelieNameMapping(i18nData: SeelieLanguageData): Record<string, string> {
    const mapping: Record<string, string> = {}

    for (const [key, value] of Object.entries(i18nData)) {
      if (typeof value === 'string') {
        mapping[value] = key
      } else if (Array.isArray(value)) {
        value.forEach((v, index) => {
          mapping[v] = `${key}+${index}`
        })
      }
    }

    return mapping
  }

  /**
   * 同步物品到 Seelie
   */
  private syncItemsToSeelie(
    itemsInventory: Record<string, number>,
    cnName2SeelieItemName: Record<string, string>,
    seelieItems: ItemsData
  ): { successNum: number; failNum: number } {
    let successNum = 0
    let failNum = 0

    for (const [cnName, count] of Object.entries(itemsInventory)) {
      const seelieName = cnName2SeelieItemName[cnName]
      if (!seelieName) {
        failNum++
        console.error("尝试操作物品出错", seelieName, cnName, cnName2SeelieItemName[cnName])
        continue
      }

      try {
        const seelieNameParts = seelieName.split('+')

        if (seelieNameParts.length > 1) {
          // 处理分层物品（如物理芯片）
          const realName = seelieNameParts[0]
          const tier = Number(seelieNameParts[1])
          const type = seelieItems[realName].type

          if (type && setInventory(type, realName, tier, count)) {
            successNum++
          } else {
            failNum++
            console.error("尝试操作物品出错", type, realName, tier, count)
          }
        } else {
          // 处理普通物品
          const type = seelieItems[seelieName]?.type

          if (type && setInventory(type, seelieName, 0, count)) {
            successNum++
          } else {
            failNum++
            console.error("尝试操作物品出错", type, seelieName, 0, count)
          }
        }
      } catch {
        failNum++
      }
    }

    return { successNum, failNum }
  }

  /**
   * 执行完整同步（电量 + 所有角色 + 养成材料）
   */
  async syncAll(): Promise<{
    resinSync: boolean
    characterSync: BatchSyncResult
    itemsSync: boolean
  }> {
    logger.debug('🚀 开始执行完整同步...')
    setToast('开始执行完整同步...', '')

    // 并行执行所有同步任务
    const [resinSync, characterSync, itemsSync] = await Promise.all([
      this.syncResinData(),
      this.syncAllCharacters(),
      this.syncItemsData()
    ])

    const totalSuccess = resinSync && characterSync.success > 0 && itemsSync
    const message = totalSuccess
      ? '完整同步成功'
      : '完整同步部分失败'

    logger.debug(`${totalSuccess ? '✅' : '⚠️'} ${message}`)
    setToast(message, totalSuccess ? 'success' : 'error')

    return { resinSync, characterSync, itemsSync }
  }
}

// 创建全局实例
export const syncService = new SyncService()

// 导出便捷函数
/**
 * 同步电量数据
 */
export const syncResinData = (): Promise<boolean> => {
  return syncService.syncResinData()
}

/**
 * 同步单个角色数据
 */
export const syncSingleCharacter = (avatarId: number): Promise<SyncResult> => {
  return syncService.syncSingleCharacter(avatarId)
}

/**
 * 同步所有角色数据
 */
export const syncAllCharacters = (): Promise<BatchSyncResult> => {
  return syncService.syncAllCharacters()
}

/**
 * 同步养成材料数据
 */
export const syncItemsData = (): Promise<boolean> => {
  return syncService.syncItemsData()
}

/**
 * 执行完整同步（电量 + 所有角色 + 养成材料）
 */
export const syncAll = (): Promise<{
  resinSync: boolean
  characterSync: BatchSyncResult
  itemsSync: boolean
}> => {
  return syncService.syncAll()
}

// 挂载到全局对象，方便调试
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const globalWindow = window as unknown as Record<string, unknown>
  globalWindow.syncService = syncService
  globalWindow.syncResinData = syncResinData
  globalWindow.syncSingleCharacter = syncSingleCharacter
  globalWindow.syncAllCharacters = syncAllCharacters
  globalWindow.syncItemsData = syncItemsData
  globalWindow.syncAll = syncAll
}