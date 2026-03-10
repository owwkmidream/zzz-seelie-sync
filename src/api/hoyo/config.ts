// 米哈游绝区零鉴权与请求配置

export const APP_VERSION = '2.102.1';
export const HYP_CONTAINER_VERSION = '1.3.3.182';
export const HOYO_LANGUAGE = 'zh-cn';

export const DEVICE_FP_PLACEHOLDER = '0000000000000';
export const DEVICE_FP_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const COOKIE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const PASSPORT_BASE_URL = 'https://passport-api.mihoyo.com';
export const API_TAKUMI_BASE_URL = 'https://api-takumi.mihoyo.com';
export const ACT_TAKUMI_BASE_URL = 'https://act-api-takumi.mihoyo.com';
export const GAME_RECORD_BASE_URL = 'https://api-takumi-record.mihoyo.com';

export const NAP_CULTIVATE_TOOL_URL = `${ACT_TAKUMI_BASE_URL}/event/nap_cultivate_tool`;
export const GAME_RECORD_URL = `${GAME_RECORD_BASE_URL}/event/game_record_zzz/api/zzz`;
export const DEVICE_FP_URL = 'https://public-data-api.mihoyo.com/device-fp/api/getFp';

export const CREATE_QR_LOGIN_URL = `${PASSPORT_BASE_URL}/account/ma-cn-passport/app/createQRLogin`;
export const QUERY_QR_LOGIN_STATUS_URL = `${PASSPORT_BASE_URL}/account/ma-cn-passport/app/queryQRLoginStatus`;
export const COOKIE_TOKEN_URL = `${PASSPORT_BASE_URL}/account/auth/api/getCookieAccountInfoBySToken`;
export const LTOKEN_URL = `${PASSPORT_BASE_URL}/account/auth/api/getLTokenBySToken`;
export const VERIFY_COOKIE_TOKEN_URL = `${PASSPORT_BASE_URL}/account/ma-cn-session/web/verifyCookieToken`;
export const GAME_ROLE_BY_COOKIE_TOKEN_URL = `${PASSPORT_BASE_URL}/binding/api/getUserGameRolesByCookieToken?game_biz=nap_cn`;

export const NAP_LOGIN_INFO_URL = `${API_TAKUMI_BASE_URL}/common/badge/v1/login/info?game_biz=nap_cn&lang=${HOYO_LANGUAGE}`;
export const GAME_ROLE_URL = `${API_TAKUMI_BASE_URL}/binding/api/getUserGameRolesByCookie?game_biz=nap_cn`;
export const NAP_TOKEN_URL = `${API_TAKUMI_BASE_URL}/common/badge/v1/login/account`;

export const MOBILE_USER_AGENT = `Mozilla/5.0 (Linux; Android 12) Mobile miHoYoBBS/${APP_VERSION}`;
export const QR_USER_AGENT = `HYPContainer/${HYP_CONTAINER_VERSION}`;
export const ACCEPT_JSON = 'application/json, text/plain, */*';
export const WEB_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
export const WEB_APP_ID = 'cieb8o6xs1kw';
export const WEB_SDK_VERSION = '2.49.0';
export const WEB_DEVICE_NAME = 'Chrome';
export const WEB_DEVICE_MODEL = 'Chrome 146.0.0.0';
export const WEB_DEVICE_OS = 'Windows 10 64-bit';
export const WEB_MI_REFERRER = 'https://act.mihoyo.com/zzz/gt/character-builder-h#/';
export const WEB_PLATFORM = '4';
export const NAP_PAGE = 'v2.6.0_apps-h_#';
export const NAP_GEETEST_EXT = JSON.stringify({
  gameId: 8,
  page: 'v2.6.0_apps-h_#',
  viewSource: 1,
  actionSource: 132,
});

export const HOYO_REFERER = {
  act: 'https://act.mihoyo.com/',
  webstatic: 'https://webstatic.mihoyo.com/',
  miyoushe: 'https://www.miyoushe.com/',
  user: 'https://user.miyoushe.com/',
} as const;

export const DS_SALTS = {
  K2: 'lX8m5VO5at5JG7hR8hzqFwzyL5aB1tYo',
  LK2: 'yBh10ikxtLPoIhgwgPZSv5dmfaOTSJ6a',
  X4: 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs',
  X6: 't0qEgfub6cvueAPgR5m9aQWWVciEer7v',
} as const;

export type DSSaltType = keyof typeof DS_SALTS;

export const DEVICE_FP_ERROR_CODES = new Set([1034, 5003, 10035, 10041, 10053]);
