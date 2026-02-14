import { logger } from '@logger'
import {
  getAvatarBasicList,
  batchGetAvatarDetail,
  getGameNote
} from '@/api/hoyo'
import {
  setResinData,
  setToast,
  syncCharacter,
  syncAllCharacters as seelieSync,
  type ResinDataInput,
  type SyncResult,
  type BatchSyncResult,
  findMinimumSetCoverIds,
  findMinimumSetWeapons,
  getItems
} from '@/utils/seelie'
import { batchGetAvatarItemCalc } from '../api/hoyo/items'
import { ItemsData } from '../utils/seelie/types'
import { getLanguageData } from '../utils/seelie/constants'
import { exposeDevGlobals } from '@/utils/devGlobals'
import {
  mapAvatarDetailToCharacterDataInput,
  mapAvatarDetailsToCharacterDataInput
} from './mappers/hoyoToSeelieMapper'
import {
  collectAllItemsInfo,
  buildItemsInventory,
  buildCnToSeelieNameMapping,
  syncItemsToSeelie
} from './mappers/itemsSyncMapper'

/**
 * 同步服务类
 * 负责协调 API 层和 Seelie 工具层之间的数据同步
 */
export class SyncService {
  /**
   * 布尔任务失败处理（日志 + Toast + 统一返回）
   */
  private failBooleanTask(message: string, error?: unknown): false {
    if (error) {
      logger.error(`❌ ${message}:`, error)
    } else {
      logger.error(`❌ ${message}`)
    }
    setToast(message, 'error')
    return false
  }

  /**
   * 单角色同步任务失败处理
   */
  private failSyncResult(message: string, error?: unknown): SyncResult {
    if (error) {
      logger.error(`❌ ${message}:`, error)
    } else {
      logger.error(`❌ ${message}`)
    }
    setToast(message, 'error')
    return {
      success: 0,
      failed: 1,
      errors: error ? [String(error)] : [message]
    }
  }

  /**
   * 批量角色同步失败处理
   */
  private failBatchSyncResult(message: string, error?: unknown): BatchSyncResult {
    if (error) {
      logger.error(`❌ ${message}:`, error)
    } else {
      logger.error(`❌ ${message}`)
    }
    setToast(message, 'error')
    return {
      success: 0,
      failed: 1,
      errors: error ? [String(error)] : [message],
      total: 0,
      details: []
    }
  }

  /**
   * 布尔任务执行模板（统一捕获并转为 failBooleanTask）
   */
  private async executeBooleanTask(
    executor: () => Promise<boolean>,
    failMessage: string
  ): Promise<boolean> {
    try {
      return await executor()
    } catch (error) {
      return this.failBooleanTask(failMessage, error)
    }
  }

  /**
   * 单体结果任务执行模板（统一捕获并转为 failSyncResult）
   */
  private async executeSyncResultTask(
    executor: () => Promise<SyncResult>,
    failMessage: string
  ): Promise<SyncResult> {
    try {
      return await executor()
    } catch (error) {
      return this.failSyncResult(failMessage, error)
    }
  }

  /**
   * 批量结果任务执行模板（统一捕获并转为 failBatchSyncResult）
   */
  private async executeBatchSyncTask(
    executor: () => Promise<BatchSyncResult>,
    failMessage: string
  ): Promise<BatchSyncResult> {
    try {
      return await executor()
    } catch (error) {
      return this.failBatchSyncResult(failMessage, error)
    }
  }

  /**
   * 同步电量（树脂）数据
   */
  async syncResinData(): Promise<boolean> {
    return this.executeBooleanTask(async () => {
      logger.debug('🔋 开始同步电量数据...')

      // 获取游戏便笺数据
      const gameNote = await getGameNote()
      if (!gameNote) {
        return this.failBooleanTask('获取游戏便笺失败')
      }

      // 构造树脂数据
      const resinData: ResinDataInput = gameNote.energy;

      // 设置到 Seelie
      const success = setResinData(resinData)

      if (success) {
        logger.debug('✅ 电量数据同步成功')
        setToast(`电量同步成功: ${resinData.progress.current}/${resinData.progress.max}`, 'success')
      } else {
        return this.failBooleanTask('电量数据设置失败')
      }

      return success
    }, '电量数据同步失败')
  }

  /**
   * 同步单个角色数据
   */
  async syncSingleCharacter(avatarId: number): Promise<SyncResult> {
    return this.executeSyncResultTask(async () => {
      logger.debug(`👤 开始同步角色数据: ${avatarId}`)

      // 获取角色详细信息
      const avatarDetails = await batchGetAvatarDetail([avatarId], undefined)
      if (!avatarDetails || avatarDetails.length === 0) {
        return this.failSyncResult('获取角色详细信息失败')
      }

      const avatarDetail = avatarDetails[0]
      const characterData = mapAvatarDetailToCharacterDataInput(avatarDetail)

      // 同步角色数据
      const result = await syncCharacter(characterData)

      if (result.success > 0) {
        logger.debug(`✅ 角色 ${avatarDetail.avatar.name_mi18n} 同步成功`)
        setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步成功`, 'success')
      } else {
        logger.error(`❌ 角色 ${avatarDetail.avatar.name_mi18n} 同步失败`)
        setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步失败`, 'error')
      }

      return result
    }, `角色 ${avatarId} 同步失败`)
  }

  /**
   * 同步所有角色数据
   */
  async syncAllCharacters(): Promise<BatchSyncResult> {
    return this.executeBatchSyncTask(async () => {
      logger.debug('👥 开始同步所有角色数据...')

      // 获取角色基础列表
      const avatarList = await getAvatarBasicList()
      if (!avatarList || avatarList.length === 0) {
        return this.failBatchSyncResult('获取角色列表失败或角色列表为空')
      }

      logger.debug(`📋 找到 ${avatarList.length} 个角色`)
      setToast(`开始同步 ${avatarList.length} 个角色...`, '')

      // 获取所有角色的详细信息
      const avatarIds = avatarList.map(avatar => avatar.avatar.id)
      const avatarDetails = await batchGetAvatarDetail(avatarIds, undefined)

      if (!avatarDetails || avatarDetails.length === 0) {
        return this.failBatchSyncResult('获取角色详细信息失败')
      }

      // 批量同步角色数据
      const batchResult = await seelieSync(mapAvatarDetailsToCharacterDataInput(avatarDetails))

      if (batchResult.success > 0) {
        logger.debug(`✅ 所有角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`)
        setToast(`角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, 'success')
      } else {
        logger.error(`❌ 角色批量同步失败`)
        setToast('角色批量同步失败', 'error')
      }

      return batchResult
    }, '所有角色同步失败')
  }

  /**
   * 同步养成材料数据
   */
  async syncItemsData(): Promise<boolean> {
    return this.executeBooleanTask(async () => {
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
        return this.failBooleanTask('获取养成材料数据失败')
      }

      // 收集所有物品信息
      const allItemsInfo = collectAllItemsInfo(itemsData)

      // 构建物品数据映射
      const itemsInventory = buildItemsInventory(itemsData, allItemsInfo)

      // 获取语言数据和物品信息
      const seelieItems = getItems() as ItemsData
      seelieItems["denny"] = {type: "denny"}
      const i18nData = await getLanguageData()

      if (!i18nData) {
        return this.failBooleanTask('获取语言数据失败')
      }

      // 构建中文名称到 Seelie 物品名称的映射
      const cnName2SeelieItemName = buildCnToSeelieNameMapping(i18nData)

      // 同步到 Seelie
      const { successNum, failNum } = syncItemsToSeelie(
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
        return this.failBooleanTask('养成材料同步失败')
      }

      return success
    }, '养成材料同步失败')
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

const syncResinData = (): Promise<boolean> => syncService.syncResinData()
const syncSingleCharacter = (avatarId: number): Promise<SyncResult> => syncService.syncSingleCharacter(avatarId)
const syncAllCharacters = (): Promise<BatchSyncResult> => syncService.syncAllCharacters()
const syncItemsData = (): Promise<boolean> => syncService.syncItemsData()
const syncAll = (): Promise<{
  resinSync: boolean
  characterSync: BatchSyncResult
  itemsSync: boolean
}> => syncService.syncAll()

// 挂载到全局对象，方便调试
exposeDevGlobals({
  syncService,
  syncResinData,
  syncSingleCharacter,
  syncAllCharacters,
  syncItemsData,
  syncAll
})
