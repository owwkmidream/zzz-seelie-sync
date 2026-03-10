import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDeviceFpRequest } from '../../../src/api/hoyo/devicePayload';

const profile = {
  deviceId: 'device-id',
  product: 'DGZM5P',
  deviceName: 'POOUD2JQD5H3',
  seedId: 'seed-id',
  seedTime: '1700000000000',
  deviceFp: 'device-fp',
  updatedAt: 1700000000000,
  schemaVersion: 1,
};

test('buildDeviceFpRequest: 使用稳定的 deviceId/seedId/seedTime', () => {
  const request = buildDeviceFpRequest(profile);

  assert.equal(request.device_id, 'device-id');
  assert.equal(request.seed_id, 'seed-id');
  assert.equal(request.seed_time, '1700000000000');
  assert.equal(request.device_fp, 'device-fp');
  assert.equal(request.platform, '2');
  assert.equal(request.app_name, 'bbs_cn');
});

test('buildDeviceFpRequest: ext_fields 与当前手机画像模板一致', () => {
  const request = buildDeviceFpRequest(profile);
  const extFields = JSON.parse(request.ext_fields) as Record<string, string | number>;

  assert.equal(extFields.deviceName, 'POOUD2JQD5H3');
  assert.equal(extFields.productName, 'DGZM5P');
  assert.equal(extFields.brand, 'XiaoMi');
  assert.equal(extFields.packageName, 'com.mihoyo.hyperion');
});
