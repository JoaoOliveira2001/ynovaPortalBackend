const getEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
    const value = (import.meta.env as Record<string, string | undefined>)[key];
    if (value !== undefined) {
      return value;
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const DEFAULT_CONTRACTS_API = 'https://b3767060a437.ngrok-free.app/contracts';

const normalizeEndpoint = (raw: string): string => {
  const trimmed = raw.trim().replace(/\s+/g, '');
  if (!trimmed) return DEFAULT_CONTRACTS_API;
  const withoutTrailingSlash = trimmed.replace(/\/$/, '');
  if (/\/contracts(\b|\/)/.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }
  return `${withoutTrailingSlash}/contracts`;
};

const resolveContractsEndpoint = (): string => {
  const candidates = [
    getEnv('VITE_CONTRACTS_API'),
    getEnv('VITE_CONTRACTS_API_URL'),
    getEnv('REACT_APP_CONTRACTS_API'),
    getEnv('VITE_API_BASE'),
    getEnv('VITE_API_BASE_URL'),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return normalizeEndpoint(candidate);
    }
  }

  return DEFAULT_CONTRACTS_API;
};

const CONTRACTS_ENDPOINT = resolveContractsEndpoint();
const REQUEST_TIMEOUT_MS = 10_000;

const createAbortRelay = (external?: AbortSignal) => {
  const controller = new AbortController();
  if (external) {
    const forwardAbort = () => controller.abort(external.reason);
    if (external.aborted) {
      controller.abort(external.reason);
    } else {
      external.addEventListener('abort', forwardAbort, { once: true });
      return { controller, cleanup: () => external.removeEventListener('abort', forwardAbort) };
    }
  }
  return { controller, cleanup: () => {} };
};

export type ContractsApiResponse = unknown;

export async function fetchContracts(signal?: AbortSignal): Promise<ContractsApiResponse> {
  const { controller, cleanup } = createAbortRelay(signal);
  const startedAt = Date.now();

  const timeoutError = new Error('Tempo limite excedido ao carregar contratos.');
  timeoutError.name = 'TimeoutError';
  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort(timeoutError);
    }
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(CONTRACTS_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });

    const tookMs = Date.now() - startedAt;

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '<body unavailable>');
      console.error('[contracts] Fetch failed', {
        url: CONTRACTS_ENDPOINT,
        status: response.status,
        statusText: response.statusText,
        body: bodyText,
        tookMs,
      });
      throw new Error(`Erro ao carregar contratos (HTTP ${response.status}).`);
    }

    try {
      return (await response.json()) as ContractsApiResponse;
    } catch (parseError) {
      console.error('[contracts] Falha ao interpretar resposta da API', {
        url: CONTRACTS_ENDPOINT,
        error: parseError,
        tookMs,
      });
      throw new Error('Não foi possível interpretar a resposta da API de contratos.');
    }
  } catch (error) {
    const tookMs = Date.now() - startedAt;
    const original = error instanceof Error ? error : new Error(String(error));
    const reason = (controller.signal as { reason?: unknown }).reason;
    const externalReason = signal && (signal as { reason?: unknown }).reason;
    const timeoutReason = reason ?? externalReason;
    const isTimeout = timeoutReason instanceof Error && timeoutReason.name === 'TimeoutError';
    const isAbort = original.name === 'AbortError';

    console.error('[contracts] Network/Unknown error', {
      url: CONTRACTS_ENDPOINT,
      status: undefined,
      payload: undefined,
      tookMs,
      error: original,
    });

    if (isTimeout) {
      throw new Error('Tempo limite excedido ao carregar contratos.');
    }

    if (isAbort && signal?.aborted) {
      throw signal.reason instanceof Error ? signal.reason : original;
    }

    throw new Error('Não foi possível carregar os contratos. Tente novamente mais tarde.');
  } finally {
    clearTimeout(timeoutId);
    cleanup();
  }
}
