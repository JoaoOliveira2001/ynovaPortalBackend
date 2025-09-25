import React, { useMemo } from 'react';
import ListRow from '../components/ListRow';
import { useClientes } from '../hooks/useClientes';
import type { Cliente } from '../types';

function buildSaldo(cliente: Cliente) {
  const amount = Math.abs(cliente.balanco).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const prefix = cliente.balanco > 0 ? '+' : cliente.balanco < 0 ? '-' : '';
  const label = cliente.saldo ?? `Saldo ${prefix}${amount} kWh`;
  const color = cliente.balanco > 0 ? 'green' : cliente.balanco < 0 ? 'red' : 'gray';
  return { label, color } as const;
}

export default function SimulationClientsPage() {
  const { clientes, loading, error } = useClientes();

  const items = useMemo(() => clientes.map((cliente) => ({
      cliente,
      saldo: buildSaldo(cliente),
    })), [clientes]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Balanço Energético</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Selecione um cliente para visualizar custos atuais, estimativas e economia.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1f24] rounded-xl border border-gray-200 dark:border-[#2b3238] shadow-sm">
        {loading ? (
          <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Carregando clientes...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">Erro ao carregar clientes: {error.message}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600 dark:text-gray-300">Nenhum cliente disponível.</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-[#2b3238]">
            {items.map(({ cliente, saldo }) => (
              <ListRow
                key={cliente.id}
                to={`/leads/simulation/${cliente.id}`}
                state={{ cliente }}
                title={cliente.nome}
                badgeLabel={`Bandeira: ${cliente.bandeira}`}
                detail={`Imposto: ${cliente.imposto} • Consumo: ${cliente.consumo.toLocaleString('pt-BR')} kWh • Geração: ${cliente.geracao.toLocaleString('pt-BR')} kWh`}
                rightPill={{
                  label: saldo.label,
                  color: saldo.color,
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
