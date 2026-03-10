import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeviceProfileCore } from '../../../src/api/hoyo/deviceProfileCore';

function createCore(now = 1_700_000_000_000) {
  return createDeviceProfileCore({
    now: () => now,
    generateUUID: () => 'uuid-value',
    generateSeedId: () => 'abcdef1234567890',
    generateProductName: () => 'DGZM5P',
    generateDeviceName: () => 'POOUD2JQD5H3',
    deviceFpPlaceholder: '0000000000000',
    deviceFpTtlMs: 3 * 24 * 60 * 60 * 1000,
  });
}

test('deviceProfileCore: 新建设备档案时持久化 deviceId/seedId/seedTime 结构', () => {
  const core = createCore();
  const profile = core.createDeviceProfile();

  assert.equal(profile.deviceId, 'uuid-value');
  assert.equal(profile.seedId, 'abcdef1234567890');
  assert.equal(profile.seedTime, '1700000000000');
  assert.equal(profile.deviceFp, '0000000000000');
});

test('deviceProfileCore: 解析已有档案时保留原始 seed/request 字段', () => {
  const core = createCore();
  const profile = core.parseDeviceProfile(JSON.stringify({
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'seed-id',
    seedTime: '1234567890',
    deviceFp: 'device-fp',
    updatedAt: 42,
  }));

  assert.deepEqual(profile, {
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'seed-id',
    seedTime: '1234567890',
    deviceFp: 'device-fp',
    updatedAt: 42,
    schemaVersion: 1,
  });
});

test('deviceProfileCore: 缺字段时按当前画像规则补齐', () => {
  const core = createCore();
  const profile = core.parseDeviceProfile(JSON.stringify({
    deviceId: 'device-id',
    deviceFp: 'device-fp',
  }));

  assert.deepEqual(profile, {
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'abcdef1234567890',
    seedTime: '1700000000000',
    deviceFp: 'device-fp',
    updatedAt: 1700000000000,
    schemaVersion: 1,
  });
});

test('deviceProfileCore: shouldRefreshFingerprint 只在占位值、过期或强制时返回 true', () => {
  const core = createCore(1_700_000_000_000);

  assert.equal(core.shouldRefreshFingerprint({
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'seed-id',
    seedTime: '1234567890',
    deviceFp: '0000000000000',
    updatedAt: 1_700_000_000_000,
    schemaVersion: 1,
  }), true);

  assert.equal(core.shouldRefreshFingerprint({
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'seed-id',
    seedTime: '1234567890',
    deviceFp: 'device-fp',
    updatedAt: 1_700_000_000_000,
    schemaVersion: 1,
  }), false);

  assert.equal(core.shouldRefreshFingerprint({
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'seed-id',
    seedTime: '1234567890',
    deviceFp: 'device-fp',
    updatedAt: 1_699_000_000_000,
    schemaVersion: 1,
  }), true);

  assert.equal(core.shouldRefreshFingerprint({
    deviceId: 'device-id',
    product: 'DGZM5P',
    deviceName: 'POOUD2JQD5H3',
    seedId: 'seed-id',
    seedTime: '1234567890',
    deviceFp: 'device-fp',
    updatedAt: 1_700_000_000_000,
    schemaVersion: 1,
  }, true), true);
});
