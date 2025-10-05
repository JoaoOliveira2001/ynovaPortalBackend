import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ContractStatus = 'ATIVO' | 'PENDENTE' | 'CANCELADO' | 'DESCONHECIDO';

export type Contract = {
  id: string;
  contractNumber: string;
  customerName: string;
  status: ContractStatus;
  amount: number | null;
  startDate: string | null;
  endDate: string | null;
  supplier?: string | null;
  monthlyConsumptionMWh?: number | null;
  tags?: string[];
};

export type ContractsState = {
  data: Contract[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};

// Sample JSON for quick reference during development:
// [
//   {
//     "id": "c-001",
//     "contractNumber": "CTR-2025-0001",
//     "customerName": "Empresa Alfa S/A",
//     "supplier": "Neoenergia",
//     "status": "ATIVO",
//     "amount": 125000.45,
//     "monthlyConsumptionMWh": 142.0,
//     "startDate": "2025-01-01",
//     "endDate": "2026-01-01"
//   }
// ]

const KNOWN_FIELDS = new Set([
  'id',
  'contractNumber',
  'customerName',
  'client',
  'contract',
  'contract_id',
  'status',
  'contact_active',
  'situation',
  'amount',
  'price',
  'value',
  'startDate',
  'start_date',
  'inicio',
  'reference_base',
  'endDate',
  'end_date',
  'fim',
  'supplier',
  'provider',
  'utility',
  'monthlyConsumptionMWh',
  'consumption',
  'monthly_consumption_mwh',
  'meter',
  'tags',
  'labels',
  'adjusted',
  'createdAt',
  'updatedAt',
  'client_id',
]);

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function parseString(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/\./g, '').replace(/,/g, '.');
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function parseDate(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeStatus(value: unknown, fallback?: unknown): ContractStatus {
  const text = parseString(value).toUpperCase();
  if (text === 'ATIVO' || text === 'ACTIVE') return 'ATIVO';
  if (text === 'PENDENTE' || text === 'PENDING') return 'PENDENTE';
  if (text === 'CANCELADO' || text === 'CANCELLED' || text === 'CANCELADA') return 'CANCELADO';
  if (text) return 'DESCONHECIDO';

  if (typeof fallback === 'boolean') {
    return fallback ? 'ATIVO' : 'PENDENTE';
  }

  return 'DESCONHECIDO';
}

function extractTags(value: unknown, adjustedFlag: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const tags = value
      .map((item) => parseString(item))
      .filter((item): item is string => Boolean(item));
    if (tags.length) {
      return tags;
    }
  }
  if (adjustedFlag === true) {
    return ['Ajustado'];
  }
  return undefined;
}

function normalizeContract(raw: Record<string, unknown>): Contract {
  if (import.meta.env.DEV) {
    const unknownKeys = Object.keys(raw).filter((key) => !KNOWN_FIELDS.has(key));
    if (unknownKeys.length) {
      console.debug('[useContracts] Unknown fields received from API:', unknownKeys);
    }
  }

  const idValue = raw.id ?? raw.contract_id ?? raw.contract ?? raw.contractNumber;
  const id = parseString(idValue) || crypto.randomUUID();
  const contractNumber = parseString(raw.contractNumber ?? raw.contract ?? id);
  const customerName = parseString(raw.customerName ?? raw.client ?? 'Sem nome');
  const status = normalizeStatus(raw.status, raw.contact_active);
  const amount = parseNumber(raw.amount ?? raw.price ?? raw.value);
  const startDate = parseDate(raw.startDate ?? raw.start_date ?? raw.inicio ?? raw.reference_base);
  const endDate = parseDate(raw.endDate ?? raw.end_date ?? raw.fim);
  const supplier = parseString(raw.supplier ?? raw.provider ?? raw.utility) || undefined;
  const monthlyConsumptionMWh = parseNumber(
    raw.monthlyConsumptionMWh ?? raw.monthly_consumption_mwh ?? raw.consumption
  );
  const tags = extractTags(raw.tags ?? raw.labels, raw.adjusted);

  return {
    id,
    contractNumber: contractNumber || id,
    customerName,
    status,
    amount,
    startDate,
    endDate,
    supplier,
    monthlyConsumptionMWh,
    tags,
  };
}

function ensureArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as { data?: unknown }).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

function ensureHttpsForNgrok(url: URL): URL {
  if (url.protocol === 'http:' && url.hostname.endsWith('.ngrok-free.app')) {
    url.protocol = 'https:';
  }
  return url;
}

function normalizeAbsoluteUrl(rawUrl: string): string {
  try {
    const parsed = ensureHttpsForNgrok(new URL(rawUrl));
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function buildUrl(): string {
  const url = import.meta.env.VITE_CONTRACTS_URL ?? import.meta.env.VITE_CONTRACTS_API ?? '/contracts';
  if (typeof url !== 'string') {
    return '/contracts';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '/contracts';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizeAbsoluteUrl(trimmed);
  }

  return trimmed;
}

async function fetchContracts(signal?: AbortSignal): Promise<Contract[]> {
  const endpoint = buildUrl();
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    mode: endpoint.startsWith('http') ? 'cors' : 'same-origin',
    credentials: 'omit',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar contratos (${response.status})`);
  }

  const json = await response.json();
  const items = ensureArray(json);
  return items
    .map((item) => (item && typeof item === 'object' ? normalizeContract(item as Record<string, unknown>) : null))
    .filter((item): item is Contract => Boolean(item));
}

export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return currencyFormatter.format(0).replace(/0,00$/, '--');
  }
  return currencyFormatter.format(value);
}

export function formatDateDDMMYYYY(value: string | null | undefined): string {
  if (!value) return '--';
  const parsed = parseDate(value);
  if (!parsed) return '--';
  const [year, month, day] = parsed.split('-').map((part) => Number(part));
  const safeDate = new Date(Date.UTC(year, month - 1, day));
  return dateFormatter.format(safeDate);
}

export function useContracts(): ContractsState {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(undefined);
    try {
      const contracts = await fetchContracts(controller.signal);
      setData(contracts);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('[useContracts] Failed to load contracts', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar contratos');
      setData([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refresh,
    }),
    [data, loading, error, refresh]
  );
}
