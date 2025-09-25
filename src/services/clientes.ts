import type { Cliente } from '../types';

const FALLBACK_WEBHOOK_PATH = '/api/webhook-test/mockScde';

export type RawCliente = Record<string, unknown>;

function parseNumberish(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    let cleaned = trimmed
      .replace(/[^0-9,.-]+/g, '')
      .replace(/(?!^)-/g, '');
    if (!cleaned) {
      return null;
    }
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    if (hasComma && hasDot) {
      if (lastComma > lastDot) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (hasComma) {
      cleaned = cleaned.replace(',', '.');
    } else if (hasDot) {
      const decimals = cleaned.length - lastDot - 1;
      const groups = cleaned.split('.');
      const grouped = groups.length > 1 && groups.slice(1).every((chunk) => chunk.length === 3);
      if (decimals === 3 && grouped) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }

    cleaned = cleaned.replace(/,/g, '');

    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatSaldoLabel(balance: number | null): string | undefined {
  if (balance === null) return undefined;
  const rounded = Math.round(balance * 100) / 100;
  const absolute = Math.abs(rounded);
  const prefix = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  const formatted = absolute.toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: absolute % 1 === 0 ? 0 : 2,
  });
  return `Saldo ${prefix}${formatted} kWh`;
}

function normalizeCliente(raw: RawCliente, index: number): Cliente | null {
  const rawId = raw.id ?? raw.ID ?? raw.clienteId ?? raw.codigo ?? raw.slug ?? index + 1;
  const idNumber = parseNumberish(rawId);
  const id = Number.isFinite(idNumber) ? Number(idNumber) : index + 1;
  const nome =
    (typeof raw.nome === 'string' && raw.nome.trim()) ||
    (typeof raw.name === 'string' && raw.name.trim()) ||
    (typeof raw.cliente === 'string' && raw.cliente.trim()) ||
    `Cliente ${index + 1}`;

  const bandeira =
    (typeof raw.bandeira === 'string' && raw.bandeira) ||
    (typeof raw.flag === 'string' && raw.flag) ||
    undefined;

  const impostoValue = raw.imposto ?? raw.aliquota ?? raw.tax ?? raw.impostoPercentual;
  const imposto =
    typeof impostoValue === 'string'
      ? impostoValue
      : typeof impostoValue === 'number'
      ? `${impostoValue}%`
      : undefined;

  const consumo = parseNumberish(raw.consumo ?? raw.consumo_kwh ?? raw.consumoKwh);
  const geracao = parseNumberish(raw.geracao ?? raw.geracao_kwh ?? raw.geracaoKwh ?? raw.producao);
  const balance =
    parseNumberish(raw.balanco ?? raw.balance ?? raw.saldo ?? raw.saldo_kwh ?? raw.saldoKwh) ??
    (consumo !== null && geracao !== null ? geracao - consumo : null);

  const saldoString =
    typeof raw.saldo === 'string' && raw.saldo.trim()
      ? raw.saldo.trim()
      : typeof raw.saldo_display === 'string'
      ? raw.saldo_display.trim()
      : undefined;

  const balanco = Number.isFinite(balance) ? (balance as number) : 0;
  const consumoKwh = Number.isFinite(consumo) ? (consumo as number) : 0;
  const geracaoKwh = Number.isFinite(geracao) ? (geracao as number) : 0;

  return {
    id: Number.isFinite(id) ? Number(id) : index + 1,
    nome,
    bandeira: bandeira ?? '—',
    imposto: imposto ?? '—',
    consumo: consumoKwh,
    geracao: geracaoKwh,
    balanco: balanco,
    saldo: saldoString ?? formatSaldoLabel(balance),
  };
}

function extractClientes(payload: unknown): RawCliente[] {
  if (Array.isArray(payload)) return payload as RawCliente[];
  if (payload && typeof payload === 'object') {
    const maybeArray = (payload as Record<string, unknown>).clientes;
    if (Array.isArray(maybeArray)) return maybeArray as RawCliente[];
  }
  return [];
}

export async function fetchClientes(signal?: AbortSignal): Promise<Cliente[]> {
  const envUrl = import.meta.env.VITE_WEBHOOK_URL;
  const url = envUrl && envUrl.trim() ? envUrl.trim() : FALLBACK_WEBHOOK_PATH;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Erro ao carregar clientes (HTTP ${response.status})`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('Resposta inválida do webhook de clientes');
  }

  const rawClientes = extractClientes(data);
  if (!rawClientes.length) {
    return [];
  }

  return rawClientes
    .map((raw, index) => normalizeCliente(raw, index))
    .filter((cliente): cliente is Cliente => Boolean(cliente));
}
