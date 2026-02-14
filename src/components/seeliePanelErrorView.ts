import type { UserInfoError } from './seeliePanelUserInfo';

interface ErrorViewActions {
  onOpenMys: () => void;
  onRetry: () => void;
}

function createActionButton(
  className: string,
  text: string,
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = className;
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function createHint(text: string): HTMLDivElement {
  const hint = document.createElement('div');
  hint.className = 'text-xs text-gray-400 mb-2 text-center';
  hint.textContent = text;
  return hint;
}

/**
 * 创建用户信息错误状态视图
 */
export function createUserInfoErrorView(
  errorInfo: UserInfoError,
  actions: ErrorViewActions
): HTMLDivElement {
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

  if (errorInfo.error === 'login_required') {
    errorContainer.appendChild(createHint('请在新标签页中登录米游社后刷新页面'));
    errorContainer.appendChild(
      createActionButton(
        'px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all duration-200',
        '前往米游社登录',
        actions.onOpenMys
      )
    );
    return errorContainer;
  }

  if (errorInfo.error === 'no_character') {
    errorContainer.appendChild(createHint('请先在米游社绑定绝区零游戏角色'));
    errorContainer.appendChild(
      createActionButton(
        'px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-all duration-200',
        '前往绑定角色',
        actions.onOpenMys
      )
    );
    return errorContainer;
  }

  if (errorInfo.error === 'network_error') {
    errorContainer.appendChild(createHint('请检查网络或代理设置后重试，必要时刷新登录状态'));
    errorContainer.appendChild(
      createActionButton(
        'px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-all duration-200',
        '重试',
        actions.onRetry
      )
    );
    return errorContainer;
  }

  errorContainer.appendChild(createHint('请先重试；若持续失败，请刷新页面并重新登录米游社。'));
  errorContainer.appendChild(
    createActionButton(
      'px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-all duration-200',
      '重试',
      actions.onRetry
    )
  );
  return errorContainer;
}
