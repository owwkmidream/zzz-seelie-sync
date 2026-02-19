/**
 * 通行证扫码登录服务
 * 实现 createQRLogin → queryQRLoginStatus → getCookieAccountInfoBySToken 最短链路
 */

import GM_fetch from '@trim21/gm-fetch';
import { GM } from '$';
import type {
  ApiResponse,
  QRLoginData,
  QRLoginStatusData,
  CookieTokenData,
  UserGameRole,
  UserGameRolesResponse,
  LoginAccountResponse,
} from './types';
import { logger } from '../../utils/logger';
import { ApiResponseError, HttpRequestError } from './errors';
import { getCurrentDeviceInfo } from './deviceService';
import {
  defaultHeaders,
  GAME_ROLE_URL,
  NAP_TOKEN_URL,
} from './config';

// ── 常量 ──

const PASSPORT_BASE = 'https://passport-api.mihoyo.com';
const VERIFY_COOKIE_TOKEN_URL = `${PASSPORT_BASE}/account/ma-cn-session/web/verifyCookieToken`;
const COOKIE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** 扫码阶段固定请求头 */
const PASSPORT_HEADERS = {
  'user-agent': 'HYPContainer/1.3.3.182',
  'x-rpc-app_id': 'ddxf5dufpuyo',
  'x-rpc-client_type': '3',
  'content-type': 'application/json',
} as const;

/** cookie_token 接口请求头模板 */
const COOKIE_TOKEN_HEADERS_BASE = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) miHoYoBBS/2.102.1',
  'x-rpc-app_version': '2.102.1',
  'x-rpc-client_type': '5',
  'x-requested-with': 'com.mihoyo.hyperion',
  'referer': 'https://webstatic.mihoyo.com',
} as const;

/** DS X4 salt（当前版本） */
const DS_X4_SALT = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs';

/** 二维码过期 retcode */
const QR_EXPIRED_RETCODE = -106;
/** 持久化存储 key */
const PASSPORT_TOKEN_STORAGE_KEY = 'zzz_passport_tokens';
/** 旧版 localStorage 数据迁移开关 */
let passportTokenStorageMigrated = false;

interface PersistedPassportTokens {
  stoken: string;
  mid: string;
  updatedAt: number;
  cookieTokenUpdatedAt?: number;
}

function parsePersistedTokens(raw: string): PersistedPassportTokens | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedPassportTokens>;
    if (!parsed || typeof parsed.stoken !== 'string' || typeof parsed.mid !== 'string') {
      return null;
    }
    return {
      stoken: parsed.stoken,
      mid: parsed.mid,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      cookieTokenUpdatedAt: typeof parsed.cookieTokenUpdatedAt === 'number' ? parsed.cookieTokenUpdatedAt : undefined,
    };
  } catch {
    return null;
  }
}

async function migrateLegacyTokensToScriptStorage(): Promise<void> {
  if (passportTokenStorageMigrated) {
    return;
  }
  passportTokenStorageMigrated = true;

  const legacyRaw = localStorage.getItem(PASSPORT_TOKEN_STORAGE_KEY);
  if (!legacyRaw) {
    return;
  }

  // 无论迁移是否成功，都先清理页面可读存储，降低暴露面
  localStorage.removeItem(PASSPORT_TOKEN_STORAGE_KEY);

  const existingRaw = await GM.getValue<string>(PASSPORT_TOKEN_STORAGE_KEY, '');
  if (existingRaw) {
    logger.warn('⚠️ 检测到旧版 localStorage 通行证凭证，已清理旧存储');
    return;
  }

  const parsed = parsePersistedTokens(legacyRaw);
  if (!parsed) {
    logger.warn('⚠️ 旧版 localStorage 通行证凭证无效，已清理');
    return;
  }

  await GM.setValue(PASSPORT_TOKEN_STORAGE_KEY, JSON.stringify(parsed));
  logger.info('🔐 已将通行证凭证迁移到脚本隔离存储');
}

async function readPersistedTokens(): Promise<PersistedPassportTokens | null> {
  await migrateLegacyTokensToScriptStorage();

  const raw = await GM.getValue<string>(PASSPORT_TOKEN_STORAGE_KEY, '');
  if (!raw) return null;
  return parsePersistedTokens(raw);
}

async function writePersistedTokens(tokens: PersistedPassportTokens): Promise<void> {
  await migrateLegacyTokensToScriptStorage();
  await GM.setValue(PASSPORT_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function shouldRefreshPassportCookieByError(error: unknown): boolean {
  if (error instanceof HttpRequestError) {
    return isPassportAuthHttpStatus(error.status);
  }
  if (error instanceof ApiResponseError) {
    return isPassportAuthRetcode(error.retcode, error.apiMessage);
  }
  return false;
}

async function persistStokenAndMid(stoken: string, mid: string): Promise<void> {
  const current = await readPersistedTokens();
  const changed = !current || current.stoken !== stoken || current.mid !== mid;

  await writePersistedTokens({
    stoken,
    mid,
    updatedAt: Date.now(),
    cookieTokenUpdatedAt: changed ? undefined : current?.cookieTokenUpdatedAt,
  });
}

async function markCookieTokenRefreshed(): Promise<PersistedPassportTokens> {
  const current = await readPersistedTokens();
  if (!current?.stoken || !current?.mid) {
    throw new Error('未找到 stoken/mid，无法持久化 cookie_token');
  }

  const refreshed: PersistedPassportTokens = {
    ...current,
    updatedAt: Date.now(),
    cookieTokenUpdatedAt: Date.now(),
  };
  await writePersistedTokens(refreshed);
  return refreshed;
}

function isCookieTokenFresh(tokens: PersistedPassportTokens): boolean {
  if (!tokens.cookieTokenUpdatedAt) {
    return false;
  }

  return Date.now() - tokens.cookieTokenUpdatedAt < COOKIE_TOKEN_TTL_MS;
}

async function verifyPersistedCookieToken(): Promise<boolean> {
  const deviceInfo = await getCurrentDeviceInfo();
  const verifyResponse = await GM_fetch(VERIFY_COOKIE_TOKEN_URL, {
    method: 'POST',
    headers: {
      ...COOKIE_TOKEN_HEADERS_BASE,
      'x-rpc-device_id': deviceInfo.deviceId,
      'x-rpc-device_fp': deviceInfo.deviceFp || '0000000000000',
    },
  });

  if (!verifyResponse.ok) {
    if (isPassportAuthHttpStatus(verifyResponse.status)) {
      return false;
    }
    throw new HttpRequestError(verifyResponse.status, verifyResponse.statusText, '校验 cookie_token 失败');
  }

  const verifyData = await verifyResponse.json() as ApiResponse<unknown>;
  if (verifyData.retcode === 0) {
    return true;
  }

  if (verifyData.retcode === -100 || isPassportAuthRetcode(verifyData.retcode, verifyData.message)) {
    return false;
  }

  throw new ApiResponseError(verifyData.retcode, verifyData.message, '校验 cookie_token 失败');
}

async function ensurePersistedCookieToken(forceRefresh = false): Promise<PersistedPassportTokens> {
  const current = await readPersistedTokens();
  if (!current?.stoken || !current?.mid) {
    throw new Error('未找到持久化 stoken，请先扫码登录');
  }

  if (!forceRefresh) {
    if (isCookieTokenFresh(current)) {
      return current;
    }

    try {
      const cookieTokenValid = await verifyPersistedCookieToken();
      if (cookieTokenValid) {
        return await markCookieTokenRefreshed();
      }

      logger.warn('⚠️ cookie_token 已失效（retcode -100），尝试使用 stoken 刷新');
    } catch (verifyError) {
      logger.warn('⚠️ cookie_token 校验异常，降级为使用 stoken 刷新', verifyError);
    }
  }

  await getCookieTokenBySToken(current.stoken, current.mid);
  return await markCookieTokenRefreshed();
}

export async function hasPersistedStoken(): Promise<boolean> {
  const current = await readPersistedTokens();
  return Boolean(current?.stoken && current?.mid);
}

export async function clearPersistedPassportTokens(): Promise<void> {
  await GM.deleteValue(PASSPORT_TOKEN_STORAGE_KEY);
  localStorage.removeItem(PASSPORT_TOKEN_STORAGE_KEY);
}

export async function ensurePassportCookieHeader(forceRefresh = false): Promise<void> {
  await ensurePersistedCookieToken(forceRefresh);
}

export function isPassportAuthHttpStatus(status: number): boolean {
  return status === 401 || status === 403;
}

export function isPassportAuthRetcode(retcode: number, message = ''): boolean {
  const msg = message.toLowerCase();
  if ([-100, 10001, 10002, 10101, -3101].includes(retcode)) return true;
  return msg.includes('登录') || msg.includes('未登录') || msg.includes('token') || msg.includes('cookie');
}

// ── DS 签名 ──

function md5(input: string): string {
  // 纯 JS MD5 实现（RFC 1321）
  const safeAdd = (x: number, y: number) => {
    const lsw = (x & 0xffff) + (y & 0xffff);
    return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff);
  };
  const bitRotateLeft = (num: number, cnt: number) => (num << cnt) | (num >>> (32 - cnt));
  const md5cmn = (q: number, a: number, b: number, x: number, s: number, t: number) =>
    safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  const md5ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    md5cmn((b & c) | (~b & d), a, b, x, s, t);
  const md5gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  const md5hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    md5cmn(b ^ c ^ d, a, b, x, s, t);
  const md5ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    md5cmn(c ^ (b | ~d), a, b, x, s, t);

  const input8 = new TextEncoder().encode(input);
  const nBlk = ((input8.length + 8) >> 6) + 1;
  const blks = new Array<number>(nBlk * 16).fill(0);
  for (let i = 0; i < input8.length; i++) blks[i >> 2] |= input8[i] << ((i % 4) * 8);
  blks[input8.length >> 2] |= 0x80 << ((input8.length % 4) * 8);
  blks[nBlk * 16 - 2] = input8.length * 8;

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < blks.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;
    a = md5ff(a, b, c, d, blks[i], 7, -680876936); d = md5ff(d, a, b, c, blks[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, blks[i + 2], 17, 606105819); b = md5ff(b, c, d, a, blks[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, blks[i + 4], 7, -176418897); d = md5ff(d, a, b, c, blks[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, blks[i + 6], 17, -1473231341); b = md5ff(b, c, d, a, blks[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, blks[i + 8], 7, 1770035416); d = md5ff(d, a, b, c, blks[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, blks[i + 10], 17, -42063); b = md5ff(b, c, d, a, blks[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, blks[i + 12], 7, 1804603682); d = md5ff(d, a, b, c, blks[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, blks[i + 14], 17, -1502002290); b = md5ff(b, c, d, a, blks[i + 15], 22, 1236535329);

    a = md5gg(a, b, c, d, blks[i + 1], 5, -165796510); d = md5gg(d, a, b, c, blks[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, blks[i + 11], 14, 643717713); b = md5gg(b, c, d, a, blks[i], 20, -373897302);
    a = md5gg(a, b, c, d, blks[i + 5], 5, -701558691); d = md5gg(d, a, b, c, blks[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, blks[i + 15], 14, -660478335); b = md5gg(b, c, d, a, blks[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, blks[i + 9], 5, 568446438); d = md5gg(d, a, b, c, blks[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, blks[i + 3], 14, -187363961); b = md5gg(b, c, d, a, blks[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, blks[i + 13], 5, -1444681467); d = md5gg(d, a, b, c, blks[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, blks[i + 7], 14, 1735328473); b = md5gg(b, c, d, a, blks[i + 12], 20, -1926607734);

    a = md5hh(a, b, c, d, blks[i + 5], 4, -378558); d = md5hh(d, a, b, c, blks[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, blks[i + 11], 16, 1839030562); b = md5hh(b, c, d, a, blks[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, blks[i + 1], 4, -1530992060); d = md5hh(d, a, b, c, blks[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, blks[i + 7], 16, -155497632); b = md5hh(b, c, d, a, blks[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, blks[i + 13], 4, 681279174); d = md5hh(d, a, b, c, blks[i], 11, -358537222);
    c = md5hh(c, d, a, b, blks[i + 3], 16, -722521979); b = md5hh(b, c, d, a, blks[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, blks[i + 9], 4, -640364487); d = md5hh(d, a, b, c, blks[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, blks[i + 15], 16, 530742520); b = md5hh(b, c, d, a, blks[i + 2], 23, -995338651);

    a = md5ii(a, b, c, d, blks[i], 6, -198630844); d = md5ii(d, a, b, c, blks[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, blks[i + 14], 15, -1416354905); b = md5ii(b, c, d, a, blks[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, blks[i + 12], 6, 1700485571); d = md5ii(d, a, b, c, blks[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, blks[i + 10], 15, -1051523); b = md5ii(b, c, d, a, blks[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, blks[i + 8], 6, 1873313359); d = md5ii(d, a, b, c, blks[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, blks[i + 6], 15, -1560198380); b = md5ii(b, c, d, a, blks[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, blks[i + 4], 6, -145523070); d = md5ii(d, a, b, c, blks[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, blks[i + 2], 15, 718787259); b = md5ii(b, c, d, a, blks[i + 9], 21, -343485551);

    a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
  }

  const hex = (n: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) s += ((n >> (i * 8 + 4)) & 0xf).toString(16) + ((n >> (i * 8)) & 0xf).toString(16);
    return s;
  };
  return hex(a) + hex(b) + hex(c) + hex(d);
}

/**
 * 计算 DS 签名（X4 算法，GET 场景）
 * @param query 查询参数字符串（按 key 字典序拼接），如 "stoken=xxx"
 */
function generateDS(query: string): string {
  const t = Math.floor(Date.now() / 1000);
  const r = Math.floor(Math.random() * 100001) + 100000; // [100000, 200000]
  const hash = md5(`salt=${DS_X4_SALT}&t=${t}&r=${r}&b=&q=${query}`);
  return `${t},${r},${hash}`;
}

// ── API 调用 ──

/** Step 1: 创建二维码 */
export async function createQRLogin(): Promise<QRLoginData> {
  const deviceInfo = await getCurrentDeviceInfo();

  const response = await GM_fetch(
    `${PASSPORT_BASE}/account/ma-cn-passport/app/createQRLogin`,
    {
      method: 'POST',
      headers: {
        ...PASSPORT_HEADERS,
        'x-rpc-device_id': deviceInfo.deviceId,
      },
    }
  );

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, '创建二维码失败');
  }

  const data = await response.json() as ApiResponse<QRLoginData>;
  if (data.retcode !== 0) {
    throw new ApiResponseError(data.retcode, data.message, '创建二维码失败');
  }

  logger.info('✅ 创建二维码成功');
  return data.data;
}

/** Step 2: 查询扫码状态 */
export async function queryQRLoginStatus(ticket: string): Promise<QRLoginStatusData> {
  const deviceInfo = await getCurrentDeviceInfo();

  const response = await GM_fetch(
    `${PASSPORT_BASE}/account/ma-cn-passport/app/queryQRLoginStatus`,
    {
      method: 'POST',
      headers: {
        ...PASSPORT_HEADERS,
        'x-rpc-device_id': deviceInfo.deviceId,
      },
      body: JSON.stringify({ ticket }),
    }
  );

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, '查询扫码状态失败');
  }

  const data = await response.json() as ApiResponse<QRLoginStatusData>;

  // 二维码过期
  if (data.retcode === QR_EXPIRED_RETCODE) {
    throw new ApiResponseError(data.retcode, data.message, '二维码已过期');
  }

  if (data.retcode !== 0) {
    throw new ApiResponseError(data.retcode, data.message, '查询扫码状态失败');
  }

  return data.data;
}

/** Step 3: stoken 换 cookie_token */
export async function getCookieTokenBySToken(stoken: string, mid: string): Promise<CookieTokenData> {
  const deviceInfo = await getCurrentDeviceInfo();
  const query = `stoken=${stoken}`;
  const ds = generateDS(query);

  const url = `${PASSPORT_BASE}/account/auth/api/getCookieAccountInfoBySToken?stoken=${encodeURIComponent(stoken)}`;

  const response = await GM_fetch(url, {
    method: 'GET',
    headers: {
      ...COOKIE_TOKEN_HEADERS_BASE,
      'x-rpc-device_id': deviceInfo.deviceId,
      'x-rpc-device_fp': deviceInfo.deviceFp || '0000000000000',
      'cookie': `mid=${mid};stoken=${stoken};`,
      'ds': ds,
    },
  });

  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, '获取 cookie_token 失败');
  }

  const data = await response.json() as ApiResponse<CookieTokenData>;
  if (data.retcode !== 0) {
    throw new ApiResponseError(data.retcode, data.message, '获取 cookie_token 失败');
  }

  logger.info('✅ cookie_token 获取成功');
  return data.data;
}

/**
 * 获取游戏角色信息并初始化 nap_token
 * 通过持久化 stoken/cookie_token 链路触发 login/account，确保后续接口可用
 */
export async function initializeNapToken(): Promise<UserGameRole> {
  logger.info('🔄 开始初始化 nap_token...');

  const execute = async (forceRefreshCookie: boolean): Promise<UserGameRole> => {
    await ensurePassportCookieHeader(forceRefreshCookie);

    // Step A: 获取用户游戏角色列表
    const rolesResponse = await GM_fetch(GAME_ROLE_URL, {
      method: 'GET',
      headers: {
        ...defaultHeaders,
      },
    });

    if (!rolesResponse.ok) {
      throw new HttpRequestError(rolesResponse.status, rolesResponse.statusText, '获取用户角色失败');
    }

    const rolesData = await rolesResponse.json() as ApiResponse<UserGameRolesResponse>;
    if (rolesData.retcode !== 0) {
      throw new ApiResponseError(rolesData.retcode, rolesData.message, '获取用户角色失败');
    }

    if (!rolesData.data?.list || rolesData.data.list.length === 0) {
      throw new Error('未找到绝区零游戏角色');
    }

    const roleInfo = rolesData.data.list[0];
    logger.info(`🎮 找到角色: ${roleInfo.nickname} (UID: ${roleInfo.game_uid}, 等级: ${roleInfo.level})`);

    // Step B: 用角色信息调用 login/account 设置 nap_token
    const tokenResponse = await GM_fetch(NAP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders,
      },
      body: JSON.stringify({
        region: roleInfo.region,
        uid: roleInfo.game_uid,
        game_biz: roleInfo.game_biz,
      }),
    });

    if (!tokenResponse.ok) {
      throw new HttpRequestError(tokenResponse.status, tokenResponse.statusText, '设置 nap_token 失败');
    }

    const tokenData = await tokenResponse.json() as ApiResponse<LoginAccountResponse>;
    if (tokenData.retcode !== 0) {
      throw new ApiResponseError(tokenData.retcode, tokenData.message, '设置 nap_token 失败');
    }

    return roleInfo;
  };

  try {
    const roleInfo = await execute(false);
    logger.info('✅ nap_token 初始化完成');
    return roleInfo;
  } catch (error) {
    if (!shouldRefreshPassportCookieByError(error)) {
      throw error;
    }

    logger.warn('⚠️ nap_token 初始化鉴权失败，尝试刷新 cookie_token 后重试');
    const roleInfo = await execute(true);
    logger.info('✅ nap_token 初始化完成');
    return roleInfo;
  }
}

// ── 轮询编排 ──

export interface QRLoginCallbacks {
  /** 状态变更时回调 */
  onStatusChange: (status: QRLoginStatusData['status']) => void;
  /** 二维码过期，传入新的 QR data */
  onQRExpired: (newData: QRLoginData) => void;
  /** 登录完成 */
  onComplete: (roleInfo: UserGameRole) => void;
  /** 发生错误 */
  onError: (error: unknown) => void;
}

/**
 * 启动扫码登录轮询流程
 * @returns 取消函数
 */
export function startQRLoginPolling(
  ticket: string,
  callbacks: QRLoginCallbacks,
): () => void {
  let cancelled = false;
  let currentTicket = ticket;

  const cancel = () => { cancelled = true; };

  const poll = async () => {
    while (!cancelled) {
      await sleep(1000);
      if (cancelled) return;

      try {
        const statusData = await queryQRLoginStatus(currentTicket);
        if (cancelled) return;
        callbacks.onStatusChange(statusData.status);
        if (cancelled) return;

        if (statusData.status === 'Confirmed') {
          // 提取 stoken 和 mid
          const stoken = statusData.tokens?.[0]?.token;
          const mid = statusData.user_info?.mid;

          if (!stoken || !mid) {
            callbacks.onError(new Error('扫码登录成功但缺少必要凭证(stoken/mid)'));
            return;
          }

          try {
            // 先持久化 stoken/mid，供后续 cookie_token 刷新使用
            await persistStokenAndMid(stoken, mid);
            if (cancelled) return;

            // Step 3: 换 cookie_token
            await getCookieTokenBySToken(stoken, mid);
            if (cancelled) return;
            await markCookieTokenRefreshed();
            if (cancelled) return;

            // Step 4: 获取 nap_token（调用 login/account）
            const roleInfo = await initializeNapToken();
            if (cancelled) return;

            callbacks.onComplete(roleInfo);
          } catch (error) {
            if (cancelled) return;
            callbacks.onError(error);
          }
          return;
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiResponseError && error.retcode === QR_EXPIRED_RETCODE) {
          // 二维码过期，重新创建
          try {
            const newQR = await createQRLogin();
            if (cancelled) return;
            currentTicket = newQR.ticket;
            callbacks.onQRExpired(newQR);
          } catch (renewError) {
            if (cancelled) return;
            callbacks.onError(renewError);
            return;
          }
        } else {
          callbacks.onError(error);
          return;
        }
      }
    }
  };

  void poll();
  return cancel;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
