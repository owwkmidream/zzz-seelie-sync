import type { DeviceFpRequest } from './types';
import {
  generateProductName,
  generateUUID,
  generateSeedId
} from './deviceUtils';

function buildDeviceExtFields(productName: string): string {
  const extFields = {
    proxyStatus: 0,
    isRoot: 0,
    romCapacity: '512',
    deviceName: 'Pixel5',
    productName,
    romRemain: '512',
    hostname: 'db1ba5f7c000000',
    screenSize: '1080x2400',
    isTablet: 0,
    aaid: '',
    model: 'Pixel5',
    brand: 'google',
    hardware: 'windows_x86_64',
    deviceType: 'redfin',
    devId: 'REL',
    serialNumber: 'unknown',
    sdCapacity: 125943,
    buildTime: '1704316741000',
    buildUser: 'cloudtest',
    simState: 0,
    ramRemain: '124603',
    appUpdateTimeDiff: 1716369357492,
    deviceInfo: `google/${productName}/redfin:13/TQ3A.230901.001/2311.40000.5.0:user/release-keys`,
    vaid: '',
    buildType: 'user',
    sdkVersion: '33',
    ui_mode: 'UI_MODE_TYPE_NORMAL',
    isMockLocation: 0,
    cpuType: 'arm64-v8a',
    isAirMode: 0,
    ringMode: 2,
    chargeStatus: 3,
    manufacturer: 'Google',
    emulatorStatus: 0,
    appMemory: '512',
    osVersion: '13',
    vendor: 'unknown',
    accelerometer: '',
    sdRemain: 123276,
    buildTags: 'release-keys',
    packageName: 'com.mihoyo.hyperion',
    networkType: 'WiFi',
    oaid: '',
    debugStatus: 1,
    ramCapacity: '125943',
    magnetometer: '',
    display: 'TQ3A.230901.001',
    appInstallTimeDiff: 1706444666737,
    packageVersion: '2.20.2',
    gyroscope: '',
    batteryStatus: 85,
    hasKeyboard: 10,
    board: 'windows'
  };
  return JSON.stringify(extFields);
}

/**
 * 构建设备指纹请求体
 */
export function buildDeviceFpRequest(deviceId: string, deviceFp: string): DeviceFpRequest {
  const productName = generateProductName();
  return {
    device_id: generateSeedId(),
    seed_id: generateUUID(),
    seed_time: Date.now().toString(),
    platform: '2',
    device_fp: deviceFp,
    app_name: 'bbs_cn',
    ext_fields: buildDeviceExtFields(productName),
    bbs_device_id: deviceId
  };
}
