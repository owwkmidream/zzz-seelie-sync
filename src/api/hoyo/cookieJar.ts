import { getResponseHeaderLines } from '@/utils/gmFetch';
import type { AuthBundle } from './types';

type CookieEntries = Array<[string, string | undefined]>;

function buildCookieHeader(entries: CookieEntries): string {
  return entries
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function parseSetCookie(line: string): { name: string; value: string } | null {
  const firstPart = line.split(';', 1)[0]?.trim();
  if (!firstPart) {
    return null;
  }

  const separatorIndex = firstPart.indexOf('=');
  if (separatorIndex <= 0) {
    return null;
  }

  return {
    name: firstPart.slice(0, separatorIndex).trim(),
    value: firstPart.slice(separatorIndex + 1).trim(),
  };
}

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
  return buildCookieHeader([
    ['account_id', bundle.accountId],
    ['cookie_token', bundle.cookieToken],
  ]);
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
    const parsed = parseSetCookie(line);
    if (parsed?.name === cookieName) {
      return parsed.value;
    }
  }
  return null;
}
