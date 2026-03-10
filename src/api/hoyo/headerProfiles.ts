import type { DeviceInfo } from './types';
import {
  getMinimalAuthContract,
  resolveNapAuthContractId,
  type MinimalAuthContractId,
} from './minimalAuthContracts';
import {
  ACCEPT_JSON,
  APP_VERSION,
  HOYO_LANGUAGE,
  HOYO_REFERER,
  MOBILE_USER_AGENT,
  QR_USER_AGENT,
} from './config';

type DeviceHeaders = Pick<DeviceInfo, 'deviceId' | 'deviceFp'>;
type AuthHeaderName = 'x-rpc-device_id' | 'x-rpc-device_fp';

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

function buildHeadersFromContract(
  contractId: MinimalAuthContractId,
  device?: DeviceHeaders,
): Record<string, string> {
  const headers: Record<string, string> = {};

  for (const headerName of getMinimalAuthContract(contractId).minimalHeaders as AuthHeaderName[]) {
    if (!device) {
      throw new Error(`缺少设备信息，无法生成鉴权头: ${headerName}`);
    }

    if (headerName === 'x-rpc-device_id') {
      headers[headerName] = device.deviceId;
      continue;
    }

    if (headerName === 'x-rpc-device_fp') {
      headers[headerName] = device.deviceFp;
      continue;
    }
  }

  return headers;
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

export function buildCookieTokenExchangeHeaders(): Record<string, string> {
  return {};
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

export function buildNapBootstrapHeaders(): Record<string, string> {
  return buildHeadersFromContract('login/account');
}

export function buildNapSessionHeaders(): Record<string, string> {
  return buildHeadersFromContract('login/info');
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

export function buildVerifyCookieTokenHeaders(): Record<string, string> {
  return buildHeadersFromContract('verifyCookieToken');
}

export function buildRoleByCookieTokenHeaders(): Record<string, string> {
  return buildHeadersFromContract('getUserGameRolesByCookieToken');
}

export function buildNapCultivateHeaders(endpoint: string, device: DeviceHeaders): Record<string, string> {
  return buildHeadersFromContract(resolveNapAuthContractId(endpoint), device);
}
