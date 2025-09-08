/**
 * Seelie 脚本交互面板组件
 * 在页面底部插入用户信息和同步按钮
 */

import { logger } from '@logger';
import { initializeUserInfo, refreshDeviceInfo, type UserInfo } from '@/api/hoyo';
import { syncAll, syncResinData, syncAllCharacters, syncItemsData } from '@/services/SyncService';
import { setToast } from '@/utils/seelie';

// 扩展用户信息类型以支持错误状态
type UserInfoWithError = UserInfo | {
  error: 'login_required' | 'no_character' | 'network_error' | 'unknown';
  message: string;
};

// URL
const MYS_URL = 'https://www.miyoushe.com/zzz/';

export class SeeliePanel {
  private container: HTMLDivElement | null = null;
  private userInfo: UserInfoWithError | null = null;
  private isLoading = false;
  private isExpanded = false; // 控制二级界面展开状态

  // 组件相关的选择器常量
  public static readonly TARGET_SELECTOR = 'div.flex.flex-col.items-center.justify-center.w-full.mt-3';
  public static readonly PANEL_SELECTOR = '[data-seelie-panel="true"]';

  constructor() {
    // 移除自动初始化，由外部控制
  }

  /**
   * 初始化面板 - 由外部调用
   */
  public async init(): Promise<void> {
    try {
      await this.createPanel();
    } catch (error) {
      logger.error('初始化 Seelie 面板失败:', error);
      throw error;
    }
  }

  /**
   * 创建面板
   */
  private async createPanel(): Promise<void> {
    const targetContainer = document.querySelector(SeeliePanel.TARGET_SELECTOR);
    if (!targetContainer) {
      throw new Error('目标容器未找到');
    }

    // 清理目标容器中可能存在的旧面板
    const existingPanel = targetContainer.querySelector(SeeliePanel.PANEL_SELECTOR);
    if (existingPanel) {
      existingPanel.remove();
      logger.debug('清理了目标容器中的旧面板');
    }

    // 检查是否已经创建过面板
    if (this.container && targetContainer.contains(this.container)) {
      logger.debug('面板已存在，跳过创建');
      return;
    }

    // 获取用户信息
    await this.loadUserInfo();

    // 创建面板元素
    this.container = this.createPanelElement();

    // 插入到目标容器的第一个位置
    targetContainer.insertBefore(this.container, targetContainer.firstChild);

    logger.info('✅ Seelie 面板创建成功');
  }

  /**
   * 加载用户信息
   */
  private async loadUserInfo(): Promise<void> {
    try {
      this.userInfo = await initializeUserInfo();
      logger.debug('用户信息加载成功:', this.userInfo);
    } catch (error) {
      logger.error('加载用户信息失败:', error);
      this.userInfo = null;

      // 分析错误类型，设置相应的错误信息
      const errorMessage = String(error);
      if (errorMessage.includes('获取用户角色失败') || errorMessage.includes('HTTP 401') || errorMessage.includes('HTTP 403')) {
        this.userInfo = { error: 'login_required', message: '请先登录米游社账号' };
      } else if (errorMessage.includes('未找到绝区零游戏角色')) {
        this.userInfo = { error: 'no_character', message: '未找到绝区零游戏角色' };
      } else if (errorMessage.includes('网络') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        this.userInfo = { error: 'network_error', message: '网络连接失败，请重试' };
      } else {
        this.userInfo = { error: 'unknown', message: '用户信息加载失败' };
      }
    }
  }

  /**
   * 创建面板元素
   */
  private createPanelElement(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'w-full mb-3 p-3 bg-gray-800 rounded-lg border border-gray-200/20';
    panel.setAttribute('data-seelie-panel', 'true');

    // 用户信息区域
    const userInfoSection = this.createUserInfoSection();

    // 同步按钮区域
    const syncSection = this.createSyncSection();

    panel.appendChild(userInfoSection);
    panel.appendChild(syncSection);

    return panel;
  }

  /**
   * 创建用户信息区域
   */
  private createUserInfoSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'flex flex-col items-center justify-center mb-3';

    // 用户信息文本
    const infoText = document.createElement('div');
    infoText.className = 'flex flex-col items-center text-center';

    if (this.userInfo && !('error' in this.userInfo)) {
      // 正常用户信息显示
      const nickname = document.createElement('div');
      nickname.className = 'text-sm font-medium text-white';
      nickname.textContent = this.userInfo.nickname;

      const uid = document.createElement('div');
      uid.className = 'text-xs text-gray-400';
      uid.textContent = `UID: ${this.userInfo.uid}`;

      infoText.appendChild(nickname);
      infoText.appendChild(uid);
    } else if (this.userInfo && 'error' in this.userInfo) {
      // 错误状态显示
      const errorInfo = this.userInfo;

      // 错误图标和消息
      const errorContainer = document.createElement('div');
      errorContainer.className = 'flex flex-col items-center';

      const errorIcon = document.createElement('div');
      errorIcon.className = 'text-red-400 mb-2';
      errorIcon.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      `;

      const errorMessage = document.createElement('div');
      errorMessage.className = 'text-sm text-red-400 mb-2';
      errorMessage.textContent = errorInfo.message;

      errorContainer.appendChild(errorIcon);
      errorContainer.appendChild(errorMessage);

      // 根据错误类型显示不同的操作建议
      if (errorInfo.error === 'login_required') {
        const loginHint = document.createElement('div');
        loginHint.className = 'text-xs text-gray-400 mb-2 text-center';
        loginHint.textContent = '请在新标签页中登录米游社后刷新页面';

        const loginButton = document.createElement('button');
        loginButton.className = 'px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all duration-200';
        loginButton.textContent = '前往米游社登录';
        loginButton.addEventListener('click', () => {
          window.open(MYS_URL, '_blank');
        });

        errorContainer.appendChild(loginHint);
        errorContainer.appendChild(loginButton);
      } else if (errorInfo.error === 'no_character') {
        const characterHint = document.createElement('div');
        characterHint.className = 'text-xs text-gray-400 mb-2 text-center';
        characterHint.textContent = '请先在米游社绑定绝区零游戏角色';

        const bindButton = document.createElement('button');
        bindButton.className = 'px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-all duration-200';
        bindButton.textContent = '前往绑定角色';
        bindButton.addEventListener('click', () => {
          window.open(MYS_URL, '_blank');
        });

        errorContainer.appendChild(characterHint);
        errorContainer.appendChild(bindButton);
      } else if (errorInfo.error === 'network_error') {
        const retryButton = document.createElement('button');
        retryButton.className = 'px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-all duration-200';
        retryButton.textContent = '重试';
        retryButton.addEventListener('click', () => this.refreshUserInfo());

        errorContainer.appendChild(retryButton);
      } else {
        // 未知错误，提供重试选项
        const retryButton = document.createElement('button');
        retryButton.className = 'px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-all duration-200';
        retryButton.textContent = '重试';
        retryButton.addEventListener('click', () => this.refreshUserInfo());

        errorContainer.appendChild(retryButton);
      }

      infoText.appendChild(errorContainer);
    } else {
      // 默认错误状态
      const errorText = document.createElement('div');
      errorText.className = 'text-sm text-red-400';
      errorText.textContent = '用户信息加载失败';
      infoText.appendChild(errorText);
    }

    section.appendChild(infoText);

    return section;
  }

  /**
   * 创建同步按钮区域
   */
  private createSyncSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'flex flex-col items-center';

    // 检查用户信息状态，决定是否禁用同步功能
    const isUserInfoValid = this.userInfo && !('error' in this.userInfo);
    const disabledClass = isUserInfoValid ? '' : ' opacity-50 cursor-not-allowed';
    const disabledBgClass = isUserInfoValid ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800';

    // 主同步按钮
    const mainSyncButton = document.createElement('button');
    mainSyncButton.className = `flex items-center justify-center px-6 py-2 ${disabledBgClass} text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2${disabledClass}`;
    mainSyncButton.disabled = !isUserInfoValid;
    mainSyncButton.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      <span class="sync-text">${isUserInfoValid ? '同步全部' : '请先登录'}</span>
    `;

    // 展开/收起按钮
    const expandButton = document.createElement('button');
    expandButton.className = `flex items-center justify-center px-4 py-1 ${isUserInfoValid ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700'} text-white text-sm rounded transition-all duration-200${disabledClass}`;
    expandButton.disabled = !isUserInfoValid;
    expandButton.innerHTML = `
      <span class="mr-1 text-xs">更多选项</span>
      <svg class="w-3 h-3 expand-icon transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    `;

    // 绑定事件（只有在用户信息有效时才绑定）
    if (isUserInfoValid) {
      mainSyncButton.addEventListener('click', () => this.handleSyncAll(mainSyncButton));
      expandButton.addEventListener('click', () => this.toggleExpanded(expandButton));
    }

    // 详细选项容器（初始隐藏）
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'w-full mt-2 overflow-hidden transition-all duration-300';
    detailsContainer.style.maxHeight = '0';
    detailsContainer.style.opacity = '0';

    // 创建详细同步选项
    const detailsContent = this.createDetailedSyncOptions();
    detailsContainer.appendChild(detailsContent);

    section.appendChild(mainSyncButton);
    section.appendChild(expandButton);
    section.appendChild(detailsContainer);

    return section;
  }

  /**
   * 创建详细同步选项
   */
  private createDetailedSyncOptions(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'grid grid-cols-2 gap-2';

    // 检查用户信息状态
    const isUserInfoValid = this.userInfo && !('error' in this.userInfo);

    // 同步选项配置
    const syncOptions = [
      {
        text: '同步电量',
        icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>`,
        handler: (event: Event) => this.handleSyncResin(event)
      },
      {
        text: '同步角色',
        icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>`,
        handler: (event: Event) => this.handleSyncCharacters(event)
      },
      {
        text: '同步材料',
        icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>`,
        handler: (event: Event) => this.handleSyncItems(event)
      },
      {
        text: '重置设备',
        icon: `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15M12 3v9m0 0l-3-3m3 3l3-3"></path>
        </svg>`,
        handler: (event: Event) => this.handleResetDeviceInfo(event)
      }
    ];

    // 创建按钮
    syncOptions.forEach(option => {
      const button = document.createElement('button');
      const buttonClass = isUserInfoValid
        ? 'bg-gray-600 hover:bg-gray-500'
        : 'bg-gray-700 opacity-50 cursor-not-allowed';

      button.className = `flex items-center justify-center px-3 py-2 ${buttonClass} text-white text-sm font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;
      button.disabled = !isUserInfoValid;
      button.innerHTML = `${option.icon}<span class="sync-text">${option.text}</span>`;

      // 只有在用户信息有效时才绑定事件
      if (isUserInfoValid) {
        button.addEventListener('click', option.handler);
      }

      container.appendChild(button);
    });

    return container;
  }

  /**
   * 切换展开状态
   */
  private toggleExpanded(expandButton: HTMLButtonElement): void {
    if (this.isLoading) return;

    this.isExpanded = !this.isExpanded;
    const detailsContainer = this.container?.querySelector('.overflow-hidden') as HTMLDivElement;
    const expandIcon = expandButton.querySelector('.expand-icon') as SVGElement;

    if (this.isExpanded) {
      // 展开
      detailsContainer.style.maxHeight = '200px'; // 足够的高度
      detailsContainer.style.opacity = '1';
      expandIcon.style.transform = 'rotate(180deg)';
    } else {
      // 收起
      detailsContainer.style.maxHeight = '0';
      detailsContainer.style.opacity = '0';
      expandIcon.style.transform = 'rotate(0deg)';
    }
  }

  /**
   * 处理同步全部按钮点击
   */
  private async handleSyncAll(button?: HTMLButtonElement): Promise<void> {
    if (this.isLoading) return;

    // 如果没有传入按钮，查找主按钮
    if (!button) {
      button = this.container?.querySelector('.sync-text')?.closest('button') as HTMLButtonElement;
      if (!button) return;
    }

    await this.performSyncOperation(button, '同步中...', async () => {
      logger.debug('开始同步全部数据...');
      await this.performSync();
      logger.debug('✅ 同步完成');
    });
  }

  /**
   * 处理同步电量
   */
  private async handleSyncResin(event?: Event): Promise<void> {
    const button = (event?.target as HTMLElement)?.closest('button') as HTMLButtonElement;
    if (!button) return;

    await this.performSyncOperation(button, '同步中...', async () => {
      logger.debug('开始同步电量数据...');
      const success = await syncResinData();
      if (!success) {
        throw new Error('电量同步失败');
      }
      logger.debug('✅ 电量同步完成');
    });
  }

  /**
   * 处理同步角色
   */
  private async handleSyncCharacters(event?: Event): Promise<void> {
    const button = (event?.target as HTMLElement)?.closest('button') as HTMLButtonElement;
    if (!button) return;

    await this.performSyncOperation(button, '同步中...', async () => {
      logger.debug('开始同步角色数据...');
      const result = await syncAllCharacters();
      if (result.success === 0) {
        throw new Error('角色同步失败');
      }
      logger.debug('✅ 角色同步完成');
    });
  }

  /**
   * 处理同步材料
   */
  private async handleSyncItems(event?: Event): Promise<void> {
    const button = (event?.target as HTMLElement)?.closest('button') as HTMLButtonElement;
    if (!button) return;

    await this.performSyncOperation(button, '同步中...', async () => {
      logger.debug('开始同步材料数据...');
      const success = await syncItemsData();
      if (!success) {
        throw new Error('材料同步失败');
      }
      logger.debug('✅ 材料同步完成');
    });
  }

  /**
   * 处理重置设备信息
   */
  private async handleResetDeviceInfo(event?: Event): Promise<void> {
    const button = (event?.target as HTMLElement)?.closest('button') as HTMLButtonElement;
    if (!button) return;

    await this.performSyncOperation(button, '重置中...', async () => {
      logger.debug('开始重置设备信息...');
      try {
        await refreshDeviceInfo();
        logger.debug('✅ 设备信息重置完成');
        setToast('设备信息已重置', 'success');
      } catch (error) {
        logger.error('设备信息重置失败:', error);
        setToast('设备信息重置失败', 'error');
      }
    });
  }

  /**
   * 通用同步操作处理器
   */
  private async performSyncOperation(
    button: HTMLButtonElement,
    loadingText: string,
    syncOperation: () => Promise<void>
  ): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    const syncText = button.querySelector('.sync-text') as HTMLSpanElement;
    const originalText = syncText.textContent;

    try {
      // 禁用所有按钮并显示加载状态
      this.setAllButtonsDisabled(true);
      syncText.textContent = loadingText;

      // 添加旋转动画到图标
      const icon = button.querySelector('svg');
      if (icon) {
        icon.classList.add('animate-spin');
      }

      // 执行同步操作
      await syncOperation();

      // 显示成功状态
      this.showSyncResult(button, syncText, originalText, icon, 'success');
    } catch (error) {
      logger.error('同步失败:', error);

      // 显示错误状态
      const icon = button.querySelector('svg');
      this.showSyncResult(button, syncText, originalText, icon, 'error');
    }
  }

  /**
   * 执行同步操作
   */
  private async performSync(): Promise<void> {
    try {
      logger.debug('开始执行完整同步...');

      // 调用 SyncService 的 syncAll 方法
      const result = await syncAll();

      // 检查同步结果
      const { resinSync, characterSync, itemsSync } = result;
      const totalSuccess = resinSync && characterSync.success > 0 && itemsSync;

      if (!totalSuccess) {
        const errorMessages: string[] = [];

        if (!resinSync) errorMessages.push('电量同步失败');
        if (characterSync.success === 0) {
          const charErrors = characterSync.errors || ['角色同步失败'];
          errorMessages.push(...charErrors);
        }
        if (!itemsSync) errorMessages.push('养成材料同步失败');

        const errorMessage = errorMessages.length > 0
          ? errorMessages.join(', ')
          : '同步过程中出现错误';
        throw new Error(errorMessage);
      }

      logger.info(`✅ 同步完成 - 电量: ${resinSync ? '成功' : '失败'}, 角色: ${characterSync.success}/${characterSync.total}, 养成材料: ${itemsSync ? '成功' : '失败'}`);
    } catch (error) {
      logger.error('同步操作失败:', error);
      throw error;
    }
  }

  /**
   * 设置所有按钮的禁用状态
   */
  private setAllButtonsDisabled(disabled: boolean): void {
    if (!this.container) return;

    const buttons = this.container.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = disabled;
    });
  }

  /**
   * 显示同步结果
   */
  private showSyncResult(
    button: HTMLButtonElement,
    syncText: HTMLSpanElement,
    originalText: string | null,
    icon: SVGElement | null,
    type: 'success' | 'error'
  ): void {
    const isSuccess = type === 'success';

    // 更新文本和样式
    syncText.textContent = isSuccess ? '同步完成' : '同步失败';
    const originalBgClass = button.className.match(/bg-gray-\d+/)?.[0] || 'bg-gray-700';
    const originalHoverClass = button.className.match(/hover:bg-gray-\d+/)?.[0] || 'hover:bg-gray-600';
    const newColorClass = isSuccess ? 'bg-green-600' : 'bg-red-600';
    const newHoverClass = isSuccess ? 'hover:bg-green-700' : 'hover:bg-red-700';

    button.className = button.className
      .replace(originalBgClass, newColorClass)
      .replace(originalHoverClass, newHoverClass);

    // 2秒后恢复原状态
    setTimeout(() => {
      syncText.textContent = originalText || '同步全部';
      button.className = button.className
        .replace(newColorClass, originalBgClass)
        .replace(newHoverClass, originalHoverClass);

      if (icon) {
        icon.classList.remove('animate-spin');
      }

      // 恢复所有按钮状态
      this.setAllButtonsDisabled(false);
      this.isLoading = false;
    }, 2000);
  }

  /**
   * 销毁面板
   */
  public destroy(): void {
    // 清理当前实例的容器
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }

    // 额外清理：移除页面上所有可能存在的面板（防止重复创建）
    const allPanels = document.querySelectorAll(SeeliePanel.PANEL_SELECTOR);
    allPanels.forEach(panel => {
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    });

    logger.debug('Seelie 面板已销毁');
  }

  /**
   * 刷新组件（实现接口要求）
   */
  public async refresh(): Promise<void> {
    await this.refreshUserInfo();
  }

  /**
   * 刷新用户信息
   */
  public async refreshUserInfo(): Promise<void> {
    try {
      if (this.container) {
        // 重新创建面板
        const parent = this.container.parentNode;
        if (parent) {
          this.destroy();
          await this.createPanel();
        }
      }
    } catch (error) {
      logger.error('刷新用户信息失败:', error);
    }
  }
}