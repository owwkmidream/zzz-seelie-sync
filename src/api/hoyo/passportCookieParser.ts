import type { CookieTokenData } from './types';
import { parseSetCookieLine } from './cookieUtils';

function getCookieValueFromSetCookieLines(
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

export function extractCookieTokenExchangeResult(
  setCookieLines: readonly string[],
  data: CookieTokenData,
): { uid?: string; cookieToken: string; accountId: string } {
  const cookieToken = data.cookie_token ?? getCookieValueFromSetCookieLines(setCookieLines, 'cookie_token');
  const accountId = getCookieValueFromSetCookieLines(setCookieLines, 'account_id') ?? data.uid;
  if (!cookieToken) {
    throw new Error('获取 cookie_token 失败：响应中未返回 cookie_token');
  }

  if (!accountId) {
    throw new Error('获取 cookie_token 失败：响应中未返回 account_id/uid');
  }

  return {
    uid: data.uid,
    cookieToken,
    accountId,
  };
}
