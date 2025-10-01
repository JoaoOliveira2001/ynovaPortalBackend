import React, { useMemo, useState } from 'react';
import ListRow from '../components/ListRow';
import EmptyState from '../components/EmptyState';
import { useSimulationClientes } from '../hooks/useSimulationClientes';
import UploadXLSX from '../components/UploadXLSX';
import { Search } from 'lucide-react';

export default function SimulationClientsPage() {
  const { clientes, loading, error, isUsingFallback } = useSimulationClientes();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClientes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return clientes;
    }

    return clientes.filter((cliente) => cliente.nome.toLowerCase().includes(term));
  }, [clientes, searchTerm]);

  const showEmptyState = !loading && clientes.length === 0;
  const showNoResults = !loading && clientes.length > 0 && filteredClientes.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Balanço Energético</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Encontre e acompanhe o saldo energético dos clientes.
          </p>
        </div>
        <div className="sm:shrink-0">
          <UploadXLSX />
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar cliente por nome"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#1a1f24] dark:text-gray-100"
          aria-label="Buscar cliente por nome"
        />
      </div>

      {error && !isUsingFallback && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar clientes: {error}
        </div>
      )}

      {isUsingFallback && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Não foi possível conectar ao BFF mock. Exibindo dados de demonstração.
          {error ? ` (${error})` : ''}
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1f24] rounded-xl border border-gray-200 dark:border-[#2b3238] shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-300">Carregando…</div>
        ) : showEmptyState ? (
          <EmptyState message="Nenhum cliente retornado pelo BFF." />
        ) : showNoResults ? (
          <EmptyState message="Nenhum cliente encontrado com o nome informado." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-[#2b3238]">
            {filteredClientes.map((cliente) => (
              <ListRow
                key={cliente.id}
                to={`/leads/${cliente.id}`}
                title={cliente.nome}
                badgeLabel={`Bandeira: ${cliente.bandeira}`}
                detail={`Imposto: ${cliente.imposto} • Consumo: ${cliente.consumo} kWh • Geração: ${cliente.geracao} kWh`}
                rightPill={{
                  label: `Saldo ${cliente.balanco >= 0 ? '+' : '-'}${Math.abs(cliente.balanco)} kWh`,
                  color: 'green',
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
