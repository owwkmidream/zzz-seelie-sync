import { logger } from '@logger'
import {
  getAvatarBasicList,
  batchGetAvatarDetail,
  getGameNote
} from '@/api/hoyo'
import { getHoyoErrorSummary, getHoyoErrorSuggestion } from '@/api/hoyo/errors'
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
import {
  collectAllItemsInfo,
  buildItemsInventory,
  buildCnToSeelieNameMapping,
  syncItemsToSeelie
} from './mappers/itemsSyncMapper'

interface SyncTaskOptions {
  notify?: boolean
}

export interface ItemsSyncResult {
  success: boolean
  partial: boolean
  successNum: number
  failNum: number
}

/**
 * 同步服务类
 * 负责协调 API 层和 Seelie 工具层之间的数据同步
 */
export class SyncService {
  private shouldNotify(options?: SyncTaskOptions): boolean {
    return options?.notify !== false
  }

  private buildErrorFeedback(message: string, error?: unknown): { summary: string; toast: string } {
    if (!error) {
      return {
        summary: message,
        toast: `${message}，请稍后重试`
      }
    }

    const summary = `${message}：${getHoyoErrorSummary(error)}`
    const suggestion = getHoyoErrorSuggestion(error)
    return {
      summary,
      toast: `${message}，${suggestion}`
    }
  }

  /**
   * 布尔任务失败处理（日志 + Toast + 统一返回）
   */
  private failBooleanTask(message: string, error?: unknown, notify = true): false {
    const feedback = this.buildErrorFeedback(message, error)
    logger.error(`❌ ${feedback.summary}`, error)
    if (notify) {
      setToast(feedback.toast, 'error')
    }
    return false
  }

  /**
   * 单角色同步任务失败处理
   */
  private failSyncResult(message: string, error?: unknown, notify = true): SyncResult {
    const feedback = this.buildErrorFeedback(message, error)
    logger.error(`❌ ${feedback.summary}`, error)
    if (notify) {
      setToast(feedback.toast, 'error')
    }
    return {
      success: 0,
      failed: 1,
      errors: error ? [feedback.summary] : [message]
    }
  }

  /**
   * 批量角色同步失败处理
   */
  private failBatchSyncResult(message: string, error?: unknown, notify = true): BatchSyncResult {
    const feedback = this.buildErrorFeedback(message, error)
    logger.error(`❌ ${feedback.summary}`, error)
    if (notify) {
      setToast(feedback.toast, 'error')
    }
    return {
      success: 0,
      failed: 1,
      errors: error ? [feedback.summary] : [message],
      total: 0,
      details: []
    }
  }

  /**
   * 养成材料同步失败处理
   */
  private failItemsSyncResult(message: string, error?: unknown, notify = true): ItemsSyncResult {
    const feedback = this.buildErrorFeedback(message, error)
    logger.error(`❌ ${feedback.summary}`, error)
    if (notify) {
      setToast(feedback.toast, 'error')
    }
    return {
      success: false,
      partial: false,
      successNum: 0,
      failNum: 0
    }
  }

  /**
   * 布尔任务执行模板（统一捕获并转为 failBooleanTask）
   */
  private async executeBooleanTask(
    executor: () => Promise<boolean>,
    failMessage: string,
    notify = true
  ): Promise<boolean> {
    try {
      return await executor()
    } catch (error) {
      return this.failBooleanTask(failMessage, error, notify)
    }
  }

  /**
   * 单体结果任务执行模板（统一捕获并转为 failSyncResult）
   */
  private async executeSyncResultTask(
    executor: () => Promise<SyncResult>,
    failMessage: string,
    notify = true
  ): Promise<SyncResult> {
    try {
      return await executor()
    } catch (error) {
      return this.failSyncResult(failMessage, error, notify)
    }
  }

  /**
   * 批量结果任务执行模板（统一捕获并转为 failBatchSyncResult）
   */
  private async executeBatchSyncTask(
    executor: () => Promise<BatchSyncResult>,
    failMessage: string,
    notify = true
  ): Promise<BatchSyncResult> {
    try {
      return await executor()
    } catch (error) {
      return this.failBatchSyncResult(failMessage, error, notify)
    }
  }

  /**
   * 同步电量（树脂）数据
   */
  async syncResinData(options?: SyncTaskOptions): Promise<boolean> {
    const notify = this.shouldNotify(options)

    return this.executeBooleanTask(async () => {
      logger.info('🔋 开始同步电量数据...')

      // 获取游戏便笺数据
      const gameNote = await getGameNote()
      if (!gameNote) {
        return this.failBooleanTask('获取游戏便笺失败', undefined, notify)
      }

      // 构造树脂数据
      const resinData: ResinDataInput = gameNote.energy;

      // 设置到 Seelie
      const success = setResinData(resinData)

      if (success) {
        logger.info('✅ 电量数据同步成功')
        if (notify) {
          setToast(`电量同步成功: ${resinData.progress.current}/${resinData.progress.max}`, 'success')
        }
      } else {
        return this.failBooleanTask('电量数据设置失败', undefined, notify)
      }

      return success
    }, '电量数据同步失败', notify)
  }

  /**
   * 同步单个角色数据
   */
  async syncSingleCharacter(avatarId: number, options?: SyncTaskOptions): Promise<SyncResult> {
    const notify = this.shouldNotify(options)

    return this.executeSyncResultTask(async () => {
      logger.info(`👤 开始同步角色数据: ${avatarId}`)

      // 获取角色详细信息
      const avatarDetails = await batchGetAvatarDetail([avatarId], undefined)
      if (!avatarDetails || avatarDetails.length === 0) {
        return this.failSyncResult('获取角色详细信息失败', undefined, notify)
      }

      const avatarDetail = avatarDetails[0]

      // 同步角色数据
      const result = await syncCharacter(avatarDetail)

      if (result.success > 0 && result.failed === 0) {
        logger.info(`✅ 角色 ${avatarDetail.avatar.name_mi18n} 同步成功`)
        if (notify) {
          setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步成功`, 'success')
        }
      } else if (result.success > 0) {
        logger.warn(`⚠️ 角色 ${avatarDetail.avatar.name_mi18n} 同步部分成功: 成功 ${result.success}，失败 ${result.failed}`)
        if (notify) {
          setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步部分成功`, 'warning')
        }
      } else {
        logger.error(`❌ 角色 ${avatarDetail.avatar.name_mi18n} 同步失败`)
        if (notify) {
          setToast(`角色 ${avatarDetail.avatar.name_mi18n} 同步失败`, 'error')
        }
      }

      return result
    }, `角色 ${avatarId} 同步失败`, notify)
  }

  /**
   * 同步所有角色数据
   */
  async syncAllCharacters(options?: SyncTaskOptions): Promise<BatchSyncResult> {
    const notify = this.shouldNotify(options)

    return this.executeBatchSyncTask(async () => {
      logger.info('👥 开始同步所有角色数据...')

      // 获取角色基础列表
      const avatarList = await getAvatarBasicList()
      if (!avatarList || avatarList.length === 0) {
        return this.failBatchSyncResult('获取角色列表失败或角色列表为空', undefined, notify)
      }

      logger.info(`📋 找到 ${avatarList.length} 个角色`)
      if (notify) {
        setToast(`开始同步 ${avatarList.length} 个角色...`, '')
      }

      // 获取所有角色的详细信息
      const avatarIds = avatarList.map(avatar => avatar.avatar.id)
      const avatarDetails = await batchGetAvatarDetail(avatarIds, undefined)

      if (!avatarDetails || avatarDetails.length === 0) {
        return this.failBatchSyncResult('获取角色详细信息失败', undefined, notify)
      }

      // 批量同步角色数据
      const batchResult = await seelieSync(avatarDetails)

      if (batchResult.success > 0 && batchResult.failed === 0) {
        logger.info(`✅ 所有角色同步完成: 成功 ${batchResult.success}`)
        if (notify) {
          setToast(`角色同步完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, 'success')
        }
      } else if (batchResult.success > 0) {
        logger.warn(`⚠️ 所有角色同步完成（部分失败）: 成功 ${batchResult.success}，失败 ${batchResult.failed}`)
        if (notify) {
          setToast(`角色同步部分完成: 成功 ${batchResult.success}，失败 ${batchResult.failed}`, 'warning')
        }
      } else {
        logger.error(`❌ 角色批量同步失败`)
        if (notify) {
          setToast('角色批量同步失败', 'error')
        }
      }

      return batchResult
    }, '所有角色同步失败', notify)
  }

  /**
   * 同步养成材料数据
   */
  async syncItemsData(options?: SyncTaskOptions): Promise<ItemsSyncResult> {
    const notify = this.shouldNotify(options)

    try {
      logger.info('🔋 开始同步养成材料数据...')

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
        return this.failItemsSyncResult('获取养成材料数据失败', undefined, notify)
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
        return this.failItemsSyncResult('获取语言数据失败', undefined, notify)
      }

      // 构建中文名称到 Seelie 物品名称的映射
      const cnName2SeelieItemName = buildCnToSeelieNameMapping(i18nData)

      // 同步到 Seelie
      const { successNum, failNum } = syncItemsToSeelie(
        itemsInventory,
        cnName2SeelieItemName,
        seelieItems
      )

      const hasSuccess = successNum > 0
      const total = successNum + failNum
      const isPartial = hasSuccess && failNum > 0

      if (hasSuccess && !isPartial) {
        logger.info(`✅ 养成材料同步成功: ${successNum}/${total}`)
        if (notify) {
          setToast(`养成材料同步完成: 成功 ${successNum}，失败 ${failNum}`, 'success')
        }
        return {
          success: true,
          partial: false,
          successNum,
          failNum
        }
      } else if (hasSuccess) {
        logger.warn(`⚠️ 养成材料同步部分成功: ${successNum}/${total}`)
        if (notify) {
          setToast(`养成材料同步部分完成: 成功 ${successNum}，失败 ${failNum}`, 'warning')
        }
        return {
          success: true,
          partial: true,
          successNum,
          failNum
        }
      }

      return this.failItemsSyncResult('养成材料同步失败', undefined, notify)
    } catch (error) {
      return this.failItemsSyncResult('养成材料同步失败', error, notify)
    }
  }

  /**
   * 执行完整同步（电量 + 所有角色 + 养成材料）
   */
  async syncAll(): Promise<{
    resinSync: boolean
    characterSync: BatchSyncResult
    itemsSync: boolean
    itemsPartial: boolean
  }> {
    logger.info('🚀 开始执行完整同步...')
    setToast('开始执行完整同步...', '')

    // 并行执行所有同步任务
    const [resinSync, characterSync, itemsResult] = await Promise.all([
      this.syncResinData({ notify: true }),
      this.syncAllCharacters({ notify: true }),
      this.syncItemsData({ notify: true })
    ])
    const itemsSync = itemsResult.success
    const itemsPartial = itemsResult.partial

    const charactersAllSuccess = characterSync.success > 0 && characterSync.failed === 0
    const totalSuccess = resinSync && charactersAllSuccess && itemsSync && !itemsPartial
    const totalFailed = !resinSync && characterSync.success === 0 && !itemsSync

    const itemsSummary = !itemsSync
      ? '失败'
      : itemsPartial
        ? `部分完成（成功 ${itemsResult.successNum}，失败 ${itemsResult.failNum}）`
        : '成功'
    const summary = `电量${resinSync ? '成功' : '失败'}，角色成功 ${characterSync.success} 失败 ${characterSync.failed}，养成材料${itemsSummary}`

    if (totalSuccess) {
      logger.info(`✅ 完整同步完成：${summary}`)
      setToast(`完整同步完成：${summary}`, 'success')
    } else if (totalFailed) {
      logger.error(`❌ 完整同步失败：${summary}`)
      setToast('完整同步失败，请刷新登录后重试', 'error')
    } else {
      logger.warn(`⚠️ 完整同步部分完成：${summary}`)
      setToast(`完整同步部分完成：${summary}`, 'warning')
    }

    return { resinSync, characterSync, itemsSync, itemsPartial }
  }
}

// 创建全局实例
export const syncService = new SyncService()
