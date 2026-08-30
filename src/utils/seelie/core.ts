// Seelie 核心功能类

import type { ResinDataInput, AccountResin, ToastType, CharacterInfo, WeaponInfo, ItemsData } from './types'
import { lazyLoadSeelieData, RESIN_INTERVAL } from './constants'
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
  private lastToast: { message: string; type: ToastType; timestamp: number } | null = null

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

    // 如果已经有 _vnode.component，直接初始化
    if (this.appElement._vnode?.component) {
      this.completeInit()
      return
    }

    // 使用 MutationObserver 等待 _vnode.component 出现
    this.waitForVNodeComponent()
  }

  /**
   * 等待 _vnode.component 出现
   */
  private waitForVNodeComponent(): void {
    const timeoutValue = 3000;
    if (!this.appElement) return

    logger.debug('🔍 SeelieCore: 等待 _vnode.component 出现...', this.appElement?._vnode?.component)

    const observer = new MutationObserver(() => {
      logger.debug('🔍 SeelieCore: 等待 _vnode.component 出现...', this.appElement?._vnode?.component)
      if (this.appElement?._vnode?.component) {
        clean();
        this.completeInit()
      }
    })

    // 监听 #app 元素的属性变化和子节点变化
    observer.observe(this.appElement, {
      attributes: true,
      childList: false,
      subtree: false
    });

    // 设置超时保护，避免无限等待
    const timeoutTimer = setTimeout(() => {
      if (!this.rootComponent) {
        clean();
        logger.warn(`⚠️ SeelieCore: 等待 _vnode.component 超时 ${timeoutValue / 1000}秒`)
      }
    }, timeoutValue)

    const clean = () => {
      observer.disconnect();
      clearTimeout(timeoutTimer);
    }
  }

  /**
   * 完成初始化
   */
  private completeInit(): void {
    if (!this.appElement?._vnode?.component) {
      logger.warn('⚠️ SeelieCore: 完成初始化时 _vnode.component 不存在')
      return
    }
    this.rootComponent = this.appElement._vnode.component

    // 初始化 stats 数据
    lazyLoadSeelieData()
    logger.debug('✅ SeelieCore: 已尝试初始化 stats 数据')
    logger.log('✅ SeelieCore 初始化成功')
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
      const now = Date.now()
      if (
        this.lastToast
        && this.lastToast.message === message
        && this.lastToast.type === type
        && now - this.lastToast.timestamp < 1500
      ) {
        logger.debug('🍞 跳过重复 Toast:', { message, type })
        return true
      }

      proxy.toast = message
      proxy.toastType = type
      this.lastToast = { message, type, timestamp: now }

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
   * 调用组件的 setInventory 方法
   */
  setInventory(type: string, item: string, tier: number, value: number): boolean {
    const proxy = this.getProxy()
    if (!proxy) {
      logger.warn('⚠️ 无法获取组件 proxy 对象')
      return false
    }

    if (typeof proxy.setInventory !== 'function') {
      logger.warn('⚠️ setInventory 方法不存在')
      return false
    }

    try {
      (proxy.setInventory as (type: string, item: string, tier: number, value: number) => void)(type, item, tier, value)
      return true
    } catch (error) {
      logger.error('❌ 调用 setInventory 失败:', error)
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
   * 获取组件的 items 数据
   */
  getItems(): unknown {
    const proxy = this.getProxy()
    return proxy?.items as ItemsData || {};
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
   * 获取根组件实例（供劫持原生按钮时遍历组件树用）
   */
  getRootComponent(): VueComponent | null {
    if (!this.ensureInitialized()) {
      return null
    }
    return this.rootComponent
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
