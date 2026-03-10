import type { AuthBundle, CookieTokenData, LTokenData } from './types';

interface LoggerLike {
  debug(message: string): void;
  info(message: string): void;
}

export interface RecordAuthCoreDeps {
  logger: LoggerLike;
  readAuthBundle: () => Promise<AuthBundle>;
  patchAuthBundle: (patch: Partial<AuthBundle>) => Promise<AuthBundle>;
  persistLToken: (ltoken: string, ltuid?: string) => Promise<AuthBundle>;
  requestCookieAccountInfoByStoken: () => Promise<CookieTokenData>;
  requestLTokenByStoken: () => Promise<LTokenData>;
}

function hasRootTokens(bundle: AuthBundle): bundle is AuthBundle & { stoken: string; mid: string } {
  return Boolean(bundle.stoken && bundle.mid);
}

function hasLToken(bundle: AuthBundle): bundle is AuthBundle & { ltoken: string; ltuid: string } {
  return Boolean(bundle.ltoken && bundle.ltuid);
}

function resolveLtuid(bundle: AuthBundle, fallbackUid?: string): string | undefined {
  return bundle.ltuid || bundle.stuid || fallbackUid;
}

export function createRecordAuthCore(deps: RecordAuthCoreDeps) {
  let lTokenRefreshPromise: Promise<void> | null = null;

  async function ensureLToken(forceRefresh = false): Promise<void> {
    const current = await deps.readAuthBundle();
    if (!forceRefresh && hasLToken(current)) {
      return;
    }

    if (lTokenRefreshPromise) {
      deps.logger.debug(`🔁 复用进行中的 ltoken 刷新${forceRefresh ? '（强制）' : ''}`);
      await lTokenRefreshPromise;
      return;
    }

    const refreshPromise = (async () => {
      const latestBeforeRefresh = await deps.readAuthBundle();
      if (!forceRefresh && hasLToken(latestBeforeRefresh)) {
        return;
      }

      if (!hasRootTokens(latestBeforeRefresh)) {
        throw new Error('未找到 stoken/mid，请先扫码登录');
      }

      let resolvedUid = resolveLtuid(latestBeforeRefresh);
      if (!resolvedUid) {
        const cookieAccountInfo = await deps.requestCookieAccountInfoByStoken();
        resolvedUid = cookieAccountInfo.uid;
        if (resolvedUid) {
          await deps.patchAuthBundle({
            stuid: latestBeforeRefresh.stuid || resolvedUid,
            ltuid: resolvedUid,
          });
        }
      }

      const data = await deps.requestLTokenByStoken();
      const latestAfterRefresh = await deps.readAuthBundle();
      const ltuid = resolveLtuid(latestAfterRefresh, resolvedUid);
      if (!ltuid) {
        throw new Error('获取 ltoken 成功但缺少 ltuid/stuid');
      }

      await deps.persistLToken(data.ltoken, ltuid);
      deps.logger.info('🔐 已刷新 ltoken');
    })();

    lTokenRefreshPromise = refreshPromise;
    try {
      await refreshPromise;
    } finally {
      if (lTokenRefreshPromise === refreshPromise) {
        lTokenRefreshPromise = null;
      }
    }
  }

  function reset(): void {
    lTokenRefreshPromise = null;
  }

  return {
    ensureLToken,
    reset,
  };
}
