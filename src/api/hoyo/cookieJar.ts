import { getResponseHeaderLines } from '../../utils/gmFetch';
import type { AuthBundle } from './types';
import { buildCookieHeader, buildCookieTokenHeader, parseSetCookieLine } from './cookieUtils';

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
  return buildCookieTokenHeader(bundle.accountId, bundle.cookieToken);
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

export function getCookieValueFromSetCookieLines(
  setCookieLines: readonly string[],
  cookieName: string,
): string | null {
  for (const line of setCookieLines) {
    const parsed = parseSetCookieLine(line);
    if (parsed?.name === cookieName) {
      return parsed.value;
    }
  }
  return null;
}

export function getCookieValueFromResponse(response: Response, cookieName: string): string | null {
  return getCookieValueFromSetCookieLines(getResponseHeaderLines(response, 'set-cookie'), cookieName);
}
