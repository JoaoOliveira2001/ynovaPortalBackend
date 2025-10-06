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

type FetchState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: EnergyBalanceResponse }
  | { status: 'error'; error: string };

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

      try {
        const response = await fetch(ENERGY_BALANCE_URL, {
          method: 'POST',
          body: '',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Falha ao carregar dados (${response.status})`);
        }

        const data: EnergyBalanceResponse = await response.json();

        setState({ status: 'success', data });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Não foi possível carregar os dados.';

        setState({ status: 'error', error: message });
      }
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
      {content}
    </section>
  );
}
