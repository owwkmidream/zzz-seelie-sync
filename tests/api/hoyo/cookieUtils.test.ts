import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCookieHeader,
  buildCookieTokenHeader,
  parseSetCookieLine,
} from '../../../src/api/hoyo/cookieUtils';

test('buildCookieHeader: 只拼接有效 cookie，并保持顺序', () => {
  const header = buildCookieHeader([
    ['mid', 'mid-value'],
    ['stoken', 'stoken-value'],
    ['empty', ''],
    ['missing', undefined],
    ['ltoken', 'ltoken-value'],
  ]);

  assert.equal(header, 'mid=mid-value; stoken=stoken-value; ltoken=ltoken-value');
});

test('parseSetCookieLine: 能解析标准 Set-Cookie 首段', () => {
  assert.deepEqual(
    parseSetCookieLine('e_nap_token=abc123; Path=/; HttpOnly; Secure'),
    { name: 'e_nap_token', value: 'abc123' },
  );
});

test('parseSetCookieLine: 无效输入返回 null', () => {
  assert.equal(parseSetCookieLine('Secure; HttpOnly'), null);
  assert.equal(parseSetCookieLine(''), null);
});

test('buildCookieTokenHeader: 只输出 account_id 与 cookie_token', () => {
  const header = buildCookieTokenHeader('428094597', 'cookie-token');
  assert.equal(header, 'account_id=428094597; cookie_token=cookie-token');
});
