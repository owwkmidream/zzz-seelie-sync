import type { DeviceInfo } from './types';
import {
  ACCEPT_JSON,
  APP_VERSION,
  HOYO_LANGUAGE,
  HOYO_REFERER,
  MOBILE_USER_AGENT,
  NAP_GEETEST_EXT,
  NAP_PAGE,
  QR_USER_AGENT,
  WEB_APP_ID,
  WEB_DEVICE_MODEL,
  WEB_DEVICE_NAME,
  WEB_DEVICE_OS,
  WEB_MI_REFERRER,
  WEB_PLATFORM,
  WEB_SDK_VERSION,
  WEB_USER_AGENT,
} from './config';

type DeviceHeaders = Pick<DeviceInfo, 'deviceId' | 'deviceFp'>;

function buildMobileBaseHeaders(): Record<string, string> {
  return {
    Accept: ACCEPT_JSON,
    'User-Agent': MOBILE_USER_AGENT,
    'x-rpc-app_version': APP_VERSION,
    'x-rpc-client_type': '5',
    'x-rpc-lang': HOYO_LANGUAGE,
    'x-rpc-language': HOYO_LANGUAGE,
    'x-rpc-platform': '2',
  };
}

function withDeviceHeaders(
  headers: Record<string, string>,
  device: DeviceHeaders,
): Record<string, string> {
  return {
    ...headers,
    'x-rpc-device_id': device.deviceId,
    'x-rpc-device_fp': device.deviceFp,
  };
}

function buildWebBaseHeaders(): Record<string, string> {
  return {
    Accept: ACCEPT_JSON,
    Origin: HOYO_REFERER.act,
    Referer: HOYO_REFERER.act,
    'User-Agent': WEB_USER_AGENT,
    'x-rpc-mi_referrer': WEB_MI_REFERRER,
  };
}

export function buildQrHeaders(deviceId: string): Record<string, string> {
  return {
    Accept: ACCEPT_JSON,
    'User-Agent': QR_USER_AGENT,
    'x-rpc-app_id': 'ddxf5dufpuyo',
    'x-rpc-client_type': '3',
    'x-rpc-device_id': deviceId,
    'Content-Type': 'application/json',
  };
}

export function buildDeviceFpHeaders(): Record<string, string> {
  return {
    ...buildMobileBaseHeaders(),
    Referer: HOYO_REFERER.webstatic,
    'X-Requested-With': 'com.mihoyo.hyperion',
    'Content-Type': 'application/json',
  };
}

export function buildStokenExchangeHeaders(
  device: DeviceHeaders,
  ds: string,
): Record<string, string> {
  return withDeviceHeaders(
    {
      ...buildMobileBaseHeaders(),
      Referer: HOYO_REFERER.webstatic,
      'X-Requested-With': 'com.mihoyo.hyperion',
      DS: ds,
    },
    device,
  );
}

export function buildRoleDiscoveryHeaders(
  device: DeviceHeaders,
  ds: string,
): Record<string, string> {
  return withDeviceHeaders(
    {
      ...buildMobileBaseHeaders(),
      Referer: HOYO_REFERER.webstatic,
      'X-Requested-With': 'com.mihoyo.hyperion',
      DS: ds,
    },
    device,
  );
}

export function buildNapBootstrapHeaders(device: DeviceHeaders): Record<string, string> {
  return {
    ...buildWebBaseHeaders(),
    'Content-Type': 'application/json;',
  };
}

export function buildNapSessionHeaders(device: DeviceHeaders): Record<string, string> {
  return {
    ...buildWebBaseHeaders(),
  };
}

export function buildGameRecordHeaders(device: DeviceHeaders): Record<string, string> {
  return withDeviceHeaders(
    {
      ...buildMobileBaseHeaders(),
      Referer: HOYO_REFERER.act,
    },
    device,
  );
}

export function buildVerifyCookieTokenHeaders(device: DeviceHeaders): Record<string, string> {
  return withDeviceHeaders(
    {
      ...buildWebBaseHeaders(),
      'x-rpc-app_id': WEB_APP_ID,
      'x-rpc-client_type': '4',
      'x-rpc-device_model': encodeURIComponent(WEB_DEVICE_MODEL),
      'x-rpc-device_name': WEB_DEVICE_NAME,
      'x-rpc-device_os': encodeURIComponent(WEB_DEVICE_OS),
      'x-rpc-game_biz': 'nap_cn',
      'x-rpc-lifecycle_id': '',
      'x-rpc-sdk_version': WEB_SDK_VERSION,
      'x-rpc-app_version': '',
    },
    device,
  );
}

export function buildRoleByCookieTokenHeaders(): Record<string, string> {
  return {
    ...buildWebBaseHeaders(),
  };
}

export function buildNapCultivateHeaders(device: DeviceHeaders): Record<string, string> {
  return withDeviceHeaders(
    {
      ...buildWebBaseHeaders(),
      'x-rpc-cultivate_source': 'pc',
      'x-rpc-geetest_ext': NAP_GEETEST_EXT,
      'x-rpc-is_teaser': '1',
      'x-rpc-lang': HOYO_LANGUAGE,
      'x-rpc-lrsag': '',
      'x-rpc-page': NAP_PAGE,
      'x-rpc-platform': WEB_PLATFORM,
    },
    device,
  );
}
