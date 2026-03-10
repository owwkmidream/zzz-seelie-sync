import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCookieTokenExchangeResult } from '../../../src/api/hoyo/passportCookieParser';

test('passport service: 从响应里解析 cookie_token 与 account_id', () => {
  const result = extractCookieTokenExchangeResult([
    'cookie_token=zxCYFwSH; Path=/',
    'account_id=428094597; Path=/',
  ], {
    uid: '428094597',
    cookie_token: 'zxCYFwSH',
  });

  assert.deepEqual(result, {
    uid: '428094597',
    cookieToken: 'zxCYFwSH',
    accountId: '428094597',
  });
});

test('passport service: account_id 缺失时回退 uid', () => {
  const result = extractCookieTokenExchangeResult([
    'cookie_token=zxCYFwSH; Path=/',
  ], {
    uid: '428094597',
    cookie_token: 'zxCYFwSH',
  });

  assert.equal(result.accountId, '428094597');
});

test('passport service: 缺少 cookie_token 时直接报错', () => {
  assert.throws(
    () => extractCookieTokenExchangeResult([
      'account_id=428094597; Path=/',
    ], {
      uid: '428094597',
    }),
    /响应中未返回 cookie_token/,
  );
});

test('passport service: 缺少 account_id 且 uid 缺失时直接报错', () => {
  assert.throws(
    () => extractCookieTokenExchangeResult([
      'cookie_token=zxCYFwSH; Path=/',
    ], {
      uid: '',
      cookie_token: 'zxCYFwSH',
    }),
    /响应中未返回 account_id\/uid/,
  );
});
