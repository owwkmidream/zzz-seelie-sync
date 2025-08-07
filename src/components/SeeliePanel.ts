/**
 * Seelie 脚本交互面板组件
 * 在页面底部插入用户信息和同步按钮
 */

import { logger } from '@logger';
import { initializeUserInfo, type UserInfo } from '@/api/hoyo';
import { syncAll, syncResinData, syncAllCharacters, syncItemsData } from '@/services/SyncService';

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

    logger.debug('✅ Seelie 面板创建成功');
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
    section.className = 'flex justify-center';

    // 同步全部按钮
    const syncAllButton = document.createElement('button');
    syncAllButton.className = 'flex items-center justify-center px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    syncAllButton.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      <span class="sync-text">同步全部</span>
    `;

    // 绑定点击事件
    syncAllButton.addEventListener('click', () => this.handleSyncAll(syncAllButton));

    section.appendChild(syncAllButton);

    return section;
  }

  /**
   * 处理同步全部按钮点击
   */
  private async handleSyncAll(button: HTMLButtonElement): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    const syncText = button.querySelector('.sync-text') as HTMLSpanElement;
    const originalText = syncText.textContent;

    try {
      // 禁用按钮并显示加载状态
      button.disabled = true;
      syncText.textContent = '同步中...';

      // 添加旋转动画到图标
      const icon = button.querySelector('svg');
      if (icon) {
        icon.classList.add('animate-spin');
      }

      logger.debug('开始同步全部数据...');

      // 执行实际的同步逻辑
      await this.performSync();

      // 显示成功状态
      this.showSyncResult(button, syncText, originalText, icon, 'success');

      logger.debug('✅ 同步完成');
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

      logger.debug(`✅ 同步完成 - 电量: ${resinSync ? '成功' : '失败'}, 角色: ${characterSync.success}/${characterSync.total}, 养成材料: ${itemsSync ? '成功' : '失败'}`);
    } catch (error) {
      logger.error('同步操作失败:', error);
      throw error;
    }
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
    const newColorClass = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
    button.className = button.className.replace('bg-gray-700 hover:bg-gray-600', newColorClass);

    // 2秒后恢复原状态
    setTimeout(() => {
      syncText.textContent = originalText || '同步全部';
      button.className = button.className.replace(newColorClass, 'bg-gray-700 hover:bg-gray-600');
      button.disabled = false;
      if (icon) {
        icon.classList.remove('animate-spin');
      }
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
      await this.loadUserInfo();
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