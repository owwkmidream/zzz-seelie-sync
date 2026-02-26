#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const DOC_PATH = 'docs/index.md'

const AUTO_START = '<!-- AUTO_INDEX:START -->'
const AUTO_END = '<!-- AUTO_INDEX:END -->'

const ROOT_FILES = [
  'package.json',
  'pnpm-workspace.yaml',
  'vite.config.ts',
  'eslint.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'README.md'
]

const INCLUDED_DIRS = ['src', 'scripts', '.github/workflows']
const EXCLUDED_DIR_NAMES = new Set(['.git', 'node_modules', 'dist', 'temp', '.kiro', '.vscode'])

const MODE_GENERATE = 'generate'
const MODE_CHECK = 'check'

function normalizeNewlines(content) {
  return content.replace(/\r\n/g, '\n')
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT_DIR, relativePath))
}

function listFilesInDir(relativeDir) {
  const result = []
  const absoluteDir = path.join(ROOT_DIR, relativeDir)

  if (!fs.existsSync(absoluteDir)) {
    return result
  }

  const visit = (currentRelativeDir) => {
    const absoluteCurrentDir = path.join(ROOT_DIR, currentRelativeDir)
    const entries = fs
      .readdirSync(absoluteCurrentDir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const entry of entries) {
      const relativePath = toPosixPath(path.join(currentRelativeDir, entry.name))

      if (entry.isDirectory()) {
        if (EXCLUDED_DIR_NAMES.has(entry.name)) {
          continue
        }
        visit(relativePath)
        continue
      }

      if (entry.isFile()) {
        result.push(relativePath)
      }
    }
  }

  visit(relativeDir)
  return result
}

function collectGroupedFiles() {
  const rootGroup = ROOT_FILES.filter((file) => fileExists(file)).sort((a, b) => a.localeCompare(b))

  const directoryGroups = Object.fromEntries(
    INCLUDED_DIRS.map((dir) => [dir, listFilesInDir(dir).sort((a, b) => a.localeCompare(b))])
  )

  return {
    src: directoryGroups['src'] ?? [],
    root: rootGroup,
    scripts: directoryGroups['scripts'] ?? [],
    workflows: directoryGroups['.github/workflows'] ?? []
  }
}

function inferSrcArea(filePath) {
  if (filePath.startsWith('src/api/hoyo/')) {
    return 'api/hoyo'
  }
  if (filePath.startsWith('src/api/')) {
    return 'api'
  }
  if (filePath.startsWith('src/components/')) {
    return 'components'
  }
  if (filePath.startsWith('src/services/mappers/')) {
    return 'services/mappers'
  }
  if (filePath.startsWith('src/services/')) {
    return 'services'
  }
  if (filePath.startsWith('src/utils/seelie/')) {
    return 'utils/seelie'
  }
  if (filePath.startsWith('src/utils/')) {
    return 'utils'
  }
  return 'src'
}

function inferRole(filePath) {
  const roleByExactPath = {
    'src/main.ts': '脚本入口，初始化应用与调试全局',
    'src/app.ts': '应用初始化与 DOM 注入协调',
    'src/vite-env.d.ts': 'Vite/插件类型声明',
    'src/monkey-global.d.ts': '油猴全局类型声明',
    'src/utils/logger.ts': '日志工具',
    'src/utils/siteManifest.ts': '站点 manifest 获取与缓存',
    'src/utils/componentRegistry.ts': '组件注册入口',
    'src/utils/useDOMInjector.ts': 'DOM 注入管理器',
    'src/utils/useRouterWatcher.ts': '路由变化监听',
    'src/utils/adCleaner.ts': '页面广告清理逻辑',
    'src/utils/adCleanerMenu.ts': '去广告设置菜单',
    'src/utils/devGlobals.ts': '开发调试全局导出',
    'scripts/release.js': '版本发布脚本',
    'scripts/index-doc.js': '索引生成与校验脚本',
    '.github/workflows/ci.yml': 'CI 类型检查/构建/夜间部署',
    '.github/workflows/release.yml': '标签发布与 Release 流程',
    'package.json': '项目元信息与命令入口',
    'pnpm-workspace.yaml': 'pnpm workspace 配置',
    'vite.config.ts': 'Vite 与 userscript 构建配置',
    'eslint.config.js': 'ESLint 规则配置',
    'tsconfig.json': 'TypeScript 基础配置入口',
    'tsconfig.app.json': '应用 TypeScript 编译配置',
    'tsconfig.node.json': 'Node 脚本 TypeScript 配置',
    'README.md': '项目说明与使用指南'
  }

  if (roleByExactPath[filePath]) {
    return roleByExactPath[filePath]
  }

  if (filePath.startsWith('src/api/hoyo/')) {
    return '米哈游 API 客户端与鉴权模块'
  }
  if (filePath.startsWith('src/components/')) {
    return 'Seelie 面板相关 UI 组件'
  }
  if (filePath.startsWith('src/services/mappers/')) {
    return '同步数据映射器'
  }
  if (filePath.startsWith('src/services/')) {
    return '业务服务编排'
  }
  if (filePath.startsWith('src/utils/seelie/')) {
    return 'Seelie 数据处理核心模块'
  }
  if (filePath.startsWith('src/utils/')) {
    return '通用工具模块'
  }
  if (filePath.startsWith('scripts/')) {
    return '自动化脚本'
  }
  if (filePath.startsWith('.github/workflows/')) {
    return 'GitHub Actions 工作流'
  }

  return '通用模块'
}

function inferArea(filePath, group) {
  if (group === 'src') {
    return inferSrcArea(filePath)
  }
  if (group === 'scripts') {
    return 'scripts'
  }
  if (group === 'workflows') {
    return '.github/workflows'
  }
  return 'root'
}

function renderTableRows(files, groupName) {
  if (files.length === 0) {
    return '| _无_ | _-_ | _-_ |'
  }

  return files
    .map((file) => `| \`${file}\` | \`${inferArea(file, groupName)}\` | ${inferRole(file)} |`)
    .join('\n')
}

function renderGroup(title, files, groupName) {
  return [
    `### ${title}`,
    '',
    '| Path | Area | Role |',
    '| --- | --- | --- |',
    renderTableRows(files, groupName)
  ].join('\n')
}

function buildAutoBody() {
  const groupedFiles = collectGroupedFiles()

  return [
    renderGroup('源码（src）', groupedFiles.src, 'src'),
    '',
    renderGroup('配置与入口（根目录关键文件）', groupedFiles.root, 'root'),
    '',
    renderGroup('自动化脚本（scripts）', groupedFiles.scripts, 'scripts'),
    '',
    renderGroup('工作流（.github/workflows）', groupedFiles.workflows, 'workflows')
  ].join('\n')
}

function wrapAutoSection(autoBody) {
  return `${AUTO_START}\n${autoBody}\n${AUTO_END}`
}

function buildDefaultDocument(autoBody) {
  return normalizeNewlines(
    [
      '# 项目索引（Agent 导航）',
      '',
      '本文件用于帮助 Codex / Claude Code 快速定位仓库结构与关键入口。',
      '',
      '## 使用方式',
      '',
      '1. 任务开始前先阅读本文件，再定位目标代码。',
      '2. 结构变更后运行 `pnpm run docs:index:generate` 更新自动区。',
      '3. 提交前运行 `pnpm run docs:index:check` 检查索引是否过期。',
      '',
      '## 手动维护区（Agent 可编辑）',
      '',
      '### 当前重点模块',
      '',
      '- 待补充',
      '',
      '### 最近结构变更',
      '',
      '- 待补充',
      '',
      '### 备注',
      '',
      '- 手动区仅记录高价值语义信息（职责、调用链、约束），避免复制源码细节。',
      '',
      '## 自动生成区（脚本覆盖）',
      '',
      wrapAutoSection(autoBody),
      ''
    ].join('\n')
  )
}

function applyAutoSectionToDocument(existingContent, autoBody) {
  const normalizedExisting = normalizeNewlines(existingContent)
  const wrappedAutoSection = wrapAutoSection(autoBody)

  if (normalizedExisting.includes(AUTO_START) && normalizedExisting.includes(AUTO_END)) {
    const autoSectionRegExp = new RegExp(
      `${escapeRegExp(AUTO_START)}[\\s\\S]*?${escapeRegExp(AUTO_END)}`,
      'm'
    )
    return normalizedExisting.replace(autoSectionRegExp, wrappedAutoSection)
  }

  const trimmed = normalizedExisting.replace(/\s*$/u, '')
  const appended = [
    trimmed,
    '',
    '## 自动生成区（脚本覆盖）',
    '',
    wrappedAutoSection,
    ''
  ].join('\n')
  return normalizeNewlines(appended)
}

function buildUpdatedDocument(currentContent) {
  const autoBody = buildAutoBody()
  if (currentContent === null) {
    return buildDefaultDocument(autoBody)
  }
  return applyAutoSectionToDocument(currentContent, autoBody)
}

function readDocumentOrNull(docAbsolutePath) {
  if (!fs.existsSync(docAbsolutePath)) {
    return null
  }
  const content = fs.readFileSync(docAbsolutePath, 'utf8')
  return normalizeNewlines(content)
}

function writeDocument(docAbsolutePath, content) {
  fs.mkdirSync(path.dirname(docAbsolutePath), { recursive: true })
  fs.writeFileSync(docAbsolutePath, normalizeNewlines(content), 'utf8')
}

function generateIndexDocument(docAbsolutePath) {
  const currentContent = readDocumentOrNull(docAbsolutePath)
  const updatedContent = buildUpdatedDocument(currentContent)

  if (currentContent === updatedContent) {
    console.log(`✅ ${DOC_PATH} 已是最新，无需更新。`)
    return
  }

  writeDocument(docAbsolutePath, updatedContent)
  console.log(`✅ 已更新 ${DOC_PATH}`)
}

function checkIndexDocument(docAbsolutePath) {
  const currentContent = readDocumentOrNull(docAbsolutePath)
  if (currentContent === null) {
    console.error(`❌ 未找到 ${DOC_PATH}`)
    console.error('请先执行: pnpm run docs:index:generate')
    process.exitCode = 1
    return
  }

  const expectedContent = buildUpdatedDocument(currentContent)
  if (currentContent === expectedContent) {
    console.log(`✅ ${DOC_PATH} 校验通过。`)
    return
  }

  console.error(`❌ ${DOC_PATH} 已过期或结构不符合规范。`)
  console.error('请执行: pnpm run docs:index:generate')
  process.exitCode = 1
}

function main() {
  const mode = process.argv[2]
  if (mode !== MODE_GENERATE && mode !== MODE_CHECK) {
    console.error(`❌ 未知命令: ${mode ?? '(empty)'}`)
    console.error('用法: node scripts/index-doc.js <generate|check>')
    process.exitCode = 1
    return
  }

  const docAbsolutePath = path.join(ROOT_DIR, DOC_PATH)
  if (mode === MODE_GENERATE) {
    generateIndexDocument(docAbsolutePath)
    return
  }

  checkIndexDocument(docAbsolutePath)
}

main()
