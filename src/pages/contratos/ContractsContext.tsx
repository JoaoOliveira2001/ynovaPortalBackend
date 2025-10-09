import React from 'react';
import { ContractMock } from '../../mocks/contracts';
import { mockContracts } from '../../mocks/contracts';
import { isValidUuid } from '../../utils/uuid';

const DEFAULT_API_URL = 'https://b3767060a437.ngrok-free.app/contracts';

const runtimeEnv: Record<string, string | undefined> =
  ((typeof import.meta !== 'undefined'
    ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    : undefined) ??
    ((typeof globalThis !== 'undefined'
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } })
      : undefined)?.process?.env) ??
    {});

const resolveReadApiUrl = () => {
  const candidates = [
    runtimeEnv.VITE_CONTRACTS_API_URL,
    runtimeEnv.VITE_CONTRACTS_API,
    runtimeEnv.REACT_APP_CONTRACTS_API_URL,
    runtimeEnv.REACT_APP_CONTRACTS_API,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeString(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_API_URL;
};

const resolveWriteApiUrl = () => {
  const candidates = [
    runtimeEnv.VITE_CONTRACTS_API_WRITE_URL,
    runtimeEnv.VITE_CONTRACTS_API_URL,
    runtimeEnv.VITE_CONTRACTS_API,
    runtimeEnv.REACT_APP_CONTRACTS_API_URL,
    runtimeEnv.REACT_APP_CONTRACTS_API,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeString(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_API_URL;
};

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

const parsePercentInput = (value: unknown): number | null => {
  const text = normalizeString(value);
  if (!text) return null;
  const match = text.replace(/%/g, '').replace(/\s/g, '').replace(',', '.');
  if (!match) return null;
  const numeric = Number(match);
  if (!Number.isFinite(numeric)) return null;
  const normalized = Math.abs(numeric) > 1 ? numeric / 100 : numeric;
  return Number.isFinite(normalized) ? normalized : null;
};

const parseNumericInput = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = normalizeString(value).replace(/[^0-9,-.]/g, '').replace(',', '.');
  if (!text) return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
};

const toIsoDateTime = (value: unknown): string | undefined => {
  const normalized = normalizeIsoDate(value);
  if (!normalized) return undefined;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const normalizeResumoStatus = (value: unknown): StatusResumoValue => {
  const text = normalizeString(value).toLowerCase();
  if (!text) return 'Em análise';
  const sanitized = removeDiacritics(text);
  if (['conforme', 'compliant', 'ok'].includes(sanitized)) return 'Conforme';
  if (['divergente', 'inconforme', 'noncompliant', 'non-compliant', 'noncompliance'].includes(sanitized)) return 'Divergente';
  if (sanitized.includes('analise') || sanitized.includes('analysis') || sanitized.includes('review') || sanitized.includes('pending')) {
    return 'Em análise';
  }
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
  if (['ativo', 'ativos', 'active'].includes(text)) return 'Ativo';
  if (['inativo', 'inativos', 'inactive'].includes(text)) return 'Inativo';
  if (['pendente', 'pending'].includes(text)) return 'Ativo';
  return 'Ativo';
};

const normalizeFonte = (value: unknown): ContractMock['fonte'] => {
  const text = removeDiacritics(normalizeString(value));
  if (['incentivada', 'incentivadao', 'incentivada50', 'subsidized'].includes(text)) return 'Incentivada';
  if (['convencional', 'conventional'].includes(text)) return 'Convencional';
  if (['renovavel', 'renewable'].includes(text)) return 'Incentivada';
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
        return;
      }

      const sanitized = removeDiacritics(key);
      if (sanitized === 'compliance_consumption' || sanitized === 'consumo') {
        resumo.Consumo = normalizeResumoStatus(status);
      } else if (sanitized === 'compliance_nf' || sanitized === 'nf' || sanitized === 'nota_fiscal') {
        resumo.NF = normalizeResumoStatus(status);
      } else if (sanitized === 'compliance_invoice' || sanitized === 'fatura' || sanitized === 'invoice') {
        resumo.Fatura = normalizeResumoStatus(status);
      } else if (sanitized === 'compliance_charges' || sanitized === 'encargos' || sanitized === 'charges') {
        resumo.Encargos = normalizeResumoStatus(status);
      } else if (sanitized === 'compliance_overall' || sanitized === 'conformidade' || sanitized === 'overall') {
        resumo.Conformidade = normalizeResumoStatus(status);
      }
    });
  }

  return resumo;
};

const formatPercentValue = (value: unknown): string => {
  const numeric = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  if (!Number.isFinite(numeric)) {
    const text = normalizeString(value);
    if (!text) return '';
    return text.includes('%') ? text : `${text}%`;
  }

  const ratio = Math.abs(numeric) <= 1 ? numeric : numeric / 100;
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      maximumFractionDigits: 2,
    }).format(ratio);
  } catch {
    return `${(ratio * 100).toFixed(2)}%`;
  }
};

const formatMwhValue = (value: unknown): string => {
  const numeric = Number(typeof value === 'string' ? value.replace(',', '.') : value);
  if (Number.isFinite(numeric)) {
    return `${numeric.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MWh`;
  }
  const text = normalizeString(value);
  if (!text) return '';
  return /mwh/i.test(text) ? text : `${text} MWh`;
};

const normalizeFieldLabel = (label: string): string => {
  const text = normalizeString(label);
  if (!text) return '';
  const sanitized = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ');
  return sanitized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
      .map(([label, val]) => ({ label: normalizeFieldLabel(label) || normalizeString(label), value: normalizeString(val) }))
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
      (item as { baseReferencia?: unknown }).baseReferencia ??
      (item as { billing_cycle?: unknown }).billing_cycle;

    const referenceMonth = normalizeReferenceMonth(referenceBaseRaw);
    const ciclo =
      normalizeString(
        (item as { cicloFaturamento?: unknown; ciclo?: unknown; periodo?: unknown }).cicloFaturamento ??
          (item as { ciclo?: unknown }).ciclo ??
          (item as { periodo?: unknown }).periodo ??
          (item as { billing_cycle?: unknown }).billing_cycle ??
          referenceMonth
      ) || referenceMonth;

    const rawCodigo =
      (item as { codigo?: unknown }).codigo ??
      (item as { codigoContrato?: unknown }).codigoContrato ??
      (item as { contract?: unknown }).contract ??
      (item as { contract_code?: unknown }).contract_code ??
      id;
    const rawCliente =
      (item as { cliente?: unknown }).cliente ??
      (item as { client?: unknown }).client ??
      (item as { nomeCliente?: unknown }).nomeCliente ??
      (item as { client_name?: unknown }).client_name ??
      'Cliente não informado';
    const rawSegmento =
      (item as { segmento?: unknown }).segmento ?? (item as { segment?: unknown }).segment ?? 'Não informado';
    const rawContato =
      (item as { contato?: unknown }).contato ??
      (item as { responsavel?: unknown }).responsavel ??
      (item as { contact?: unknown }).contact ??
      (item as { contact_responsible?: unknown }).contact_responsible ??
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
      normalizeString(
        (item as { supplier?: unknown }).supplier ??
          (item as { fornecedor?: unknown }).fornecedor ??
          (item as { supplier_name?: unknown }).supplier_name
      ) ||
      'Não informado';
    const meter = normalizeString((item as { meter?: unknown }).meter ?? (item as { medidor?: unknown }).medidor);
    const clientId = normalizeString(
      (item as { client_id?: unknown }).client_id ??
        (item as { clienteId?: unknown }).clienteId ??
        (item as { clientId?: unknown }).clientId
    );

    const rawPrice =
      (item as { price?: unknown }).price ??
      (item as { preco?: unknown }).preco ??
      (item as { precoMedio?: unknown }).precoMedio ??
      (item as { average_price_mwh?: unknown }).average_price_mwh;
    const precoMedio = Number(rawPrice) || 0;
    const precoSpotReferencia =
      Number(
        (item as { precoSpotReferencia?: unknown; precoSpot?: unknown }).precoSpotReferencia ??
          (item as { precoSpot?: unknown }).precoSpot ??
          (item as { spot_price_ref_mwh?: unknown }).spot_price_ref_mwh
      ) || 0;

    const inicioVigencia = normalizeIsoDate(
      (item as { inicioVigencia?: unknown; vigenciaInicio?: unknown }).inicioVigencia ??
        (item as { vigenciaInicio?: unknown }).vigenciaInicio ??
        (item as { start_date?: unknown }).start_date ??
        referenceBaseRaw
    );
    const fimVigencia = normalizeIsoDate(
      (item as { fimVigencia?: unknown; vigenciaFim?: unknown }).fimVigencia ??
        (item as { vigenciaFim?: unknown }).vigenciaFim ??
        (item as { end_date?: unknown }).end_date
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
        (item as { conformidades?: unknown }).conformidades ??
        {
          Consumo: (item as { compliance_consumption?: unknown }).compliance_consumption,
          NF: (item as { compliance_nf?: unknown }).compliance_nf,
          Fatura: (item as { compliance_invoice?: unknown }).compliance_invoice,
          Encargos: (item as { compliance_charges?: unknown }).compliance_charges,
          Conformidade: (item as { compliance_overall?: unknown }).compliance_overall,
        }
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

    const contractedVolume =
      (item as { energiaContratada?: unknown }).energiaContratada ??
      (item as { contracted_volume_mwh?: unknown }).contracted_volume_mwh;
    const flexValue =
      (item as { flex?: unknown; flexibilidade?: unknown }).flex ??
      (item as { flexibilidade?: unknown }).flexibilidade ??
      (item as { flexibility_percent?: unknown }).flexibility_percent;
    const upperLimitRaw =
      (item as { limiteSuperior?: unknown }).limiteSuperior ??
      (item as { upper_limit_percent?: unknown }).upper_limit_percent;
    const lowerLimitRaw =
      (item as { limiteInferior?: unknown }).limiteInferior ??
      (item as { lower_limit_percent?: unknown }).lower_limit_percent;

    ensureField('Fornecedor', supplier);
    ensureField('Medidor', meter || 'Não informado');
    ensureField('Preço (R$/MWh)', precoMedio ? formatCurrencyBRL(precoMedio) : 'Não informado');
    ensureField('Preço Spot Ref. (R$/MWh)', precoSpotReferencia ? formatCurrencyBRL(precoSpotReferencia) : 'Não informado');
    ensureField('Contrato', normalizeString(rawCodigo));
    ensureField('Cliente ID', clientId || 'Não informado');
    ensureField('Volume contratado', formatMwhValue(contractedVolume));
    ensureField(
      'Flex / Limites',
      [formatPercentValue(flexValue), formatPercentValue(lowerLimitRaw), formatPercentValue(upperLimitRaw)]
        .filter(Boolean)
        .join(' · ')
    );
    ensureField('Ciclo de faturamento', normalizeString(ciclo) || 'Não informado');
    if (adjusted !== undefined) {
      ensureField('Ajustado', adjusted ? 'Sim' : 'Não');
    }
    if (referenceBaseRaw) {
      ensureField('Base de referência', normalizeIsoDate(referenceBaseRaw) || normalizeString(referenceBaseRaw));
    }
    ensureField('Início da vigência', inicioVigencia);
    ensureField('Fim da vigência', fimVigencia);
    ensureField('Criado em', normalizeIsoDate((item as { created_at?: unknown }).created_at));
    ensureField('Atualizado em', normalizeIsoDate((item as { updated_at?: unknown }).updated_at));

    const kpisBase: ContractMock['kpis'] = [
      ...normalizeKpis((item as { kpis?: unknown; indicadores?: unknown }).kpis ?? (item as { indicadores?: unknown }).indicadores),
    ];
    if (precoMedio) {
      kpisBase.push({ label: 'Preço contratado', value: formatCurrencyBRL(precoMedio) });
    }
    if (contractedVolume) {
      kpisBase.push({ label: 'Volume contratado', value: formatMwhValue(contractedVolume) });
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
      fonte: normalizeFonte((item as { fonte?: unknown }).fonte ?? (item as { energy_source?: unknown }).energy_source),
      modalidade:
        normalizeString(
          (item as { modalidade?: unknown }).modalidade ?? (item as { contracted_modality?: unknown }).contracted_modality
        ) || 'Não informado',
      inicioVigencia: inicioVigencia || normalizeString((item as { inicio?: unknown }).inicio),
      fimVigencia: fimVigencia,
      limiteSuperior: formatPercentValue(
        (item as { limiteSuperior?: unknown }).limiteSuperior ?? (item as { upper_limit_percent?: unknown }).upper_limit_percent
      ),
      limiteInferior: formatPercentValue(
        (item as { limiteInferior?: unknown }).limiteInferior ?? (item as { lower_limit_percent?: unknown }).lower_limit_percent
      ),
      flex: formatPercentValue(
        (item as { flex?: unknown; flexibilidade?: unknown }).flex ??
          (item as { flexibilidade?: unknown }).flexibilidade ??
          (item as { flexibility_percent?: unknown }).flexibility_percent
      ),
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

const buildResourceEndpointCandidates = (rawUrl: string, resourceId: string): string[] => {
  const sanitizedId = encodeURIComponent(resourceId);
  return buildEndpointCandidates(rawUrl).map((endpoint) => `${endpoint.replace(/\/$/, '')}/${sanitizedId}`);
};

const baseHeaders = {
  Accept: 'application/json',
  'ngrok-skip-browser-warning': 'true',
} as const;

const contractToApiPayload = (contract: ContractMock): Record<string, unknown> => {
  const findDadosValue = (keywords: string[]): string | undefined => {
    const match = contract.dadosContrato.find((item) => {
      const normalized = removeDiacritics(item.label);
      return keywords.some((keyword) => normalized.includes(keyword));
    });
    return match ? normalizeString(match.value) : undefined;
  };

  const supplier = findDadosValue(['fornecedor', 'supplier']);
  const rawGroupName = findDadosValue(['grupo', 'group']);
  const volumeField =
    contract.dadosContrato.find((item) => /volume/i.test(item.label))?.value ?? contract.flex;
  const contractedVolume = parseNumericInput(volumeField);
  const normalizedGroupName = normalizeString(rawGroupName);
  const resolvedGroupName = normalizedGroupName || 'default';
  const rawClientId = normalizeString(contract.id);

  const payload: Record<string, unknown> = {
    client_name: normalizeString(contract.cliente),
    groupName: resolvedGroupName,
    supplier: supplier || undefined,
    cnpj: normalizeString(contract.cnpj),
    segment: normalizeString(contract.segmento),
    contact_responsible: normalizeString(contract.contato),
    contracted_volume_mwh: contractedVolume ?? undefined,
    status: normalizeString(contract.status),
    energy_source: normalizeString(contract.fonte),
    contracted_modality: normalizeString(contract.modalidade),
    start_date: toIsoDateTime(contract.inicioVigencia),
    end_date: toIsoDateTime(contract.fimVigencia),
    billing_cycle: normalizeString(contract.cicloFaturamento),
    upper_limit_percent: parsePercentInput(contract.limiteSuperior),
    lower_limit_percent: parsePercentInput(contract.limiteInferior),
    flexibility_percent: parsePercentInput(contract.flex),
    average_price_mwh: parseNumericInput(contract.precoMedio) ?? contract.precoMedio,
    spot_price_ref_mwh: parseNumericInput(contract.precoSpotReferencia) ?? contract.precoSpotReferencia,
    compliance_consumption: normalizeString(contract.resumoConformidades.Consumo) || undefined,
    compliance_nf: normalizeString(contract.resumoConformidades.NF) || undefined,
    compliance_invoice: normalizeString(contract.resumoConformidades.Fatura) || undefined,
    compliance_charges: normalizeString(contract.resumoConformidades.Encargos) || undefined,
    compliance_overall: normalizeString(contract.resumoConformidades.Conformidade) || undefined,
    contact_active: Boolean(normalizeString(contract.contato)),
    adjusted: parsePercentInput(contract.flex) ? true : undefined,
    price: parseNumericInput(contract.precoMedio) ?? contract.precoMedio,
  };

  if (rawClientId && isValidUuid(rawClientId)) {
    payload.client_id = rawClientId;
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
};

const buildDeletePayload = (contract: ContractMock): Record<string, unknown> => ({
  client: normalizeString(contract.cliente) || contract.id,
  price: parseNumericInput(contract.precoMedio) ?? contract.precoMedio ?? 0,
  adjusted: Boolean(parsePercentInput(contract.flex)),
  contact_active: Boolean(normalizeString(contract.contato)),
});

const requestContractApi = async (
  endpoints: string[],
  method: 'POST' | 'PUT' | 'DELETE',
  payload?: Record<string, unknown>
): Promise<unknown> => {
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          ...baseHeaders,
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(message || `${method} ${endpoint} falhou com status ${response.status}`);
      }

      const text = await response.text().catch(() => '');
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('[ContractsContext] Falha ao interpretar resposta da API.', parseError);
        return null;
      }
    } catch (error) {
      lastError = error;
      console.error(`[ContractsContext] Falha ao executar ${method} em ${endpoint}.`, error);
    }
  }

  throw (lastError instanceof Error ? lastError : new Error('Falha na requisição da API de contratos.'));
};

const createContractInApi = async (contract: ContractMock): Promise<ContractMock> => {
  const payload = contractToApiPayload(contract);
  const endpoints = buildEndpointCandidates(resolveWriteApiUrl());
  const response = await requestContractApi(endpoints, 'POST', payload);
  if (!response) {
    return contract;
  }
  const normalized = normalizeContractsFromApi({ contracts: Array.isArray(response) ? response : [response] });
  return normalized[0] ?? contract;
};

const updateContractInApi = async (contract: ContractMock): Promise<ContractMock> => {
  const payload = contractToApiPayload(contract);
  const id = normalizeString(contract.id);
  const baseUrl = resolveWriteApiUrl();
  const endpoints = id ? buildResourceEndpointCandidates(baseUrl, id) : buildEndpointCandidates(baseUrl);
  const response = await requestContractApi(endpoints, 'PUT', payload);
  if (!response) {
    return contract;
  }
  const normalized = normalizeContractsFromApi({ contracts: Array.isArray(response) ? response : [response] });
  return normalized.find((item) => item.id === contract.id) ?? normalized[0] ?? contract;
};

const deleteContractInApi = async (contract: ContractMock): Promise<void> => {
  const id = normalizeString(contract.id);
  const baseUrl = resolveWriteApiUrl();
  const endpoints = [
    ...(id ? buildResourceEndpointCandidates(baseUrl, id) : []),
    ...buildEndpointCandidates(baseUrl),
  ];
  await requestContractApi(endpoints, 'DELETE', buildDeletePayload(contract));
};

async function fetchContracts(signal?: AbortSignal): Promise<ContractMock[]> {
  const rawUrl = resolveReadApiUrl();
  const endpoints = buildEndpointCandidates(rawUrl);
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      console.info(`[ContractsContext] Buscando contratos da API em ${endpoint} usando GET.`);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar contratos erro aqui (${response.status})`);
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
  updateContract: (
    id: string,
    updater: ContractUpdater | Partial<ContractMock>
  ) => Promise<ContractMock | undefined>;
  getContractById: (id: string) => ContractMock | undefined;
  addContract: (contract: ContractMock) => Promise<ContractMock>;
  deleteContract: (id: string) => Promise<void>;
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

  const addContract = React.useCallback(async (contract: ContractMock) => {
    const draft = cloneContract(contract);
    try {
      const saved = await createContractInApi(draft);
      setContracts((prev) => [cloneContract(saved), ...prev.filter((item) => item.id !== saved.id)]);
      setError(null);
      return saved;
    } catch (apiError) {
      console.error('[ContractsProvider] Falha ao criar contrato na API.', apiError);
      const message =
        apiError instanceof Error ? apiError.message : 'Erro desconhecido ao criar contrato na API';
      setError(message);
      throw apiError instanceof Error ? apiError : new Error(message);
    }
  }, []);

  const updateContract = React.useCallback(
    async (id: string, updater: ContractUpdater | Partial<ContractMock>) => {
      const current = contracts.find((contract) => contract.id === id);
      if (!current) return undefined;

      const updated = applyUpdate(current, updater);
      setContracts((prev) =>
        prev.map((contract) => (contract.id === id ? cloneContract(updated) : contract))
      );

      try {
        const saved = await updateContractInApi(updated);
        setContracts((prev) =>
          prev.map((contract) => (contract.id === saved.id ? cloneContract(saved) : contract))
        );
        setError(null);
        return saved;
      } catch (apiError) {
        console.error('[ContractsProvider] Falha ao atualizar contrato na API.', apiError);
        const message =
          apiError instanceof Error ? apiError.message : 'Erro desconhecido ao atualizar contrato na API';
        setError(message);
        setContracts((prev) =>
          prev.map((contract) => (contract.id === current.id ? cloneContract(current) : contract))
        );
        throw apiError instanceof Error ? apiError : new Error(message);
      }
    },
    [contracts]
  );

  const deleteContract = React.useCallback(
    async (id: string) => {
      const current = contracts.find((contract) => contract.id === id);
      if (!current) return;

      setContracts((prev) => prev.filter((contract) => contract.id !== id));

      try {
        await deleteContractInApi(current);
        setError(null);
      } catch (apiError) {
        console.error('[ContractsProvider] Falha ao excluir contrato na API.', apiError);
        const message =
          apiError instanceof Error ? apiError.message : 'Erro desconhecido ao excluir contrato na API';
        setError(message);
        setContracts((prev) => {
          if (prev.some((contract) => contract.id === current.id)) {
            return prev;
          }
          return [cloneContract(current), ...prev];
        });
        throw apiError instanceof Error ? apiError : new Error(message);
      }
    },
    [contracts]
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
      deleteContract,
      refreshContracts,
    }),
    [
      contracts,
      isLoading,
      error,
      updateContract,
      getContractById,
      addContract,
      deleteContract,
      refreshContracts,
    ]
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
