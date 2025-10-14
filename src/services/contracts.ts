import { get, post } from '../lib/apiClient';

export type Contract = {
  id: string;
  contract_code: string;
  client_name: string;
  client_id?: string;
  groupName?: string;
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
  upper_limit_percent?: string | number | null;
  lower_limit_percent?: string | number | null;
  flexibility_percent?: string | number | null;
  average_price_mwh?: string | number | null;
  supplier?: string | null;
  proinfa_contribution?: string | number | null;
  spot_price_ref_mwh?: string | number | null;
  compliance_consumption?: string | number | null;
  compliance_nf?: string | number | null;
  compliance_invoice?: string | number | null;
  compliance_charges?: string | number | null;
  compliance_overall?: string | number | null;
  created_at: string;
  updated_at: string;
};

type ContractsPayload =
  | Contract[]
  | { data: Contract[] }
  | { items: Contract[] }
  | { results: Contract[] }
  | { contract: Contract }
  | { result: Contract }
  | Contract
  | undefined;

const normalizeContracts = (res: unknown): unknown[] => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    const record = res as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as unknown[];
    }
    if (Array.isArray(record.items)) {
      return record.items as unknown[];
    }
    if (record.results && Array.isArray(record.results)) {
      return record.results as unknown[];
    }
    if (record.contract && typeof record.contract === 'object') {
      return [record.contract];
    }
    if (record.result && typeof record.result === 'object') {
      return [record.result];
    }
    if (
      record.id !== undefined ||
      record.contract_code !== undefined ||
      record.client_name !== undefined
    ) {
      return [res];
    }
  }
  console.error('[contracts] Unexpected response shape:', res);
  return [];
};

function normalizeContract(raw: any, index: number): Contract {
  const idSource = raw?.id ?? raw?.contract_code ?? index;
  const toString = (value: unknown, fallback = ''): string => {
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  return {
    id: toString(idSource, String(index)),
    contract_code: toString(raw?.contract_code),
    client_name: toString(raw?.client_name),
    client_id: raw?.client_id == null ? undefined : toString(raw?.client_id),
    groupName: raw?.groupName == null ? undefined : toString(raw?.groupName),
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
    upper_limit_percent: raw?.upper_limit_percent ?? null,
    lower_limit_percent: raw?.lower_limit_percent ?? null,
    flexibility_percent: raw?.flexibility_percent ?? null,
    average_price_mwh: raw?.average_price_mwh ?? null,
    supplier: raw?.supplier != null
      ? toString(raw?.supplier)
      : raw?.fornecedor != null
      ? toString(raw?.fornecedor)
      : raw?.supplier_name != null
      ? toString(raw?.supplier_name)
      : null,
    proinfa_contribution: raw?.proinfa_contribution ?? raw?.proinfa ?? null,
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

export async function fetchContracts(signal?: AbortSignal): Promise<Contract[]> {
  const data = await get<ContractsPayload>('/contracts', {
    signal,
    cache: 'no-store',
  });

  const normalizedPayload = normalizeContracts(data);
  return normalizedPayload.map((item, index) => normalizeContract(item, index));
}

export async function getContracts(signal?: AbortSignal): Promise<Contract[]> {
  return fetchContracts(signal);
}

export type CreateContractPayload = Omit<
  Contract,
  'id' | 'created_at' | 'updated_at'
> & {
  supplier?: string | null;
  proinfa_contribution?: string | number | null;
  spot_price_ref_mwh?: unknown;
};

const normalizeNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
};

const normalizeProinfaContribution = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractCreatedContract = (payload: unknown): Contract => {
  const candidates = normalizeContracts(payload);
  if (candidates.length > 0) {
    return normalizeContract(candidates[0], 0);
  }
  if (payload && typeof payload === 'object') {
    return normalizeContract(payload, 0);
  }
  throw new Error('Resposta inválida ao criar contrato.');
};

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
  const {
    spot_price_ref_mwh: _omitSpotPrice,
    supplier,
    proinfa_contribution,
    groupName,
    ...rest
  } = payload;

  const body: Record<string, unknown> = {
    ...rest,
    supplier: normalizeNullableString(supplier),
    proinfa_contribution: normalizeProinfaContribution(proinfa_contribution),
    groupName: normalizeNullableString(groupName) ?? 'default',
  };

  const sanitizedBody = Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined)
  );

  const response = await post<unknown>('/contracts', sanitizedBody);

  return extractCreatedContract(response);
}
