// 米哈游绝区零 API 配置常量

export const APP_VERSION = '2.85.1';

export const NAP_CULTIVATE_TOOL_URL = 'https://act-api-takumi.mihoyo.com/event/nap_cultivate_tool';
export const GAME_RECORD_URL = 'https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz';
export const DEVICE_FP_URL = 'https://public-data-api.mihoyo.com/device-fp/api/getFp';

export const NAP_LOGIN_INFO_URL = 'https://api-takumi.mihoyo.com/common/badge/v1/login/info?game_biz=nap_cn&lang=zh-cn';
export const GAME_ROLE_URL = 'https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=nap_cn';
export const NAP_TOKEN_URL = 'https://api-takumi.mihoyo.com/common/badge/v1/login/account';

// UA 请求头
export const defaultHeaders: Record<string, string> = {
  Accept: 'application/json',
  'User-Agent': `Mozilla/5.0 (Linux; Android 13; Pixel 5 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36 miHoYoBBS/${APP_VERSION}`
};
