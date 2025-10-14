export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type JsonLike =
  | BodyInit
  | Record<string, unknown>
  | Array<unknown>
  | null
  | undefined;

export type FetchJsonOptions = Omit<RequestInit, 'body' | 'method'> & {
  method?: HttpMethod;
  body?: JsonLike;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawBaseUrl) {
  const message =
    '[apiClient] Variável de ambiente VITE_API_BASE_URL não foi definida. Configure o .env com a URL base da API.';
  console.error(message);
  throw new Error(message);
}

const baseURL = rawBaseUrl.replace(/\/+$/, '');

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  return `${baseURL}/${normalizedPath}`;
};

const isJsonSerializable = (value: JsonLike): value is Record<string, unknown> | Array<unknown> => {
  if (!value) return false;
  if (typeof value !== 'object') return false;
  if (value instanceof FormData) return false;
  if (value instanceof Blob) return false;
  if (value instanceof ArrayBuffer) return false;
  if (ArrayBuffer.isView(value)) return false;
  if (value instanceof URLSearchParams) return false;
  return true;
};

export async function fetchJson<T>(path: string, options: FetchJsonOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers: headersInit,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortListener = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('The user aborted a request.', 'AbortError');
    }
    signal.addEventListener('abort', abortListener);
  }

  try {
    const headers = new Headers(headersInit ?? {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    let finalBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (isJsonSerializable(body)) {
        finalBody = JSON.stringify(body);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      } else {
        finalBody = body as BodyInit;
      }
    }

    const response = await fetch(buildUrl(path), {
      ...rest,
      method,
      headers,
      body: finalBody,
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      const snippet = text ? text.slice(0, 500) : '<empty>';
      throw new Error(
        `[apiClient] Request to ${path} failed with status ${response.status}. Response body: ${snippet}`
      );
    }

    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      console.error(`[apiClient] Failed to parse JSON from ${path}`, error, { responseText: text });
      throw new Error(`[apiClient] Resposta inválida da API para ${path}.`);
    }
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortListener);
    }
  }
}

export function get<T>(
  path: string,
  options: Omit<FetchJsonOptions, 'method' | 'body'> = {}
): Promise<T> {
  return fetchJson<T>(path, { ...options, method: 'GET' });
}

export function post<T>(
  path: string,
  body?: JsonLike,
  options: Omit<FetchJsonOptions, 'method' | 'body'> = {}
): Promise<T> {
  return fetchJson<T>(path, { ...options, method: 'POST', body });
}

export function put<T>(
  path: string,
  body?: JsonLike,
  options: Omit<FetchJsonOptions, 'method' | 'body'> = {}
): Promise<T> {
  return fetchJson<T>(path, { ...options, method: 'PUT', body });
}

export function patch<T>(
  path: string,
  body?: JsonLike,
  options: Omit<FetchJsonOptions, 'method' | 'body'> = {}
): Promise<T> {
  return fetchJson<T>(path, { ...options, method: 'PATCH', body });
}

export function del<T>(
  path: string,
  body?: JsonLike,
  options: Omit<FetchJsonOptions, 'method' | 'body'> = {}
): Promise<T> {
  return fetchJson<T>(path, { ...options, method: 'DELETE', body });
}

export const healthcheck = () => get('/health', { cache: 'no-store' });

export const apiClient = {
  baseURL,
  fetchJson,
  get,
  post,
  put,
  patch,
  del,
  healthcheck,
};

export default apiClient;
