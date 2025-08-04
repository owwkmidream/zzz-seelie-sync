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
  clearDeviceInfo,
  getCurrentDeviceInfo,
  refreshDeviceFingerprint,
  resetAvatarUrlInitialization,
  AVATAR_URL,
  GAME_RECORD_URL,
  DEVICE_FP_URL
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
  formatEnergyRestoreTime,
  getEnergyProgress
} from './game-note';

// 工具函数
export {
  resolveUserInfo,
  processBatches,
  getElementName,
  getProfessionName,
  getSkillTypeName,
  getEquipmentSlotName,
  filterUnlockedAvatars,
  groupAvatarsByElement,
  groupAvatarsByProfession,
  getSRankAvatars,
  getARankAvatars
} from './utils';

// 将主要函数挂载到全局对象，方便调试
if (typeof window !== 'undefined') {
  // 导入各个模块的函数
  import('./avatar').then(avatarModule => {
    import('./game-note').then(gameNoteModule => {
      import('./client').then(clientModule => {
        import('./utils').then(utilsModule => {
          (window as any).ZZZApi = {
            // 角色相关
            ...avatarModule,
            // 游戏便笺相关
            ...gameNoteModule,
            // 客户端相关
            getDeviceFingerprint: clientModule.getDeviceFingerprint,
            generateUUID: clientModule.generateUUID,
            generateHexString: clientModule.generateHexString,
            clearDeviceInfo: clientModule.clearDeviceInfo,
            getCurrentDeviceInfo: clientModule.getCurrentDeviceInfo,
            refreshDeviceFingerprint: clientModule.refreshDeviceFingerprint,
            resetAvatarUrlInitialization: clientModule.resetAvatarUrlInitialization,
            getUserInfo: clientModule.getUserInfo,
            clearUserInfo: clientModule.clearUserInfo,
            initializeUserInfo: clientModule.initializeUserInfo,
            // 工具函数
            ...utilsModule
          };
        });
      });
    });
  });
}