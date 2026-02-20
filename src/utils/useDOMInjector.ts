/**
 * 通用 DOM 注入管理器
 * 负责管理多种组件的 DOM 注入、路由监听和生命周期
 */

import { logger } from '@logger';
import { useRouterWatcher, type RouteLocation } from './useRouterWatcher';

// 组件接口定义
export interface InjectableComponent {
  /** 初始化组件 */
  init(): Promise<void> | void;
  /** 销毁组件 */
  destroy(): void;
  /** 刷新组件（可选） */
  refresh?(): Promise<void> | void;
}

// 组件配置接口
export interface ComponentConfig {
  /** 组件唯一标识 */
  id: string;
  /** 目标容器选择器 */
  targetSelector: string;
  /** 组件元素选择器（用于检查是否已存在） */
  componentSelector: string;
  /** 条件检查函数，返回 false 时不创建组件 */
  condition?: () => boolean;
  /** 路由匹配模式（可选） */
  routePattern?: string | RegExp;
}

// 组件工厂函数类型
export type ComponentFactory<T extends InjectableComponent = InjectableComponent> = () => T | Promise<T>;

// 注入器实例
class ComponentInjector<T extends InjectableComponent = InjectableComponent> {
  private component: T | null = null;
  private readonly config: ComponentConfig;
  private readonly factory: ComponentFactory<T>;
  private isCreating = false;
  private createPromise: Promise<void> | null = null;

  constructor(config: ComponentConfig, factory: ComponentFactory<T>) {
    this.config = config;
    this.factory = factory;
  }

  /**
   * 检查组件是否已存在
   */
  private checkExistence(): boolean {
    const targetContainer = document.querySelector(this.config.targetSelector);
    if (!targetContainer) return false;

    const componentElement = targetContainer.querySelector(this.config.componentSelector);
    return componentElement !== null;
  }

  /**
   * 检查创建条件
   */
  private checkCondition(): boolean {
    // 检查目标容器是否存在
    const targetExists = document.querySelector(this.config.targetSelector) !== null;
    if (!targetExists) return false;

    // 检查自定义条件
    if (this.config.condition && !this.config.condition()) {
      return false;
    }

    // 检查路由匹配
    if (this.config.routePattern) {
      const currentPath = window.location.pathname;
      if (typeof this.config.routePattern === 'string') {
        return currentPath.includes(this.config.routePattern);
      } else {
        return this.config.routePattern.test(currentPath);
      }
    }

    return true;
  }

  /**
   * 尝试创建组件
   */
  public async tryCreate(): Promise<void> {
    // 如果正在创建中，等待创建完成
    if (this.isCreating && this.createPromise) {
      logger.debug(`⏳ [${this.config.id}] 组件正在创建中，等待完成`);
      await this.createPromise;
      return;
    }

    // 检查条件
    if (!this.checkCondition()) {
      logger.debug(`🚫 [${this.config.id}] 条件不满足，跳过创建`);
      return;
    }

    // 检查组件是否已存在
    if (this.checkExistence()) {
      logger.debug(`✅ [${this.config.id}] 组件已存在，跳过创建`);
      return;
    }

    // 创建新组件
    this.createPromise = this.createComponent();
    await this.createPromise;
  }

  /**
   * 创建组件
   */
  private async createComponent(): Promise<void> {
    if (this.isCreating) {
      logger.debug(`⏳ [${this.config.id}] 组件已在创建中，跳过重复创建`);
      return;
    }

    this.isCreating = true;

    try {
      // 双重检查
      if (this.checkExistence()) {
        logger.debug(`✅ [${this.config.id}] 组件已存在，取消创建`);
        return;
      }

      // 销毁现有组件
      this.destroyComponent();

      // 创建新组件
      this.component = await this.factory();

      // 初始化组件
      await this.component.init();

      logger.debug(`✅ [${this.config.id}] 组件创建成功`);
    } catch (error) {
      logger.error(`❌ [${this.config.id}] 创建组件失败:`, error);
      this.component = null;
    } finally {
      this.isCreating = false;
      this.createPromise = null;
    }
  }

  /**
   * 检查并重新创建组件
   */
  public async checkAndRecreate(): Promise<void> {
    if (this.isCreating) {
      logger.debug(`⏳ [${this.config.id}] 组件正在创建中，跳过检查`);
      return;
    }

    const shouldExist = this.checkCondition();
    const doesExist = this.checkExistence();

    if (shouldExist && !doesExist) {
      logger.debug(`🔧 [${this.config.id}] 组件缺失，重新创建组件`);
      await this.tryCreate();
    } else if (!shouldExist && doesExist) {
      logger.debug(`🗑️ [${this.config.id}] 条件不满足，销毁组件`);
      this.destroyComponent();
    }
  }

  /**
   * 销毁组件
   */
  public destroyComponent(): void {
    if (this.isCreating && this.createPromise) {
      logger.debug(`⏳ [${this.config.id}] 等待创建完成后销毁`);
      this.createPromise.then(() => {
        if (this.component) {
          this.component.destroy();
          this.component = null;
          logger.debug(`🗑️ [${this.config.id}] 组件已销毁（延迟）`);
        }
      });
      return;
    }

    if (this.component) {
      this.component.destroy();
      this.component = null;
      logger.debug(`🗑️ [${this.config.id}] 组件已销毁`);
    }
  }

  /**
   * 刷新组件
   */
  public async refreshComponent(): Promise<void> {
    if (this.component && this.component.refresh) {
      await this.component.refresh();
      logger.debug(`🔄 [${this.config.id}] 组件已刷新`);
    }
  }

  /**
   * 处理路由变化
   */
  public async handleRouteChange(_to: RouteLocation, _from: RouteLocation | null): Promise<void> {
    await this.checkAndRecreate();
  }

  /**
   * 处理 DOM 变化
   */
  public async handleDOMChange(_mutations: MutationRecord[]): Promise<void> {
    await this.checkAndRecreate();
  }

  /**
   * 清理资源
   */
  public cleanup(): void {
    this.isCreating = false;
    this.createPromise = null;
    this.destroyComponent();
  }

  /**
   * 获取组件实例
   */
  public getComponent(): T | null {
    return this.component;
  }

  /**
   * 检查组件是否存在
   */
  public hasComponent(): boolean {
    return this.component !== null && this.checkExistence();
  }

  /**
   * 检查是否正在创建中
   */
  public isCreatingComponent(): boolean {
    return this.isCreating;
  }

  /**
   * 获取配置
   */
  public getConfig(): ComponentConfig {
    return this.config;
  }
}

// DOM 注入管理器选项
interface DOMInjectorOptions {
  /** DOM 观察配置 */
  observerConfig?: MutationObserverInit;
  /** 是否启用全局路由监听，默认 true */
  enableGlobalRouterWatch?: boolean;
  /** 路由监听延迟时间，默认 100ms */
  routerDelay?: number;
}

/**
 * DOM 注入管理器
 * 统一管理多个组件的 DOM 注入
 */
export class DOMInjectorManager {
  private injectors = new Map<string, ComponentInjector>();
  private domObserver: MutationObserver | null = null;
  private routerUnwatch: (() => void) | null = null;
  private isInitialized = false;
  private readonly options: Required<DOMInjectorOptions>;

  constructor(options: DOMInjectorOptions = {}) {
    this.options = {
      observerConfig: {
        childList: true,
        subtree: true
      },
      enableGlobalRouterWatch: true,
      routerDelay: 100,
      ...options
    };
  }

  /**
   * 注册组件注入器
   */
  public register<T extends InjectableComponent>(
    config: ComponentConfig,
    factory: ComponentFactory<T>
  ): ComponentInjector<T> {
    if (this.injectors.has(config.id)) {
      logger.warn(`⚠️ 注入器 [${config.id}] 已存在，将被覆盖`);
      this.unregister(config.id);
    }

    const injector = new ComponentInjector(config, factory);
    this.injectors.set(config.id, injector as ComponentInjector);

    logger.debug(`📝 注册组件注入器: [${config.id}]`);

    // 如果管理器已经初始化，立即尝试创建组件
    if (this.isInitialized) {
      injector.tryCreate();
    }

    return injector;
  }

  /**
   * 注销组件注入器
   */
  public unregister(id: string): boolean {
    const injector = this.injectors.get(id);
    if (injector) {
      injector.cleanup();
      this.injectors.delete(id);
      logger.debug(`🗑️ 注销组件注入器: [${id}]`);
      return true;
    }
    return false;
  }

  /**
   * 获取注入器
   */
  public getInjector<T extends InjectableComponent>(id: string): ComponentInjector<T> | null {
    return (this.injectors.get(id) as ComponentInjector<T>) || null;
  }

  /**
   * 初始化管理器
   */
  public init(): void {
    if (this.isInitialized) {
      logger.warn('⚠️ DOM 注入管理器已经初始化');
      return;
    }

    logger.debug('🎯 初始化 DOM 注入管理器');

    // 设置全局路由监听
    if (this.options.enableGlobalRouterWatch) {
      this.setupGlobalRouterWatcher();
    }

    // 设置 DOM 观察器
    this.setupDOMObserver();

    // 立即尝试创建所有组件
    this.createAllComponents();

    this.isInitialized = true;
  }

  /**
   * 设置全局路由监听
   */
  private setupGlobalRouterWatcher(): void {
    const { unwatch } = useRouterWatcher(
      async (to, from) => {
        logger.debug('🔄 全局路由变化检测到:', from?.path, '->', to?.path);
        await this.handleGlobalRouteChange(to, from);
      },
      {
        delay: this.options.routerDelay,
        immediate: false
      }
    );

    this.routerUnwatch = unwatch;
    logger.debug('✅ 全局路由监听设置完成');
  }

  /**
   * 设置 DOM 观察器
   */
  private setupDOMObserver(): void {
    let debounceTimer: NodeJS.Timeout | null = null;
    let isProcessing = false;
    let pendingMutations: MutationRecord[] = [];
    let lastDebugTime = 0;
    const debugLogInterval = 3000;

    this.domObserver = new MutationObserver(async (mutations) => {
      // 收集待处理的变化
      pendingMutations.push(...mutations);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        if (isProcessing) {
          logger.debug('🔍 DOM 变化处理中，跳过本次处理');
          return;
        }

        isProcessing = true;
        const currentMutations = [...pendingMutations];
        pendingMutations = []; // 清空待处理队列

        try {
          // 节流处理：3秒内只处理一次
          const now = Date.now();
          if (now - lastDebugTime >= debugLogInterval) {
            lastDebugTime = now;
            logger.debug(`🔍 检测到 ${currentMutations.length} 个 DOM 变化，通知所有组件`);
          }
          await this.handleGlobalDOMChange(currentMutations);
        } finally {
          isProcessing = false;
          debounceTimer = null;
        }
      }, 100);
    });

    // 开始观察
    this.domObserver.observe(document.body, this.options.observerConfig);
    logger.debug('✅ DOM 观察器设置完成');
  }

  /**
   * 处理全局路由变化
   */
  private async handleGlobalRouteChange(to: RouteLocation, from: RouteLocation | null): Promise<void> {
    const promises = Array.from(this.injectors.values()).map(injector =>
      injector.handleRouteChange(to, from)
    );
    await Promise.allSettled(promises);
  }

  /**
   * 处理全局 DOM 变化
   */
  private async handleGlobalDOMChange(mutations: MutationRecord[]): Promise<void> {
    const promises = Array.from(this.injectors.values()).map(injector =>
      injector.handleDOMChange(mutations)
    );
    await Promise.allSettled(promises);
  }

  /**
   * 创建所有组件
   */
  private async createAllComponents(): Promise<void> {
    const promises = Array.from(this.injectors.values()).map(injector => injector.tryCreate());
    await Promise.allSettled(promises);
  }

  /**
   * 刷新所有组件
   */
  public async refreshAllComponents(): Promise<void> {
    const promises = Array.from(this.injectors.values()).map(injector => injector.refreshComponent());
    await Promise.allSettled(promises);
  }

  /**
   * 刷新指定组件
   */
  public async refreshComponent(id: string): Promise<void> {
    const injector = this.injectors.get(id);
    if (injector) {
      await injector.refreshComponent();
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    logger.debug('🗑️ 销毁 DOM 注入管理器');

    // 清理所有注入器
    for (const injector of this.injectors.values()) {
      injector.cleanup();
    }
    this.injectors.clear();

    // 停止路由监听
    if (this.routerUnwatch) {
      this.routerUnwatch();
      this.routerUnwatch = null;
    }

    // 停止 DOM 观察
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }

    this.isInitialized = false;
  }

  /**
   * 获取所有注入器 ID
   */
  public getInjectorIds(): string[] {
    return Array.from(this.injectors.keys());
  }

  /**
   * 获取注入器数量
   */
  public getInjectorCount(): number {
    return this.injectors.size;
  }

  /**
   * 检查是否已初始化
   */
  public isInit(): boolean {
    return this.isInitialized;
  }
}

// 全局 DOM 注入管理器实例
export const domInjector = new DOMInjectorManager({
  enableGlobalRouterWatch: true,
  routerDelay: 200,
  observerConfig: {
    childList: true,
    subtree: true
  }
});
