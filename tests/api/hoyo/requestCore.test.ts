import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiResponseError } from '../../../src/api/hoyo/errors';
import { createRouteRequestCore } from '../../../src/api/hoyo/requestCore';

function createLogger() {
  return {
    debug: () => {},
    warn: () => {},
    error: () => {},
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushAsyncWork(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('request core: NAP 请求只带最小业务 Cookie/Header', async () => {
  let capturedInit: RequestInit & { anonymous?: boolean; cookie?: string } | undefined;

  const core = createRouteRequestCore({
    fetch: async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ retcode: 0, message: 'OK', data: { list: [] } });
    },
    logger: createLogger(),
    buildRouteRequestContext: async () => ({
      headers: { 'x-rpc-device_fp': 'device-fp' },
      cookie: 'e_nap_token=nap-token',
    }),
    triggerRouteAuthRefresh: async () => {},
    hasPersistedStoken: async () => true,
    isPassportAuthHttpStatus: (status) => status === 401 || status === 403,
    isPassportAuthRetcode: (retcode) => retcode === -100,
    getDeviceFingerprint: async () => {},
  });

  await core.execute({
    url: 'https://example.com/user/avatar_basic_list',
    endpoint: '/user/avatar_basic_list',
    route: 'nap_cultivate',
    method: 'GET',
    requestLabel: 'GET /user/avatar_basic_list',
  });

  assert.equal(capturedInit?.cookie, 'e_nap_token=nap-token');
  assert.deepEqual(capturedInit?.headers, { 'x-rpc-device_fp': 'device-fp' });
});

test('request core: 并发业务鉴权失败只触发一次路由刷新', async () => {
  let fetchCalls = 0;
  let refreshCalls = 0;
  const deferred = createDeferred<void>();

  const core = createRouteRequestCore({
    fetch: async () => {
      fetchCalls += 1;
      if (fetchCalls <= 2) {
        return jsonResponse({ retcode: -100, message: '未登录', data: null });
      }

      return jsonResponse({ retcode: 0, message: 'OK', data: { ok: true } });
    },
    logger: createLogger(),
    buildRouteRequestContext: async () => ({
      headers: { 'x-rpc-device_fp': 'device-fp' },
      cookie: 'e_nap_token=nap-token',
    }),
    triggerRouteAuthRefresh: async () => {
      refreshCalls += 1;
      await deferred.promise;
    },
    hasPersistedStoken: async () => true,
    isPassportAuthHttpStatus: () => false,
    isPassportAuthRetcode: (retcode) => retcode === -100,
    getDeviceFingerprint: async () => {},
  });

  const request1 = core.execute({
    url: 'https://example.com/user/avatar_basic_list',
    endpoint: '/user/avatar_basic_list',
    route: 'nap_cultivate',
    method: 'GET',
    requestLabel: 'GET /user/avatar_basic_list',
  });
  const request2 = core.execute({
    url: 'https://example.com/user/avatar_basic_list',
    endpoint: '/user/avatar_basic_list',
    route: 'nap_cultivate',
    method: 'GET',
    requestLabel: 'GET /user/avatar_basic_list',
  });

  await flushAsyncWork();
  assert.equal(refreshCalls, 1);

  deferred.resolve();
  await Promise.all([request1, request2]);
  assert.equal(fetchCalls, 4);
});

test('request core: 设备指纹错误只刷新一次并重试一次', async () => {
  let fetchCalls = 0;
  let fingerprintRefreshCalls = 0;
  let routeRefreshCalls = 0;

  const core = createRouteRequestCore({
    fetch: async () => {
      fetchCalls += 1;
      if (fetchCalls === 1) {
        return jsonResponse({ retcode: 10041, message: 'device fp invalid', data: null });
      }

      return jsonResponse({ retcode: 0, message: 'OK', data: { ok: true } });
    },
    logger: createLogger(),
    buildRouteRequestContext: async () => ({
      headers: { 'x-rpc-device_fp': 'device-fp' },
      cookie: 'e_nap_token=nap-token',
    }),
    triggerRouteAuthRefresh: async () => {
      routeRefreshCalls += 1;
    },
    hasPersistedStoken: async () => true,
    isPassportAuthHttpStatus: () => false,
    isPassportAuthRetcode: (retcode) => retcode === -100,
    getDeviceFingerprint: async () => {
      fingerprintRefreshCalls += 1;
    },
  });

  const response = await core.execute<{ ok: boolean }>({
    url: 'https://example.com/user/avatar_basic_list',
    endpoint: '/user/avatar_basic_list',
    route: 'nap_cultivate',
    method: 'GET',
    requestLabel: 'GET /user/avatar_basic_list',
  });

  assert.equal(response.data.ok, true);
  assert.equal(fingerprintRefreshCalls, 1);
  assert.equal(routeRefreshCalls, 0);
});

test('request core: 普通业务错误直接抛出，不触发刷新', async () => {
  let routeRefreshCalls = 0;
  let fingerprintRefreshCalls = 0;

  const core = createRouteRequestCore({
    fetch: async () => jsonResponse({ retcode: -1, message: '普通错误', data: null }),
    logger: createLogger(),
    buildRouteRequestContext: async () => ({
      headers: {},
      cookie: 'e_nap_token=nap-token',
    }),
    triggerRouteAuthRefresh: async () => {
      routeRefreshCalls += 1;
    },
    hasPersistedStoken: async () => true,
    isPassportAuthHttpStatus: () => false,
    isPassportAuthRetcode: (retcode) => retcode === -100,
    getDeviceFingerprint: async () => {
      fingerprintRefreshCalls += 1;
    },
  });

  await assert.rejects(
    core.execute({
      url: 'https://example.com/user/avatar_basic_list',
      endpoint: '/user/avatar_basic_list',
      route: 'nap_cultivate',
      method: 'GET',
      requestLabel: 'GET /user/avatar_basic_list',
    }),
    (error) => error instanceof ApiResponseError && error.retcode === -1,
  );

  assert.equal(routeRefreshCalls, 0);
  assert.equal(fingerprintRefreshCalls, 0);
});

test('request core: note 请求只带最小 Cookie/Header', async () => {
  let capturedInit: RequestInit & { anonymous?: boolean; cookie?: string } | undefined;

  const core = createRouteRequestCore({
    fetch: async (_url, init) => {
      capturedInit = init;
      return jsonResponse({ retcode: 0, message: 'OK', data: { energy: { progress: { current: 100, max: 240 } } } });
    },
    logger: createLogger(),
    buildRouteRequestContext: async () => ({
      headers: { 'x-rpc-device_id': 'device-id' },
      cookie: 'ltoken=ltoken; ltuid=428094597',
    }),
    triggerRouteAuthRefresh: async () => {},
    hasPersistedStoken: async () => true,
    isPassportAuthHttpStatus: (status) => status === 401 || status === 403,
    isPassportAuthRetcode: (retcode) => retcode === -100,
    getDeviceFingerprint: async () => {},
  });

  await core.execute({
    url: 'https://example.com/note',
    endpoint: '/note',
    route: 'zzz_note',
    method: 'GET',
    requestLabel: 'GET /note',
  });

  assert.equal(capturedInit?.cookie, 'ltoken=ltoken; ltuid=428094597');
  assert.deepEqual(capturedInit?.headers, { 'x-rpc-device_id': 'device-id' });
});

test('request core: note 并发鉴权失败只触发一次路由刷新', async () => {
  let fetchCalls = 0;
  let refreshCalls = 0;
  const deferred = createDeferred<void>();

  const core = createRouteRequestCore({
    fetch: async () => {
      fetchCalls += 1;
      if (fetchCalls <= 2) {
        return jsonResponse({ retcode: -100, message: '未登录', data: null });
      }

      return jsonResponse({ retcode: 0, message: 'OK', data: { ok: true } });
    },
    logger: createLogger(),
    buildRouteRequestContext: async () => ({
      headers: { 'x-rpc-device_id': 'device-id' },
      cookie: 'ltoken=ltoken; ltuid=428094597',
    }),
    triggerRouteAuthRefresh: async () => {
      refreshCalls += 1;
      await deferred.promise;
    },
    hasPersistedStoken: async () => true,
    isPassportAuthHttpStatus: () => false,
    isPassportAuthRetcode: (retcode) => retcode === -100,
    getDeviceFingerprint: async () => {},
  });

  const request1 = core.execute({
    url: 'https://example.com/note',
    endpoint: '/note',
    route: 'zzz_note',
    method: 'GET',
    requestLabel: 'GET /note',
  });
  const request2 = core.execute({
    url: 'https://example.com/note',
    endpoint: '/note',
    route: 'zzz_note',
    method: 'GET',
    requestLabel: 'GET /note',
  });

  await flushAsyncWork();
  assert.equal(refreshCalls, 1);

  deferred.resolve();
  await Promise.all([request1, request2]);
});
