// Seelie 工具类 - 用于操作 Vue 应用中的数据

/**
 * 树脂数据输入格式
 */
export interface ResinDataInput {
  progress: {
    max: number;
    current: number;
  };
  restore: number;
  day_type: number;
  hour: number;
  minute: number;
}

/**
 * AccountResin 格式
 */
interface AccountResin {
  amount: number;
  time: string;
}

/**
 * Seelie 数据操作工具类
 * 提供对 #app._vnode.component.ctx.accountResin 等属性的读写操作
 */
class SeelieDataManager {
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
   * 获取根组件的 proxy 对象
   */
  private getProxy(): any {
    if (!this.ensureInitialized()) {
      return null;
    }
    return this.rootComponent.proxy;
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
   * @param value 输入参数格式: ResinDataInput
   * @returns 是否设置成功
   */
  setAccountResin(value: ResinDataInput): boolean {
    const ctx = this.getContext();
    if (!ctx) {
      console.warn('⚠️ 无法获取组件上下文');
      return false;
    }

    try {
      const oldValue = ctx.accountResin;

      // 转换输入参数为 accountResin 格式
      const convertedValue = this.convertToAccountResinFormat(value);

      ctx.accountResin = convertedValue;

      console.log('✏️ 设置 accountResin:', {
        oldValue,
        inputValue: value,
        convertedValue
      });

      return true;
    } catch (error) {
      console.error('❌ 设置 accountResin 失败:', error);
      return false;
    }
  }

  /**
   * 将输入参数转换为 accountResin 格式
   * @param input 输入参数 ResinDataInput
   * @returns 转换后的格式 AccountResin
   */
  private convertToAccountResinFormat(input: ResinDataInput): AccountResin {
    if (!input || !input.progress) {
      throw new Error('输入参数格式错误，缺少 progress 字段');
    }

    const { progress, restore } = input;
    const currentAmount = progress.current;
    const maxAmount = progress.max;
    const restoreSeconds = restore;

    // 回复间隔6分钟
    const resinInterval = 360;

    // 计算当前 amount 的更新时间
    // 参考逻辑：this.dayjs().add(u, "seconds").subtract(this.resinInterval * (m - n), "seconds").toString()
    // 即：now + restore - resinInterval * (max - current)
    const now = new Date();
    const theoreticalRestoreTime = (maxAmount - currentAmount) * resinInterval; // 理论恢复时间（秒）

    // time = now + API返回的实际恢复时间 - 理论恢复时间
    const updateTime = new Date(now.getTime() + (restoreSeconds - theoreticalRestoreTime) * 1000);

    return {
      amount: currentAmount,
      time: updateTime.toString()
    };
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
   * 设置 Toast 消息
   * @param message Toast 消息内容
   * @param type Toast 类型: 'error' | 'warning' | 'success'
   * @returns 是否设置成功
   */
  setToast(message: string, type: 'error' | 'warning' | 'success' = 'success'): boolean {
    const proxy = this.getProxy();
    if (!proxy) {
      console.warn('⚠️ 无法获取组件 proxy 对象');
      return false;
    }

    try {
      proxy.toast = message;
      proxy.toastType = type;

      console.log('🍞 设置 Toast:', {
        message,
        type
      });

      return true;
    } catch (error) {
      console.error('❌ 设置 Toast 失败:', error);
      return false;
    }
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

/**
 * 设置树脂数据的便捷函数
 * @param data 树脂数据对象
 */
export const setResinData = (data: ResinDataInput): boolean => {
  return seelieDataManager.setAccountResin(data);
};

/**
 * 设置 Toast 消息的便捷函数
 * @param message Toast 消息内容
 * @param type Toast 类型: 'error' | 'warning' | 'success'
 */
export const setToast = (message: string, type: 'error' | 'warning' | 'success' = 'success'): boolean => {
  return seelieDataManager.setToast(message, type);
};

// 挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).setResinData = setResinData;
  (window as any).setToast = setToast;
}