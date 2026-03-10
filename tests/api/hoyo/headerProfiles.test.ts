import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDeviceFpHeaders,
  buildGameRecordHeaders,
  buildNapBootstrapHeaders,
  buildNapCultivateHeaders,
  buildNapSessionHeaders,
  buildRoleByCookieTokenHeaders,
  buildVerifyCookieTokenHeaders,
} from '../../../src/api/hoyo/headerProfiles';

const device = {
  deviceId: 'device-id',
  deviceFp: 'device-fp',
};

test('NAP bootstrap 与 login/info 不再显式拼业务鉴权头', () => {
  assert.deepEqual(buildNapBootstrapHeaders(device), {});
  assert.deepEqual(buildNapSessionHeaders(), {});
  assert.deepEqual(buildVerifyCookieTokenHeaders(), {});
  assert.deepEqual(buildRoleByCookieTokenHeaders(), {});
});

test('NAP cultivate 按端点输出最小业务头', () => {
  assert.deepEqual(buildNapCultivateHeaders('/user/avatar_basic_list', device), {
    'x-rpc-device_fp': 'device-fp',
  });
  assert.deepEqual(buildNapCultivateHeaders('/user/batch_avatar_detail_v2', device), {
    'x-rpc-device_fp': 'device-fp',
  });
  assert.deepEqual(buildNapCultivateHeaders('/user/avatar_calc', device), {});
});

test('NAP cultivate 未配置端点直接抛错，避免静默 fallback', () => {
  assert.throws(
    () => buildNapCultivateHeaders('/user/unknown', device),
    /未配置的 NAP 鉴权结构/,
  );
});

test('Game record 只输出 x-rpc-device_id，不要求显式 device_fp', () => {
  assert.deepEqual(buildGameRecordHeaders(device), {
    'x-rpc-device_id': 'device-id',
  });
});

test('getFp 不再显式拼业务鉴权头', () => {
  assert.deepEqual(buildDeviceFpHeaders(), {});
});
