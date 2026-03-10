import type { DeviceInfo } from './types';

interface DeviceProfileCoreDeps {
  now: () => number;
  generateUUID: () => string;
  generateSeedId: () => string;
  generateProductName: () => string;
  generateDeviceName: () => string;
  deviceFpPlaceholder: string;
  deviceFpTtlMs: number;
}

export function createDeviceProfileCore(deps: DeviceProfileCoreDeps) {
  function createDeviceProfile(): DeviceInfo {
    return {
      deviceId: deps.generateUUID(),
      product: deps.generateProductName(),
      deviceName: deps.generateDeviceName(),
      seedId: deps.generateSeedId(),
      seedTime: deps.now().toString(),
      deviceFp: deps.deviceFpPlaceholder,
      updatedAt: deps.now(),
      schemaVersion: 1,
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
        product: parsed.product || deps.generateProductName(),
        deviceName: parsed.deviceName || deps.generateDeviceName(),
        seedId: parsed.seedId || deps.generateSeedId(),
        seedTime: parsed.seedTime || deps.now().toString(),
        deviceFp: parsed.deviceFp,
        updatedAt: typeof parsed.updatedAt === 'number'
          ? parsed.updatedAt
          : typeof (parsed as { timestamp?: number }).timestamp === 'number'
            ? (parsed as { timestamp: number }).timestamp
            : deps.now(),
        schemaVersion: 1,
      };
    } catch {
      return null;
    }
  }

  function shouldRefreshFingerprint(profile: DeviceInfo, forceRefresh = false): boolean {
    if (forceRefresh) {
      return true;
    }

    if (profile.deviceFp === deps.deviceFpPlaceholder) {
      return true;
    }

    return deps.now() - profile.updatedAt > deps.deviceFpTtlMs;
  }

  return {
    createDeviceProfile,
    parseDeviceProfile,
    shouldRefreshFingerprint,
  };
}
