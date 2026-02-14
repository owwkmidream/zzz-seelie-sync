/**
 * HTTP 层错误
 */
export class HttpRequestError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly context?: string;

  constructor(status: number, statusText: string, context?: string) {
    super(context ? `${context}: HTTP ${status}: ${statusText}` : `HTTP ${status}: ${statusText}`);
    this.name = 'HttpRequestError';
    this.status = status;
    this.statusText = statusText;
    this.context = context;
  }
}

/**
 * API 业务响应错误（retcode 非 0）
 */
export class ApiResponseError extends Error {
  public readonly retcode: number;
  public readonly apiMessage: string;
  public readonly context?: string;

  constructor(retcode: number, apiMessage: string, context?: string) {
    super(context ? `${context}: API Error ${retcode}: ${apiMessage}` : `API Error ${retcode}: ${apiMessage}`);
    this.name = 'ApiResponseError';
    this.retcode = retcode;
    this.apiMessage = apiMessage;
    this.context = context;
  }
}

/**
 * 设备指纹刷新后仍失败
 */
export class DeviceFingerprintRefreshError extends Error {
  public readonly retcode: number;
  public readonly apiMessage: string;
  public readonly causeError: unknown;

  constructor(retcode: number, apiMessage: string, causeError: unknown) {
    super(`设备指纹刷新失败，原始错误: API Error ${retcode}: ${apiMessage}`);
    this.name = 'DeviceFingerprintRefreshError';
    this.retcode = retcode;
    this.apiMessage = apiMessage;
    this.causeError = causeError;
  }
}

/**
 * 设备指纹字段异常（请求前校验）
 */
export class InvalidDeviceFingerprintError extends Error {
  constructor() {
    super('❌ 设备指纹有误，请检查');
    this.name = 'InvalidDeviceFingerprintError';
  }
}

export function getHoyoErrorSummary(error: unknown): string {
  if (error instanceof DeviceFingerprintRefreshError) {
    return `设备指纹刷新失败（${error.retcode}）：${error.apiMessage}`;
  }
  if (error instanceof InvalidDeviceFingerprintError) {
    return '设备指纹无效';
  }
  if (error instanceof HttpRequestError) {
    return `网络请求失败（HTTP ${error.status} ${error.statusText}）`;
  }
  if (error instanceof ApiResponseError) {
    return `接口返回错误（${error.retcode}）：${error.apiMessage}`;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

export function getHoyoErrorSuggestion(error: unknown): string {
  if (error instanceof DeviceFingerprintRefreshError || error instanceof InvalidDeviceFingerprintError) {
    return '请重置设备信息后重试';
  }
  if (error instanceof HttpRequestError) {
    return '请检查网络后重试';
  }
  if (error instanceof ApiResponseError) {
    return '请稍后重试，必要时刷新登录';
  }
  return '请稍后重试';
}
