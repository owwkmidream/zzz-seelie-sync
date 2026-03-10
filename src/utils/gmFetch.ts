import { GM } from '$'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'TRACE', 'OPTIONS', 'CONNECT'] as const
const RAW_RESPONSE_HEADERS = Symbol('gmFetchRawResponseHeaders')

type HttpMethod = (typeof HTTP_METHODS)[number]
type GmResponse = Response & { [RAW_RESPONSE_HEADERS]?: string }

export interface GmFetchInit extends RequestInit {
  anonymous?: boolean
  cookie?: string
  timeout?: number
  redirect?: 'follow' | 'error' | 'manual'
}

function normalizeMethod(method: string): HttpMethod {
  const upperMethod = method.toUpperCase()
  if (HTTP_METHODS.includes(upperMethod as HttpMethod)) {
    return upperMethod as HttpMethod
  }
  throw new Error(`unsupported http method ${method}`)
}

function parseResponseHeaders(rawHeaders: string): Headers {
  const headers = new Headers()

  for (const line of rawHeaders.split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx <= 0) {
      continue
    }

    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (key) {
      headers.append(key, value)
    }
  }

  return headers
}

export function getRawResponseHeaders(response: Response): string {
  return (response as GmResponse)[RAW_RESPONSE_HEADERS] ?? ''
}

export function getResponseHeaderLines(response: Response, headerName: string): string[] {
  const needle = `${headerName.toLowerCase()}:`

  return getRawResponseHeaders(response)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.toLowerCase().startsWith(needle))
    .map((line) => line.slice(needle.length).trim())
}

export default async function GM_fetch(input: RequestInfo | URL, init: GmFetchInit = {}): Promise<Response> {
  const request = new Request(input, init)

  let data: string | undefined
  if (init.body !== undefined) {
    data = await request.text()
  }

  return await new Promise<Response>((resolve, reject) => {
    if (request.signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const xhr = GM.xmlHttpRequest({
      url: request.url,
      method: normalizeMethod(request.method.toUpperCase()),
      headers: Object.fromEntries(request.headers.entries()),
      data,
      responseType: 'blob',
      anonymous: init.anonymous,
      cookie: init.cookie,
      timeout: init.timeout,
      redirect: init.redirect,
      onload: (res) => {
        const responseHeaders = parseResponseHeaders(res.responseHeaders)
        const responseBody = res.response instanceof Blob ? res.response : new Blob([res.responseText ?? ''])
        const response = new Response(responseBody, {
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
        }) as GmResponse
        Object.defineProperty(response, RAW_RESPONSE_HEADERS, {
          value: res.responseHeaders ?? '',
          enumerable: false,
          configurable: false,
          writable: false,
        })
        resolve(response)
      },
      onabort: () => {
        reject(new DOMException('Aborted', 'AbortError'))
      },
      ontimeout: () => {
        reject(new TypeError('Network request failed, timeout'))
      },
      onerror: (err) => {
        const reason = typeof err.error === 'string' && err.error ? err.error : request.url
        reject(new TypeError(`Failed to fetch: ${reason}`))
      },
    })

    if (request.signal) {
      const onAbort = () => {
        xhr.abort()
      }
      request.signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}
