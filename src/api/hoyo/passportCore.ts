import type { AuthBundle, UserGameRole } from './types';

interface LoggerLike {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
}

interface CookieTokenExchangeResult {
  uid?: string;
  cookieToken: string;
  accountId: string;
}

interface CookieSessionBundle extends AuthBundle {
  accountId: string;
  cookieToken: string;
}

export interface PassportNapCoreDeps {
  now: () => number;
  logger: LoggerLike;
  readAuthBundle: () => Promise<AuthBundle>;
  patchAuthBundle: (patch: Partial<AuthBundle>) => Promise<AuthBundle>;
  persistCookieToken: (cookieToken: string, accountId: string) => Promise<AuthBundle>;
  persistSelectedRole: (role: UserGameRole) => Promise<AuthBundle>;
  persistNapToken: (eNapToken: string) => Promise<AuthBundle>;
  requestCookieTokenByStoken: () => Promise<CookieTokenExchangeResult>;
  verifyCookieToken: (cookie: string) => Promise<void>;
  requestGameRolesByCookieToken: (cookie: string) => Promise<UserGameRole[]>;
  requestNapBootstrap: (role: UserGameRole, cookie: string) => Promise<string>;
  buildCookieTokenCookie: (bundle: CookieSessionBundle) => string;
  isAuthRefreshableError: (error: unknown) => boolean;
  cookieTokenTtlMs: number;
}

function hasRootTokens(bundle: AuthBundle): bundle is AuthBundle & { stoken: string; mid: string } {
  return Boolean(bundle.stoken && bundle.mid);
}

function hasCookieToken(bundle: AuthBundle): bundle is CookieSessionBundle {
  return Boolean(bundle.accountId && bundle.cookieToken);
}

function hasNapToken(bundle: AuthBundle): bundle is AuthBundle & { eNapToken: string } {
  return Boolean(bundle.eNapToken);
}

function isCookieTokenFresh(
  updatedAt: number | undefined,
  now: () => number,
  ttlMs: number,
): boolean {
  if (!updatedAt) {
    return false;
  }

  return now() - updatedAt < ttlMs;
}

export function createPassportNapCore(deps: PassportNapCoreDeps) {
  let cookieTokenRefreshPromise: Promise<void> | null = null;
  let primaryGameRolePromise: Promise<UserGameRole> | null = null;
  let napTokenRefreshPromise: Promise<string> | null = null;

  async function ensureCookieToken(forceRefresh = false): Promise<void> {
    const current = await deps.readAuthBundle();
    if (
      !forceRefresh
      && hasCookieToken(current)
      && isCookieTokenFresh(current.cookieTokenUpdatedAt, deps.now, deps.cookieTokenTtlMs)
    ) {
      return;
    }

    if (cookieTokenRefreshPromise) {
      deps.logger.debug(`🔁 复用进行中的 cookie_token 刷新${forceRefresh ? '（强制）' : ''}`);
      await cookieTokenRefreshPromise;
      return;
    }

    const refreshPromise = (async () => {
      const latestBeforeRefresh = await deps.readAuthBundle();
      if (
        !forceRefresh
        && hasCookieToken(latestBeforeRefresh)
        && isCookieTokenFresh(latestBeforeRefresh.cookieTokenUpdatedAt, deps.now, deps.cookieTokenTtlMs)
      ) {
        return;
      }

      if (!hasRootTokens(latestBeforeRefresh)) {
        throw new Error('未找到 stoken/mid，请先扫码登录');
      }

      const { cookieToken, accountId, uid } = await deps.requestCookieTokenByStoken();
      await deps.persistCookieToken(cookieToken, accountId);

      if (uid && !latestBeforeRefresh.stuid) {
        await deps.patchAuthBundle({ stuid: uid });
      }

      deps.logger.info('🔐 已刷新 cookie_token');
    })();

    cookieTokenRefreshPromise = refreshPromise;
    try {
      await refreshPromise;
    } finally {
      if (cookieTokenRefreshPromise === refreshPromise) {
        cookieTokenRefreshPromise = null;
      }
    }
  }

  async function getPrimaryGameRole(forceRefresh = false): Promise<UserGameRole> {
    const current = await deps.readAuthBundle();
    if (!forceRefresh && current.selectedRole) {
      return current.selectedRole;
    }

    if (primaryGameRolePromise) {
      deps.logger.debug(`🔁 复用进行中的角色发现${forceRefresh ? '（强制）' : ''}`);
      return await primaryGameRolePromise;
    }

    const rolePromise = (async () => {
      await ensureCookieToken(forceRefresh);
      const bundle = await deps.readAuthBundle();
      if (!hasCookieToken(bundle)) {
        throw new Error('未找到 cookie_token/account_id，请先完成扫码登录');
      }

      const cookie = deps.buildCookieTokenCookie(bundle);
      await deps.verifyCookieToken(cookie);
      const roles = await deps.requestGameRolesByCookieToken(cookie);
      const role = roles[0];
      if (!role) {
        throw new Error('未找到绝区零角色');
      }

      await deps.persistSelectedRole(role);
      return role;
    })();

    primaryGameRolePromise = rolePromise;
    try {
      return await rolePromise;
    } finally {
      if (primaryGameRolePromise === rolePromise) {
        primaryGameRolePromise = null;
      }
    }
  }

  async function issueNapBusinessToken(role: UserGameRole): Promise<string> {
    await ensureCookieToken(false);

    let bundle = await deps.readAuthBundle();
    if (!hasCookieToken(bundle)) {
      throw new Error('未找到 cookie_token/account_id，无法初始化 e_nap_token');
    }

    try {
      return await deps.requestNapBootstrap(role, deps.buildCookieTokenCookie(bundle));
    } catch (error) {
      if (!deps.isAuthRefreshableError(error)) {
        throw error;
      }

      deps.logger.warn('⚠️ e_nap_token 自举命中鉴权失败，升级刷新 cookie_token 后重试');
      await ensureCookieToken(true);
      bundle = await deps.readAuthBundle();
      if (!hasCookieToken(bundle)) {
        throw new Error('刷新 cookie_token 后仍缺少 cookie_token/account_id');
      }

      return await deps.requestNapBootstrap(role, deps.buildCookieTokenCookie(bundle));
    }
  }

  async function ensureNapBusinessToken(forceRefresh = false, role?: UserGameRole): Promise<string> {
    const current = await deps.readAuthBundle();
    if (!forceRefresh && hasNapToken(current)) {
      return current.eNapToken;
    }

    if (napTokenRefreshPromise) {
      deps.logger.debug(`🔁 复用进行中的 e_nap_token 刷新${forceRefresh ? '（强制）' : ''}`);
      return await napTokenRefreshPromise;
    }

    const refreshPromise = (async () => {
      const latestBeforeRefresh = await deps.readAuthBundle();
      if (!forceRefresh && hasNapToken(latestBeforeRefresh)) {
        return latestBeforeRefresh.eNapToken;
      }

      const resolvedRole = role ?? latestBeforeRefresh.selectedRole ?? await getPrimaryGameRole(false);
      const eNapToken = await issueNapBusinessToken(resolvedRole);
      await deps.persistNapToken(eNapToken);
      await deps.persistSelectedRole(resolvedRole);
      deps.logger.info(`🔐 已${forceRefresh ? '重新' : ''}完成 e_nap_token 自举`);
      return eNapToken;
    })();

    napTokenRefreshPromise = refreshPromise;
    try {
      return await refreshPromise;
    } finally {
      if (napTokenRefreshPromise === refreshPromise) {
        napTokenRefreshPromise = null;
      }
    }
  }

  async function initializeNapToken(): Promise<UserGameRole> {
    const role = await getPrimaryGameRole(false);
    await ensureNapBusinessToken(false, role);
    return role;
  }

  function reset(): void {
    cookieTokenRefreshPromise = null;
    primaryGameRolePromise = null;
    napTokenRefreshPromise = null;
  }

  return {
    ensureCookieToken,
    getPrimaryGameRole,
    ensureNapBusinessToken,
    initializeNapToken,
    reset,
  };
}
