import type { Cliente } from '../types';
import { getJson } from '../lib/apiClient';

type FetchOptions = {
  signal?: AbortSignal;
};

export type LeadSimulationResponse = {
  clientes: Cliente[];
  fromCache: boolean;
  error?: string;
};

const LEAD_SIMULATION_PATH = import.meta.env.VITE_LEAD_SIMULATION_PATH || '/lead-simulation';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

let lastResult: LeadSimulationResponse | null = null;
let lastRemoteClientes: Cliente[] | null = null;

function parseNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[^0-9.,-]/g, '')
      .replace(/,(?=\d{3}(?:\D|$))/g, '.')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function ensurePercent(value: unknown): string {
  if (typeof value === 'string') {
    return value.includes('%') ? value : `${value}%`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}%`;
  }
  return '0%';
}

function normalizeCliente(raw: any, index: number): Cliente {
  const consumo =
    parseNumber(raw?.consumo) ||
    parseNumber(raw?.consumo_kwh) ||
    parseNumber(raw?.consumoKwh) ||
    parseNumber(raw?.consumoKWh) ||
    parseNumber(raw?.kwh_consumo) ||
    parseNumber(raw?.energiaAtual);
  const geracao =
    parseNumber(raw?.geracao) ||
    parseNumber(raw?.geracao_kwh) ||
    parseNumber(raw?.geracaoKwh) ||
    parseNumber(raw?.geracaoKWh) ||
    parseNumber(raw?.kwh_geracao) ||
    parseNumber(raw?.energiaGerada);
  const balancoRaw =
    parseNumber(raw?.balanco) ||
    parseNumber(raw?.saldoEnergetico) ||
    parseNumber(raw?.saldo) ||
    parseNumber(raw?.balancoEnergetico) ||
    parseNumber(raw?.economiaMigracao?.saldoEnergetico) ||
    parseNumber(raw?.economiaMigracao?.saldoEnergeticoKWh);

  const idValue = raw?.id ?? raw?.clienteId ?? raw?.leadId ?? raw?.codigo ?? index + 1;
  const id = Number.parseInt(String(idValue), 10);

  const nome =
    raw?.nome ??
    raw?.name ??
    raw?.razaoSocial ??
    raw?.cliente ??
    raw?.empresa ??
    `Cliente ${index + 1}`;

  const bandeira =
    raw?.bandeira ??
    raw?.flag ??
    raw?.tarifaBandeira ??
    raw?.categoria ??
    'Sem bandeira';

  const impostoValue =
    raw?.imposto ??
    raw?.impostoPercentual ??
    raw?.aliquota ??
    raw?.aliquotaExtra ??
    raw?.taxa ??
    raw?.percentualImposto ??
    raw?.impostoExtra ??
    raw?.impostos?.aliquotaExtra ??
    '0%';

  const imposto = ensurePercent(impostoValue);

  const balanco = balancoRaw || geracao - consumo;

  return {
    id: Number.isFinite(id) ? id : index + 1,
    nome,
    bandeira,
    imposto,
    consumo,
    geracao,
    balanco,
  };
}

function isClienteLike(value: any): boolean {
  if (!value || typeof value !== 'object') return false;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  const hasNome = keys.some((key) =>
    ['nome', 'name', 'cliente', 'razaosocial', 'empresa', 'fantasia'].includes(key)
  );
  const hasConsumo = keys.some((key) =>
    ['consumo', 'consumo_kwh', 'consumokwh', 'kwh_consumo', 'energiaatual'].includes(key)
  );
  const hasGeracaoOuSaldo = keys.some((key) =>
    [
      'geracao',
      'geracao_kwh',
      'geracaokwh',
      'kwh_geracao',
      'energiagerada',
      'saldo',
      'saldoenergetico',
      'saldoenergeticokwh',
      'balanco',
      'balancoenergetico',
    ].includes(key)
  );
  return hasNome && (hasConsumo || hasGeracaoOuSaldo);
}

function tryParseJsonString(text: string): any {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tryParse = (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(trimmed);
  if (parsed !== null) return parsed;

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const unescaped = tryParse(trimmed);
    if (typeof unescaped === 'string') {
      parsed = tryParse(unescaped);
      if (parsed !== null) return parsed;
      return unescaped;
    }
  }

  return null;
}

function extractClientes(payload: any): any[] {
  const visited = new Set<any>();

  const search = (value: any): any[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
      const candidates = value.filter(isClienteLike);
      if (candidates.length > 0) return candidates;
      for (const item of value) {
        const nested = search(item);
        if (nested.length > 0) return nested;
      }
      return [];
    }

    if (typeof value === 'string') {
      const parsed = tryParseJsonString(value);
      if (parsed !== null) {
        return search(parsed);
      }
      return [];
    }

    if (typeof value === 'object') {
      if (visited.has(value)) return [];
      visited.add(value);

      if (isClienteLike(value)) {
        return [value];
      }

      const objectValues = Object.values(value);
      const directClientes = objectValues.filter(isClienteLike);
      if (directClientes.length > 0) return directClientes as any[];

      const preferredKeys = [
        'clientes',
        'lista',
        'listaclientes',
        'dadosclientes',
        'clientesenergia',
        'leadclientes',
        'items',
        'rows',
        'entries',
        'result',
        'data',
        'payload',
        'body',
        'response',
        'simulation',
        'leadsimulation',
        'balanco',
      ];

      for (const [key, nestedValue] of Object.entries(value)) {
        const normalizedKey = key.toLowerCase();
        if (preferredKeys.includes(normalizedKey)) {
          const nested = search(nestedValue);
          if (nested.length > 0) return nested;
        }
      }

      for (const nestedValue of objectValues) {
        const nested = search(nestedValue);
        if (nested.length > 0) return nested;
      }
    }

    return [];
  };

  const result = search(payload);
  return Array.isArray(result) ? result : [];
}

function buildErrorMessage(label: string, error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return `${label}: requisição cancelada`;
  }
  if (error instanceof Error) {
    return `${label}: ${error.message}`;
  }
  return `${label}: erro desconhecido`;
}

export function getCachedLeadSimulationClientes(): LeadSimulationResponse | null {
  return lastResult;
}

export async function fetchLeadSimulationClientes({ signal }: FetchOptions = {}): Promise<LeadSimulationResponse> {
  try {
    const payload = await getJson<unknown>(LEAD_SIMULATION_PATH, {
      signal,
      cache: 'no-store',
    });

    const rawClientes = extractClientes(payload);
    if (!Array.isArray(rawClientes) || rawClientes.length === 0) {
      throw new Error('Resposta sem clientes válidos');
    }

    const clientes = rawClientes.map((item, index) => normalizeCliente(item, index));
    const result: LeadSimulationResponse = { clientes, fromCache: false };
    lastResult = result;
    lastRemoteClientes = clientes;
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    const errorMessage = buildErrorMessage('GET', error);
    const fallbackClientes = lastRemoteClientes
      ?? (USE_MOCKS ? (await import('../data/mockData')).mockClientes : null);

    if (fallbackClientes) {
      const fallbackResult: LeadSimulationResponse = {
        clientes: fallbackClientes,
        fromCache: true,
        error: errorMessage,
      };
      lastResult = fallbackResult;
      return fallbackResult;
    }

    throw error instanceof Error
      ? error
      : new Error('Erro desconhecido ao carregar clientes da simulação');
  }
}
