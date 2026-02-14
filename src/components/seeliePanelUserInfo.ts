import type { UserInfo } from '@/api/hoyo';

export type UserInfoErrorCode =
  | 'login_required'
  | 'no_character'
  | 'network_error'
  | 'unknown';

export interface UserInfoError {
  error: UserInfoErrorCode;
  message: string;
}

export type UserInfoWithError = UserInfo | UserInfoError;

/**
 * 将用户信息加载异常映射为可展示的错误模型
 */
export function mapUserInfoError(error: unknown): UserInfoError {
  const message = String(error);

  if (
    message.includes('获取用户角色失败') ||
    message.includes('未登录') ||
    message.includes('HTTP 401') ||
    message.includes('HTTP 403')
  ) {
    return { error: 'login_required', message: '请先登录米游社账号' };
  }

  if (message.includes('未找到绝区零游戏角色')) {
    return { error: 'no_character', message: '未找到绝区零游戏角色' };
  }

  if (
    message.includes('网络') ||
    message.includes('timeout') ||
    message.includes('fetch')
  ) {
    return { error: 'network_error', message: '网络连接失败，请重试' };
  }

  return { error: 'unknown', message: '用户信息加载失败' };
}
