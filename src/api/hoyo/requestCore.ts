import { DEVICE_FP_ERROR_CODES } from './config';
import type { HoyoAuthRoute } from './authRouter';
import type { ApiResponse } from './types';
import {
  ApiResponseError,
  DeviceFingerprintRefreshError,
  HttpRequestError,
} from './errors';

interface LoggerLike {
  debug(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, error: unknown): void;
}

interface RouteRequestContext {
  headers: Record<string, string>;
  cookie: string;
}

interface FetchLike {
  (input: RequestInfo | URL, init?: RequestInit & { anonymous?: boolean; cookie?: string }): Promise<Response>;
}

export interface RouteRequestCoreDeps {
  fetch: FetchLike;
  logger: LoggerLike;
  buildRouteRequestContext: (
    route: HoyoAuthRoute,
    endpoint: string,
    forceAuthRefresh: boolean,
  ) => Promise<RouteRequestContext>;
  triggerRouteAuthRefresh: (route: HoyoAuthRoute) => Promise<void>;
  hasPersistedStoken: () => Promise<boolean>;
  isPassportAuthHttpStatus: (status: number) => boolean;
  isPassportAuthRetcode: (retcode: number, message?: string) => boolean;
  getDeviceFingerprint: () => Promise<void>;
}

export interface ExecuteRouteRequestInput {
  url: string;
  endpoint: string;
  route: HoyoAuthRoute;
  method: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  requestLabel: string;
}

export function createRouteRequestCore(deps: RouteRequestCoreDeps) {
  const routeRefreshPromises = new Map<HoyoAuthRoute, Promise<void>>();

  async function refreshRouteAuth(route: HoyoAuthRoute): Promise<void> {
    const inFlight = routeRefreshPromises.get(route);
    if (inFlight) {
      deps.logger.debug(`🔁 复用进行中的 ${route} 路由鉴权刷新`);
      await inFlight;
      return;
    }

    const refreshPromise = deps.triggerRouteAuthRefresh(route);
    routeRefreshPromises.set(route, refreshPromise);
    try {
      await refreshPromise;
    } finally {
      if (routeRefreshPromises.get(route) === refreshPromise) {
        routeRefreshPromises.delete(route);
      }
    }
  }

  async function execute<T>({
    url,
    endpoint,
    route,
    method,
    body,
    headers = {},
    requestLabel,
  }: ExecuteRouteRequestInput): Promise<ApiResponse<T>> {
    const executeRequest = async (
      authRetried = false,
      deviceRetried = false,
    ): Promise<ApiResponse<T>> => {
      const routeContext = await deps.buildRouteRequestContext(route, endpoint, authRetried);
      const finalHeaders: Record<string, string> = {
        ...routeContext.headers,
        ...headers,
      };

      if (body !== undefined && !finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }

      deps.logger.debug(`🌐 发起请求 ${requestLabel}${authRetried || deviceRetried ? ' (重试)' : ''}`, {
        endpoint,
        route,
        authRetried,
        deviceRetried,
      });

      try {
        const response = await deps.fetch(url, {
          method,
          anonymous: true,
          cookie: routeContext.cookie,
          headers: finalHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          if (!authRetried && await deps.hasPersistedStoken() && deps.isPassportAuthHttpStatus(response.status)) {
            deps.logger.warn(`⚠️ 鉴权失败，准备刷新路由凭证后重试 ${requestLabel}`);
            await refreshRouteAuth(route);
            return await executeRequest(true, deviceRetried);
          }

          throw new HttpRequestError(response.status, response.statusText);
        }

        const data = await response.json() as ApiResponse<T>;
        if (data.retcode !== 0) {
          if (DEVICE_FP_ERROR_CODES.has(data.retcode) && !deviceRetried) {
            deps.logger.warn(`⚠️ 设备指纹错误，准备刷新后重试 ${requestLabel}`, {
              retcode: data.retcode,
              message: data.message,
            });

            try {
              await deps.getDeviceFingerprint();
              return await executeRequest(authRetried, true);
            } catch (error) {
              throw new DeviceFingerprintRefreshError(data.retcode, data.message, error);
            }
          }

          if (!authRetried && await deps.hasPersistedStoken() && deps.isPassportAuthRetcode(data.retcode, data.message)) {
            deps.logger.warn(`⚠️ 业务鉴权失败，准备刷新路由凭证后重试 ${requestLabel}`, {
              retcode: data.retcode,
              message: data.message,
            });
            await refreshRouteAuth(route);
            return await executeRequest(true, deviceRetried);
          }

          throw new ApiResponseError(data.retcode, data.message);
        }

        return data;
      } catch (error) {
        if (
          error instanceof ApiResponseError
          || error instanceof HttpRequestError
          || error instanceof DeviceFingerprintRefreshError
        ) {
          throw error;
        }

        deps.logger.error(`❌ 请求异常 ${requestLabel}`, error);
        throw error;
      }
    };

    return await executeRequest();
  }

  return {
    execute,
  };
}
