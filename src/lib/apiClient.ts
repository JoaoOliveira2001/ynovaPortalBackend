export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type JsonLike =
  | BodyInit
  | Record<string, unknown>
  | Array<unknown>
  | null
  | undefined

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  method?: HttpMethod
  body?: JsonLike
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000
const rawDevFlag = import.meta.env.DEV
const isDev = rawDevFlag === true || rawDevFlag === 'true'
const useProxy = (import.meta.env.VITE_USE_PROXY ?? 'true') !== 'false'
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const BASE_URL = isDev && useProxy ? '' : sanitizedBaseUrl

if (!BASE_URL && !(isDev && useProxy)) {
  const message =
    '[apiClient] VITE_API_BASE_URL não foi definida. Configure a variável ou habilite o proxy com VITE_USE_PROXY=true.'
  console.error(message)
  throw new Error(message)
}

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!BASE_URL) {
    return normalizedPath
  }
  return `${BASE_URL}${normalizedPath}`
}

const shouldSerializeAsJson = (value: JsonLike): value is Record<string, unknown> | Array<unknown> => {
  if (!value) return false
  if (typeof value !== 'object') return false
  if (value instanceof FormData) return false
  if (value instanceof Blob) return false
  if (value instanceof ArrayBuffer) return false
  if (ArrayBuffer.isView(value)) return false
  if (value instanceof URLSearchParams) return false
  return true
}

export async function apiFetch<T = unknown>(path: string, init: ApiFetchOptions = {}): Promise<T> {
  const {
    method: rawMethod = 'GET',
    body,
    headers: headersInit,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = init

  const { credentials, mode, ...restOptions } = rest

  const method = rawMethod.toUpperCase() as HttpMethod
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const cleanup = () => {
    clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortListener)
  }

  const abortListener = () => controller.abort()
  if (signal) {
    if (signal.aborted) {
      cleanup()
      throw new DOMException('The user aborted a request.', 'AbortError')
    }
    signal.addEventListener('abort', abortListener)
  }

  try {
    const headers = new Headers(headersInit ?? {})
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    let finalBody: BodyInit | undefined
    if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
      if (shouldSerializeAsJson(body)) {
        finalBody = JSON.stringify(body)
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json')
        }
      } else {
        finalBody = body as BodyInit
      }
    }

    const response = await fetch(buildUrl(path), {
      ...restOptions,
      method,
      headers,
      body: finalBody,
      signal: controller.signal,
      credentials: credentials ?? 'omit',
      mode: mode ?? 'cors',
    }).catch((error) => {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`[apiClient] Falha de rede ao acessar ${path}: ${reason}`)
    })

    const text = await response.text()

    if (!response.ok) {
      const snippet = text ? text.slice(0, 500) : '<empty>'
      throw new Error(
        `[apiClient] Request to ${path} failed with status ${response.status}. Response body: ${snippet}`
      )
    }

    if (!text) {
      return undefined as T
    }

    try {
      return JSON.parse(text) as T
    } catch (error) {
      console.error(`[apiClient] Failed to parse JSON from ${path}`, error, { responseText: text })
      throw new Error(`[apiClient] Resposta inválida da API para ${path}.`)
    }
  } finally {
    cleanup()
  }
}

export function getJson<T = unknown>(path: string, init: Omit<ApiFetchOptions, 'method' | 'body'> = {}) {
  return apiFetch<T>(path, { ...init, method: 'GET' })
}

export function postJson<T = unknown>(
  path: string,
  body?: JsonLike,
  init: Omit<ApiFetchOptions, 'method' | 'body'> = {}
) {
  return apiFetch<T>(path, { ...init, method: 'POST', body })
}

export function putJson<T = unknown>(
  path: string,
  body?: JsonLike,
  init: Omit<ApiFetchOptions, 'method' | 'body'> = {}
) {
  return apiFetch<T>(path, { ...init, method: 'PUT', body })
}

export function patchJson<T = unknown>(
  path: string,
  body?: JsonLike,
  init: Omit<ApiFetchOptions, 'method' | 'body'> = {}
) {
  return apiFetch<T>(path, { ...init, method: 'PATCH', body })
}

export function deleteJson<T = unknown>(
  path: string,
  body?: JsonLike,
  init: Omit<ApiFetchOptions, 'method' | 'body'> = {}
) {
  return apiFetch<T>(path, { ...init, method: 'DELETE', body })
}

export const apiClient = {
  baseUrl: BASE_URL,
  isDev,
  useProxy,
  fetch: apiFetch,
  getJson,
  postJson,
  putJson,
  patchJson,
  deleteJson,
}

export const fetchJson = apiFetch
export type FetchJsonOptions = ApiFetchOptions

export default apiClient
