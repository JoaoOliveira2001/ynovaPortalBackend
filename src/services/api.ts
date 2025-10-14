import { fetchJson, type FetchJsonOptions, type HttpMethod } from '../lib/apiClient';

/* Simple API client with CSRF support */
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiFetch<T>(path: string, options: FetchJsonOptions = {}): Promise<T> {
  if (USE_MOCKS) {
    const { mockFetch } = await import('./mockApi');
    const mockOptions: RequestInit = { ...options };
    if (mockOptions.body && typeof mockOptions.body !== 'string') {
      mockOptions.body = JSON.stringify(mockOptions.body);
    }
    return mockFetch<T>(path, mockOptions);
  }

  const { headers, credentials, ...rest } = options;
  const headersWithCsrf = new Headers(headers ?? {});
  const csrf = getCsrfToken();
  if (csrf && !headersWithCsrf.has('X-CSRF-Token')) {
    headersWithCsrf.set('X-CSRF-Token', csrf);
  }

  return fetchJson<T>(path, {
    ...rest,
    credentials: credentials ?? 'include',
    headers: headersWithCsrf,
  });
}

export type { HttpMethod };

// Auth endpoints
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions?: string[];
};

export const AuthAPI = {
  csrf: () => apiFetch<void>('/auth/csrf', { method: 'GET' }),
  me: () => apiFetch<AuthUser>('/auth/me', { method: 'GET' }),
  login: (email: string, password: string) =>
    apiFetch<AuthUser>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
  refresh: () => apiFetch<AuthUser>('/auth/refresh', { method: 'POST' }),
  forgotPassword: (email: string) =>
    apiFetch<void>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),
};

// Contracts endpoints
export type ContractsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  cnpj?: string;
  status?: string;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
};

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
  upper_limit_percent: string | number | null;
  lower_limit_percent: string | number | null;
  flexibility_percent: string | number | null;
  average_price_mwh: string | number | null;
  supplier?: string | null;
  proinfa_contribution?: string | number | null;
  spot_price_ref_mwh: string | number | null;
  compliance_consumption: string;
  compliance_nf: string;
  compliance_invoice: string;
  compliance_charges: string;
  compliance_overall: string;
  created_at: string;
  updated_at: string;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toPercentNumber = (value: unknown): number => {
  const numeric = toNumber(value, 0);
  if (!numeric) return 0;
  const ratio = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
  return Number(ratio.toFixed(2));
};

const normalizeStatus = (value: unknown): ContractSummary['status'] => {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['ativo', 'active', 'actives'].includes(text)) return 'ativo';
  if (['inativo', 'inactive'].includes(text)) return 'inativo';
  if (['pendente', 'pending'].includes(text)) return 'pendente';
  return 'ativo';
};

const mapContractSummary = (raw: unknown, index: number): ContractSummary => {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const id =
    (obj.id as string | undefined) ??
    (obj.contract_code as string | undefined) ??
    (obj.codigoContrato as string | undefined) ??
    (obj.codigo as string | undefined) ??
    `contract-${index + 1}`;

  const clientName =
    (obj.client_name as string | undefined) ??
    (obj.cliente as string | undefined) ??
    (obj.client as string | undefined) ??
    'Cliente não informado';

  const billingCycle =
    (obj.billing_cycle as string | undefined) ??
    (obj.cicloFaturamento as string | undefined) ??
    (obj.ciclo as string | undefined) ??
    (obj.periodo as string | undefined) ??
    (typeof obj.start_date === 'string' ? obj.start_date.slice(0, 7) : undefined) ??
    '';

  const contracted = toNumber(obj.contracted_volume_mwh ?? obj.energiaContratadaMWh ?? obj.energiaContratada ?? 0, 0);
  const utilized =
    toNumber(
      obj.energy_used_mwh ??
        obj.energiaUtilizadaMWh ??
        obj.energiaUtilizada ??
        obj.consumo ??
        obj.volumeUtilizado ??
        contracted,
      contracted
    );

  const flex =
    toPercentNumber(
      obj.flexibility_percent ??
        obj.flexibilidadePct ??
        obj.flex ??
        (obj.limiteSuperior !== undefined && obj.limiteInferior !== undefined
          ? (toPercentNumber(obj.limiteSuperior) + toPercentNumber(obj.limiteInferior)) / 2
          : 0)
    );

  const excedente = toNumber(obj.excedenteMWh ?? obj.excedente_mwh ?? 0, 0);
  const extraCost = toNumber(obj.custoExtra ?? obj.extra_cost ?? 0, 0);

  return {
    id: String(id),
    cliente: clientName,
    cnpj: (obj.cnpj as string | undefined) ?? '',
    uc:
      (obj.uc as string | undefined) ??
      (obj.contract_code as string | undefined) ??
      (obj.client_id as string | undefined) ??
      String(id),
    status: normalizeStatus(obj.status),
    ciclo: billingCycle,
    energiaContratadaMWh: contracted,
    energiaUtilizadaMWh: utilized,
    flexibilidadePct: flex,
    excedenteMWh: excedente,
    custoExtra: extraCost,
  };
};

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export const ContractsAPI = {
  list: async (q: ContractsQuery = {}) => {
    const contracts = await apiFetch<Contract[]>(`/contracts`, { method: 'GET', cache: 'no-store' });

    const searchTerm = (q.search || '').toLowerCase();
    const cnpjFilter = (q.cnpj || '').replace(/[^0-9]/g, '');
    const statusFilter = q.status ? q.status.toLowerCase() : '';
    const startDateFilter = q.startDate ? new Date(`${q.startDate}-01T00:00:00Z`) : null;
    const endDateFilter = q.endDate ? new Date(`${q.endDate}-01T00:00:00Z`) : null;

    const filtered = contracts.filter((contract) => {
      const normalizedCnpj = contract.cnpj.replace(/[^0-9]/g, '');
      const contractStart = new Date(contract.start_date);
      const contractEnd = new Date(contract.end_date);

      const matchesSearch = !searchTerm
        || contract.contract_code.toLowerCase().includes(searchTerm)
        || contract.client_name.toLowerCase().includes(searchTerm);

      const matchesCnpj = !cnpjFilter || normalizedCnpj.includes(cnpjFilter);
      const matchesStatus = !statusFilter || contract.status.toLowerCase() === statusFilter;

      const matchesStartDate = !startDateFilter || contractEnd >= startDateFilter;
      const matchesEndDate = !endDateFilter || contractStart <= endDateFilter;

      return matchesSearch && matchesCnpj && matchesStatus && matchesStartDate && matchesEndDate;
    });

    const page = q.page && q.page > 0 ? q.page : 1;
    const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : 10;
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    const result: Paged<Contract> = { items, total: filtered.length, page, pageSize };
    return result;
  },
};
