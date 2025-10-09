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
  groupName: string;
  client_id?: string;
};

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
  const sanitizedPayload: Record<string, unknown> = {
    ...payload,
    groupName: payload.groupName.trim() || 'default',
  };

  delete sanitizedPayload.contract_code;
  delete sanitizedPayload.id;
  delete sanitizedPayload.created_at;
  delete sanitizedPayload.updated_at;

  const trimmedClientId = payload.client_id?.trim();
  if (trimmedClientId && isValidUuid(trimmedClientId)) {
    sanitizedPayload.client_id = trimmedClientId;
  } else {
    delete sanitizedPayload.client_id;
  }

  const response = await fetch(`${CONTRACTS_API}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sanitizedPayload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `POST /contracts ${response.status}`);
  }

  return response.json();
}
