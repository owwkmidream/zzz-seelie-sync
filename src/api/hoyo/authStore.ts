import { GM } from '$';
import { logger } from '@/utils/logger';
import type { AuthBundle, UserGameRole } from './types';

const AUTH_BUNDLE_KEY = 'zzz_hoyo_auth_bundle';
const LEGACY_PASSPORT_TOKEN_KEY = 'zzz_passport_tokens';
const AUTH_BUNDLE_SCHEMA_VERSION = 1;

interface LegacyPassportTokens {
  stoken: string;
  mid: string;
  updatedAt?: number;
  cookieTokenUpdatedAt?: number;
}

let migrationPromise: Promise<void> | null = null;

function createEmptyAuthBundle(): AuthBundle {
  return {
    updatedAt: Date.now(),
    schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
  };
}

function parseLegacyTokens(raw: string): LegacyPassportTokens | null {
  try {
    const parsed = JSON.parse(raw) as Partial<LegacyPassportTokens>;
    if (!parsed.stoken || !parsed.mid) {
      return null;
    }

    return {
      stoken: parsed.stoken,
      mid: parsed.mid,
      updatedAt: parsed.updatedAt,
      cookieTokenUpdatedAt: parsed.cookieTokenUpdatedAt,
    };
  } catch {
    return null;
  }
}

function parseAuthBundle(raw: string): AuthBundle | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthBundle>;
    return {
      ...createEmptyAuthBundle(),
      ...parsed,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
    };
  } catch {
    return null;
  }
}

async function writeBundle(bundle: AuthBundle): Promise<void> {
  await GM.setValue(AUTH_BUNDLE_KEY, JSON.stringify(bundle));
}

async function migrateLegacyAuthBundle(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const existing = parseAuthBundle(await GM.getValue<string>(AUTH_BUNDLE_KEY, ''));
      if (existing) {
        return;
      }

      const legacyRawFromScript = await GM.getValue<string>(LEGACY_PASSPORT_TOKEN_KEY, '');
      const legacyRawFromPage = localStorage.getItem(LEGACY_PASSPORT_TOKEN_KEY) ?? '';
      const legacy = parseLegacyTokens(legacyRawFromScript) ?? parseLegacyTokens(legacyRawFromPage);

      if (!legacy) {
        return;
      }

      const migrated: AuthBundle = {
        ...createEmptyAuthBundle(),
        stoken: legacy.stoken,
        mid: legacy.mid,
        updatedAt: Date.now(),
        rootTokensUpdatedAt: legacy.updatedAt ?? Date.now(),
        cookieTokenUpdatedAt: legacy.cookieTokenUpdatedAt,
      };

      await writeBundle(migrated);
      await GM.deleteValue(LEGACY_PASSPORT_TOKEN_KEY);
      localStorage.removeItem(LEGACY_PASSPORT_TOKEN_KEY);
      logger.info('🔐 已将旧版通行证凭证迁移到新的 HoYo 鉴权存储');
    })();
  }

  await migrationPromise;
}

export async function readAuthBundle(): Promise<AuthBundle> {
  await migrateLegacyAuthBundle();
  const raw = await GM.getValue<string>(AUTH_BUNDLE_KEY, '');
  return parseAuthBundle(raw) ?? createEmptyAuthBundle();
}

export async function writeAuthBundle(bundle: AuthBundle): Promise<void> {
  await migrateLegacyAuthBundle();
  await writeBundle({
    ...bundle,
    updatedAt: Date.now(),
    schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
  });
}

export async function patchAuthBundle(patch: Partial<AuthBundle>): Promise<AuthBundle> {
  const current = await readAuthBundle();
  const next: AuthBundle = {
    ...current,
    ...patch,
    updatedAt: Date.now(),
    schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
  };
  await writeBundle(next);
  return next;
}

export async function persistRootTokens(
  rootTokens: { stoken: string; mid: string; stuid?: string | null },
): Promise<AuthBundle> {
  const current = await readAuthBundle();
  const changed =
    current.stoken !== rootTokens.stoken
    || current.mid !== rootTokens.mid
    || current.stuid !== (rootTokens.stuid ?? undefined);

  const next: AuthBundle = {
    ...createEmptyAuthBundle(),
    ...current,
    stoken: rootTokens.stoken,
    mid: rootTokens.mid,
    stuid: rootTokens.stuid ?? undefined,
    updatedAt: Date.now(),
    rootTokensUpdatedAt: Date.now(),
    schemaVersion: AUTH_BUNDLE_SCHEMA_VERSION,
  };

  if (changed) {
    next.ltoken = undefined;
    next.ltuid = undefined;
    next.cookieToken = undefined;
    next.cookieTokenV2 = undefined;
    next.accountId = undefined;
    next.eNapToken = undefined;
    next.selectedRole = undefined;
    next.ltokenUpdatedAt = undefined;
    next.cookieTokenUpdatedAt = undefined;
    next.cookieTokenV2UpdatedAt = undefined;
    next.eNapTokenUpdatedAt = undefined;
    next.roleUpdatedAt = undefined;
  }

  await writeBundle(next);
  return next;
}

export async function persistLToken(ltoken: string, ltuid?: string): Promise<AuthBundle> {
  return await patchAuthBundle({
    ltoken,
    ltuid,
    ltokenUpdatedAt: Date.now(),
  });
}

export async function persistCookieToken(cookieToken: string, accountId?: string): Promise<AuthBundle> {
  return await patchAuthBundle({
    cookieToken,
    accountId,
    cookieTokenUpdatedAt: Date.now(),
  });
}

export async function persistCookieTokenV2(cookieTokenV2: string): Promise<AuthBundle> {
  return await patchAuthBundle({
    cookieTokenV2,
    cookieTokenV2UpdatedAt: Date.now(),
  });
}

export async function persistNapToken(eNapToken: string): Promise<AuthBundle> {
  return await patchAuthBundle({
    eNapToken,
    eNapTokenUpdatedAt: Date.now(),
  });
}

export async function persistSelectedRole(role: UserGameRole): Promise<AuthBundle> {
  return await patchAuthBundle({
    selectedRole: role,
    roleUpdatedAt: Date.now(),
  });
}

export async function clearAuthBundle(): Promise<void> {
  await GM.deleteValue(AUTH_BUNDLE_KEY);
  await GM.deleteValue(LEGACY_PASSPORT_TOKEN_KEY);
  localStorage.removeItem(LEGACY_PASSPORT_TOKEN_KEY);
}

export function hasRootTokens(bundle: AuthBundle): bundle is AuthBundle & { stoken: string; mid: string } {
  return Boolean(bundle.stoken && bundle.mid);
}

export function hasLToken(bundle: AuthBundle): bundle is AuthBundle & { ltoken: string; ltuid: string } {
  return Boolean(bundle.ltoken && bundle.ltuid);
}

export function hasCookieToken(bundle: AuthBundle): bundle is AuthBundle & { cookieToken: string; accountId: string } {
  return Boolean(bundle.cookieToken && bundle.accountId);
}

export function hasCookieTokenV2(bundle: AuthBundle): bundle is AuthBundle & { mid: string; cookieTokenV2: string } {
  return Boolean(bundle.mid && bundle.cookieTokenV2);
}

export function hasNapToken(bundle: AuthBundle): bundle is AuthBundle & { eNapToken: string } {
  return Boolean(bundle.eNapToken);
}
