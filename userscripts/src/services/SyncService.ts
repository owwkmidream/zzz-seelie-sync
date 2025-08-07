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
  type CharacterDataInput,
  type ResinDataInput,
  type SyncResult,
  type BatchSyncResult
} from '@/utils/seelie'

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
   * 执行完整同步（电量 + 所有角色）
   */
  async syncAll(): Promise<{
    resinSync: boolean
    characterSync: BatchSyncResult
  }> {
    logger.debug('🚀 开始执行完整同步...')
    setToast('开始执行完整同步...', '')

    // 并行执行电量同步和角色同步
    const [resinSync, characterSync] = await Promise.all([
      this.syncResinData(),
      this.syncAllCharacters()
    ])

    const totalSuccess = resinSync && characterSync.success > 0
    const message = totalSuccess
      ? '完整同步成功'
      : '完整同步部分失败'

    logger.debug(`${totalSuccess ? '✅' : '⚠️'} ${message}`)
    setToast(message, totalSuccess ? 'success' : 'error')

    return { resinSync, characterSync }
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
 * 执行完整同步（电量 + 所有角色）
 */
export const syncAll = (): Promise<{
  resinSync: boolean
  characterSync: BatchSyncResult
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
  globalWindow.syncAll = syncAll
}