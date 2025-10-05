import React from 'react';
import {
  ContractMock,
  mockContracts,
} from '../../mocks/contracts';
import {
  Contract,
  ContractStatus,
  useContracts as useContractsApi,
  formatCurrencyBRL,
} from '../../hooks/useContracts';

const statusMap: Record<ContractStatus, ContractMock['status']> = {
  ATIVO: 'Ativo',
  PENDENTE: 'Inativo',
  CANCELADO: 'Inativo',
  DESCONHECIDO: 'Ativo',
};

export type ContractUpdater = (contract: ContractMock) => ContractMock;

type ContractsContextValue = {
  contracts: ContractMock[];
  isLoading: boolean;
  error: string | null;
  updateContract: (id: string, updater: ContractUpdater | Partial<ContractMock>) => void;
  getContractById: (id: string) => ContractMock | undefined;
  addContract: (contract: ContractMock) => void;
  refreshContracts: () => Promise<void>;
};

const ContractsContext = React.createContext<ContractsContextValue | undefined>(undefined);

function cloneContract(contract: ContractMock): ContractMock {
  return JSON.parse(JSON.stringify(contract)) as ContractMock;
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function monthFromDate(value: string | null | undefined): string | null {
  const iso = toIsoDate(value);
  return iso ? iso.slice(0, 7) : null;
}

function buildPeriods(start: string | null, end: string | null, fallback: string[]): string[] {
  const startMonth = monthFromDate(start);
  const endMonth = monthFromDate(end);
  if (!startMonth && !endMonth) {
    return fallback;
  }
  if (startMonth && !endMonth) {
    return [startMonth];
  }
  if (!startMonth || !endMonth) {
    return fallback;
  }

  const result: string[] = [];
  const current = new Date(`${startMonth}-01T00:00:00Z`);
  const limit = new Date(`${endMonth}-01T00:00:00Z`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(limit.getTime())) {
    return fallback;
  }

  while (current <= limit) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    result.push(`${year}-${month}`);
    current.setUTCMonth(current.getUTCMonth() + 1);
  }

  return result.sort((a, b) => (a < b ? 1 : -1));
}

function buildVigenciaLabel(start: string | null, end: string | null, fallback: string): string {
  const startIso = toIsoDate(start);
  const endIso = toIsoDate(end);
  if (!startIso && !endIso) return fallback;

  const formatMonthYear = (iso: string | null) => {
    if (!iso) return null;
    const [year, month, day] = iso.split('-').map((part) => Number(part));
    const date = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric',
    })
      .format(date)
      .replace('.', '');
  };

  const startLabel = formatMonthYear(startIso);
  const endLabel = formatMonthYear(endIso);
  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }
  return startLabel ?? endLabel ?? fallback;
}

function formatMonthlyConsumption(value: number | null | undefined, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} MWh/mês`;
}

function mapContractToMock(contract: Contract, index: number): ContractMock {
  const template = cloneContract(mockContracts[index % mockContracts.length]);
  const startDate = toIsoDate(contract.startDate);
  const endDate = toIsoDate(contract.endDate);
  const ciclo = monthFromDate(contract.startDate) ?? template.cicloFaturamento;

  return {
    ...template,
    id: contract.id,
    codigo: contract.contractNumber || template.codigo,
    cliente: contract.customerName || template.cliente,
    status: statusMap[contract.status] ?? template.status,
    precoMedio: contract.amount ?? template.precoMedio,
    cicloFaturamento: ciclo,
    inicioVigencia: startDate ?? template.inicioVigencia,
    fimVigencia: endDate ?? template.fimVigencia,
    periodos: buildPeriods(startDate, endDate, template.periodos),
    dadosContrato: template.dadosContrato.map((field) => {
      const label = field.label.toLowerCase();
      if (label.includes('fornecedor')) {
        return {
          ...field,
          value: contract.supplier ?? field.value,
        };
      }
      if (label.includes('vigência')) {
        return {
          ...field,
          value: buildVigenciaLabel(startDate, endDate, field.value),
        };
      }
      if (label.includes('volume') && contract.monthlyConsumptionMWh !== undefined) {
        return {
          ...field,
          value: formatMonthlyConsumption(contract.monthlyConsumptionMWh, field.value),
        };
      }
      if (label.includes('preço médio') && contract.amount !== null && contract.amount !== undefined) {
        return {
          ...field,
          value: formatCurrencyBRL(contract.amount),
        };
      }
      return field;
    }),
    kpis: template.kpis.map((item, kpiIndex) => {
      if (kpiIndex === 0 && contract.amount !== null && contract.amount !== undefined) {
        return {
          ...item,
          value: formatCurrencyBRL(contract.amount),
          helper: contract.supplier ? `Fornecedor: ${contract.supplier}` : item.helper,
        };
      }
      return item;
    }),
  };
}

function applyUpdate(contract: ContractMock, update: ContractUpdater | Partial<ContractMock>): ContractMock {
  if (typeof update === 'function') {
    return update(contract);
  }
  return {
    ...contract,
    ...update,
  };
}

export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const { data: apiContracts, loading, error, refresh } = useContractsApi();
  const [manualContracts, setManualContracts] = React.useState<ContractMock[]>([]);
  const [remoteContracts, setRemoteContracts] = React.useState<ContractMock[]>([]);

  React.useEffect(() => {
    setRemoteContracts(apiContracts.map((contract, index) => mapContractToMock(contract, index)));
  }, [apiContracts]);

  const contracts = React.useMemo(
    () => [...manualContracts, ...remoteContracts],
    [manualContracts, remoteContracts]
  );

  const updateContract = React.useCallback(
    (id: string, updater: ContractUpdater | Partial<ContractMock>) => {
      setManualContracts((prev) => prev.map((contract) => (contract.id === id ? applyUpdate(contract, updater) : contract)));
      setRemoteContracts((prev) => prev.map((contract) => (contract.id === id ? applyUpdate(contract, updater) : contract)));
    },
    []
  );

  const getContractById = React.useCallback(
    (id: string) => contracts.find((contract) => contract.id === id),
    [contracts]
  );

  const addContract = React.useCallback((contract: ContractMock) => {
    setManualContracts((prev) => [cloneContract(contract), ...prev]);
  }, []);

  const refreshContracts = React.useCallback(async () => {
    await refresh();
  }, [refresh]);

  const contextValue = React.useMemo(
    () => ({
      contracts,
      isLoading: loading,
      error: error ?? null,
      updateContract,
      getContractById,
      addContract,
      refreshContracts,
    }),
    [contracts, loading, error, updateContract, getContractById, addContract, refreshContracts]
  );

  return <ContractsContext.Provider value={contextValue}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const context = React.useContext(ContractsContext);
  if (!context) {
    throw new Error('useContracts must be used within ContractsProvider');
  }
  return context;
}
