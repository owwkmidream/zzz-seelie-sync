/**
 * Logger 工具类
 * 包装 console 的相关方法，提供统一的日志输出接口
 * 支持文件名、行号显示和随机颜色分配
 */

export interface LoggerOptions {
  prefix?: string
  timestamp?: boolean
  showLocation?: boolean
  colors?: {
    log?: string
    info?: string
    warn?: string
    error?: string
    debug?: string
  }
}

interface LocationInfo {
  fileName: string
  lineNumber: number
  columnNumber: number
}

class Logger {
  private prefix: string
  private timestamp: boolean
  private showLocation: boolean
  private colors: Required<NonNullable<LoggerOptions['colors']>>
  private fileColorMap: Map<string, string> = new Map()

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '[zzz-seelie-sync]'
    this.timestamp = options.timestamp ?? true
    this.showLocation = options.showLocation ?? true
    this.colors = {
      log: '#333333',
      info: '#2196F3',
      warn: '#FF9800',
      error: '#F44336',
      debug: '#9C27B0',
      ...options.colors
    }
  }

  /**
   * 生成随机颜色
   */
  private generateRandomColor(): string {
    const colors = [
      '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
      '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
      '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548',
      '#607D8B', '#E53935', '#D81B60', '#8E24AA', '#5E35B1'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * 获取文件颜色（为每个文件分配固定的随机颜色）
   */
  private getFileColor(fileName: string): string {
    if (!this.fileColorMap.has(fileName)) {
      this.fileColorMap.set(fileName, this.generateRandomColor())
    }
    return this.fileColorMap.get(fileName)!
  }

  /**
   * 获取调用位置信息
   */
  private getLocationInfo(): LocationInfo | null {
    try {
      const stack = new Error().stack
      if (!stack) return null

      // 跳过 Logger 内部的调用栈，找到实际调用位置
      const lines = stack.split('\n')

      // 尝试多个可能的调用位置（不同环境下堆栈深度可能不同）
      for (let i = 3; i < Math.min(lines.length, 8); i++) {
        const targetLine = lines[i]
        if (!targetLine) continue

        // 跳过 Logger 内部方法
        if (targetLine.includes('Logger.') ||
          targetLine.includes('formatMessage') ||
          targetLine.includes('getLocationInfo')) {
          continue
        }

        // 匹配不同浏览器的堆栈格式
        // Chrome: at functionName (file:line:column) 或 at file:line:column
        // Firefox: functionName@file:line:column
        // Safari: functionName@file:line:column
        const patterns = [
          /at.*?\((.+):(\d+):(\d+)\)/, // Chrome with function name
          /at\s+(.+):(\d+):(\d+)/, // Chrome without function name
          /@(.+):(\d+):(\d+)/, // Firefox/Safari
          /(.+):(\d+):(\d+)$/ // Fallback pattern
        ]

        for (const pattern of patterns) {
          const match = targetLine.match(pattern)
          if (match) {
            const fullPath = match[1]
            const lineNumber = parseInt(match[2], 10)
            const columnNumber = parseInt(match[3], 10)

            // 跳过无效的路径
            if (!fullPath || fullPath.includes('chrome-extension://') ||
              fullPath.includes('moz-extension://')) {
              continue
            }

            // 提取文件名（去掉路径）
            const fileName = fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath

            // 验证解析结果
            if (fileName && !isNaN(lineNumber) && !isNaN(columnNumber)) {
              return {
                fileName,
                lineNumber,
                columnNumber
              }
            }
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  private formatMessage(level: string, color: string, ...args: unknown[]): unknown[] {
    const timestamp = this.timestamp ? `[${new Date().toLocaleTimeString()}]` : ''
    const location = this.showLocation ? this.getLocationInfo() : null

    let prefix = `${timestamp} ${this.prefix} [${level.toUpperCase()}]`
    let locationStr = ''
    let locationColor = ''

    if (location) {
      locationStr = ` [${location.fileName}:${location.lineNumber}]`
      locationColor = this.getFileColor(location.fileName)
    }

    // 在浏览器环境中使用颜色样式
    if (typeof window !== 'undefined') {
      if (location) {
        return [
          `%c${prefix}%c${locationStr}`,
          `color: ${color}; font-weight: bold;`,
          `color: ${locationColor}; font-weight: bold; font-style: italic;`,
          ...args
        ]
      } else {
        return [
          `%c${prefix}`,
          `color: ${color}; font-weight: bold;`,
          ...args
        ]
      }
    }

    // 在其他环境中使用普通格式
    return [prefix + locationStr, ...args]
  }

  /**
   * 普通日志输出
   */
  log(...args: unknown[]): void {
    console.log(...this.formatMessage('log', this.colors.log, ...args))
  }

  /**
   * 信息日志输出
   */
  info(...args: unknown[]): void {
    console.info(...this.formatMessage('info', this.colors.info, ...args))
  }

  /**
   * 警告日志输出
   */
  warn(...args: unknown[]): void {
    console.warn(...this.formatMessage('warn', this.colors.warn, ...args))
  }

  /**
   * 错误日志输出
   */
  error(...args: unknown[]): void {
    console.error(...this.formatMessage('error', this.colors.error, ...args))
  }

  /**
   * 调试日志输出 (仅在开发环境下输出)
   */
  debug(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(...this.formatMessage('debug', this.colors.debug, ...args))
    }
  }

  /**
   * 表格输出
   */
  table(data: unknown, columns?: string[]): void {
    if (this.timestamp || this.prefix) {
      this.info('Table data:')
    }
    console.table(data, columns)
  }

  /**
   * 分组开始
   */
  group(label?: string): void {
    const formattedLabel = label ? this.formatMessage('group', this.colors.info, label)[2] : undefined
    console.group(formattedLabel)
  }

  /**
   * 折叠分组开始
   */
  groupCollapsed(label?: string): void {
    const formattedLabel = label ? this.formatMessage('group', this.colors.info, label)[2] : undefined
    console.groupCollapsed(formattedLabel)
  }

  /**
   * 分组结束
   */
  groupEnd(): void {
    console.groupEnd()
  }

  /**
   * 计时开始
   */
  time(label?: string): void {
    console.time(label)
  }

  /**
   * 计时结束
   */
  timeEnd(label?: string): void {
    console.timeEnd(label)
  }

  /**
   * 清空控制台
   */
  clear(): void {
    console.clear()
  }

  /**
   * 创建子 Logger 实例
   */
  createChild(childPrefix: string, options?: Partial<LoggerOptions>): Logger {
    const childLogger = new Logger({
      prefix: `${this.prefix}:${childPrefix}`,
      timestamp: this.timestamp,
      showLocation: this.showLocation,
      colors: this.colors,
      ...options
    })
    // 共享文件颜色映射，保持颜色一致性
    childLogger.fileColorMap = this.fileColorMap
    return childLogger
  }
}

// 默认 logger 实例
export const logger = new Logger({
  prefix: '[Seelie]',
  timestamp: true,
  showLocation: true,
  colors: {
    log: '#4CAF50',
    info: '#2196F3',
    warn: '#FF9800',
    error: '#F44336',
    debug: '#9C27B0'
  }
})

// debug 函数 - 仅在开发环境下输出
export const debug = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    logger.debug(...args)
  }
}

// 导出 Logger 类供自定义使用
export { Logger }

// 便捷的全局方法
export const log = logger.log.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)