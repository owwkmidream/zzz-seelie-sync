// 米哈游绝区零API统一导出

// 类型导出
export type * from './types';

// 客户端核心功能
export {
  ensureUserInfo,
  request,
  getDeviceFingerprint,
  generateUUID,
  generateHexString,
  getUserInfo,
  clearUserInfo,
  initializeUserInfo,
  hydrateUserInfoFromRole,
  getCurrentDeviceInfo,
  refreshDeviceInfo,
  resetNapTokenlInitialization,
} from './client';

// 角色相关API
export {
  getAvatarBasicList,
  batchGetAvatarDetail,
  getAvatarDetail
} from './avatar';

// 游戏便笺API
export {
  getGameNote,
  getEnergyInfo,
} from './game-note';

// 工具函数
export {
  resolveUserInfo,
  processBatches,
} from './utils';

// 扫码登录
export {
  createQRLogin,
  startQRLoginPolling,
  type QRLoginCallbacks,
} from './passportService';
