// Seelie 数据自动更新模块
// 将 scripts/update-and-restore.js 的逻辑适配到油猴脚本环境

import GM_fetch from '@trim21/gm-fetch'
import type { SeelieLanguageData, SeelieStatsData } from './types'
import { logger } from '../logger'
import { getSiteManifest, SEELIE_BASE_URL, type StatsFileName } from '../siteManifest'

/**
 * Seelie 数据更新器
 * 从 seelie.me 获取最新的语言包和统计数据
 */
export class SeelieDataUpdater {
  private static readonly UNIQUE_ZZZ_KEYS = ['denny', 'w_engine', 'drive_disc']

  /**
   * 获取网络内容
   */
  private static async fetchContent(url: string): Promise<string> {
    try {
      const response = await GM_fetch(url)
      if (!response.ok) {
        throw new Error(`请求失败，状态码: ${response.status} - ${response.statusText}`)
      }
      return await response.text()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`获取 ${url} 时网络错误: ${errorMessage}`)
    }
  }

  /**
   * 从 JS 内容中还原绝区零数据
   */
  private static restoreZzzData(jsContent: string): SeelieLanguageData {
    logger.debug('▶️  开始从 JS 内容中还原绝区零数据...')

    // 解析所有导出的变量
    const exportMatch = jsContent.match(/\bexport\s*\{([\s\S]*?)\}/)
    if (!exportMatch) {
      throw new Error('在JS文件中未找到 export 语句。')
    }

    const exportedVars = exportMatch[1]
      .split(',')
      .map(s => s.trim().split(/\s+as\s+/)[0])
      .filter(Boolean)

    let executionCode = jsContent.replace(/\bexport\s*\{[\s\S]*?};/, '')
    executionCode += `\n\n// Appended by script\nreturn { ${exportedVars.map(v => `${v}: ${v}`).join(', ')} };`

    try {
      const scriptRunner = new Function(executionCode)
      const allDataBlocks = scriptRunner()

      // 智能搜索正确的数据块
      logger.debug(`🔍 正在 ${Object.keys(allDataBlocks).length} 个数据块中搜索绝区零数据...`)
      for (const blockName in allDataBlocks) {
        const block = allDataBlocks[blockName]
        if (!block || typeof block !== 'object') continue

        const sources = [block.default, block] // 检查 .default 和对象本身
        for (const source of sources) {
          if (source && typeof source === 'object' && this.UNIQUE_ZZZ_KEYS.some(key => key in source)) {
            logger.debug(`🎯 命中！在变量 '${blockName}' 中找到关键词。`)
            return source
          }
        }
      }

      throw new Error('未能在任何数据块中找到绝区零的锚点关键词。')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`还原数据时发生错误: ${errorMessage}`)
    }
  }

  /**
   * 解析统计数据 JS 文件
   */
  private static parseStatsFile(jsContent: string): unknown {
    try {
      const exportMatch = jsContent.match(/\bexport\s*\{([\s\S]*?)\}/)
      if (!exportMatch) {
        throw new Error('在统计文件中未找到 export 语句')
      }

      // 解析导出映射
      const exportItems = exportMatch[1].split(',').map(s => s.trim())
      const exportMappings: { [key: string]: string } = {}
      let defaultExportVar: string | null = null

      exportItems.forEach(item => {
        const parts = item.split(/\s+as\s+/)
        if (parts.length === 2) {
          const [varName, exportName] = parts
          if (exportName.trim() === 'default') {
            defaultExportVar = varName.trim()
          }
          exportMappings[exportName.trim()] = varName.trim()
        } else {
          const varName = item.trim()
          exportMappings[varName] = varName
        }
      })

      let executionCode = jsContent.replace(/\bexport\s*\{[\s\S]*?};/, '')

      // 如果有默认导出，直接返回默认导出的变量
      if (defaultExportVar) {
        executionCode += `\n\n// Appended by script\nreturn ${defaultExportVar};`
      } else {
        // 否则返回所有导出的变量
        const allVars = Object.values(exportMappings)
        executionCode += `\n\n// Appended by script\nreturn { ${allVars.map(v => `${v}: ${v}`).join(', ')} };`
      }

      const scriptRunner = new Function(executionCode)
      return scriptRunner()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`解析统计文件时发生错误: ${errorMessage}`)
    }
  }

  /**
   * 处理统计数据文件（并行版本）
   */
  private static async processStatsFiles(
    statsFiles: Partial<Record<StatsFileName, string>>
  ): Promise<SeelieStatsData> {
    logger.debug('▶️  开始并行处理统计数据文件...')

    const statsFileNames: StatsFileName[] = ['charactersStats', 'weaponsStats', 'weaponsStatsCommon']

    // 并行处理所有统计文件
    const statsPromises = statsFileNames.map(async (name) => {
      const fileName = statsFiles[name]
      if (!fileName) {
        logger.warn(`⚠️  未找到 ${name} 文件，跳过...`)
        return { name, data: null }
      }

      const statsFileUrl = `${SEELIE_BASE_URL}/assets/${fileName}`
      logger.debug(`📥 下载 ${name} -> ${statsFileUrl}`)

      try {
        const statsFileContent = await this.fetchContent(statsFileUrl)
        const parsedData: unknown = this.parseStatsFile(statsFileContent)
        logger.debug(`✅ ${name} 处理完成`)
        return { name, data: parsedData }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error(`❌ 处理 ${name} 时出错: ${errorMessage}`)
        return { name, data: null }
      }
    })

    // 等待所有统计文件处理完成
    const results = await Promise.all(statsPromises)

    // 组装结果
    const statsData: Partial<SeelieStatsData> = {}
    results.forEach(({ name, data }) => {
      if (data !== null) {
        (statsData as Record<string, unknown>)[name] = data
      }
    })

    logger.debug(`✅ 统计数据并行处理完成，共处理 ${Object.keys(statsData).length} 个文件`)
    return statsData as SeelieStatsData
  }

  /**
   * 更新 Seelie 数据（优化并行版本）
   */
  static async updateSeelieData(): Promise<{ languageData: SeelieLanguageData; statsData: SeelieStatsData }> {
    try {
      logger.debug('🚀 开始更新 Seelie 数据...')

      // 1. 统一从 site manifest 获取 index 解析结果
      const siteManifest = await getSiteManifest()
      logger.debug(`第一步：使用站点 manifest（来源: ${siteManifest.source}）`)
      logger.debug(`第二步：发现主脚本 -> ${siteManifest.indexScriptUrl}`)

      if (!siteManifest.stringsZhUrl) {
        throw new Error('在主脚本中未找到 strings-zh-*.js 语言包。')
      }

      logger.debug(`第三步：发现中文语言包 -> ${siteManifest.stringsZhUrl}`)

      // 3. 并行获取语言包内容和处理统计数据文件
      logger.debug('🔄 开始并行处理语言包和统计数据...')
      const [stringsFileContent, statsData] = await Promise.all([
        this.fetchContent(siteManifest.stringsZhUrl),
        this.processStatsFiles(siteManifest.statsFiles)
      ])

      logger.debug('✅ 语言包和统计数据并行处理完成')

      // 4. 还原语言包数据
      const languageData = this.restoreZzzData(stringsFileContent)

      logger.debug('🎉 Seelie 数据更新完成！')
      return { languageData, statsData }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`❌ Seelie 数据更新失败: ${errorMessage}`)
      throw error
    }
  }

  /**
   * 缓存数据到 localStorage
   */
  static cacheData(languageData: SeelieLanguageData, statsData: SeelieStatsData): void {
    try {
      localStorage.setItem('seelie_language_data', JSON.stringify(languageData))
      localStorage.setItem('seelie_stats_data', JSON.stringify(statsData))
      localStorage.setItem('seelie_data_timestamp', Date.now().toString())
      logger.debug('✅ 数据已缓存到 localStorage')
    } catch (error) {
      logger.error('❌ 缓存数据失败:', error)
    }
  }

  /**
   * 从缓存获取数据
   */
  static getCachedData(): { languageData: SeelieLanguageData; statsData: SeelieStatsData; timestamp: number } | null {
    try {
      const languageDataStr = localStorage.getItem('seelie_language_data')
      const statsDataStr = localStorage.getItem('seelie_stats_data')
      const timestampStr = localStorage.getItem('seelie_data_timestamp')

      if (!languageDataStr || !statsDataStr || !timestampStr) {
        return null
      }

      return {
        languageData: JSON.parse(languageDataStr),
        statsData: JSON.parse(statsDataStr),
        timestamp: parseInt(timestampStr)
      }
    } catch (error) {
      logger.error('❌ 获取缓存数据失败:', error)
      return null
    }
  }

  /**
   * 获取最新数据（优先网络请求，失败时使用缓存）
   */
  static async getLatestData(): Promise<{ languageData: SeelieLanguageData; statsData: SeelieStatsData }> {
    try {
      logger.debug('🔄 请求最新 Seelie 数据...')
      const { languageData, statsData } = await this.updateSeelieData()

      // 请求成功，缓存数据
      this.cacheData(languageData, statsData)

      return { languageData, statsData }
    } catch (error) {
      logger.warn('⚠️ 网络请求失败，尝试使用缓存数据:', error)

      // 网络请求失败，尝试使用缓存
      const cachedData = this.getCachedData()
      if (cachedData) {
        logger.debug('✅ 使用缓存的 Seelie 数据')
        return {
          languageData: cachedData.languageData,
          statsData: cachedData.statsData
        }
      }

      // 缓存也没有，抛出错误
      throw new Error('网络请求失败且无可用缓存数据')
    }
  }
}
