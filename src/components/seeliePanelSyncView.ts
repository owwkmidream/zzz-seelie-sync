import type { SyncActionType, SyncOptionConfig } from './seeliePanelSyncOptions';
import { createSettingsButton } from './seeliePanelSettingsView';

interface SyncSectionActions {
  onSyncAll: (button: HTMLButtonElement) => Promise<void> | void;
  onToggleExpanded: (button: HTMLButtonElement) => Promise<void> | void;
  onSyncAction: (action: SyncActionType, event: Event) => Promise<void> | void;
  onOpenSettings: () => void;
}

interface SyncSectionViewOptions {
  isUserInfoValid: boolean;
  syncOptions: SyncOptionConfig[];
  actions: SyncSectionActions;
}

function createDetailedSyncOptions(
  syncOptions: SyncOptionConfig[],
  isUserInfoValid: boolean,
  actions: SyncSectionActions
): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'ZSS-sync-grid';

  syncOptions.forEach(option => {
    const button = document.createElement('button');
    const buttonClass = isUserInfoValid
      ? 'ZSS-sync-option-btn--enabled'
      : 'ZSS-sync-option-btn--disabled';

    button.className = `ZSS-sync-option-btn ${buttonClass}`;
    button.disabled = !isUserInfoValid;
    button.innerHTML = `${option.icon}<span class="ZSS-sync-text">${option.text}</span>`;

    if (isUserInfoValid) {
      button.addEventListener('click', (event) => {
        void actions.onSyncAction(option.action, event);
      });
    }

    container.appendChild(button);
  });

  return container;
}

/**
 * 创建同步按钮区域视图
 */
export function createSyncSectionView(options: SyncSectionViewOptions): HTMLDivElement {
  const { isUserInfoValid, syncOptions, actions } = options;
  const section = document.createElement('div');
  section.className = 'ZSS-sync-section';

  const mainButtonModifier = isUserInfoValid
    ? 'ZSS-main-sync-btn--enabled'
    : 'ZSS-main-sync-btn--disabled';

  // 主同步按钮
  const mainSyncButton = document.createElement('button');
  mainSyncButton.className = `ZSS-main-sync-btn ${mainButtonModifier}`;
  mainSyncButton.setAttribute('data-sync-main', 'true');
  mainSyncButton.disabled = !isUserInfoValid;
  mainSyncButton.innerHTML = `
    <svg class="ZSS-icon-md ZSS-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    <span class="ZSS-sync-text">${isUserInfoValid ? '同步全部' : '请先登录'}</span>
  `;

  // 展开/收起按钮
  const expandButtonModifier = isUserInfoValid
    ? 'ZSS-expand-btn--enabled'
    : 'ZSS-expand-btn--disabled';
  const expandButton = document.createElement('button');
  expandButton.className = `ZSS-expand-btn ${expandButtonModifier}`;
  expandButton.disabled = !isUserInfoValid;
  expandButton.innerHTML = `
    <span class="ZSS-expand-label">更多选项</span>
    <svg class="ZSS-icon-sm ZSS-expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  `;

  // 绑定事件
  if (isUserInfoValid) {
    mainSyncButton.addEventListener('click', () => {
      void actions.onSyncAll(mainSyncButton);
    });
    expandButton.addEventListener('click', () => {
      void actions.onToggleExpanded(expandButton);
    });
  }

  // 详细选项容器（初始隐藏）
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'ZSS-details-container';
  detailsContainer.style.maxHeight = '0';
  detailsContainer.style.opacity = '0';

  detailsContainer.appendChild(createDetailedSyncOptions(syncOptions, isUserInfoValid, actions));

  // 设置按钮
  const settingsWrapper = document.createElement('div');
  settingsWrapper.className = 'ZSS-settings-wrapper';
  settingsWrapper.appendChild(createSettingsButton(() => actions.onOpenSettings()));

  section.appendChild(mainSyncButton);
  section.appendChild(expandButton);
  section.appendChild(detailsContainer);
  section.appendChild(settingsWrapper);

  return section;
}
