/**
 * Logger 工具类
 * 包装 console 的相关方法，提供统一的日志输出接口
 */

export interface LoggerOptions {
  prefix?: string
  timestamp?: boolean
  colors?: {
    log?: string
    info?: string
    warn?: string
    error?: string
    debug?: string
  }
}

class Logger {
  private prefix: string
  private timestamp: boolean
  private colors: Required<NonNullable<LoggerOptions['colors']>>

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '[zzz-seelie-sync]'
    this.timestamp = options.timestamp ?? true
    this.colors = {
      log: '#333333',
      info: '#2196F3',
      warn: '#FF9800',
      error: '#F44336',
      debug: '#9C27B0',
      ...options.colors
    }
  }

  private formatMessage(level: string, color: string, ...args: unknown[]): unknown[] {
    const timestamp = this.timestamp ? `[${new Date().toLocaleTimeString()}]` : ''
    const prefix = `${timestamp} ${this.prefix} [${level.toUpperCase()}]`

    // 在浏览器环境中使用颜色样式
    if (typeof window !== 'undefined') {
      return [
        `%c${prefix}`,
        `color: ${color}; font-weight: bold;`,
        ...args
      ]
    }

    // 在其他环境中使用普通格式
    return [prefix, ...args]
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
    return new Logger({
      prefix: `${this.prefix}:${childPrefix}`,
      timestamp: this.timestamp,
      colors: this.colors,
      ...options
    })
  }
}

// 默认 logger 实例
export const logger = new Logger({
  prefix: '[Seelie]',
  timestamp: true,
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