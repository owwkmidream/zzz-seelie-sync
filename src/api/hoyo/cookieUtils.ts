export type CookieEntry = readonly [string, string | null | undefined];

export interface ParsedSetCookie {
  name: string;
  value: string;
}

export function buildCookieHeader(entries: readonly CookieEntry[]): string {
  return entries
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export function buildCookieTokenV2Header(mid?: string, cookieTokenV2?: string): string {
  return buildCookieHeader([
    ['account_mid_v2', mid],
    ['cookie_token_v2', cookieTokenV2],
  ]);
}

export function parseSetCookieLine(line: string): ParsedSetCookie | null {
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
