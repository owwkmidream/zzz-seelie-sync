import type { AvatarCalcData } from '@/api/hoyo'
import type { ItemsData, SeelieLanguageData } from '@/utils/seelie/types'
import { setInventory } from '@/utils/seelie'
import { logger } from '@/utils/logger'

/**
 * 收集所有物品信息（从所有消耗类型中获取完整的物品信息）
 */
export function collectAllItemsInfo(itemsData: AvatarCalcData[]): Record<string, { id: number; name: string }> {
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
export function buildItemsInventory(
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
export function buildCnToSeelieNameMapping(i18nData: SeelieLanguageData): Record<string, string> {
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
 * 同步物品到 Seelie（名字路径，fallback 用）
 */
export function syncItemsToSeelie(
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
        }
      } else {
        // 处理普通物品
        const type = seelieItems[seelieName]?.type

        if (type && setInventory(type, seelieName, 0, count)) {
          successNum++
        } else {
          failNum++
        }
      }
    } catch {
      failNum++
    }
  }

  return { successNum, failNum }
}

// ===== ID 映射路径（新） =====

/** ID → Seelie 索引条目 */
export interface SeelieIdIndexEntry {
  key: string
  tier: number
  type: string
}

/**
 * 收集全量材料 ID 并合并用户拥有数量
 * 先从消耗列表收集所有 ID（默认 0），再用 user_owns_materials 覆盖实际数量，
 * 确保不在 user_owns_materials 中的材料会被写零（与名字路径行为一致）。
 */
export function buildUserOwnItemsById(itemsData: AvatarCalcData[]): Record<string, number> {
  const merged: Record<string, number> = {}

  for (const data of itemsData) {
    // 先从消耗列表收集全量 ID，默认 count = 0
    const allConsumes = [
      ...data.avatar_consume,
      ...data.weapon_consume,
      ...data.skill_consume,
      ...data.need_get
    ]
    for (const item of allConsumes) {
      const id = item.id.toString()
      if (!(id in merged)) {
        merged[id] = 0
      }
    }

    // 再用实际拥有量覆盖
    for (const [id, count] of Object.entries(data.user_owns_materials)) {
      merged[id] = Math.max(merged[id] ?? 0, count)
    }
  }

  return merged
}

/**
 * 从 Seelie items 构建 materialId → { key, tier, type } 索引
 * @param seelieItems  宿主 proxy.items
 * @param coinId       货币 ID（来自 API 返回的 coin_id），映射到 denny
 */
export function buildItemIdToSeelieIndex(
  seelieItems: ItemsData,
  coinId?: number
): Map<number, SeelieIdIndexEntry> {
  const index = new Map<number, SeelieIdIndexEntry>()

  for (const [key, item] of Object.entries(seelieItems)) {
    if (item.id != null) {
      index.set(item.id, { key, tier: 0, type: item.type })
    }
    if (item.ids) {
      for (let i = 0; i < item.ids.length; i++) {
        index.set(item.ids[i], { key, tier: i, type: item.type })
      }
    }
  }

  // 货币特判：coin_id → denny
  if (coinId != null && !index.has(coinId)) {
    index.set(coinId, { key: 'denny', tier: 0, type: 'denny' })
  }

  return index
}

/**
 * 通过 ID 映射同步物品到 Seelie
 */
export function syncItemsToSeelieById(
  userOwnById: Record<string, number>,
  idIndex: Map<number, SeelieIdIndexEntry>
): { successNum: number; failNum: number; unknownIds: string[] } {
  let successNum = 0
  let failNum = 0
  const unknownIds: string[] = []

  for (const [idStr, count] of Object.entries(userOwnById)) {
    const id = Number(idStr)
    const entry = idIndex.get(id)

    if (!entry) {
      unknownIds.push(idStr)
      failNum++
      continue
    }

    try {
      if (setInventory(entry.type, entry.key, entry.tier, count)) {
        successNum++
      } else {
        failNum++
        logger.warn(`⚠️ setInventory 失败: id=${idStr}, key=${entry.key}`)
      }
    } catch (error) {
      failNum++
      logger.error(`❌ setInventory 异常: id=${idStr}`, error)
    }
  }

  if (unknownIds.length > 0) {
    logger.warn(`⚠️ ID 映射未命中 ${unknownIds.length} 项:`, unknownIds)
  }

  return { successNum, failNum, unknownIds }
}
