import type { SyncActionType, SyncOptionConfig } from './seeliePanelSyncOptions';

interface SyncSectionActions {
  onSyncAll: (button: HTMLButtonElement) => Promise<void> | void;
  onToggleExpanded: (button: HTMLButtonElement) => Promise<void> | void;
  onSyncAction: (action: SyncActionType, event: Event) => Promise<void> | void;
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
  container.className = 'grid grid-cols-2 gap-2';

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
  section.className = 'flex flex-col items-center';

  const disabledClass = isUserInfoValid ? '' : ' opacity-50 cursor-not-allowed';
  const disabledBgClass = isUserInfoValid ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800';

  // 主同步按钮
  const mainSyncButton = document.createElement('button');
  mainSyncButton.className = `flex items-center justify-center px-6 py-2 ${disabledBgClass} text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2${disabledClass}`;
  mainSyncButton.setAttribute('data-sync-main', 'true');
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
    mainSyncButton.addEventListener('click', () => {
      void actions.onSyncAll(mainSyncButton);
    });
    expandButton.addEventListener('click', () => {
      void actions.onToggleExpanded(expandButton);
    });
  }

  // 详细选项容器（初始隐藏）
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'w-full mt-2 overflow-hidden transition-all duration-300';
  detailsContainer.style.maxHeight = '0';
  detailsContainer.style.opacity = '0';

  // 创建详细同步选项
  detailsContainer.appendChild(createDetailedSyncOptions(syncOptions, isUserInfoValid, actions));

  section.appendChild(mainSyncButton);
  section.appendChild(expandButton);
  section.appendChild(detailsContainer);

  return section;
}
