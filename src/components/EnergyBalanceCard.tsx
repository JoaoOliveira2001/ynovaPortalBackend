import React, { useEffect, useMemo, useState } from 'react';

const ENERGY_BALANCE_URL = 'https://n8n.ynovamarketplace.com/webhook/mockBalancoEnergetico';

type EnergyBalanceResponse = {
  cliente: string;
  bandeira?: string | null;
  consumoKWh?: number;
  consumo?: number;
  geracaoKWh?: number;
  geracao?: number;
  economiaMigracao?: {
    saldoEnergeticoKWh?: number;
    saldoEnergetico?: number;
  };
  impostos?: {
    aliquotaExtra?: number | string;
  };
};

type SuccessState = {
  status: 'success';
  data: EnergyBalanceResponse;
  isFallback: boolean;
  warning?: string;
};

type FetchState =
  | { status: 'idle' | 'loading' }
  | SuccessState
  | { status: 'error'; error: string };

const DEMO_ENERGY_BALANCE: EnergyBalanceResponse = {
  cliente: 'Cliente Energia A',
  bandeira: 'Verde',
  consumoKWh: 1000,
  geracaoKWh: 1400,
  economiaMigracao: {
    saldoEnergeticoKWh: 200,
  },
  impostos: {
    aliquotaExtra: 12,
  },
};

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);

    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function sanitizeResponse(raw: unknown): EnergyBalanceResponse | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const cliente = typeof record.cliente === 'string' ? record.cliente.trim() : '';

  if (!cliente) {
    return null;
  }

  const bandeira = typeof record.bandeira === 'string' ? record.bandeira.trim() : undefined;
  const consumo =
    parseNumber(record.consumoKWh) ?? parseNumber(record.consumo) ?? parseNumber(record.consumoKwH);
  const geracao =
    parseNumber(record.geracaoKWh) ?? parseNumber(record.geracao) ?? parseNumber(record.geracaoKwH);

  const economiaMigracao =
    record.economiaMigracao && typeof record.economiaMigracao === 'object'
      ? (record.economiaMigracao as Record<string, unknown>)
      : undefined;

  const saldo =
    parseNumber(economiaMigracao?.saldoEnergeticoKWh) ??
    parseNumber(economiaMigracao?.saldoEnergetico) ??
    parseNumber((record as Record<string, unknown>).saldoEnergeticoKWh) ??
    parseNumber((record as Record<string, unknown>).saldoEnergetico) ??
    parseNumber((record as Record<string, unknown>).saldo);

  const impostos =
    record.impostos && typeof record.impostos === 'object'
      ? (record.impostos as Record<string, unknown>)
      : undefined;

  const aliquotaExtra = impostos?.aliquotaExtra ?? (record as Record<string, unknown>).aliquotaExtra;

  const response: EnergyBalanceResponse = {
    cliente,
  };

  if (bandeira) {
    response.bandeira = bandeira;
  }

  if (typeof consumo === 'number') {
    response.consumoKWh = consumo;
  }

  if (typeof geracao === 'number') {
    response.geracaoKWh = geracao;
  }

  if (typeof saldo === 'number') {
    response.economiaMigracao = {
      saldoEnergeticoKWh: saldo,
    };
  }

  if (aliquotaExtra !== undefined) {
    response.impostos = {
      aliquotaExtra,
    };
  }

  return response;
}

function formatNumber(value: number | undefined | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

function formatPercent(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}%`;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.includes('%') ? value : `${value}%`;
  }

  return '-';
}

export default function EnergyBalanceCard() {
  const [state, setState] = useState<FetchState>({ status: 'idle' });

  useEffect(() => {
    const abortController = new AbortController();

    async function load() {
      setState({ status: 'loading' });

      const attemptErrors: string[] = [];

      const attempts: Array<{
        label: string;
        init: RequestInit;
      }> = [
        {
          label: 'POST',
          init: {
            method: 'POST',
            body: '',
            signal: abortController.signal,
          },
        },
        {
          label: 'GET',
          init: {
            method: 'GET',
            signal: abortController.signal,
          },
        },
      ];

      for (const attempt of attempts) {
        try {
          const response = await fetch(ENERGY_BALANCE_URL, attempt.init);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const raw = await response.json();
          const sanitized = sanitizeResponse(raw);

          if (!sanitized) {
            attemptErrors.push(`${attempt.label}: resposta sem dados válidos`);
            continue;
          }

          setState({
            status: 'success',
            data: sanitized,
            isFallback: false,
          });
          return;
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }

          const message = error instanceof Error ? error.message : 'Erro inesperado';
          attemptErrors.push(`${attempt.label}: ${message}`);
        }
      }

      if (abortController.signal.aborted) {
        return;
      }

      setState({
        status: 'success',
        data: DEMO_ENERGY_BALANCE,
        isFallback: true,
        warning: `Não foi possível conectar ao BFF mock. Exibindo dados de demonstração. (${attemptErrors.join(' | ')})`,
      });
    }

    load();

    return () => {
      abortController.abort();
    };
  }, []);

  const content = useMemo(() => {
    if (state.status === 'loading' || state.status === 'idle') {
      return (
        <div className="flex min-h-[160px] items-center justify-center text-sm text-gray-500 dark:text-gray-300">
          Carregando…
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      );
    }

    const { data } = state;
    const consumo = data.consumoKWh ?? data.consumo;
    const geracao = data.geracaoKWh ?? data.geracao;
    const saldo = data.economiaMigracao?.saldoEnergeticoKWh ?? data.economiaMigracao?.saldoEnergetico;
    const imposto = data.impostos?.aliquotaExtra;

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {data.cliente ?? 'Cliente desconhecido'}
            </h2>
            {data.bandeira && (
              <span className="mt-1 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Bandeira: {data.bandeira}
              </span>
            )}
          </div>
          <div className="rounded-lg bg-green-50 px-4 py-3 text-right">
            <span className="block text-xs font-medium uppercase tracking-wide text-green-700">
              Saldo Energético
            </span>
            <span className="text-2xl font-semibold text-green-700">
              {formatNumber(saldo)} kWh
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Imposto Extra
            </dt>
            <dd className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatPercent(imposto)}
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Consumo
            </dt>
            <dd className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatNumber(consumo)} kWh
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Geração
            </dt>
            <dd className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatNumber(geracao)} kWh
            </dd>
          </div>
        </dl>
      </div>
    );
  }, [state]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
      {state.status === 'success' && state.warning && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {state.warning}
        </div>
      )}
      {content}
    </section>
  );
}
