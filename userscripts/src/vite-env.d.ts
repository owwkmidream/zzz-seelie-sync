/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
//// <reference types="vite-plugin-monkey/global" />

// 扩展 HTMLElement 接口，添加 _vue 和 _vnode 属性
declare global {
  interface HTMLElement {
    _vue?: any;
    _vnode?: any;
  }
}

// 声明 @trim21/gm-fetch 的类型
declare module '@trim21/gm-fetch' {
  export interface RequestInit {
    method?: string;
    headers?: Record<string, string> | Headers;
    body?: string | FormData | URLSearchParams | Blob | ArrayBuffer;
    signal?: AbortSignal;
  }

  export interface Response {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Headers;
    url: string;
    json(): Promise<any>;
    text(): Promise<string>;
    blob(): Promise<Blob>;
    arrayBuffer(): Promise<ArrayBuffer>;
    body?: ReadableStream<Uint8Array>;
  }

  export function fetch(url: string, init?: RequestInit): Promise<Response>;
}
