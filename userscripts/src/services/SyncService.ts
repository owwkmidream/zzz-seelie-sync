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
  type BatchSyncResult,
  findMinimumSetCoverIds,
  findMinimumSetWeapons,
  getItems,
  setInventory
} from '@/utils/seelie'
import { batchGetAvatarItemCalc } from '../api/hoyo/items'
import { ItemsData } from '../utils/seelie/types'
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
   * 同步养成材料信息
   */
  async syncItemsData(): Promise<boolean> {
    try {
      logger.debug('🔋 开始同步养成材料...')

      // 计算最小集合
      const minSetChar = findMinimumSetCoverIds();
      const minSetWeapon = findMinimumSetWeapons();

      // 获取养成材料数据
      const itemsData = await batchGetAvatarItemCalc(
        minSetChar.map(item => (
          {
            avatar_id: item.id,
            weapon_id: minSetWeapon[item.style]
          }
        )));

      if (!itemsData) {
        logger.error('❌ 获取养成材料失败')
        setToast('获取养成材料失败', 'error')
        return false
      }

      // 展开数据并去重
      const userOwnItems: Record<string, number> = {} // id-value
      const userNeedGets: Record<string, string> = {} // id-name

      for (const item of itemsData) {
        // ownItems
        for (const [k, v] of Object.entries(item.user_owns_materials)) {
          userOwnItems[k] = v;
        }
        // needGet
        for (const obj of item.need_get) {
          const id = obj.id.toString();
          // 确保只处理对象自身的属性，而不是原型链上的
          if (!Object.prototype.hasOwnProperty.call(userNeedGets, id)) {
            userNeedGets[id] = obj.name;
          }
        }
      }

      // 构建name-value
      const userOwnItemsName2Value: Record<string, number> = {}
      for (const [k, v] of Object.entries(userOwnItems)) {
        userOwnItemsName2Value[userNeedGets[k]] = v;
      }

      // 处理到seelie格式
      const seelieItems = getItems() as ItemsData;
      const i18n_cn_json = await getLanguageData();
      const cnName2SeelieItemName: Record<string, string> = {} // cn2seelie-id
      // 翻转
      for (const key in i18n_cn_json) {
        // 确保只处理对象自身的属性，而不是原型链上的
        if (Object.prototype.hasOwnProperty.call(i18n_cn_json, key)) {
          const value = i18n_cn_json[key];
          // 是字符串
          if (typeof value === 'string') {
            cnName2SeelieItemName[value] = key;
          }

          // 是数组
          if (typeof value === 'object' && Array.isArray(value)) {
            value.forEach((v, i) => {
              cnName2SeelieItemName[v] = `${key}+${i}` // 形如chip_physical+0格式
            })
          }
        }
      }
      
      let failNum = 0, successNum = 0;
      // 设置到 Seelie
      for (const [cnName, num] of Object.entries(userOwnItemsName2Value)) {
        // 还要做处理
        const seelieName = cnName2SeelieItemName[cnName];
        // 如果结尾有+数字，需要特殊处理
        const seelieNameParts = seelieName.split('+');
        if (seelieNameParts.length > 1) { // 物理芯片之类的
          const realName = seelieNameParts[0];
          const tier = Number(seelieNameParts[1]);
          const type = seelieItems[realName].type;
          
          setInventory(type, realName, tier, num) ? successNum++ : failNum++;
        } else {
          const type = seelieItems[seelieName].type;

          setInventory(type, seelieName, 0, num) ? successNum++ : failNum++;
        }
      }
      const success = successNum !== 0;

      if (success) {
        logger.debug('✅ 库存数据同步成功')
        setToast(`库存同步成功: 同步${successNum} / ${successNum + failNum}个`, failNum === 0 ? 'success' : 'warning')
      } else {
        logger.warn('❌ 库存数据设置失败')
        setToast('库存数据设置失败', 'warning')
      }

      return success
    } catch (error) {
      logger.error('❌ 库存数据同步失败:', error)
      setToast('库存数据同步失败', 'error')
      return false
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