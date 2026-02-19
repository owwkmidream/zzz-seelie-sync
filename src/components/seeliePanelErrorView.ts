import type { UserInfoError } from './seeliePanelUserInfo';

interface ErrorViewActions {
  onOpenMys: () => void;
  onRetry: () => void;
  onStartQRLogin?: () => void;
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
  hint.className = 'ZSS-error-hint';
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
  errorContainer.className = 'ZSS-error-container';

  const errorIcon = document.createElement('div');
  errorIcon.className = 'ZSS-error-icon';
  errorIcon.innerHTML = `
    <svg class="ZSS-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
    </svg>
  `;

  const errorMessage = document.createElement('div');
  errorMessage.className = 'ZSS-error-message';
  errorMessage.textContent = errorInfo.message;

  errorContainer.appendChild(errorIcon);
  errorContainer.appendChild(errorMessage);

  if (errorInfo.error === 'login_required') {
    errorContainer.appendChild(createHint('使用米游社 App 扫码登录，或前往米游社网页登录'));
    if (actions.onStartQRLogin) {
      errorContainer.appendChild(
        createActionButton(
          'ZSS-action-button ZSS-action-button--login',
          '扫码登录',
          actions.onStartQRLogin
        )
      );
    }
    errorContainer.appendChild(
      createActionButton(
        'ZSS-action-button ZSS-action-button--retry-default ZSS-mt-2',
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
        'ZSS-action-button ZSS-action-button--bind',
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
        'ZSS-action-button ZSS-action-button--retry-network',
        '重试',
        actions.onRetry
      )
    );
    return errorContainer;
  }

  errorContainer.appendChild(createHint('请先重试；若持续失败，请刷新页面并重新登录米游社。'));
  errorContainer.appendChild(
    createActionButton(
      'ZSS-action-button ZSS-action-button--retry-default',
      '重试',
      actions.onRetry
    )
  );
  return errorContainer;
}
