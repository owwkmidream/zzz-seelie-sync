// 米哈游绝区零API统一导出
import { exposeDevGlobals } from '@/utils/devGlobals';

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

// 将主要函数挂载到全局对象，方便调试
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // 导入各个模块的函数
  import('./avatar').then(avatarModule => {
    import('./game-note').then(gameNoteModule => {
      import('./client').then(clientModule => {
        import('./utils').then(utilsModule => {
          exposeDevGlobals({
            ZZZApi: {
              // 角色相关
              ...avatarModule,
              // 游戏便笺相关
              ...gameNoteModule,
              // 客户端相关
              getDeviceFingerprint: clientModule.getDeviceFingerprint,
              generateUUID: clientModule.generateUUID,
              generateHexString: clientModule.generateHexString,
              getCurrentDeviceInfo: clientModule.getCurrentDeviceInfo,
              refreshDeviceInfo: clientModule.refreshDeviceInfo,
              resetNapTokenlInitialization: clientModule.resetNapTokenlInitialization,
              getUserInfo: clientModule.getUserInfo,
              clearUserInfo: clientModule.clearUserInfo,
              initializeUserInfo: clientModule.initializeUserInfo,
              // 工具函数
              ...utilsModule
            }
          });
        });
      });
    });
  });
}
