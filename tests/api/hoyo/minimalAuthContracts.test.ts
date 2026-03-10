import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MINIMAL_AUTH_CONTRACTS,
  getMinimalAuthContract,
  requiresFreshNapToken,
  resolveNapAuthContractId,
} from '../../../src/api/hoyo/minimalAuthContracts';

test('minimal auth contracts: NAP 主链结构与实测一致', () => {
  assert.deepEqual(getMinimalAuthContract('login/account').minimalCookies, ['account_mid_v2', 'cookie_token_v2']);
  assert.deepEqual(getMinimalAuthContract('login/info').minimalCookies, ['e_nap_token']);
  assert.deepEqual(getMinimalAuthContract('avatar_basic_list').minimalHeaders, ['x-rpc-device_fp']);
  assert.deepEqual(getMinimalAuthContract('batch_avatar_detail_v2').minimalHeaders, ['x-rpc-device_fp']);
  assert.deepEqual(getMinimalAuthContract('avatar_calc').minimalHeaders, []);
});

test('minimal auth contracts: note 与 stoken 交换结构与实测一致', () => {
  assert.deepEqual(getMinimalAuthContract('note').minimalCookies, ['ltoken', 'ltuid']);
  assert.deepEqual(getMinimalAuthContract('note').minimalHeaders, ['x-rpc-device_id']);
  assert.deepEqual(getMinimalAuthContract('getCookieAccountInfoBySToken').minimalCookies, ['mid', 'stoken']);
  assert.deepEqual(getMinimalAuthContract('getLTokenBySToken').minimalCookies, ['mid', 'stoken']);
});

test('minimal auth contracts: fresh e_nap_token 依赖只落在 NAP 会话端点', () => {
  assert.equal(requiresFreshNapToken('login/info'), true);
  assert.equal(requiresFreshNapToken('avatar_basic_list'), true);
  assert.equal(requiresFreshNapToken('batch_avatar_detail_v2'), true);
  assert.equal(requiresFreshNapToken('avatar_calc'), true);
  assert.equal(requiresFreshNapToken('note'), false);
  assert.equal(requiresFreshNapToken('verifyCookieToken'), false);
});

test('minimal auth contracts: 所有端点都有模板来源', () => {
  for (const contract of Object.values(MINIMAL_AUTH_CONTRACTS)) {
    assert.ok(contract.templateSource.length > 0);
    assert.ok(contract.endpoint.length > 0);
  }
});

test('minimal auth contracts: NAP endpoint 能解析到唯一 contract', () => {
  assert.equal(resolveNapAuthContractId('/user/avatar_basic_list'), 'avatar_basic_list');
  assert.equal(resolveNapAuthContractId('/user/batch_avatar_detail_v2'), 'batch_avatar_detail_v2');
  assert.equal(resolveNapAuthContractId('/user/avatar_calc'), 'avatar_calc');
  assert.throws(() => resolveNapAuthContractId('/user/unknown'), /未配置的 NAP 鉴权结构/);
});
