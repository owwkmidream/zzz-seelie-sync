import { GM } from '$';
import { logger } from '@/utils/logger';
import GM_fetch from '@/utils/gmFetch';
import type { ApiResponse, DeviceFpRes, DeviceInfo } from './types';
import {
  DEVICE_FP_PLACEHOLDER,
  DEVICE_FP_TTL_MS,
  DEVICE_FP_URL,
} from './config';
import { HttpRequestError, ApiResponseError } from './errors';
import { buildDeviceFpHeaders } from './headerProfiles';
import { buildDeviceFpRequest } from './devicePayload';
import {
  generateUUID,
  generateSeedId,
  generateProductName,
  generateDeviceName,
} from './deviceUtils';
import { createDeviceProfileCore } from './deviceProfileCore';

const DEVICE_PROFILE_KEY = 'zzz_device_info';
const DEVICE_PROFILE_SCHEMA_VERSION = 1;

let deviceProfileCache: DeviceInfo | null = null;
let deviceProfilePromise: Promise<DeviceInfo> | null = null;

const deviceProfileCore = createDeviceProfileCore({
  now: () => Date.now(),
  generateUUID,
  generateSeedId,
  generateProductName,
  generateDeviceName,
  deviceFpPlaceholder: DEVICE_FP_PLACEHOLDER,
  deviceFpTtlMs: DEVICE_FP_TTL_MS,
});

async function writeDeviceProfile(profile: DeviceInfo): Promise<void> {
  const normalized: DeviceInfo = {
    ...profile,
    schemaVersion: DEVICE_PROFILE_SCHEMA_VERSION,
  };

  await GM.setValue(DEVICE_PROFILE_KEY, JSON.stringify(normalized));
  localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(normalized));
}

async function readDeviceProfile(): Promise<DeviceInfo> {
  const gmRaw = await GM.getValue<string>(DEVICE_PROFILE_KEY, '');
  const gmProfile = deviceProfileCore.parseDeviceProfile(gmRaw);
  if (gmProfile) {
    localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(gmProfile));
    return gmProfile;
  }

  const localRaw = localStorage.getItem(DEVICE_PROFILE_KEY) ?? '';
  const localProfile = deviceProfileCore.parseDeviceProfile(localRaw);
  if (localProfile) {
    await writeDeviceProfile(localProfile);
    return localProfile;
  }

  const created = deviceProfileCore.createDeviceProfile();
  await writeDeviceProfile(created);
  return created;
}

async function loadDeviceProfile(forceRefresh = false): Promise<DeviceInfo> {
  if (!deviceProfilePromise) {
    deviceProfilePromise = (async () => {
      if (!deviceProfileCache) {
        deviceProfileCache = await readDeviceProfile();
      }

      if (deviceProfileCore.shouldRefreshFingerprint(deviceProfileCache, forceRefresh)) {
        deviceProfileCache = await refreshDeviceFingerprintInternal(deviceProfileCache);
      }

      return deviceProfileCache;
    })().finally(() => {
      deviceProfilePromise = null;
    });
  }

  return await deviceProfilePromise;
}

async function refreshDeviceFingerprintInternal(profile: DeviceInfo): Promise<DeviceInfo> {
  const requestBody = buildDeviceFpRequest(profile);
  logger.info(`🔐 开始刷新设备指纹，设备档案: ${profile.deviceId}`);

  const response = await GM_fetch(DEVICE_FP_URL, {
    method: 'POST',
    anonymous: true,
    headers: {
      ...buildDeviceFpHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, '设备指纹获取失败');
  }

  const data = await response.json() as ApiResponse<DeviceFpRes>;
  if (data.retcode !== 0 || data.data.code !== 200 || !data.data.device_fp) {
    throw new ApiResponseError(data.retcode, data.message, '设备指纹获取失败');
  }

  const next: DeviceInfo = {
    ...profile,
    deviceFp: data.data.device_fp,
    updatedAt: Date.now(),
  };

  await writeDeviceProfile(next);
  logger.info('✅ 设备指纹刷新成功');
  return next;
}

export async function getCurrentDeviceProfile(): Promise<DeviceInfo> {
  if (deviceProfileCache) {
    return deviceProfileCache;
  }

  deviceProfileCache = await readDeviceProfile();
  return deviceProfileCache;
}

export async function ensureDeviceProfile(forceRefresh = false): Promise<DeviceInfo> {
  const profile = await loadDeviceProfile(forceRefresh);
  if (profile.deviceFp === DEVICE_FP_PLACEHOLDER) {
    throw new Error('设备指纹仍为占位值，无法继续请求');
  }
  return profile;
}

export async function refreshDeviceFingerprint(): Promise<DeviceInfo> {
  const profile = await getCurrentDeviceProfile();
  deviceProfileCache = await refreshDeviceFingerprintInternal(profile);
  return deviceProfileCache;
}

export async function resetDeviceProfile(): Promise<DeviceInfo> {
  const next = deviceProfileCore.createDeviceProfile();
  await writeDeviceProfile(next);
  deviceProfileCache = next;

  try {
    deviceProfileCache = await refreshDeviceFingerprintInternal(next);
  } catch (error) {
    logger.warn('⚠️ 设备档案已重建，但首次刷新指纹失败，将保留占位值', error);
  }

  return deviceProfileCache;
}
