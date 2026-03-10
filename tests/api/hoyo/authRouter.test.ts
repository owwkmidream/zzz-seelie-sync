import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveHoyoAuthRoute } from '../../../src/api/hoyo/authRouter';
import { GAME_RECORD_URL, NAP_CULTIVATE_TOOL_URL } from '../../../src/api/hoyo/config';

test('resolveHoyoAuthRoute: nap cultivate 路由命中 nap_cultivate', () => {
  assert.equal(resolveHoyoAuthRoute(NAP_CULTIVATE_TOOL_URL, '/user/avatar_basic_list'), 'nap_cultivate');
});

test('resolveHoyoAuthRoute: note 路由命中 zzz_note', () => {
  assert.equal(resolveHoyoAuthRoute(GAME_RECORD_URL, '/note'), 'zzz_note');
});

test('resolveHoyoAuthRoute: 未知 baseUrl 会抛错', () => {
  assert.throws(
    () => resolveHoyoAuthRoute('https://example.com', '/unknown'),
    /未配置的 HoYo 鉴权路由/,
  );
});
