import { logger } from '@/utils/logger';
import { DEVICE_FP_PLACEHOLDER } from './config';
import { buildNapSessionHeaders } from './headerProfiles';
import {
  ensureDeviceProfile,
  getCurrentDeviceProfile,
  refreshDeviceFingerprint as refreshPersistedFingerprint,
  resetDeviceProfile,
} from './deviceProfile';
import type { DeviceInfo } from './types';

/**
 * 兼容旧接口：返回带设备头的手机请求头
 */
export async function getZZZHeaderWithDevice(): Promise<Record<string, string>> {
  await ensureDeviceProfile();
  return buildNapSessionHeaders();
}

/**
 * 刷新当前设备档案的 device_fp，不旋转设备身份
 */
export async function getDeviceFingerprint(): Promise<void> {
  await refreshPersistedFingerprint();
}

/**
 * 获取当前设备档案；如果尚未拿到真实指纹，仅返回已持久化档案
 */
export async function getCurrentDeviceInfo(): Promise<DeviceInfo> {
  return await getCurrentDeviceProfile();
}

/**
 * 用户显式重置设备信息：重建整份设备档案并尝试获取新的 device_fp
 */
export async function refreshDeviceInfo(): Promise<void> {
  logger.info('🔄 开始重建设备档案...');
  const next = await resetDeviceProfile();
  if (next.deviceFp === DEVICE_FP_PLACEHOLDER) {
    throw new Error('设备档案已重建，但新的 device_fp 仍未成功获取');
  }
  logger.info('✅ 设备档案重建完成');
  logger.debug('设备档案详情:', next);
}
