// Seelie 工具类 - 用于操作 Vue 应用中的数据

/**
 * Seelie 数据操作工具类
 * 提供对 #app._vnode.component.ctx.accountResin 等属性的读写操作
 */
export class SeelieDataManager {
  private appElement: HTMLElement | null = null;
  private rootComponent: any = null;

  constructor() {
    this.init();
  }

  /**
   * 初始化，获取 #app 元素和根组件
   */
  private init(): void {
    this.appElement = document.querySelector('#app') as HTMLElement & { _vnode?: any };

    if (!this.appElement) {
      console.warn('⚠️ SeelieDataManager: 未找到 #app 元素');
      return;
    }

    if (!this.appElement._vnode?.component) {
      console.warn('⚠️ SeelieDataManager: #app 元素没有 _vnode.component');
      return;
    }

    this.rootComponent = this.appElement._vnode.component;
    console.log('✓ SeelieDataManager 初始化成功');
  }

  /**
   * 确保组件已初始化
   */
  private ensureInitialized(): boolean {
    if (!this.rootComponent) {
      this.init();
    }
    return !!this.rootComponent;
  }

  /**
   * 获取根组件的上下文 (ctx)
   */
  private getContext(): any {
    if (!this.ensureInitialized()) {
      return null;
    }
    return this.rootComponent.ctx;
  }

  /**
   * 获取 accountResin 属性值
   * @returns accountResin 的当前值
   */
  getAccountResin(): any {
    const ctx = this.getContext();
    if (!ctx) {
      console.warn('⚠️ 无法获取组件上下文');
      return null;
    }

    const accountResin = ctx.accountResin;
    console.log('📖 获取 accountResin:', accountResin);
    return accountResin;
  }

  /**
   * 设置 accountResin 属性值
   * @param value 要设置的新值
   * @returns 是否设置成功
   */
  setAccountResin(value: any): boolean {
    const ctx = this.getContext();
    if (!ctx) {
      console.warn('⚠️ 无法获取组件上下文');
      return false;
    }

    try {
      const oldValue = ctx.accountResin;
      ctx.accountResin = value;

      console.log('✏️ 设置 accountResin:', {
        oldValue,
        newValue: value
      });

      return true;
    } catch (error) {
      console.error('❌ 设置 accountResin 失败:', error);
      return false;
    }
  }



  /**
   * 获取完整的组件上下文信息（调试用）
   * @returns 组件上下文的详细信息
   */
  getContextInfo(): any {
    const ctx = this.getContext();
    if (!ctx) {
      return null;
    }

    return {
      keys: Object.keys(ctx),
      accountResin: ctx.accountResin,
      hasAccountResin: 'accountResin' in ctx,
      contextType: typeof ctx
    };
  }

  /**
   * 重新初始化（当页面路由变化时调用）
   */
  refresh(): void {
    console.log('🔄 SeelieDataManager 重新初始化...');
    this.appElement = null;
    this.rootComponent = null;
    this.init();
  }
}

// 创建全局实例
export const seelieDataManager = new SeelieDataManager();

// 便捷的全局函数
export const getAccountResin = () => seelieDataManager.getAccountResin();
export const setAccountResin = (value: any) => seelieDataManager.setAccountResin(value);

// 挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).seelieDataManager = seelieDataManager;
  (window as any).getAccountResin = getAccountResin;
  (window as any).setAccountResin = setAccountResin;
}