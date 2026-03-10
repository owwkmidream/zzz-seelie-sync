import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiResponseError } from '../../../src/api/hoyo/errors';
import { createPassportNapCore } from '../../../src/api/hoyo/passportCore';
import type { AuthBundle, UserGameRole } from '../../../src/api/hoyo/types';

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
    warn: () => {},
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

function createRole(): UserGameRole {
  return {
    game_biz: 'nap_cn',
    region: 'prod_gf_cn',
    game_uid: '10946813',
    nickname: '测试角色',
    level: 60,
    is_chosen: true,
    region_name: '新艾利都',
    is_official: true,
  };
}

async function flushAsyncWork(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test('passport core: 新鲜 cookie_token_v2 直接复用，不再交换', async () => {
  let exchangeCalls = 0;
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
    cookieTokenV2: 'cookie-token-v2',
    cookieTokenV2UpdatedAt: 10_000,
  });

  const core = createPassportNapCore({
    now: () => 10_001,
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistCookieTokenV2: async (cookieTokenV2) => Object.assign(bundle, { cookieTokenV2 }),
    persistSelectedRole: async (role) => Object.assign(bundle, { selectedRole: role }),
    persistNapToken: async (eNapToken) => Object.assign(bundle, { eNapToken }),
    requestCookieTokenByStoken: async () => {
      exchangeCalls += 1;
      return { uid: '428094597', cookieTokenV2: 'new-cookie-token-v2' };
    },
    verifyCookieToken: async () => {},
    requestGameRolesByCookieToken: async () => [createRole()],
    requestNapBootstrap: async () => 'nap-token',
    buildCookieTokenCookie: ({ mid, cookieTokenV2 }) => `account_mid_v2=${mid}; cookie_token_v2=${cookieTokenV2}`,
    isAuthRefreshableError: () => false,
    cookieTokenTtlMs: 60_000,
  });

  await core.ensureCookieToken(false);
  assert.equal(exchangeCalls, 0);
});

test('passport core: 并发 ensureCookieToken 只触发一次交换', async () => {
  let exchangeCalls = 0;
  let persistCalls = 0;
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
  });
  const deferred = createDeferred<{ uid: string; cookieTokenV2: string }>();

  const core = createPassportNapCore({
    now: () => 10_000,
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistCookieTokenV2: async (cookieTokenV2) => {
      persistCalls += 1;
      return Object.assign(bundle, {
        cookieTokenV2,
        cookieTokenV2UpdatedAt: 10_000,
      });
    },
    persistSelectedRole: async (role) => Object.assign(bundle, { selectedRole: role }),
    persistNapToken: async (eNapToken) => Object.assign(bundle, { eNapToken }),
    requestCookieTokenByStoken: async () => {
      exchangeCalls += 1;
      return await deferred.promise;
    },
    verifyCookieToken: async () => {},
    requestGameRolesByCookieToken: async () => [createRole()],
    requestNapBootstrap: async () => 'nap-token',
    buildCookieTokenCookie: ({ mid, cookieTokenV2 }) => `account_mid_v2=${mid}; cookie_token_v2=${cookieTokenV2}`,
    isAuthRefreshableError: () => false,
    cookieTokenTtlMs: 60_000,
  });

  const promise1 = core.ensureCookieToken(false);
  const promise2 = core.ensureCookieToken(false);
  await flushAsyncWork();

  assert.equal(exchangeCalls, 1);

  deferred.resolve({
    uid: '428094597',
    cookieTokenV2: 'cookie-token-v2',
  });

  await Promise.all([promise1, promise2]);
  assert.equal(persistCalls, 1);
  assert.equal(bundle.cookieTokenV2, 'cookie-token-v2');
  assert.equal(bundle.stuid, '428094597');
});

test('passport core: 角色缓存命中时不再触发 verify / role discovery', async () => {
  const role = createRole();
  let verifyCalls = 0;
  let roleCalls = 0;
  const bundle = createBundle({ selectedRole: role });

  const core = createPassportNapCore({
    now: () => 10_000,
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistCookieTokenV2: async (cookieTokenV2) => Object.assign(bundle, { cookieTokenV2 }),
    persistSelectedRole: async (nextRole) => Object.assign(bundle, { selectedRole: nextRole }),
    persistNapToken: async (eNapToken) => Object.assign(bundle, { eNapToken }),
    requestCookieTokenByStoken: async () => ({ uid: '428094597', cookieTokenV2: 'cookie-token-v2' }),
    verifyCookieToken: async () => {
      verifyCalls += 1;
    },
    requestGameRolesByCookieToken: async () => {
      roleCalls += 1;
      return [role];
    },
    requestNapBootstrap: async () => 'nap-token',
    buildCookieTokenCookie: ({ mid, cookieTokenV2 }) => `account_mid_v2=${mid}; cookie_token_v2=${cookieTokenV2}`,
    isAuthRefreshableError: () => false,
    cookieTokenTtlMs: 60_000,
  });

  const resolved = await core.getPrimaryGameRole(false);
  assert.equal(resolved, role);
  assert.equal(verifyCalls, 0);
  assert.equal(roleCalls, 0);
});

test('passport core: 冷启动角色发现按 verify -> role 顺序执行', async () => {
  const calls: string[] = [];
  const role = createRole();
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
    cookieTokenV2: 'cookie-token-v2',
    cookieTokenV2UpdatedAt: 10_000,
  });

  const core = createPassportNapCore({
    now: () => 10_001,
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistCookieTokenV2: async (cookieTokenV2) => Object.assign(bundle, { cookieTokenV2 }),
    persistSelectedRole: async (nextRole) => {
      calls.push('persistRole');
      return Object.assign(bundle, { selectedRole: nextRole });
    },
    persistNapToken: async (eNapToken) => Object.assign(bundle, { eNapToken }),
    requestCookieTokenByStoken: async () => ({ uid: '428094597', cookieTokenV2: 'cookie-token-v2' }),
    verifyCookieToken: async () => {
      calls.push('verify');
    },
    requestGameRolesByCookieToken: async () => {
      calls.push('roles');
      return [role];
    },
    requestNapBootstrap: async () => 'nap-token',
    buildCookieTokenCookie: ({ mid, cookieTokenV2 }) => `account_mid_v2=${mid}; cookie_token_v2=${cookieTokenV2}`,
    isAuthRefreshableError: () => false,
    cookieTokenTtlMs: 60_000,
  });

  const resolved = await core.getPrimaryGameRole(false);
  assert.equal(resolved, role);
  assert.deepEqual(calls, ['verify', 'roles', 'persistRole']);
});

test('passport core: e_nap_token 自举命中鉴权失败时只强刷一次 cookie_token_v2 再重试一次', async () => {
  const role = createRole();
  let exchangeCalls = 0;
  let bootstrapCalls = 0;
  const bundle = createBundle({
    stoken: 'stoken',
    mid: 'mid',
    cookieTokenV2: 'cookie-token-v2',
    cookieTokenV2UpdatedAt: 10_000,
    selectedRole: role,
  });

  const core = createPassportNapCore({
    now: () => 10_001,
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistCookieTokenV2: async (cookieTokenV2) => Object.assign(bundle, {
      cookieTokenV2,
      cookieTokenV2UpdatedAt: 10_001,
    }),
    persistSelectedRole: async (nextRole) => Object.assign(bundle, { selectedRole: nextRole }),
    persistNapToken: async (eNapToken) => Object.assign(bundle, { eNapToken }),
    requestCookieTokenByStoken: async () => {
      exchangeCalls += 1;
      return { uid: '428094597', cookieTokenV2: `cookie-token-v2-${exchangeCalls}` };
    },
    verifyCookieToken: async () => {},
    requestGameRolesByCookieToken: async () => [role],
    requestNapBootstrap: async () => {
      bootstrapCalls += 1;
      if (bootstrapCalls === 1) {
        throw new ApiResponseError(-100, '未登录', '初始化绝区零业务态失败');
      }

      return 'nap-token';
    },
    buildCookieTokenCookie: ({ mid, cookieTokenV2 }) => `account_mid_v2=${mid}; cookie_token_v2=${cookieTokenV2}`,
    isAuthRefreshableError: (error) => error instanceof ApiResponseError && error.retcode === -100,
    cookieTokenTtlMs: 60_000,
  });

  const token = await core.ensureNapBusinessToken(false);
  assert.equal(token, 'nap-token');
  assert.equal(exchangeCalls, 1);
  assert.equal(bootstrapCalls, 2);
  assert.equal(bundle.eNapToken, 'nap-token');
});

test('passport core: 缺少 stoken/mid 时直接报错，不再尝试 fallback', async () => {
  const bundle = createBundle();

  const core = createPassportNapCore({
    now: () => 10_000,
    logger: createLogger(),
    readAuthBundle: async () => bundle,
    patchAuthBundle: async (patch) => Object.assign(bundle, patch),
    persistCookieTokenV2: async (cookieTokenV2) => Object.assign(bundle, { cookieTokenV2 }),
    persistSelectedRole: async (role) => Object.assign(bundle, { selectedRole: role }),
    persistNapToken: async (eNapToken) => Object.assign(bundle, { eNapToken }),
    requestCookieTokenByStoken: async () => ({ uid: '428094597', cookieTokenV2: 'cookie-token-v2' }),
    verifyCookieToken: async () => {},
    requestGameRolesByCookieToken: async () => [createRole()],
    requestNapBootstrap: async () => 'nap-token',
    buildCookieTokenCookie: ({ mid, cookieTokenV2 }) => `account_mid_v2=${mid}; cookie_token_v2=${cookieTokenV2}`,
    isAuthRefreshableError: () => false,
    cookieTokenTtlMs: 60_000,
  });

  await assert.rejects(
    core.ensureCookieToken(false),
    /未找到 stoken\/mid，请先扫码登录/,
  );
});
