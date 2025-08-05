// Seelie 核心功能类

import type { ResinDataInput, AccountResin, ToastType } from './types'
import { RESIN_INTERVAL } from './constants'

/**
 * Seelie 核心数据管理器
 * 提供对 Vue 应用组件的基础访问和操作
 */
export class SeelieCore {
  private appElement: HTMLElement | null = null
  private rootComponent: any = null

  constructor() {
    this.init()
  }

  /**
   * 初始化，获取 #app 元素和根组件
   */
  private init(): void {
    this.appElement = document.querySelector('#app') as HTMLElement & { _vnode?: any }

    if (!this.appElement) {
      console.warn('⚠️ SeelieCore: 未找到 #app 元素')
      return
    }

    if (!this.appElement._vnode?.component) {
      console.warn('⚠️ SeelieCore: #app 元素没有 _vnode.component')
      return
    }

    this.rootComponent = this.appElement._vnode.component
    console.log('✓ SeelieCore 初始化成功')
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
  protected getProxy(): any {
    if (!this.ensureInitialized()) {
      return null
    }
    return this.rootComponent.proxy
  }

  /**
   * 获取 accountResin 属性值
   */
  getAccountResin(): any {
    const proxy = this.getProxy()
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象')
      return null
    }

    const accountResin = proxy.accountResin
    console.log('📖 获取 accountResin:', accountResin)
    return accountResin
  }

  /**
   * 设置 accountResin 属性值
   */
  setAccountResin(value: ResinDataInput): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    try {
      const oldValue = proxy.accountResin
      const convertedValue = this.convertToAccountResinFormat(value)

      proxy.accountResin = convertedValue

      console.log('✏️ 设置 accountResin:', {
        oldValue,
        inputValue: value,
        convertedValue
      })

      return true
    } catch (error) {
      console.error('❌ 设置 accountResin 失败:', error)
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
      console.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    try {
      proxy.toast = message
      proxy.toastType = type

      console.log('🍞 设置 Toast:', { message, type })
      return true
    } catch (error) {
      console.error('❌ 设置 Toast 失败:', error)
      return false
    }
  }

  /**
   * 调用组件的 addGoal 方法
   */
  protected addGoal(goal: any): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    if (typeof proxy.addGoal !== 'function') {
      console.warn('⚠️ addGoal 方法不存在')
      return false
    }

    try {
      proxy.addGoal(goal)
      return true
    } catch (error) {
      console.error('❌ 调用 addGoal 失败:', error)
      return false
    }
  }

  /**
   * 调用组件的 removeGoal 方法
   */
  protected removeGoal(goal: any): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    if (typeof proxy.removeGoal !== 'function') {
      console.warn('⚠️ removeGoal 方法不存在')
      return false
    }

    try {
      proxy.removeGoal(goal)
      return true
    } catch (error) {
      console.error('❌ 调用 removeGoal 失败:', error)
      return false
    }
  }

  /**
   * 获取组件的 characters 数据
   */
  protected getCharacters(): any {
    const proxy = this.getProxy()
    return proxy?.characters || {}
  }

  /**
   * 获取组件的 goals 数据
   */
  protected getGoals(): any[] {
    const proxy = this.getProxy()
    return proxy?.goals || []
  }

  /**
   * 获取完整的组件上下文信息（调试用）
   */
  getContextInfo(): any {
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
    console.log('🔄 SeelieCore 重新初始化...')
    this.appElement = null
    this.rootComponent = null
    this.init()
  }
}