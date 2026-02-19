/**
 * Seelie 脚本交互面板组件
 * 在页面底部插入用户信息和同步按钮
 */

import { logger } from '@logger';
import { hydrateUserInfoFromRole, initializeUserInfo, refreshDeviceInfo } from '@/api/hoyo';
import { createQRLogin, startQRLoginPolling } from '@/api/hoyo/passportService';
import { syncService } from '@/services/SyncService';
import {
  copyAdCleanerRules,
  setAdCleanerEnabled
} from '@/utils/adCleanerMenu';
import { createSettingsModalView } from './seeliePanelSettingsView';
import { setToast } from '@/utils/seelie';
import { mapUserInfoError, type UserInfoWithError } from './seeliePanelUserInfo';
import { SYNC_OPTION_CONFIGS, type SyncActionType } from './seeliePanelSyncOptions';
import { buildFullSyncFeedback } from './seeliePanelSyncResult';
import { createUserInfoSection } from './seeliePanelUserInfoView';
import { createSyncSectionView } from './seeliePanelSyncView';
import { createQRLoginModal, updateQRLoginStatus, refreshQRCode } from './seeliePanelQrLoginView';
import { ensurePanelStyles } from './zssPanelStyles';

// URL
const MYS_URL = 'https://act.mihoyo.com/zzz/gt/character-builder-h#/';
const MYS_POPUP_NAME = 'zzz-seelie-mys-auth';
const MYS_POPUP_WIDTH = 1120;
const MYS_POPUP_HEIGHT = 900;

type SyncOperationStatus = 'success' | 'warning' | 'error';

interface SyncOperationResult {
  status: SyncOperationStatus;
  message: string;
}

export class SeeliePanel {
  private container: HTMLDivElement | null = null;
  private userInfo: UserInfoWithError | null = null;
  private isLoading = false;
  private isExpanded = false; // 控制二级界面展开状态
  private mysPopupCloseWatcher: number | null = null;
  private settingsModal: HTMLDivElement | null = null;
  private settingsModalKeydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private qrLoginCancelFn: (() => void) | null = null;
  private qrLoginModal: HTMLDivElement | null = null;
  private qrLoginKeydownHandler: ((event: KeyboardEvent) => void) | null = null;
  private qrLoginGeneration = 0;

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
      setToast('用户信息加载失败，部分同步功能可能不可用', 'warning');
      this.userInfo = mapUserInfoError(error);
    }
  }

  /**
   * 创建面板元素
   */
  private createPanelElement(): HTMLDivElement {
    ensurePanelStyles();

    const panel = document.createElement('div');
    panel.className = 'ZSS-panel';
    panel.setAttribute('data-seelie-panel', 'true');

    // 用户信息区域
    const userInfoSection = createUserInfoSection(this.userInfo, {
      onOpenMys: () => this.openMysPopup(),
      onRetry: () => this.refreshUserInfo(),
      onStartQRLogin: () => this.startQRLogin(),
    });

    // 同步按钮区域
    const syncSection = this.createSyncSection();

    panel.appendChild(userInfoSection);
    panel.appendChild(syncSection);

    return panel;
  }

  /**
   * 打开设置弹窗
   */
  private openSettingsModal(): void {
    if (!this.container || this.settingsModal) {
      return;
    }

    const modal = createSettingsModalView({
      onToggleAdCleaner: (enabled) => {
        setAdCleanerEnabled(enabled);
        const stateText = enabled ? '开启' : '关闭';
        setToast(`脚本去广告已${stateText}，如未生效可刷新页面`, 'success');
      },
      onCopyUBlockRules: async () => {
        return copyAdCleanerRules();
      },
      onResetDevice: () => this.handleResetDeviceInfo(),
      onClose: () => this.closeSettingsModal(),
    });

    this.settingsModal = modal;
    document.body.appendChild(modal);

    this.settingsModalKeydownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeSettingsModal();
      }
    };
    window.addEventListener('keydown', this.settingsModalKeydownHandler);
  }

  /**
   * 关闭设置弹窗
   */
  private closeSettingsModal(): void {
    if (this.settingsModal) {
      // 退场动画
      this.settingsModal.classList.remove('ZSS-open');
      const modal = this.settingsModal;
      setTimeout(() => modal.remove(), 300);
      this.settingsModal = null;
    }

    if (this.settingsModalKeydownHandler) {
      window.removeEventListener('keydown', this.settingsModalKeydownHandler);
      this.settingsModalKeydownHandler = null;
    }
  }

  /**
   * 以弹窗形式打开米游社页面，降低上下文切换成本
   */
  private openMysPopup(): void {
    const width = Math.min(MYS_POPUP_WIDTH, window.outerWidth);
    const height = Math.min(MYS_POPUP_HEIGHT, window.outerHeight);

    const screenLeft = typeof window.screenLeft === 'number' ? window.screenLeft : window.screenX;
    const screenTop = typeof window.screenTop === 'number' ? window.screenTop : window.screenY;
    // 多屏环境下副屏可能位于主屏左侧/上方，坐标会是负数，不能强制截断为 0
    const left = screenLeft + Math.round((window.outerWidth - width) / 2);
    const top = screenTop + Math.round((window.outerHeight - height) / 2);

    const popup = window.open(
      MYS_URL,
      MYS_POPUP_NAME,
      `popup=yes,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      setToast('登录弹窗被拦截，请允许弹窗后重试', 'warning');
      return;
    }

    try {
      popup.focus();
    } catch (error) {
      logger.warn('弹窗聚焦失败，但登录窗口已打开:', error);
    }
    this.startMysPopupCloseWatcher(popup);
  }

  /**
   * 监听米游社弹窗关闭，关闭后自动刷新页面
   */
  private startMysPopupCloseWatcher(popup: Window): void {
    this.stopMysPopupCloseWatcher();

    this.mysPopupCloseWatcher = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }

      this.stopMysPopupCloseWatcher();
      logger.info('检测到米游社弹窗关闭，刷新页面以更新登录状态');
      window.location.reload();
    }, 500);
  }

  /**
   * 停止监听米游社弹窗关闭
   */
  private stopMysPopupCloseWatcher(): void {
    if (this.mysPopupCloseWatcher === null) {
      return;
    }

    window.clearInterval(this.mysPopupCloseWatcher);
    this.mysPopupCloseWatcher = null;
  }

  /**
   * 启动扫码登录流程
   */
  private async startQRLogin(): Promise<void> {
    if (!this.container) return;

    // 若已有扫码流程进行中，先清理旧实例（防止并发导致监听器/轮询泄漏）
    this.cancelQRLogin();

    // 递增 generation，用于 await 后校验当前流程是否仍有效
    const generation = ++this.qrLoginGeneration;

    try {
      // Step 1: 创建二维码
      const qrData = await createQRLogin();

      // 若在等待期间有后发调用已接管，或组件已被销毁，当前调用静默退出
      if (this.qrLoginGeneration !== generation || !this.container) return;

      // 以 Modal 弹窗展示二维码
      const qrElements = createQRLoginModal(
        qrData,
        () => {
          this.cancelQRLogin();
          void this.refreshUserInfo();
        },
      );

      this.qrLoginModal = qrElements.overlay;
      document.body.appendChild(this.qrLoginModal);

      // ESC 关闭
      this.qrLoginKeydownHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.cancelQRLogin();
          void this.refreshUserInfo();
        }
      };
      window.addEventListener('keydown', this.qrLoginKeydownHandler);

      // Step 2: 开始轮询
      this.qrLoginCancelFn = startQRLoginPolling(qrData.ticket, {
        onStatusChange: (status) => {
          updateQRLoginStatus(qrElements, status);
          if (status === 'Scanned') {
            logger.info('扫码登录：用户已扫码，等待确认');
          }
        },
        onQRExpired: (newData) => {
          refreshQRCode(qrElements, newData);
          logger.info('扫码登录：二维码已过期，已自动刷新');
          setToast('二维码已过期，已自动刷新', 'warning');
        },
        onComplete: (roleInfo) => {
          this.qrLoginCancelFn = null;
          this.closeQRLoginModal();
          logger.info('扫码登录成功，刷新面板');
          setToast('登录成功', 'success');

          // 直接使用 login/account 阶段已拿到的角色信息更新缓存，避免重复调用 login/info
          hydrateUserInfoFromRole(roleInfo);
          void this.refreshUserInfo();
        },
        onError: (error) => {
          this.qrLoginCancelFn = null;
          this.closeQRLoginModal();
          logger.error('扫码登录失败:', error);
          setToast('扫码登录失败，请重试', 'error');
          void this.refreshUserInfo();
        },
      });
    } catch (error) {
      logger.error('启动扫码登录失败:', error);
      setToast('无法创建二维码，请重试', 'error');
    }
  }

  /**
   * 关闭扫码登录 Modal（退场动画 + 移除 DOM）
   */
  private closeQRLoginModal(): void {
    if (this.qrLoginModal) {
      this.qrLoginModal.classList.remove('ZSS-open');
      const modal = this.qrLoginModal;
      setTimeout(() => modal.remove(), 300);
      this.qrLoginModal = null;
    }

    if (this.qrLoginKeydownHandler) {
      window.removeEventListener('keydown', this.qrLoginKeydownHandler);
      this.qrLoginKeydownHandler = null;
    }
  }

  /**
   * 取消扫码登录（停止轮询 + 关闭弹窗）
   */
  private cancelQRLogin(): void {
    if (this.qrLoginCancelFn) {
      this.qrLoginCancelFn();
      this.qrLoginCancelFn = null;
    }
    this.closeQRLoginModal();
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
        onSyncAction: (action, event) => syncActionHandlers[action](event),
        onOpenSettings: () => this.openSettingsModal()
      }
    });
  }

  /**
   * 切换展开状态
   */
  private toggleExpanded(expandButton: HTMLButtonElement): void {
    if (this.isLoading) return;

    this.isExpanded = !this.isExpanded;
    const detailsContainer = this.container?.querySelector('.ZSS-details-container') as HTMLDivElement | null;
    const expandIcon = expandButton.querySelector('.ZSS-expand-icon') as SVGElement | null;
    if (!detailsContainer || !expandIcon) return;

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

    await this.performSyncOperation(button, '同步中...', async () => this.performSync());
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
        return {
          status: success ? 'success' : 'error',
          message: success ? '电量同步完成' : '电量同步失败'
        };
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
          return {
            status: 'error',
            message: '角色同步失败'
          };
        }

        if (result.failed > 0) {
          return {
            status: 'warning',
            message: `角色同步部分完成：成功 ${result.success}，失败 ${result.failed}`
          };
        }

        return {
          status: 'success',
          message: `角色同步完成：成功 ${result.success}`
        };
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
        const result = await syncService.syncItemsData();
        if (!result.success) {
          return {
            status: 'error',
            message: '养成材料同步失败'
          };
        }

        if (result.partial) {
          return {
            status: 'warning',
            message: `养成材料同步部分完成：成功 ${result.successNum}，失败 ${result.failNum}`
          };
        }

        return {
          status: 'success',
          message: `养成材料同步完成：成功 ${result.successNum}，失败 ${result.failNum}`
        };
      }
    );
  }

  /**
   * 处理重置设备信息
   */
  private async handleResetDeviceInfo(event?: Event): Promise<void> {
    // 从设置面板调用（无 event）
    if (!event) {
      try {
        await refreshDeviceInfo();
        setToast('设备信息已重置', 'success');
        logger.info('设备信息重置完成');
      } catch (error) {
        setToast('设备信息重置失败', 'error');
        logger.error('设备信息重置失败:', error);
      }
      return;
    }

    // 从同步按钮区域调用（有 event）
    await this.handleSyncActionFromEvent(
      event,
      '重置中...',
      '重置设备信息',
      async () => {
        try {
          await refreshDeviceInfo();
          setToast('设备信息已重置', 'success');
          return { status: 'success' as const, message: '设备信息重置完成' };
        } catch (error) {
          setToast('设备信息重置失败', 'error');
          logger.error('设备信息重置失败:', error);
          return { status: 'error' as const, message: '设备信息重置失败' };
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
    syncOperation: () => Promise<SyncOperationResult>
  ): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    const syncText = button.querySelector('.ZSS-sync-text') as HTMLSpanElement | null;
    if (!syncText) {
      this.isLoading = false;
      return;
    }
    const originalText = syncText.textContent;

    try {
      // 禁用所有按钮并显示加载状态
      this.setAllButtonsDisabled(true);
      syncText.textContent = loadingText;

      // 添加旋转动画到图标
      const icon = button.querySelector('svg') as SVGElement | null;
      if (icon) {
        icon.classList.add('ZSS-animate-spin');
      }

      // 执行同步操作
      const operationResult = await syncOperation();

      if (operationResult.status === 'success') {
        logger.info(operationResult.message);
      } else if (operationResult.status === 'warning') {
        logger.warn(operationResult.message);
      } else {
        logger.warn(operationResult.message);
      }

      // 显示状态
      this.showSyncResult(button, syncText, originalText, icon, operationResult.status);
    } catch (error) {
      logger.error('同步失败:', error);

      // 显示错误状态
      const icon = button.querySelector('svg') as SVGElement | null;
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
    syncAction: () => Promise<SyncOperationResult>
  ): Promise<void> {
    const button = this.getButtonFromEvent(event);
    if (!button) return;

    await this.performSyncOperation(button, loadingText, async () => {
      const result = await syncAction();
      if (result.status === 'warning') {
        logger.warn(`${actionName}部分完成`);
      }
      return result;
    });
  }

  /**
   * 执行同步操作
   */
  private async performSync(): Promise<SyncOperationResult> {
    try {
      logger.info('开始执行完整同步...');

      // 调用 SyncService 的 syncAll 方法
      const result = await syncService.syncAll();
      const feedback = buildFullSyncFeedback(result);
      const logPayload = {
        summary: feedback.summary,
        detail: feedback.details
      };

      if (feedback.status === 'success') {
        logger.info('完整同步成功', logPayload);
        return {
          status: 'success',
          message: feedback.summary
        };
      }

      if (feedback.status === 'partial') {
        logger.warn('完整同步部分完成', logPayload);
        return {
          status: 'warning',
          message: feedback.summary
        };
      }

      logger.error('完整同步失败', logPayload);
      return {
        status: 'error',
        message: feedback.summary
      };
    } catch (error) {
      logger.error('同步操作失败:', error);
      return {
        status: 'error',
        message: '同步失败，请稍后重试'
      };
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
    type: SyncOperationStatus
  ): void {
    // 更新文本和样式
    const textMap: Record<SyncOperationStatus, string> = {
      success: '同步完成',
      warning: '部分完成',
      error: '同步失败'
    };
    const stateClassMap: Record<SyncOperationStatus, string> = {
      success: 'ZSS-sync-state-success',
      warning: 'ZSS-sync-state-warning',
      error: 'ZSS-sync-state-error',
    };
    const allStateClasses = Object.values(stateClassMap);
    const nextStateClass = stateClassMap[type];

    syncText.textContent = textMap[type];

    button.classList.remove(...allStateClasses);
    button.classList.add(nextStateClass);

    // 2秒后恢复原状态
    setTimeout(() => {
      syncText.textContent = originalText || '同步全部';
      button.classList.remove(nextStateClass);

      if (icon) {
        icon.classList.remove('ZSS-animate-spin');
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
    this.stopMysPopupCloseWatcher();
    this.closeSettingsModal();
    this.cancelQRLogin();
    this.closeQRLoginModal();

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
      if (!this.container) return;

      // 刷新期间先停止可能存在的扫码轮询，避免旧回调竞争更新 UI
      this.cancelQRLogin();

      await this.loadUserInfo();

      // 原地重渲染，避免 destroy/create 与 DOM 注入器并发时出现重复面板
      const nextPanel = this.createPanelElement();
      this.container.replaceWith(nextPanel);
      this.container = nextPanel;
    } catch (error) {
      logger.error('刷新用户信息失败:', error);
    }
  }
}
