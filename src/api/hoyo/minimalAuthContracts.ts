export type MinimalAuthContractId =
  | 'createQRLogin'
  | 'queryQRLoginStatus'
  | 'getCookieAccountInfoBySToken'
  | 'getLTokenBySToken'
  | 'verifyCookieToken'
  | 'getUserGameRolesByCookieToken'
  | 'login/account'
  | 'login/info'
  | 'avatar_basic_list'
  | 'batch_avatar_detail_v2'
  | 'avatar_calc'
  | 'note'
  | 'getFp';

export type NapAuthContractId =
  | 'login/account'
  | 'login/info'
  | 'avatar_basic_list'
  | 'batch_avatar_detail_v2'
  | 'avatar_calc';

export type AuthRefreshDependency = 'none' | 'qr_ticket' | 'e_nap_token';

export interface MinimalAuthContract {
  endpoint: string;
  templateSource: string;
  minimalCookies: readonly string[];
  minimalHeaders: readonly string[];
  refreshDependency: AuthRefreshDependency;
}

export const MINIMAL_AUTH_CONTRACTS: Record<MinimalAuthContractId, MinimalAuthContract> = {
  createQRLogin: {
    endpoint: 'passport-api/account/ma-cn-passport/app/createQRLogin',
    templateSource: 'TeyvatGuide/current-repo QR',
    minimalCookies: [],
    minimalHeaders: ['x-rpc-app_id', 'x-rpc-device_id', 'x-rpc-device_fp'],
    refreshDependency: 'none',
  },
  queryQRLoginStatus: {
    endpoint: 'passport-api/account/ma-cn-passport/app/queryQRLoginStatus',
    templateSource: 'TeyvatGuide/current-repo QR',
    minimalCookies: [],
    minimalHeaders: ['x-rpc-app_id', 'x-rpc-device_id', 'x-rpc-device_fp'],
    refreshDependency: 'qr_ticket',
  },
  getCookieAccountInfoBySToken: {
    endpoint: 'passport-api/account/auth/api/getCookieAccountInfoBySToken',
    templateSource: 'current-repo X4 mobile',
    minimalCookies: ['mid', 'stoken'],
    minimalHeaders: [],
    refreshDependency: 'none',
  },
  getLTokenBySToken: {
    endpoint: 'passport-api/account/auth/api/getLTokenBySToken',
    templateSource: 'current-repo X4 mobile',
    minimalCookies: ['mid', 'stoken'],
    minimalHeaders: [],
    refreshDependency: 'none',
  },
  verifyCookieToken: {
    endpoint: 'passport-api/account/ma-cn-session/web/verifyCookieToken',
    templateSource: 'TeyvatGuide / QR script-managed session',
    minimalCookies: ['account_id', 'cookie_token'],
    minimalHeaders: [],
    refreshDependency: 'none',
  },
  getUserGameRolesByCookieToken: {
    endpoint: 'passport-api/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn',
    templateSource: 'TeyvatGuide / QR script-managed session',
    minimalCookies: ['account_id', 'cookie_token'],
    minimalHeaders: [],
    refreshDependency: 'none',
  },
  'login/account': {
    endpoint: 'api-takumi/common/badge/v1/login/account',
    templateSource: 'TeyvatGuide / QR script-managed session',
    minimalCookies: ['account_id', 'cookie_token'],
    minimalHeaders: [],
    refreshDependency: 'none',
  },
  'login/info': {
    endpoint: 'api-takumi/common/badge/v1/login/info',
    templateSource: 'minimal web session',
    minimalCookies: ['e_nap_token'],
    minimalHeaders: [],
    refreshDependency: 'e_nap_token',
  },
  avatar_basic_list: {
    endpoint: 'act-api-takumi/event/nap_cultivate_tool/user/avatar_basic_list',
    templateSource: '2.js minimal cultivate',
    minimalCookies: ['e_nap_token'],
    minimalHeaders: ['x-rpc-device_id', 'x-rpc-device_fp'],
    refreshDependency: 'e_nap_token',
  },
  batch_avatar_detail_v2: {
    endpoint: 'act-api-takumi/event/nap_cultivate_tool/user/batch_avatar_detail_v2',
    templateSource: '2.js minimal cultivate',
    minimalCookies: ['e_nap_token'],
    minimalHeaders: ['x-rpc-device_id', 'x-rpc-device_fp'],
    refreshDependency: 'e_nap_token',
  },
  avatar_calc: {
    endpoint: 'act-api-takumi/event/nap_cultivate_tool/user/avatar_calc',
    templateSource: '2.js minimal cultivate',
    minimalCookies: ['e_nap_token'],
    minimalHeaders: [],
    refreshDependency: 'e_nap_token',
  },
  note: {
    endpoint: 'api-takumi-record/event/game_record_zzz/api/zzz/note',
    templateSource: 'current-repo mobile note',
    minimalCookies: ['ltoken', 'ltuid'],
    minimalHeaders: ['x-rpc-device_id', 'x-rpc-device_fp'],
    refreshDependency: 'none',
  },
  getFp: {
    endpoint: 'public-data-api/device-fp/api/getFp',
    templateSource: 'current-repo / TeyvatGuide Xiaomi ext_fields',
    minimalCookies: [],
    minimalHeaders: [],
    refreshDependency: 'none',
  },
};

export function getMinimalAuthContract(id: MinimalAuthContractId): MinimalAuthContract {
  return MINIMAL_AUTH_CONTRACTS[id];
}

export function requiresFreshNapToken(id: MinimalAuthContractId): boolean {
  return MINIMAL_AUTH_CONTRACTS[id].refreshDependency === 'e_nap_token';
}

export function resolveNapAuthContractId(endpoint: string): NapAuthContractId {
  switch (endpoint) {
    case '/user/avatar_basic_list':
      return 'avatar_basic_list';
    case '/user/batch_avatar_detail_v2':
      return 'batch_avatar_detail_v2';
    case '/user/avatar_calc':
      return 'avatar_calc';
    default:
      throw new Error(`未配置的 NAP 鉴权结构: ${endpoint}`);
  }
}
