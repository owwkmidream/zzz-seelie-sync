import { getResponseHeaderLines } from '../../utils/gmFetch';
import type { AuthBundle } from './types';
import { buildCookieHeader, buildCookieTokenV2Header, parseSetCookieLine } from './cookieUtils';

export function buildStokenCookie(bundle: AuthBundle): string {
  return buildCookieHeader([
    ['mid', bundle.mid],
    ['stoken', bundle.stoken],
    ['stuid', bundle.stuid],
  ]);
}

export function buildLTokenCookie(bundle: AuthBundle): string {
  return buildCookieHeader([
    ['ltoken', bundle.ltoken],
    ['ltuid', bundle.ltuid],
  ]);
}

export function buildCookieTokenCookie(bundle: AuthBundle): string {
  return buildCookieTokenV2Header(bundle.mid, bundle.cookieTokenV2);
}

export function buildCombinedSessionCookie(bundle: AuthBundle): string {
  return buildCookieHeader([
    ['ltoken', bundle.ltoken],
    ['ltuid', bundle.ltuid],
    ['account_id', bundle.accountId],
    ['cookie_token', bundle.cookieToken],
  ]);
}

export function buildNapCookie(bundle: AuthBundle): string {
  return buildCookieHeader([
    ['e_nap_token', bundle.eNapToken],
  ]);
}

export function getCookieValueFromResponse(response: Response, cookieName: string): string | null {
  const setCookieLines = getResponseHeaderLines(response, 'set-cookie');
  for (const line of setCookieLines) {
    const parsed = parseSetCookieLine(line);
    if (parsed?.name === cookieName) {
      return parsed.value;
    }
  }
  return null;
}
