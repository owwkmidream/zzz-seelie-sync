/**
 * Seelie 脚本交互面板组件
 * 在页面底部插入用户信息和同步按钮
 */

import { logger } from '@logger';
import { initializeUserInfo, type UserInfo } from '@/api/hoyo';

export class SeeliePanel {
  private container: HTMLDivElement | null = null;
  private userInfo: UserInfo | null = null;
  private isLoading = false;

  constructor() {
    this.init();
  }

  /**
   * 初始化面板
   */
  private async init(): Promise<void> {
    try {
      // 等待页面加载完成
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.createPanel());
      } else {
        this.createPanel();
      }
    } catch (error) {
      logger.error('初始化 Seelie 面板失败:', error);
    }
  }

  /**
   * 创建面板
   */
  private async createPanel(): Promise<void> {
    try {
      // 查找目标容器
      const targetContainer = document.querySelector('div.flex.flex-col.items-center.justify-center.w-full.mt-3');
      if (!targetContainer) {
        logger.warn('未找到目标容器，稍后重试...');
        setTimeout(() => this.createPanel(), 1000);
        return;
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
    } catch (error) {
      logger.error('创建 Seelie 面板失败:', error);
    }
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
    section.className = 'flex items-center justify-center mb-3';

    // 用户信息文本
    const infoText = document.createElement('div');
    infoText.className = 'flex flex-col items-center text-center';

    if (this.userInfo) {
      const nickname = document.createElement('div');
      nickname.className = 'text-sm font-medium text-white';
      nickname.textContent = this.userInfo.nickname;

      const uid = document.createElement('div');
      uid.className = 'text-xs text-gray-400';
      uid.textContent = `UID: ${this.userInfo.uid}`;

      infoText.appendChild(nickname);
      infoText.appendChild(uid);
    } else {
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

      // 模拟同步过程（1秒）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 显示成功状态
      syncText.textContent = '同步完成';
      button.className = button.className.replace('bg-gray-700 hover:bg-gray-600', 'bg-green-600 hover:bg-green-700');

      // 2秒后恢复原状态
      setTimeout(() => {
        syncText.textContent = originalText;
        button.className = button.className.replace('bg-green-600 hover:bg-green-700', 'bg-gray-700 hover:bg-gray-600');
        button.disabled = false;
        if (icon) {
          icon.classList.remove('animate-spin');
        }
        this.isLoading = false;
      }, 2000);

      logger.debug('✅ 同步完成');
    } catch (error) {
      logger.error('同步失败:', error);

      // 显示错误状态
      syncText.textContent = '同步失败';
      button.className = button.className.replace('bg-gray-700 hover:bg-gray-600', 'bg-red-600 hover:bg-red-700');

      // 2秒后恢复原状态
      setTimeout(() => {
        syncText.textContent = originalText;
        button.className = button.className.replace('bg-red-600 hover:bg-red-700', 'bg-gray-700 hover:bg-gray-600');
        button.disabled = false;
        const icon = button.querySelector('svg');
        if (icon) {
          icon.classList.remove('animate-spin');
        }
        this.isLoading = false;
      }, 2000);
    }
  }



  /**
   * 销毁面板
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      logger.debug('Seelie 面板已销毁');
    }
  }

  /**
   * 刷新用户信息
   */
  public async refreshUserInfo(): Promise<void> {
    await this.loadUserInfo();
    if (this.container) {
      // 重新创建面板
      const parent = this.container.parentNode;
      if (parent) {
        this.destroy();
        await this.createPanel();
      }
    }
  }
}