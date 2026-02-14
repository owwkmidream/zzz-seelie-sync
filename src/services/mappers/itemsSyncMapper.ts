import type { AvatarCalcData } from '@/api/hoyo'
import type { ItemsData, SeelieLanguageData } from '@/utils/seelie/types'
import { setInventory } from '@/utils/seelie'

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
 * 同步物品到 Seelie
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
