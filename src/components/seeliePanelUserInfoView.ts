import { createUserInfoErrorView } from './seeliePanelErrorView';
import type { UserInfoWithError } from './seeliePanelUserInfo';

interface UserInfoViewActions {
  onOpenMys: () => void;
  onRetry: () => void;
  onStartQRLogin?: () => void;
}

/**
 * 创建用户信息区域
 */
export function createUserInfoSection(
  userInfo: UserInfoWithError | null,
  actions: UserInfoViewActions
): HTMLDivElement {
  const section = document.createElement('div');
  section.className = 'ZSS-user-section';

  // 用户信息文本
  const infoText = document.createElement('div');
  infoText.className = 'ZSS-user-info-text';

  if (userInfo && !('error' in userInfo)) {
    // 正常用户信息显示
    const nickname = document.createElement('div');
    nickname.className = 'ZSS-user-nickname';
    nickname.textContent = userInfo.nickname;

    const uid = document.createElement('div');
    uid.className = 'ZSS-user-uid';
    uid.textContent = `UID: ${userInfo.uid}`;

    infoText.appendChild(nickname);
    infoText.appendChild(uid);
  } else if (userInfo && 'error' in userInfo) {
    // 错误状态显示
    const errorContainer = createUserInfoErrorView(userInfo, {
      onOpenMys: actions.onOpenMys,
      onRetry: actions.onRetry,
      onStartQRLogin: actions.onStartQRLogin,
    });
    infoText.appendChild(errorContainer);
  } else {
    // 默认错误状态
    const errorText = document.createElement('div');
    errorText.className = 'ZSS-user-error-fallback';
    errorText.textContent = '用户信息加载失败';
    infoText.appendChild(errorText);
  }

  section.appendChild(infoText);
  return section;
}
