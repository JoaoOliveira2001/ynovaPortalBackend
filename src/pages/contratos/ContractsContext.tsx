import React from 'react';
import { ContractMock } from '../../mocks/contracts';
import { mockContracts } from '../../mocks/contracts';

const DEFAULT_API_URL = 'https://657285488d18.ngrok-free.app';

const resumoKeys: Array<keyof ContractMock['resumoConformidades']> = [
  'Consumo',
  'NF',
  'Fatura',
  'Encargos',
  'Conformidade',
];

const statusResumoValues = ['Conforme', 'Divergente', 'Em análise'] as const;
type StatusResumoValue = (typeof statusResumoValues)[number];

const analiseStatusValues = ['verde', 'amarelo', 'vermelho'] as const;
type AnaliseStatusValue = (typeof analiseStatusValues)[number];

const invoiceStatusValues = ['Paga', 'Em aberto', 'Em análise'] as const;
type InvoiceStatusValue = (typeof invoiceStatusValues)[number];

const normalizeString = (value: unknown, fallback = '') => {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
};

const normalizeIsoDate = (value: unknown): string => {
  const text = normalizeString(value);
  if (!text) return '';
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return isoMatch ? text : '';
};

const normalizeReferenceMonth = (value: unknown): string => {
  const isoDate = normalizeIsoDate(value);
  if (isoDate) {
    return isoDate.slice(0, 7);
  }
  const text = normalizeString(value);
  const monthMatch = text.match(/^(\d{4})[-/](\d{2})/);
  return monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : '';
};

const formatCurrencyBRL = (value: number): string => {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    console.warn('[ContractsContext] Falha ao formatar moeda, usando fallback.', error);
    return `R$ ${value.toFixed(2)}`;
  }
};

const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const normalizeResumoStatus = (value: unknown): StatusResumoValue => {
  const text = normalizeString(value).toLowerCase();
  if (!text) return 'Em análise';
  const sanitized = removeDiacritics(text);
  if (sanitized === 'conforme') return 'Conforme';
  if (sanitized === 'divergente') return 'Divergente';
  if (sanitized.includes('analise')) return 'Em análise';
  return 'Em análise';
};

const normalizeAnaliseStatus = (value: unknown): AnaliseStatusValue => {
  const text = removeDiacritics(normalizeString(value));
  if (analiseStatusValues.includes(text as AnaliseStatusValue)) {
    return text as AnaliseStatusValue;
  }
  if (text === 'amarela') return 'amarelo';
  if (text === 'vermelha') return 'vermelho';
  return 'amarelo';
};

const normalizeInvoiceStatus = (value: unknown): InvoiceStatusValue => {
  const text = removeDiacritics(normalizeString(value));
  if (text === 'paga' || text === 'pagas') return 'Paga';
  if (text === 'em aberto' || text === 'aberto') return 'Em aberto';
  if (text.includes('analise')) return 'Em análise';
  return 'Em análise';
};

const normalizeContratoStatus = (value: unknown): ContractMock['status'] => {
  const text = removeDiacritics(normalizeString(value));
  if (text === 'ativo' || text === 'ativos') return 'Ativo';
  if (text === 'inativo' || text === 'inativos') return 'Inativo';
  return 'Ativo';
};

const normalizeFonte = (value: unknown): ContractMock['fonte'] => {
  const text = removeDiacritics(normalizeString(value));
  if (text === 'incentivada' || text === 'incentivadao') return 'Incentivada';
  return 'Convencional';
};

const normalizeResumo = (value: unknown): ContractMock['resumoConformidades'] => {
  const resumo: ContractMock['resumoConformidades'] = {
    Consumo: 'Em análise',
    NF: 'Em análise',
    Fatura: 'Em análise',
    Encargos: 'Em análise',
    Conformidade: 'Em análise',
  };

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    Object.entries(value as Record<string, unknown>).forEach(([key, status]) => {
      if (resumoKeys.includes(key as keyof ContractMock['resumoConformidades'])) {
        resumo[key as keyof ContractMock['resumoConformidades']] = normalizeResumoStatus(status);
      }
    });
  }

  return resumo;
};

const normalizeContractData = (value: unknown): ContractMock['dadosContrato'] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        label: normalizeString((item as { label?: unknown }).label),
        value: normalizeString((item as { value?: unknown }).value),
      }))
      .filter((item) => item.label || item.value);
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([label, val]) => ({ label: normalizeString(label), value: normalizeString(val) }))
      .filter((item) => item.label || item.value);
  }
  return [];
};

const normalizeKpis = (value: unknown): ContractMock['kpis'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const label = normalizeString((item as { label?: unknown; nome?: unknown }).label ?? (item as { nome?: unknown }).nome);
      const rawValue =
        (item as { value?: unknown; valor?: unknown }).value ?? (item as { valor?: unknown }).valor;
      const valueText = normalizeString(rawValue);
      if (!label || !valueText) return null;
      const helper = normalizeString((item as { helper?: unknown; descricao?: unknown }).helper ?? (item as { descricao?: unknown }).descricao);
      const variationValue = normalizeString((item as { variation?: { value?: unknown } }).variation?.value ?? (item as { variacao?: unknown }).variacao);
      const directionRaw = normalizeString((item as { variation?: { direction?: unknown } }).variation?.direction);
      const directionText = removeDiacritics(directionRaw);
      const direction: 'up' | 'down' | 'neutral' | undefined =
        directionText === 'up' || directionText === 'positivo'
          ? 'up'
          : directionText === 'down' || directionText === 'negativo'
          ? 'down'
          : directionText
          ? 'neutral'
          : undefined;

      return {
        label,
        value: valueText,
        helper: helper || undefined,
        variation:
          variationValue && direction
            ? {
                value: variationValue,
                direction,
              }
            : undefined,
      };
    })
    .filter((item): item is ContractMock['kpis'][number] => Boolean(item));
};

const normalizeHistoricoDemanda = (value: unknown): ContractMock['historicoDemanda'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      mes: normalizeString((item as { mes?: unknown; competencia?: unknown }).mes ?? (item as { competencia?: unknown }).competencia),
      ponta: Number((item as { ponta?: unknown; pontaMWh?: unknown }).ponta ?? (item as { pontaMWh?: unknown }).pontaMWh) || 0,
      foraPonta:
        Number((item as { foraPonta?: unknown; fora_ponta?: unknown }).foraPonta ?? (item as { fora_ponta?: unknown }).fora_ponta) || 0,
    }))
    .filter((item) => item.mes);
};

const normalizeHistoricoConsumo = (value: unknown): ContractMock['historicoConsumo'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      mes: normalizeString((item as { mes?: unknown; competencia?: unknown }).mes ?? (item as { competencia?: unknown }).competencia),
      meta: Number((item as { meta?: unknown }).meta) || 0,
      realizado: Number((item as { realizado?: unknown }).realizado) || 0,
    }))
    .filter((item) => item.mes);
};

const normalizeObrigacoes = (value: unknown): ContractMock['obrigacoes'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const periodo = normalizeString((item as { periodo?: unknown }).periodo);
      if (!periodo) return null;
      const statusObj: Record<string, ContractMock['resumoConformidades'][keyof ContractMock['resumoConformidades']]> = {};
      const statusRaw = (item as { status?: unknown; etapas?: unknown }).status ?? (item as { etapas?: unknown }).etapas;
      if (statusRaw && typeof statusRaw === 'object') {
        Object.entries(statusRaw as Record<string, unknown>).forEach(([key, status]) => {
          statusObj[key] = normalizeResumoStatus(status);
        });
      }
      return {
        periodo,
        status: statusObj,
      };
    })
    .filter((item): item is ContractMock['obrigacoes'][number] => Boolean(item));
};

const etapaNomeValues = ['Dados', 'Cálculo', 'Análise'] as const;
type EtapaNomeValue = (typeof etapaNomeValues)[number];

const normalizeEtapaNome = (value: unknown): EtapaNomeValue => {
  const text = normalizeString(value);
  if (!text) return 'Dados';
  const sanitized = removeDiacritics(text);
  const match = etapaNomeValues.find((option) => removeDiacritics(option) === sanitized);
  if (match) return match;
  if (sanitized.includes('calc')) return 'Cálculo';
  if (sanitized.includes('anal')) return 'Análise';
  return 'Dados';
};

const normalizeAnalises = (value: unknown): ContractMock['analises'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const area = normalizeString((item as { area?: unknown; nome?: unknown }).area ?? (item as { nome?: unknown }).nome);
      if (!area) return null;
      const etapasRaw = (item as { etapas?: unknown; steps?: unknown }).etapas ?? (item as { steps?: unknown }).steps;
      const etapas = Array.isArray(etapasRaw)
        ? etapasRaw
            .map((etapa) => ({
              nome: normalizeEtapaNome((etapa as { nome?: unknown; etapa?: unknown }).nome ?? (etapa as { etapa?: unknown }).etapa),
              status: normalizeAnaliseStatus((etapa as { status?: unknown }).status),
              observacao: normalizeString((etapa as { observacao?: unknown; descricao?: unknown }).observacao ?? (etapa as { descricao?: unknown }).descricao) || undefined,
            }))
            .filter((etapa) => analiseStatusValues.includes(etapa.status))
        : [];
      return {
        area,
        etapas,
      };
    })
    .filter((item): item is ContractMock['analises'][number] => Boolean(item));
};

const normalizeFaturas = (value: unknown): ContractMock['faturas'] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const rawId =
        (item as { id?: unknown }).id ??
        (item as { identificador?: unknown }).identificador ??
        `invoice-${index + 1}`;
      const rawArquivo = (item as { arquivo?: unknown }).arquivo ?? (item as { url?: unknown }).url;
      return {
        id: normalizeString(rawId),
        competencia: normalizeString((item as { competencia?: unknown }).competencia),
        vencimento: normalizeString((item as { vencimento?: unknown; dueDate?: unknown }).vencimento ?? (item as { dueDate?: unknown }).dueDate),
        valor: Number((item as { valor?: unknown }).valor) || 0,
        status: normalizeInvoiceStatus((item as { status?: unknown }).status),
        arquivo: rawArquivo ? normalizeString(rawArquivo) : undefined,
      };
    })
    .filter((item) => item.competencia);
};

const normalizePeriodos = (value: unknown): ContractMock['periodos'] => {
  if (!Array.isArray(value)) return [];
  return value.map((periodo) => normalizeString(periodo)).filter(Boolean);
};

const normalizeContractsFromApi = (payload: unknown): ContractMock[] => {
  const extractArray = (data: unknown): unknown[] => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const maybeArrayKeys = ['contratos', 'contracts', 'items', 'data', 'result'];
    for (const key of maybeArrayKeys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).items)) {
        return (value as Record<string, unknown>).items as unknown[];
      }
      if (value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).contratos)) {
        return (value as Record<string, unknown>).contratos as unknown[];
      }
    }
    return [];
  };

  const rawContracts = extractArray(payload);
  return rawContracts.map((item, index) => {
    const baseId = normalizeString((item as { id?: unknown; codigo?: unknown }).id ?? (item as { codigo?: unknown }).codigo);
    const id = baseId || `contract-${index + 1}`;

    const referenceBaseRaw =
      (item as { reference_base?: unknown }).reference_base ??
      (item as { referenciaBase?: unknown }).referenciaBase ??
      (item as { baseReferencia?: unknown }).baseReferencia;

    const referenceMonth = normalizeReferenceMonth(referenceBaseRaw);
    const ciclo =
      normalizeString(
        (item as { cicloFaturamento?: unknown; ciclo?: unknown; periodo?: unknown }).cicloFaturamento ??
          (item as { ciclo?: unknown }).ciclo ??
          (item as { periodo?: unknown }).periodo ??
          referenceMonth
      ) || referenceMonth;

    const rawCodigo =
      (item as { codigo?: unknown }).codigo ??
      (item as { codigoContrato?: unknown }).codigoContrato ??
      (item as { contract?: unknown }).contract ??
      id;
    const rawCliente =
      (item as { cliente?: unknown }).cliente ??
      (item as { client?: unknown }).client ??
      (item as { nomeCliente?: unknown }).nomeCliente ??
      'Cliente não informado';
    const rawSegmento = (item as { segmento?: unknown }).segmento ?? 'Não informado';
    const rawContato =
      (item as { contato?: unknown }).contato ??
      (item as { responsavel?: unknown }).responsavel ??
      (item as { contact?: unknown }).contact ??
      '';

    const contatoAtivoRaw =
      (item as { contact_active?: unknown }).contact_active ??
      (item as { contatoAtivo?: unknown }).contatoAtivo ??
      (item as { ativoContato?: unknown }).ativoContato;

    const contatoAtivo =
      typeof contatoAtivoRaw === 'boolean'
        ? contatoAtivoRaw
        : typeof contatoAtivoRaw === 'string'
        ? contatoAtivoRaw.toLowerCase() === 'true'
        : undefined;

    const supplier =
      normalizeString((item as { supplier?: unknown }).supplier ?? (item as { fornecedor?: unknown }).fornecedor) ||
      'Não informado';
    const meter = normalizeString((item as { meter?: unknown }).meter ?? (item as { medidor?: unknown }).medidor);
    const clientId = normalizeString(
      (item as { client_id?: unknown }).client_id ?? (item as { clienteId?: unknown }).clienteId
    );

    const rawPrice =
      (item as { price?: unknown }).price ??
      (item as { preco?: unknown }).preco ??
      (item as { precoMedio?: unknown }).precoMedio;
    const precoMedio = Number(rawPrice) || 0;
    const precoSpotReferencia =
      Number(
        (item as { precoSpotReferencia?: unknown; precoSpot?: unknown }).precoSpotReferencia ??
          (item as { precoSpot?: unknown }).precoSpot
      ) || 0;

    const inicioVigencia = normalizeIsoDate(
      (item as { inicioVigencia?: unknown; vigenciaInicio?: unknown }).inicioVigencia ??
        (item as { vigenciaInicio?: unknown }).vigenciaInicio ??
        referenceBaseRaw
    );
    const fimVigencia = normalizeIsoDate(
      (item as { fimVigencia?: unknown; vigenciaFim?: unknown }).fimVigencia ??
        (item as { vigenciaFim?: unknown }).vigenciaFim
    );

    const periodosBase = normalizePeriodos(
      (item as { periodos?: unknown }).periodos ??
        (item as { meses?: unknown }).meses ??
        (item as { ciclos?: unknown }).ciclos
    );
    const periodos = referenceMonth
      ? Array.from(new Set([...periodosBase, referenceMonth]))
      : periodosBase;

    const resumo = normalizeResumo(
      (item as { resumoConformidades?: unknown; conformidades?: unknown }).resumoConformidades ??
        (item as { conformidades?: unknown }).conformidades
    );

    const adjustedRaw =
      (item as { adjusted?: unknown }).adjusted ?? (item as { ajustado?: unknown }).ajustado;
    const adjusted =
      typeof adjustedRaw === 'boolean'
        ? adjustedRaw
        : typeof adjustedRaw === 'string'
        ? adjustedRaw.toLowerCase() === 'true'
        : undefined;

    if (adjusted !== undefined) {
      const resumoStatus: ContractMock['resumoConformidades']['Consumo'] = adjusted ? 'Conforme' : 'Em análise';
      resumo.Consumo = resumoStatus;
      resumo.Fatura = resumoStatus;
      resumo.Conformidade = resumoStatus;
    }

    const dadosContratoBase: ContractMock['dadosContrato'] = [
      ...normalizeContractData(
        (item as { dadosContrato?: unknown; dados?: unknown }).dadosContrato ??
          (item as { dados?: unknown }).dados
      ),
    ];

    const dadosContratoKeys = new Set(dadosContratoBase.map((field) => removeDiacritics(field.label)));
    const ensureField = (label: string, value: string) => {
      const normalizedLabel = removeDiacritics(label);
      const finalValue = normalizeString(value);
      if (!finalValue) return;
      if (!dadosContratoKeys.has(normalizedLabel)) {
        dadosContratoKeys.add(normalizedLabel);
        dadosContratoBase.push({ label, value: finalValue });
      }
    };

    ensureField('Fornecedor', supplier);
    ensureField('Medidor', meter || 'Não informado');
    ensureField('Preço (R$/MWh)', precoMedio ? formatCurrencyBRL(precoMedio) : 'Não informado');
    ensureField('Contrato', normalizeString(rawCodigo));
    ensureField('Cliente ID', clientId || 'Não informado');
    if (adjusted !== undefined) {
      ensureField('Ajustado', adjusted ? 'Sim' : 'Não');
    }
    if (referenceBaseRaw) {
      ensureField('Base de referência', normalizeIsoDate(referenceBaseRaw) || normalizeString(referenceBaseRaw));
    }

    const kpisBase: ContractMock['kpis'] = [
      ...normalizeKpis((item as { kpis?: unknown; indicadores?: unknown }).kpis ?? (item as { indicadores?: unknown }).indicadores),
    ];
    if (precoMedio) {
      kpisBase.push({ label: 'Preço contratado', value: formatCurrencyBRL(precoMedio) });
    }
    if (typeof contatoAtivo === 'boolean') {
      kpisBase.push({ label: 'Contato', value: contatoAtivo ? 'Ativo' : 'Inativo' });
    }

    const contatoFinal =
      normalizeString(rawContato) ||
      (typeof contatoAtivo === 'boolean' ? (contatoAtivo ? 'Contato ativo' : 'Contato inativo') : 'Não informado');

    const statusValor =
      typeof contatoAtivo === 'boolean'
        ? contatoAtivo
          ? 'Ativo'
          : 'Inativo'
        : normalizeContratoStatus((item as { status?: unknown }).status);

    return {
      id,
      codigo: normalizeString(rawCodigo),
      cliente: normalizeString(rawCliente),
      cnpj: normalizeString((item as { cnpj?: unknown }).cnpj),
      segmento: normalizeString(rawSegmento),
      contato: contatoFinal,
      status: statusValor,
      fonte: normalizeFonte((item as { fonte?: unknown }).fonte),
      modalidade: normalizeString((item as { modalidade?: unknown }).modalidade || 'Não informado'),
      inicioVigencia: inicioVigencia || normalizeString((item as { inicio?: unknown }).inicio),
      fimVigencia: fimVigencia,
      limiteSuperior: normalizeString((item as { limiteSuperior?: unknown }).limiteSuperior),
      limiteInferior: normalizeString((item as { limiteInferior?: unknown }).limiteInferior),
      flex: normalizeString((item as { flex?: unknown; flexibilidade?: unknown }).flex ?? (item as { flexibilidade?: unknown }).flexibilidade),
      precoMedio,
      precoSpotReferencia,
      cicloFaturamento: ciclo,
      periodos,
      resumoConformidades: resumo,
      kpis: kpisBase,
      dadosContrato: dadosContratoBase,
      historicoDemanda: normalizeHistoricoDemanda((item as { historicoDemanda?: unknown; demanda?: unknown }).historicoDemanda ?? (item as { demanda?: unknown }).demanda),
      historicoConsumo: normalizeHistoricoConsumo((item as { historicoConsumo?: unknown; consumo?: unknown }).historicoConsumo ?? (item as { consumo?: unknown }).consumo),
      obrigacoes: normalizeObrigacoes((item as { obrigacoes?: unknown }).obrigacoes),
      analises: normalizeAnalises((item as { analises?: unknown; analisesConformidade?: unknown }).analises ?? (item as { analisesConformidade?: unknown }).analisesConformidade),
      faturas: normalizeFaturas((item as { faturas?: unknown; invoices?: unknown }).faturas ?? (item as { invoices?: unknown }).invoices),
    } satisfies ContractMock;
  });
};

const buildEndpointCandidates = (rawUrl: string): string[] => {
  const normalized = normalizeString(rawUrl) || DEFAULT_API_URL;
  const sanitized = normalized.replace(/\s/g, '');
  if (!sanitized) return [DEFAULT_API_URL];
  const withoutTrailingSlash = sanitized.replace(/\/$/, '');
  const candidates = new Set<string>();
  candidates.add(withoutTrailingSlash);
  if (!/\/contracts(\b|\d|\/)/i.test(withoutTrailingSlash)) {
    candidates.add(`${withoutTrailingSlash}/contracts`);
  }
  return Array.from(candidates);
};

async function fetchContracts(signal?: AbortSignal): Promise<ContractMock[]> {
  const rawUrl = normalizeString(import.meta.env.VITE_CONTRACTS_API_URL);
  const endpoints = buildEndpointCandidates(rawUrl);
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      console.info(`[ContractsContext] Buscando contratos da API em ${endpoint} usando GET.`);
      const response = await fetch(endpoint, {
        method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        mode: 'cors',
        credentials: 'omit',
        signal,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar contratos (${response.status})`);
      }

      const data = await response.json();
      const contracts = normalizeContractsFromApi(data);
      if (!contracts.length) {
        console.warn('[ContractsContext] API retornou lista vazia de contratos.');
      }
      console.info(
        `[ContractsContext] Contratos carregados com sucesso: ${contracts.length} itens recebidos.`
      );
      return contracts;
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      lastError = error;
      console.error(
        `[ContractsContext] Erro ao buscar contratos em ${endpoint}.`,
        error instanceof Error ? error : new Error(String(error))
      );
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error(
          '[ContractsContext] Falha de rede ao buscar contratos. Possível problema de CORS ou indisponibilidade da API.'
        );
      }
      console.info('[ContractsContext] Tentando próximo endpoint disponível...');
    }
  }

  throw (lastError instanceof Error
    ? lastError
    : new Error('Erro desconhecido ao carregar contratos'));
}

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

function applyUpdate(contract: ContractMock, update: ContractUpdater | Partial<ContractMock>): ContractMock {
  if (typeof update === 'function') {
    return update(contract);
  }
  return {
    ...contract,
    ...update,
  };
}

function cloneContract(contract: ContractMock): ContractMock {
  return JSON.parse(JSON.stringify(contract)) as ContractMock;
}

export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = React.useState<ContractMock[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadContracts = React.useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        const apiContracts = await fetchContracts(signal);
        if (signal?.aborted) return;
        setContracts(apiContracts.map((contract) => cloneContract(contract)));
        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        console.error('[ContractsProvider] Falha ao buscar contratos da API, utilizando mocks.', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar contratos');
        setContracts(mockContracts.map((contract) => cloneContract(contract)));
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    const controller = new AbortController();
    loadContracts(controller.signal);
    return () => controller.abort();
  }, [loadContracts]);

  const refreshContracts = React.useCallback(async () => {
    await loadContracts();
  }, [loadContracts]);

  const addContract = React.useCallback((contract: ContractMock) => {
    setContracts((prev) => [cloneContract(contract), ...prev]);
  }, []);

  const updateContract = React.useCallback(
    (id: string, updater: ContractUpdater | Partial<ContractMock>) => {
      setContracts((prev) =>
        prev.map((contract) => (contract.id === id ? applyUpdate(contract, updater) : contract))
      );
    },
    []
  );

  const getContractById = React.useCallback(
    (id: string) => contracts.find((contract) => contract.id === id),
    [contracts]
  );

  const value = React.useMemo(
    () => ({
      contracts,
      isLoading,
      error,
      updateContract,
      getContractById,
      addContract,
      refreshContracts,
    }),
    [contracts, isLoading, error, updateContract, getContractById, addContract, refreshContracts]
  );

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const context = React.useContext(ContractsContext);
  if (!context) {
    throw new Error('useContracts must be used within ContractsProvider');
  }
  return context;
}
