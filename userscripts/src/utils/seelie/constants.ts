// Seelie 相关常量定义

import type { CharacterStats, WeaponStatsCommon, WeaponInfo } from '../../types/seelie'

/**
 * 角色统计数据
 */
export const CHARACTERS_STATS: CharacterStats[] = [
  {
    id: 1091,
    name: "雅",
    base: 7673,
    growth: 818426,
    core: [0, 100, 200, 300, 400, 500],
    ascHP: [0, 414, 828, 1242, 1656, 2069]
  },
  {
    id: 1221,
    name: "柳",
    base: 6500,
    growth: 750000,
    core: [0, 90, 180, 270, 360, 450],
    ascHP: [0, 350, 700, 1050, 1400, 1750]
  },
  // 可以根据需要添加更多角色数据
]

/**
 * 突破等级数组
 */
export const ASCENSIONS: number[] = [1, 10, 20, 30, 40, 50, 60]

/**
 * 技能类型映射
 */
export const SKILLS: { [key: number]: string } = {
  0: 'basic',    // 普通攻击
  1: 'special',  // 特殊技
  2: 'evade',    // 闪避
  3: 'chain',    // 连携技
  5: 'core',     // 核心被动
  6: 'assist'    // 支援技
}

/**
 * 武器统计数据
 */
export const WEAPONS_STATS_COMMON: WeaponStatsCommon = {
  rate: {
    1: 0, 10: 1000, 20: 2000, 30: 3000, 40: 4000, 50: 5000, 60: 6000
  },
  ascRate: [0, 500, 1000, 1500, 2000, 2500, 3000]
}

/**
 * 武器基础攻击力数据
 */
export const WEAPONS_STATS: { [id: number]: number } = {
  14109: 743, // 霰落星殿
  14001: 500, // 加农转子
  // 可以根据需要添加更多武器数据
}

/**
 * 武器信息数据
 */
export const WEAPONS: { [key: string]: WeaponInfo } = {
  'weapon_1': { id: 14109, name: '霰落星殿' },
  'weapon_2': { id: 14001, name: '加农转子', craftable: true },
  // 可以根据需要添加更多武器数据
}

/**
 * 树脂恢复间隔（秒）
 */
export const RESIN_INTERVAL = 360