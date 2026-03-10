import { GAME_RECORD_URL, NAP_CULTIVATE_TOOL_URL } from './config';

export type HoyoAuthRoute = 'nap_cultivate' | 'zzz_note';

export function resolveHoyoAuthRoute(baseUrl: string, _endpoint: string): HoyoAuthRoute {
  if (baseUrl === NAP_CULTIVATE_TOOL_URL) {
    return 'nap_cultivate';
  }

  if (baseUrl === GAME_RECORD_URL) {
    return 'zzz_note';
  }

  throw new Error(`未配置的 HoYo 鉴权路由: ${baseUrl}`);
}
