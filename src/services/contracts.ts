import { isValidUuid } from '../utils/uuid';

export type Contract = {
  id: string;
  contract_code: string;
  client_id: string;
  client_name: string;
  cnpj: string;
  segment: string;
  contact_responsible: string;
  contracted_volume_mwh: string | number | null;
  status: string;
  energy_source: string;
  contracted_modality: string;
  start_date: string;
  end_date: string;
  billing_cycle: string;
  groupName?: string;
  upper_limit_percent?: string | number | null;
  lower_limit_percent?: string | number | null;
  flexibility_percent?: string | number | null;
  average_price_mwh?: string | number | null;
  spot_price_ref_mwh?: string | number | null;
  compliance_consumption?: string | number | null;
  compliance_nf?: string | number | null;
  compliance_invoice?: string | number | null;
  compliance_charges?: string | number | null;
  compliance_overall?: string | number | null;
  created_at: string;
  updated_at: string;
};

const TEN_SECONDS = 10_000;
const DEFAULT_CONTRACTS_API = 'https://b3767060a437.ngrok-free.app/contracts';

const runtimeEnv: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string | undefined> }).env)
  || (typeof globalThis !== 'undefined' && (globalThis as any)?.process?.env)
  || {};

const CONTRACTS_API = (runtimeEnv.VITE_CONTRACTS_API || runtimeEnv.REACT_APP_CONTRACTS_API || DEFAULT_CONTRACTS_API).replace(/\/$/, '');

function normalizeContract(raw: any, index: number): Contract {
  const idSource = raw?.id ?? raw?.contract_code ?? index;
  const toString = (value: unknown, fallback = ''): string => {
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  return {
    id: toString(idSource, String(index)),
    contract_code: toString(raw?.contract_code),
    client_id: toString(raw?.client_id),
    client_name: toString(raw?.client_name),
    cnpj: toString(raw?.cnpj),
    segment: toString(raw?.segment),
    contact_responsible: toString(raw?.contact_responsible),
    contracted_volume_mwh: raw?.contracted_volume_mwh ?? null,
    status: toString(raw?.status),
    energy_source: toString(raw?.energy_source),
    contracted_modality: toString(raw?.contracted_modality),
    start_date: toString(raw?.start_date),
    end_date: toString(raw?.end_date),
    billing_cycle: toString(raw?.billing_cycle),
    groupName: raw?.groupName ? toString(raw?.groupName) : undefined,
    upper_limit_percent: raw?.upper_limit_percent ?? null,
    lower_limit_percent: raw?.lower_limit_percent ?? null,
    flexibility_percent: raw?.flexibility_percent ?? null,
    average_price_mwh: raw?.average_price_mwh ?? null,
    spot_price_ref_mwh: raw?.spot_price_ref_mwh ?? null,
    compliance_consumption: raw?.compliance_consumption ?? null,
    compliance_nf: raw?.compliance_nf ?? null,
    compliance_invoice: raw?.compliance_invoice ?? null,
    compliance_charges: raw?.compliance_charges ?? null,
    compliance_overall: raw?.compliance_overall ?? null,
    created_at: toString(raw?.created_at),
    updated_at: toString(raw?.updated_at),
  };
}

type ContractsPayload = Contract[] | { data: Contract[] } | undefined;

export async function fetchContracts(signal?: AbortSignal): Promise<Contract[]> {
  const startedAt = Date.now();
  const controller = new AbortController();
  let didTimeout = false;

  const abortFromCaller = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  if (signal) {
    if (signal.aborted) {
      abortFromCaller();
    } else {
      signal.addEventListener('abort', abortFromCaller);
    }
  }

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, TEN_SECONDS);

  try {
    const response = await fetch(CONTRACTS_API, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '<unavailable>');
      console.error('[contracts] Fetch failed', {
        url: CONTRACTS_API,
        status: response.status,
        statusText: response.statusText,
        payload: bodyText,
        tookMs: Date.now() - startedAt,
        stack: new Error().stack,
      });
      throw new Error(`Falha ao carregar contratos (HTTP ${response.status}).`);
    }

    const text = await response.text();
    let parsed: ContractsPayload;
    if (text) {
      try {
        parsed = JSON.parse(text) as ContractsPayload;
      } catch (parseError) {
        console.error('[contracts] Invalid JSON payload', {
          url: CONTRACTS_API,
          payload: text,
          tookMs: Date.now() - startedAt,
          error: parseError,
          stack: parseError instanceof Error ? parseError.stack : undefined,
        });
        throw new Error('Resposta inválida da API de contratos.');
      }
    }

    const data = Array.isArray(parsed) ? parsed : parsed?.data;
    if (!Array.isArray(data)) {
      console.error('[contracts] Unexpected payload shape', {
        url: CONTRACTS_API,
        payload: parsed,
        tookMs: Date.now() - startedAt,
        stack: new Error().stack,
      });
      throw new Error('Resposta inesperada da API de contratos.');
    }

    return data.map((item, index) => normalizeContract(item, index));
  } catch (error) {
    if (controller.signal.aborted && !didTimeout) {
      throw error;
    }

    const logPayload = {
      url: CONTRACTS_API,
      tookMs: Date.now() - startedAt,
      timedOut: didTimeout,
      error,
      stack: error instanceof Error ? error.stack : undefined,
    };
    console.error('[contracts] Network/unknown error', logPayload);

    if (didTimeout) {
      throw new Error('Tempo limite ao carregar os contratos. Tente novamente mais tarde.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro desconhecido ao carregar os contratos.');
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortFromCaller);
    }
  }
}

export async function getContracts(signal?: AbortSignal): Promise<Contract[]> {
  return fetchContracts(signal);
}

type BaseContractPayload = Omit<
  Contract,
  'id' | 'contract_code' | 'client_id' | 'created_at' | 'updated_at' | 'groupName'
>;

export type CreateContractPayload = BaseContractPayload & {
  groupName?: string | null;
  client_id?: string | null;
  contract_code?: string | null;
};

function buildCreateContractBody(payload: CreateContractPayload): Record<string, unknown> {
  const draft: Record<string, unknown> = { ...payload };

  delete draft.contract_code;
  delete draft.id;
  delete draft.created_at;
  delete draft.updated_at;

  const rawGroupName =
    typeof payload.groupName === 'string'
      ? payload.groupName
      : payload.groupName != null
        ? String(payload.groupName)
        : '';
  const normalizedGroupName = rawGroupName.trim();
  draft.groupName = normalizedGroupName || 'default';

  const rawClientId =
    typeof payload.client_id === 'string'
      ? payload.client_id.trim()
      : payload.client_id != null
        ? String(payload.client_id).trim()
        : '';

  if (isValidUuid(rawClientId)) {
    draft.client_id = rawClientId;
  } else {
    delete draft.client_id;
  }

  Object.keys(draft).forEach((key) => {
    if (draft[key] === undefined || draft[key] === null) {
      delete draft[key];
    }
  });

  return draft;
}

type TryParseJsonResult = { ok: true; value: unknown } | { ok: false; error: unknown };

function tryParseJson(text: string): TryParseJsonResult {
  if (!text) {
    return { ok: true, value: null };
  }

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
  const body = buildCreateContractBody(payload);
  const startedAt = Date.now();
  const url = CONTRACTS_API;

  console.info('[contracts:POST] Request', { url, payload: body });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[contracts:POST] Network/Unknown error', {
      url,
      error,
      payload: body,
      tookMs: Date.now() - startedAt,
    });
    throw error;
  }

  const responseText = await response.text().catch(() => '');
  const tookMs = Date.now() - startedAt;

  if (!response.ok) {
    console.error('[contracts:POST] Failed', {
      url,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      payload: body,
      tookMs,
    });

    const parsedError = responseText ? tryParseJson(responseText) : { ok: true, value: null };
    let message = `POST ${url} failed with status ${response.status}`;
    if (parsedError.ok) {
      const maybeMessage =
        parsedError.value && typeof parsedError.value === 'object' && 'message' in parsedError.value
          ? parsedError.value.message
          : null;
      if (maybeMessage) {
        message = String(maybeMessage);
      } else if (typeof parsedError.value === 'string' && parsedError.value.trim()) {
        message = parsedError.value;
      } else if (responseText.trim()) {
        message = responseText;
      }
    } else if (responseText.trim()) {
      message = responseText;
    }

    throw new Error(message);
  }

  const parsedResponse = tryParseJson(responseText);
  if (!parsedResponse.ok) {
    console.error('[contracts:POST] Invalid JSON response', {
      url,
      response: responseText,
      error: parsedResponse.error,
      tookMs,
    });
    throw new Error('Resposta inválida da API de contratos.');
  }

  if (!parsedResponse.value || typeof parsedResponse.value !== 'object') {
    console.error('[contracts:POST] Unexpected response payload', {
      url,
      response: parsedResponse.value,
      tookMs,
    });
    throw new Error('Resposta inesperada da API de contratos.');
  }

  const contract = parsedResponse.value as Contract;

  console.info('[contracts:POST] Success', {
    url,
    status: response.status,
    tookMs,
    id: (contract as { id?: unknown })?.id,
  });

  return contract;
}
