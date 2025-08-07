// Seelie 核心功能类

import type { ResinDataInput, AccountResin, ToastType, CharacterInfo, WeaponInfo } from './types'
import { RESIN_INTERVAL } from './constants'
import { logger } from '../logger'

/**
 * Seelie 核心数据管理器
 * 提供对 Vue 应用组件的基础访问和操作
 */
interface VueComponent {
  proxy?: Record<string, unknown>;
  [key: string]: unknown;
}

interface AppElement extends HTMLElement {
  _vnode?: {
    component?: VueComponent;
  };
}

export class SeelieCore {
  private appElement: AppElement | null = null
  private rootComponent: VueComponent | null = null

  constructor() {
    this.init()
  }

  /**
   * 初始化，获取 #app 元素和根组件
   */
  private init(): void {
    this.appElement = document.querySelector('#app') as AppElement

    if (!this.appElement) {
      logger.warn('⚠️ SeelieCore: 未找到 #app 元素')
      return
    }

    if (!this.appElement._vnode?.component) {
      logger.warn('⚠️ SeelieCore: #app 元素没有 _vnode.component')
      return
    }

    this.rootComponent = this.appElement._vnode.component
    logger.debug('✓ SeelieCore 初始化成功')
  }

  /**
   * 确保组件已初始化
   */
  private ensureInitialized(): boolean {
    if (!this.rootComponent) {
      this.init()
    }
    return !!this.rootComponent
  }

  /**
   * 获取根组件的 proxy 对象
   */
  protected getProxy(): Record<string, unknown> | null {
    if (!this.ensureInitialized()) {
      return null
    }
    return this.rootComponent?.proxy as Record<string, unknown> | null
  }

  /**
   * 获取 accountResin 属性值
   */
  getAccountResin(): unknown {
    const proxy = this.getProxy()
    if (!proxy) {
      logger.warn('⚠️ 无法获取组件 proxy 对象')
      return null
    }

    const accountResin = proxy.accountResin
    logger.debug('📖 获取 accountResin:', accountResin)
    return accountResin
  }

  /**
   * 设置 accountResin 属性值
   */
  setAccountResin(value: ResinDataInput): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      logger.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    try {
      const oldValue = proxy.accountResin
      const convertedValue = this.convertToAccountResinFormat(value)

      proxy.accountResin = convertedValue

      logger.debug('✏️ 设置 accountResin:', {
        oldValue,
        inputValue: value,
        convertedValue
      })

      return true
    } catch (error) {
      logger.error('❌ 设置 accountResin 失败:', error)
      return false
    }
  }

  /**
   * 将输入参数转换为 accountResin 格式
   */
  private convertToAccountResinFormat(input: ResinDataInput): AccountResin {
    if (!input || !input.progress) {
      throw new Error('输入参数格式错误，缺少 progress 字段')
    }

    const { progress, restore } = input
    const currentAmount = progress.current
    const maxAmount = progress.max
    const restoreSeconds = restore

    // 计算当前 amount 的更新时间
    const now = new Date()
    const theoreticalRestoreTime = (maxAmount - currentAmount) * RESIN_INTERVAL
    const updateTime = new Date(now.getTime() + (restoreSeconds - theoreticalRestoreTime) * 1000)

    return {
      amount: currentAmount,
      time: updateTime.toString()
    }
  }

  /**
   * 设置 Toast 消息
   */
  setToast(message: string, type: ToastType = ''): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      logger.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    try {
      proxy.toast = message
      proxy.toastType = type

      logger.debug('🍞 设置 Toast:', { message, type })
      return true
    } catch (error) {
      logger.error('❌ 设置 Toast 失败:', error)
      return false
    }
  }

  /**
   * 调用组件的 addGoal 方法
   */
  protected addGoal(goal: unknown): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      logger.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    if (typeof proxy.addGoal !== 'function') {
      logger.warn('⚠️ addGoal 方法不存在')
      return false
    }

    try {
      (proxy.addGoal as (goal: unknown) => void)(goal)
      return true
    } catch (error) {
      logger.error('❌ 调用 addGoal 失败:', error)
      return false
    }
  }

  /**
   * 调用组件的 removeGoal 方法
   */
  protected removeGoal(goal: unknown): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      logger.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    if (typeof proxy.removeGoal !== 'function') {
      logger.warn('⚠️ removeGoal 方法不存在')
      return false
    }

    try {
      (proxy.removeGoal as (goal: unknown) => void)(goal)
      return true
    } catch (error) {
      logger.error('❌ 调用 removeGoal 失败:', error)
      return false
    }
  }

  /**
   * 获取组件的 characters 数据
   */
  protected getCharacters(): Record<string, CharacterInfo> {
    const proxy = this.getProxy()
    return (proxy?.characters as Record<string, CharacterInfo>) || {}
  }

  /**
   * 获取组件的 weapons 数据
   */
  protected getWeapons(): Record<string, WeaponInfo> {
    const proxy = this.getProxy()
    return (proxy?.weapons as Record<string, WeaponInfo>) || {}
  }

  /**
   * 获取组件的 goals 数据
   */
  protected getGoals(): unknown[] {
    const proxy = this.getProxy()
    return (proxy?.goals as unknown[]) || []
  }

  /**
   * 获取完整的组件上下文信息（调试用）
   */
  getContextInfo(): Record<string, unknown> | null {
    const proxy = this.getProxy()
    if (!proxy) {
      return null
    }

    return {
      keys: Object.keys(proxy),
      accountResin: proxy.accountResin,
      hasAccountResin: 'accountResin' in proxy,
      contextType: typeof proxy
    }
  }

  /**
   * 重新初始化（当页面路由变化时调用）
   */
  refresh(): void {
    logger.debug('🔄 SeelieCore 重新初始化...')
    this.appElement = null
    this.rootComponent = null
    this.init()
  }
}