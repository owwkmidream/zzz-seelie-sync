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

const DEVICE_PROFILE_KEY = 'zzz_device_info';
const DEVICE_PROFILE_SCHEMA_VERSION = 1;

let deviceProfileCache: DeviceInfo | null = null;
let deviceProfilePromise: Promise<DeviceInfo> | null = null;

function createDeviceProfile(): DeviceInfo {
  return {
    deviceId: generateUUID(),
    requestDeviceId: generateSeedId(),
    product: generateProductName(),
    deviceName: generateDeviceName(),
    seedId: generateUUID(),
    seedTime: Date.now().toString(),
    deviceFp: DEVICE_FP_PLACEHOLDER,
    updatedAt: Date.now(),
    schemaVersion: DEVICE_PROFILE_SCHEMA_VERSION,
  };
}

function parseDeviceProfile(raw: string): DeviceInfo | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DeviceInfo>;
    if (!parsed.deviceId || !parsed.deviceFp) {
      return null;
    }

    return {
      deviceId: parsed.deviceId,
      requestDeviceId: parsed.requestDeviceId || generateSeedId(),
      product: parsed.product || generateProductName(),
      deviceName: parsed.deviceName || generateDeviceName(),
      seedId: parsed.seedId || generateUUID(),
      seedTime: parsed.seedTime || Date.now().toString(),
      deviceFp: parsed.deviceFp,
      updatedAt: typeof parsed.updatedAt === 'number'
        ? parsed.updatedAt
        : typeof (parsed as { timestamp?: number }).timestamp === 'number'
          ? (parsed as { timestamp: number }).timestamp
          : Date.now(),
      schemaVersion: DEVICE_PROFILE_SCHEMA_VERSION,
    };
  } catch {
    return null;
  }
}

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
  const gmProfile = parseDeviceProfile(gmRaw);
  if (gmProfile) {
    localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(gmProfile));
    return gmProfile;
  }

  const localRaw = localStorage.getItem(DEVICE_PROFILE_KEY) ?? '';
  const localProfile = parseDeviceProfile(localRaw);
  if (localProfile) {
    await writeDeviceProfile(localProfile);
    return localProfile;
  }

  const created = createDeviceProfile();
  await writeDeviceProfile(created);
  return created;
}

function shouldRefreshFingerprint(profile: DeviceInfo, forceRefresh = false): boolean {
  if (forceRefresh) {
    return true;
  }

  if (profile.deviceFp === DEVICE_FP_PLACEHOLDER) {
    return true;
  }

  return Date.now() - profile.updatedAt > DEVICE_FP_TTL_MS;
}

async function loadDeviceProfile(forceRefresh = false): Promise<DeviceInfo> {
  if (!deviceProfilePromise) {
    deviceProfilePromise = (async () => {
      if (!deviceProfileCache) {
        deviceProfileCache = await readDeviceProfile();
      }

      if (shouldRefreshFingerprint(deviceProfileCache, forceRefresh)) {
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
    headers: buildDeviceFpHeaders(),
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
  const next = createDeviceProfile();
  await writeDeviceProfile(next);
  deviceProfileCache = next;

  try {
    deviceProfileCache = await refreshDeviceFingerprintInternal(next);
  } catch (error) {
    logger.warn('⚠️ 设备档案已重建，但首次刷新指纹失败，将保留占位值', error);
  }

  return deviceProfileCache;
}
