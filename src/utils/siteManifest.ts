import GM_fetch from '@trim21/gm-fetch'
import { logger } from './logger'

export const SEELIE_BASE_URL = 'https://zzz.seelie.me'

const SITE_MANIFEST_CACHE_KEY = 'seelie_site_manifest_v1'
const SITE_MANIFEST_CACHE_TTL_MS = 6 * 60 * 60 * 1000

const INDEX_SCRIPT_PATTERN = /\/assets\/index-([a-f0-9]+)\.js/
const STRINGS_ZH_PATTERN = /strings-zh-([a-f0-9]+)\.js/
const SIGNAL_TRACKER_HREF_PATTERN = /https:\/\/stardb\.gg\/zzz\/signal-tracker[^\s"'`)]*/

export type StatsFileName = 'charactersStats' | 'weaponsStats' | 'weaponsStatsCommon'

const STATS_FILE_PATTERNS: Record<StatsFileName, RegExp> = {
  charactersStats: /stats-characters-[a-f0-9]+\.js/,
  weaponsStats: /stats-weapons-[a-f0-9]+\.js/,
  weaponsStatsCommon: /stats-weapons-common-[a-f0-9]+\.js/
}

interface SiteManifestAdHints {
  hasPleaseSticker: boolean
  hasLeaderboardTarget: boolean
  hasPwIncontent: boolean
  usesLegacyContainer: boolean
  usesModernContainer: boolean
  signalTrackerHref: string | null
}

interface StoredSiteManifest {
  fetchedAt: number
  indexScriptPath: string
  indexScriptUrl: string
  stringsZhFile: string | null
  stringsZhUrl: string | null
  statsFiles: Partial<Record<StatsFileName, string>>
  adHints: SiteManifestAdHints
}

export interface SiteManifest extends StoredSiteManifest {
  source: 'cache' | 'network'
}

let runtimeManifest: SiteManifest | null = null
let runtimeManifestLoading: Promise<SiteManifest> | null = null

async function fetchContent(url: string): Promise<string> {
  const response = await GM_fetch(url)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText} (${url})`)
  }
  return await response.text()
}

function toRuntimeManifest(stored: StoredSiteManifest, source: 'cache' | 'network'): SiteManifest {
  return {
    ...stored,
    source
  }
}

function readCachedManifest(): StoredSiteManifest | null {
  try {
    const value = localStorage.getItem(SITE_MANIFEST_CACHE_KEY)
    if (!value) {
      return null
    }

    const parsed = JSON.parse(value) as Partial<StoredSiteManifest>
    if (
      typeof parsed !== 'object'
      || parsed === null
      || typeof parsed.fetchedAt !== 'number'
      || typeof parsed.indexScriptPath !== 'string'
      || typeof parsed.indexScriptUrl !== 'string'
      || typeof parsed.statsFiles !== 'object'
      || parsed.statsFiles === null
      || typeof parsed.adHints !== 'object'
      || parsed.adHints === null
    ) {
      return null
    }

    return {
      fetchedAt: parsed.fetchedAt,
      indexScriptPath: parsed.indexScriptPath,
      indexScriptUrl: parsed.indexScriptUrl,
      stringsZhFile: typeof parsed.stringsZhFile === 'string' ? parsed.stringsZhFile : null,
      stringsZhUrl: typeof parsed.stringsZhUrl === 'string' ? parsed.stringsZhUrl : null,
      statsFiles: parsed.statsFiles,
      adHints: {
        hasPleaseSticker: Boolean(parsed.adHints.hasPleaseSticker),
        hasLeaderboardTarget: Boolean(parsed.adHints.hasLeaderboardTarget),
        hasPwIncontent: Boolean(parsed.adHints.hasPwIncontent),
        usesLegacyContainer: Boolean(parsed.adHints.usesLegacyContainer),
        usesModernContainer: Boolean(parsed.adHints.usesModernContainer),
        signalTrackerHref: typeof parsed.adHints.signalTrackerHref === 'string' ? parsed.adHints.signalTrackerHref : null
      }
    }
  } catch (error) {
    logger.warn('读取 site manifest 缓存失败，忽略缓存:', error)
    return null
  }
}

function writeCachedManifest(manifest: StoredSiteManifest): void {
  try {
    localStorage.setItem(SITE_MANIFEST_CACHE_KEY, JSON.stringify(manifest))
  } catch (error) {
    logger.warn('写入 site manifest 缓存失败:', error)
  }
}

function isCacheFresh(manifest: StoredSiteManifest): boolean {
  return Date.now() - manifest.fetchedAt < SITE_MANIFEST_CACHE_TTL_MS
}

function extractStatsFiles(indexScriptContent: string): Partial<Record<StatsFileName, string>> {
  const statsFiles: Partial<Record<StatsFileName, string>> = {}

  ;(Object.keys(STATS_FILE_PATTERNS) as StatsFileName[]).forEach((name) => {
    const fileMatch = indexScriptContent.match(STATS_FILE_PATTERNS[name])
    if (fileMatch) {
      statsFiles[name] = fileMatch[0]
    }
  })

  return statsFiles
}

function buildStoredManifest(mainPageHtml: string, indexScriptContent: string): StoredSiteManifest {
  const indexMatch = mainPageHtml.match(INDEX_SCRIPT_PATTERN)
  if (!indexMatch) {
    throw new Error('在主页 HTML 中未找到 index-*.js')
  }

  const indexScriptPath = indexMatch[0]
  const indexScriptUrl = `${SEELIE_BASE_URL}${indexScriptPath}`

  const stringsZhMatch = indexScriptContent.match(STRINGS_ZH_PATTERN)
  const stringsZhFile = stringsZhMatch ? stringsZhMatch[0] : null
  const stringsZhUrl = stringsZhFile ? `${SEELIE_BASE_URL}/assets/locale/${stringsZhFile}` : null

  const signalTrackerHrefMatch = indexScriptContent.match(SIGNAL_TRACKER_HREF_PATTERN)
  const signalTrackerHref = signalTrackerHrefMatch ? signalTrackerHrefMatch[0] : null

  return {
    fetchedAt: Date.now(),
    indexScriptPath,
    indexScriptUrl,
    stringsZhFile,
    stringsZhUrl,
    statsFiles: extractStatsFiles(indexScriptContent),
    adHints: {
      hasPleaseSticker: indexScriptContent.includes('img/stickers/please.png'),
      hasLeaderboardTarget: indexScriptContent.includes('leaderboard-target'),
      hasPwIncontent: indexScriptContent.includes('pw-incontent'),
      usesLegacyContainer: indexScriptContent.includes('overflow-hidden relative text-white'),
      usesModernContainer: indexScriptContent.includes('relative mx-auto overflow-hidden shrink-0'),
      signalTrackerHref
    }
  }
}

async function fetchManifestFromNetwork(): Promise<SiteManifest> {
  const mainPageHtml = await fetchContent(SEELIE_BASE_URL)
  const indexMatch = mainPageHtml.match(INDEX_SCRIPT_PATTERN)
  if (!indexMatch) {
    throw new Error('在主页 HTML 中未找到 index-*.js')
  }

  const indexScriptPath = indexMatch[0]
  const indexScriptUrl = `${SEELIE_BASE_URL}${indexScriptPath}`
  const indexScriptContent = await fetchContent(indexScriptUrl)

  const stored = buildStoredManifest(mainPageHtml, indexScriptContent)
  writeCachedManifest(stored)

  return toRuntimeManifest(stored, 'network')
}

export function getCachedSiteManifest(): SiteManifest | null {
  if (runtimeManifest) {
    return runtimeManifest
  }

  const cached = readCachedManifest()
  if (!cached) {
    return null
  }

  return toRuntimeManifest(cached, 'cache')
}

/**
 * 获取站点 manifest：统一分发 index 解析结果（stats/locale/adHints）
 */
export async function getSiteManifest(options: { forceRefresh?: boolean } = {}): Promise<SiteManifest> {
  const { forceRefresh = false } = options

  if (!forceRefresh && runtimeManifest) {
    return runtimeManifest
  }

  if (!forceRefresh && runtimeManifestLoading) {
    return runtimeManifestLoading
  }

  if (!forceRefresh) {
    const cached = readCachedManifest()
    if (cached && isCacheFresh(cached)) {
      runtimeManifest = toRuntimeManifest(cached, 'cache')
      return runtimeManifest
    }
  }

  runtimeManifestLoading = (async () => {
    try {
      const manifest = await fetchManifestFromNetwork()
      runtimeManifest = manifest
      return manifest
    } catch (error) {
      const cached = readCachedManifest()
      if (cached) {
        logger.warn('刷新 site manifest 失败，回退到缓存:', error)
        runtimeManifest = toRuntimeManifest(cached, 'cache')
        return runtimeManifest
      }
      throw error
    } finally {
      runtimeManifestLoading = null
    }
  })()

  return runtimeManifestLoading
}
