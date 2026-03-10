import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecordAuthCore } from '../../../src/api/hoyo/recordAuthCore';
import type { AuthBundle } from '../../../src/api/hoyo/types';

function createBundle(overrides: Partial<AuthBundle> = {}): AuthBundle {
  return {
    updatedAt: Date.now(),
    schemaVersion: 1,
    ...overrides,
  };
}

function createLogger() {
  return {
    debug: () => {},
    info: () => {},
  };
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

test('record auth core: 已有 ltoken + ltuid 时不再刷新', async () => {
  let lTokenCalls = 0;
  let accountInfoCalls = 0;
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
    ltoken: 'ltoken',
    ltuid: '428094597',
  });

  const core = createRecordAuthCore({
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistLToken: async (ltoken, ltuid) => Object.assign(bundle, { ltoken, ltuid }),
    requestCookieAccountInfoByStoken: async () => {
      accountInfoCalls += 1;
      return { uid: '428094597' };
    },
    requestLTokenByStoken: async () => {
      lTokenCalls += 1;
      return { ltoken: 'new-ltoken' };
    },
  });

  await core.ensureLToken(false);
  assert.equal(lTokenCalls, 0);
  assert.equal(accountInfoCalls, 0);
});

test('record auth core: 缺少 ltuid 时先补 uid 再刷新 ltoken', async () => {
  let accountInfoCalls = 0;
  let lTokenCalls = 0;
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
  });

  const core = createRecordAuthCore({
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistLToken: async (ltoken, ltuid) => Object.assign(bundle, { ltoken, ltuid }),
    requestCookieAccountInfoByStoken: async () => {
      accountInfoCalls += 1;
      return { uid: '428094597' };
    },
    requestLTokenByStoken: async () => {
      lTokenCalls += 1;
      return { ltoken: 'ltoken' };
    },
  });

  await core.ensureLToken(false);
  assert.equal(accountInfoCalls, 1);
  assert.equal(lTokenCalls, 1);
  assert.equal(bundle.stuid, '428094597');
  assert.equal(bundle.ltuid, '428094597');
  assert.equal(bundle.ltoken, 'ltoken');
});

test('record auth core: 并发 ensureLToken 只触发一轮刷新', async () => {
  let lTokenCalls = 0;
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
    stuid: '428094597',
  });
  const deferred = createDeferred<{ ltoken: string }>();

  const core = createRecordAuthCore({
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistLToken: async (ltoken, ltuid) => Object.assign(bundle, { ltoken, ltuid }),
    requestCookieAccountInfoByStoken: async () => ({ uid: '428094597' }),
    requestLTokenByStoken: async () => {
      lTokenCalls += 1;
      return await deferred.promise;
    },
  });

  const promise1 = core.ensureLToken(false);
  const promise2 = core.ensureLToken(false);
  await flushAsyncWork();

  assert.equal(lTokenCalls, 1);

  deferred.resolve({ ltoken: 'ltoken' });
  await Promise.all([promise1, promise2]);
  assert.equal(bundle.ltoken, 'ltoken');
  assert.equal(bundle.ltuid, '428094597');
});

test('record auth core: 缺少 stoken/mid 时直接报错', async () => {
  const bundle = createBundle();

  const core = createRecordAuthCore({
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistLToken: async (ltoken, ltuid) => Object.assign(bundle, { ltoken, ltuid }),
    requestCookieAccountInfoByStoken: async () => ({ uid: '428094597' }),
    requestLTokenByStoken: async () => ({ ltoken: 'ltoken' }),
  });

  await assert.rejects(
    core.ensureLToken(false),
    /未找到 stoken\/mid，请先扫码登录/,
  );
});

test('record auth core: 获取 ltoken 成功但没有 ltuid/stuid 时直接报错', async () => {
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
  });

  const core = createRecordAuthCore({
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistLToken: async (ltoken, ltuid) => Object.assign(bundle, { ltoken, ltuid }),
    requestCookieAccountInfoByStoken: async () => ({ uid: '' as unknown as string }),
    requestLTokenByStoken: async () => ({ ltoken: 'ltoken' }),
  });

  await assert.rejects(
    core.ensureLToken(false),
    /获取 ltoken 成功但缺少 ltuid\/stuid/,
  );
});
