/**
 * Seelie 脚本交互面板组件
 * 在页面底部插入用户信息和同步按钮
 */

import { logger } from '@logger';
import { initializeUserInfo, refreshDeviceInfo } from '@/api/hoyo';
import { syncService } from '@/services/SyncService';
import { setToast } from '@/utils/seelie';
import { mapUserInfoError, type UserInfoWithError } from './seeliePanelUserInfo';
import { SYNC_OPTION_CONFIGS, type SyncActionType } from './seeliePanelSyncOptions';
import { assertFullSyncSuccess } from './seeliePanelSyncResult';
import { createUserInfoSection } from './seeliePanelUserInfoView';
import { createSyncSectionView } from './seeliePanelSyncView';

// URL
const MYS_URL = 'https://act.mihoyo.com/zzz/gt/character-builder-h#/';

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
      this.userInfo = mapUserInfoError(error);
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
    const userInfoSection = createUserInfoSection(this.userInfo, {
      onOpenMys: () => window.open(MYS_URL, '_blank'),
      onRetry: () => this.refreshUserInfo()
    });

    // 同步按钮区域
    const syncSection = this.createSyncSection();

    panel.appendChild(userInfoSection);
    panel.appendChild(syncSection);

    return panel;
  }

  /**
   * 创建同步按钮区域
   */
  private createSyncSection(): HTMLDivElement {
    // 检查用户信息状态，决定是否禁用同步功能
    const isUserInfoValid = !!this.userInfo && !('error' in this.userInfo);
    const syncActionHandlers: Record<SyncActionType, (event?: Event) => Promise<void>> = {
      resin: (event) => this.handleSyncResin(event),
      characters: (event) => this.handleSyncCharacters(event),
      items: (event) => this.handleSyncItems(event),
      reset_device: (event) => this.handleResetDeviceInfo(event)
    };

    return createSyncSectionView({
      isUserInfoValid,
      syncOptions: SYNC_OPTION_CONFIGS,
      actions: {
        onSyncAll: (button) => this.handleSyncAll(button),
        onToggleExpanded: (button) => this.toggleExpanded(button),
        onSyncAction: (action, event) => syncActionHandlers[action](event)
      }
    });
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
      button = this.container?.querySelector('[data-sync-main="true"]') as HTMLButtonElement;
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
    await this.handleSyncActionFromEvent(
      event,
      '同步中...',
      '同步电量数据',
      async () => {
        const success = await syncService.syncResinData();
        if (!success) {
          throw new Error('电量同步失败');
        }
      }
    );
  }

  /**
   * 处理同步角色
   */
  private async handleSyncCharacters(event?: Event): Promise<void> {
    await this.handleSyncActionFromEvent(
      event,
      '同步中...',
      '同步角色数据',
      async () => {
        const result = await syncService.syncAllCharacters();
        if (result.success === 0) {
          throw new Error('角色同步失败');
        }
      }
    );
  }

  /**
   * 处理同步材料
   */
  private async handleSyncItems(event?: Event): Promise<void> {
    await this.handleSyncActionFromEvent(
      event,
      '同步中...',
      '同步材料数据',
      async () => {
        const success = await syncService.syncItemsData();
        if (!success) {
          throw new Error('材料同步失败');
        }
      }
    );
  }

  /**
   * 处理重置设备信息
   */
  private async handleResetDeviceInfo(event?: Event): Promise<void> {
    await this.handleSyncActionFromEvent(
      event,
      '重置中...',
      '重置设备信息',
      async () => {
      try {
        await refreshDeviceInfo();
        setToast('设备信息已重置', 'success');
      } catch (error) {
        setToast('设备信息重置失败', 'error');
        throw error;
      }
      }
    );
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
   * 从点击事件中解析按钮元素
   */
  private getButtonFromEvent(event?: Event): HTMLButtonElement | null {
    return ((event?.target as HTMLElement | null)?.closest('button') as HTMLButtonElement) || null;
  }

  /**
   * 从点击事件中解析按钮并执行同步动作
   */
  private async handleSyncActionFromEvent(
    event: Event | undefined,
    loadingText: string,
    actionName: string,
    syncAction: () => Promise<void>
  ): Promise<void> {
    const button = this.getButtonFromEvent(event);
    if (!button) return;

    await this.performSyncOperation(button, loadingText, async () => {
      logger.debug(`开始${actionName}...`);
      await syncAction();
      logger.debug(`✅ ${actionName}完成`);
    });
  }

  /**
   * 执行同步操作
   */
  private async performSync(): Promise<void> {
    try {
      logger.debug('开始执行完整同步...');

      // 调用 SyncService 的 syncAll 方法
      const result = await syncService.syncAll();
      assertFullSyncSuccess(result);

      const { resinSync, characterSync, itemsSync } = result;
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
