import React from 'react';
import { X, Plus, Trash2, UploadCloud } from 'lucide-react';
import {
  type ContractInvoiceStatus,
  type ContractMock,
  type StatusResumo,
  type AnaliseArea,
  obrigacaoColunas,
  formatMesLabel,
} from '../../mocks/contracts';

const resumoStatusOptions: StatusResumo[] = ['Conforme', 'Em análise', 'Divergente'];
const invoiceStatusOptions: ContractInvoiceStatus[] = ['Paga', 'Em aberto', 'Em análise'];

type InvoiceFormState = {
  id: string;
  competencia: string;
  vencimento: string;
  valor: string;
  status: ContractInvoiceStatus;
  arquivo?: string;
};

type FormState = {
  cliente: string;
  cnpj: string;
  segmento: string;
  contato: string;
  status: ContractMock['status'];
  fonte: ContractMock['fonte'];
  modalidade: string;
  inicioVigencia: string;
  fimVigencia: string;
  limiteSuperior: string;
  limiteInferior: string;
  flex: string;
  precoMedio: string;
  precoSpotReferencia: string;
  cicloFaturamento: string;
  volumeContratado: string;
  resumoConformidades: ContractMock['resumoConformidades'];
  faturas: InvoiceFormState[];
};

type CreateContractModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (contract: ContractMock) => void;
};

function buildInvoiceState(): InvoiceFormState {
  const now = new Date();
  const competencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomId =
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return {
    id: `invoice-${randomId}`,
    competencia,
    vencimento: '',
    valor: '',
    status: 'Em aberto',
  };
}

function buildInitialFormState(): FormState {
  return {
    cliente: '',
    cnpj: '',
    segmento: '',
    contato: '',
    status: 'Ativo',
    fonte: 'Convencional',
    modalidade: '',
    inicioVigencia: '',
    fimVigencia: '',
    limiteSuperior: '105%',
    limiteInferior: '95%',
    flex: '5%',
    precoMedio: '',
    precoSpotReferencia: '',
    cicloFaturamento: '',
    volumeContratado: '',
    resumoConformidades: {
      Consumo: 'Em análise',
      NF: 'Em análise',
      Fatura: 'Em análise',
      Encargos: 'Em análise',
      Conformidade: 'Em análise',
    },
    faturas: [buildInvoiceState()],
  };
}

function formatCurrencyInput(value: string) {
  if (!value) return 'R$ 0,00';
  const parsed = Number(value.replace(',', '.'));
  if (Number.isNaN(parsed)) return 'R$ 0,00';
  return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getReferenceMonths(base: string, total = 6) {
  const months: string[] = [];
  const reference = base ? new Date(`${base}-01T00:00:00`) : new Date();
  reference.setDate(1);
  for (let i = total - 1; i >= 0; i -= 1) {
    const current = new Date(reference);
    current.setMonth(reference.getMonth() - i);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  return months;
}

function buildAnalises(): AnaliseArea[] {
  return [
    {
      area: 'Dados Cadastrais',
      etapas: [
        { nome: 'Dados', status: 'amarelo' },
        { nome: 'Cálculo', status: 'amarelo' },
        { nome: 'Análise', status: 'amarelo' },
      ],
    },
    {
      area: 'Faturamento',
      etapas: [
        { nome: 'Dados', status: 'amarelo' },
        { nome: 'Cálculo', status: 'amarelo' },
        { nome: 'Análise', status: 'amarelo' },
      ],
    },
    {
      area: 'Riscos & Projeções',
      etapas: [
        { nome: 'Dados', status: 'amarelo' },
        { nome: 'Cálculo', status: 'amarelo' },
        { nome: 'Análise', status: 'amarelo' },
      ],
    },
    {
      area: 'Conformidade',
      etapas: [
        { nome: 'Dados', status: 'amarelo' },
        { nome: 'Cálculo', status: 'amarelo' },
        { nome: 'Análise', status: 'amarelo' },
      ],
    },
  ];
}

function ensureId(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : `CT-${Date.now()}`;
}

export default function CreateContractModal({ open, onClose, onCreate }: CreateContractModalProps) {
  const [formState, setFormState] = React.useState<FormState>(() => buildInitialFormState());
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) {
      setFormState(buildInitialFormState());
      setErrors({});
    }
  }, [open]);

  const handleInputChange = (
    field: keyof FormState,
    formatter?: (value: string) => string
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = formatter ? formatter(event.target.value) : event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleResumoChange = (chave: keyof ContractMock['resumoConformidades']) =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as StatusResumo;
      setFormState((prev) => ({
        ...prev,
        resumoConformidades: {
          ...prev.resumoConformidades,
          [chave]: value,
        },
      }));
    };

  const handleFaturaChange = (
    index: number,
    field: keyof InvoiceFormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value =
      field === 'arquivo' && event.target instanceof HTMLInputElement && event.target.files?.[0]
        ? event.target.files[0].name
        : event.target.value;
    setFormState((prev) => {
      const faturas = prev.faturas.map((fatura, idx) =>
        idx === index
          ? {
              ...fatura,
              [field]: field === 'status' ? (value as ContractInvoiceStatus) : value,
            }
          : fatura
      );
      return { ...prev, faturas };
    });
  };

  const handleAddFatura = () => {
    setFormState((prev) => ({
      ...prev,
      faturas: [...prev.faturas, buildInvoiceState()],
    }));
  };

  const handleRemoveFatura = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      faturas: prev.faturas.filter((fatura) => fatura.id !== id),
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.cliente.trim()) nextErrors.cliente = 'Informe o cliente';
    if (!formState.cnpj.trim()) nextErrors.cnpj = 'Informe o CNPJ';
    if (!formState.cicloFaturamento.trim()) nextErrors.cicloFaturamento = 'Informe o ciclo de faturamento';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const id = ensureId();
    const months = getReferenceMonths(formState.cicloFaturamento || undefined);
    const periodos = Array.from(new Set([formState.cicloFaturamento, ...months].filter(Boolean))) as string[];

    const defaultStatus = obrigacaoColunas.slice(1).reduce<Record<string, StatusResumo>>((acc, col) => {
      acc[col] = 'Em análise';
      return acc;
    }, {} as Record<string, StatusResumo>);

    const historicoDemanda = months.map((mes, index) => ({
      mes,
      ponta: 0 + index * 5,
      foraPonta: 0 + index * 4,
    }));

    const historicoConsumo = months.map((mes, index) => ({
      mes,
      meta: Number(formState.volumeContratado) || 0,
      realizado: Math.max(0, (Number(formState.volumeContratado) || 0) - index * 25),
    }));

    const dadosContrato = [
      { label: 'Cliente', value: formState.cliente.trim() },
      { label: 'Segmento', value: formState.segmento.trim() || 'Não informado' },
      { label: 'Modalidade', value: formState.modalidade.trim() || 'Não informado' },
      { label: 'Fonte', value: formState.fonte },
      {
        label: 'Vigência',
        value:
          formState.inicioVigencia && formState.fimVigencia
            ? `${formatMesLabel(formState.inicioVigencia.slice(0, 7))} - ${formatMesLabel(
                formState.fimVigencia.slice(0, 7)
              )}`
            : 'Não informado',
      },
      {
        label: 'Flex / Limites',
        value: `${formState.flex || 'N/I'} (${formState.limiteInferior || 'N/I'} - ${formState.limiteSuperior || 'N/I'})`,
      },
      {
        label: 'Preço Médio',
        value: formatCurrencyInput(formState.precoMedio),
      },
      {
        label: 'Preço Spot Ref.',
        value: formatCurrencyInput(formState.precoSpotReferencia),
      },
      {
        label: 'Volume Contratado',
        value: formState.volumeContratado ? `${formState.volumeContratado} MWh/mês` : 'Não informado',
      },
      {
        label: 'Responsável',
        value: formState.contato.trim() || 'Não informado',
      },
    ];

    const faturas = formState.faturas
      .filter((fatura) => fatura.competencia || fatura.vencimento || fatura.valor)
      .map((fatura) => ({
        id: fatura.id,
        competencia: fatura.competencia || formState.cicloFaturamento,
        vencimento: fatura.vencimento,
        valor: Number(fatura.valor.replace(',', '.')) || 0,
        status: fatura.status,
        arquivo: fatura.arquivo,
      }));

    const newContract: ContractMock = {
      id,
      codigo: id,
      cliente: formState.cliente.trim(),
      cnpj: formState.cnpj.trim(),
      segmento: formState.segmento.trim() || 'Não informado',
      contato: formState.contato.trim() || 'Não informado',
      status: formState.status,
      fonte: formState.fonte,
      modalidade: formState.modalidade.trim() || 'Não informado',
      inicioVigencia: formState.inicioVigencia || '',
      fimVigencia: formState.fimVigencia || '',
      limiteSuperior: formState.limiteSuperior || 'N/I',
      limiteInferior: formState.limiteInferior || 'N/I',
      flex: formState.flex || 'N/I',
      precoMedio: Number(formState.precoMedio.replace(',', '.')) || 0,
      precoSpotReferencia: Number(formState.precoSpotReferencia.replace(',', '.')) || 0,
      cicloFaturamento: formState.cicloFaturamento,
      periodos,
      resumoConformidades: { ...formState.resumoConformidades },
      kpis: [
        { label: 'Consumo acumulado', value: '0 MWh', helper: 'Contrato recém-criado' },
        { label: 'Receita Prevista', value: 'R$ 0,00' },
        { label: 'Economia vs Cativo', value: 'R$ 0,00' },
        { label: 'Variação mensal', value: '0%' },
      ],
      dadosContrato,
      historicoDemanda,
      historicoConsumo,
      obrigacoes: months.map((mes) => ({
        periodo: formatMesLabel(mes),
        status: { ...defaultStatus },
      })),
      analises: buildAnalises(),
      faturas,
    };

    onCreate(newContract);
    setFormState(buildInitialFormState());
    setErrors({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div
        className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Criar contrato manualmente</h2>
            <p className="text-sm text-gray-500">
              Cadastre um novo contrato e inclua os dados de faturamento recebidos manualmente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar modal de criação de contrato"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <section aria-labelledby="dados-principais" className="space-y-4">
              <div>
                <h3 id="dados-principais" className="text-base font-semibold text-gray-900">
                  Dados principais
                </h3>
                <p className="text-sm text-gray-500">
                  Defina informações de identificação e vigência do contrato manual.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Cliente
                  <input
                    type="text"
                    value={formState.cliente}
                    onChange={handleInputChange('cliente')}
                    className={`rounded-lg border px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40 ${
                      errors.cliente ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="Nome do cliente"
                  />
                  {errors.cliente && <span className="text-xs font-medium text-red-500">{errors.cliente}</span>}
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  CNPJ
                  <input
                    type="text"
                    value={formState.cnpj}
                    onChange={handleInputChange('cnpj')}
                    className={`rounded-lg border px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40 ${
                      errors.cnpj ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="00.000.000/0000-00"
                  />
                  {errors.cnpj && <span className="text-xs font-medium text-red-500">{errors.cnpj}</span>}
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Segmento
                  <input
                    type="text"
                    value={formState.segmento}
                    onChange={handleInputChange('segmento')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: Indústria"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Contato responsável
                  <input
                    type="text"
                    value={formState.contato}
                    onChange={handleInputChange('contato')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Nome completo"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Volume contratado (MWh/mês)
                  <input
                    type="number"
                    min="0"
                    value={formState.volumeContratado}
                    onChange={handleInputChange('volumeContratado')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: 3200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Status
                  <select
                    value={formState.status}
                    onChange={handleInputChange('status')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Fonte de energia
                  <select
                    value={formState.fonte}
                    onChange={handleInputChange('fonte')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                  >
                    <option value="Convencional">Convencional</option>
                    <option value="Incentivada">Incentivada</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Modalidade contratada
                  <input
                    type="text"
                    value={formState.modalidade}
                    onChange={handleInputChange('modalidade')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: Preço Fixo"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Início da vigência
                  <input
                    type="date"
                    value={formState.inicioVigencia}
                    onChange={handleInputChange('inicioVigencia')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Fim da vigência
                  <input
                    type="date"
                    value={formState.fimVigencia}
                    onChange={handleInputChange('fimVigencia')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Ciclo de faturamento
                  <input
                    type="month"
                    value={formState.cicloFaturamento}
                    onChange={handleInputChange('cicloFaturamento')}
                    className={`rounded-lg border px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40 ${
                      errors.cicloFaturamento ? 'border-red-400' : 'border-gray-200'
                    }`}
                    aria-label="Selecionar ciclo de faturamento"
                  />
                  {errors.cicloFaturamento && (
                    <span className="text-xs font-medium text-red-500">{errors.cicloFaturamento}</span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Limite superior
                  <input
                    type="text"
                    value={formState.limiteSuperior}
                    onChange={handleInputChange('limiteSuperior')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: 105%"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Limite inferior
                  <input
                    type="text"
                    value={formState.limiteInferior}
                    onChange={handleInputChange('limiteInferior')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: 95%"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Flexibilidade
                  <input
                    type="text"
                    value={formState.flex}
                    onChange={handleInputChange('flex')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: 5%"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Preço médio (R$ / MWh)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.precoMedio}
                    onChange={handleInputChange('precoMedio')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: 275,50"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Preço spot de referência (R$ / MWh)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.precoSpotReferencia}
                    onChange={handleInputChange('precoSpotReferencia')}
                    className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                    placeholder="Ex: 310,00"
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="resumo-conformidades" className="space-y-4">
              <div>
                <h3 id="resumo-conformidades" className="text-base font-semibold text-gray-900">
                  Resumo de conformidades
                </h3>
                <p className="text-sm text-gray-500">
                  Ajuste o status inicial dos principais indicadores de conformidade do contrato.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(formState.resumoConformidades) as Array<keyof ContractMock['resumoConformidades']>).map(
                  (chave) => (
                    <label key={chave} className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      {chave}
                      <select
                        value={formState.resumoConformidades[chave]}
                        onChange={handleResumoChange(chave)}
                        className="rounded-lg border border-gray-200 px-3 py-2 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                      >
                        {resumoStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                )}
              </div>
            </section>

            <section aria-labelledby="faturas-manual" className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 id="faturas-manual" className="text-base font-semibold text-gray-900">
                    Faturas enviadas manualmente
                  </h3>
                  <p className="text-sm text-gray-500">
                    Adicione as faturas recebidas por e-mail ou upload para manter o histórico completo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFatura}
                  className="inline-flex items-center gap-2 rounded-lg border border-yn-orange px-3 py-2 text-sm font-medium text-yn-orange shadow-sm transition hover:bg-yn-orange hover:text-white"
                >
                  <Plus size={16} /> Adicionar fatura
                </button>
              </div>
              <div className="space-y-3">
                {formState.faturas.map((fatura, index) => (
                  <div key={fatura.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                          Competência (YYYY-MM)
                          <input
                            type="month"
                            value={fatura.competencia}
                            onChange={handleFaturaChange(index, 'competencia')}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                          Vencimento
                          <input
                            type="date"
                            value={fatura.vencimento}
                            onChange={handleFaturaChange(index, 'vencimento')}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                          Valor (R$)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fatura.valor}
                            onChange={handleFaturaChange(index, 'valor')}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                          Status
                          <select
                            value={fatura.status}
                            onChange={handleFaturaChange(index, 'status')}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-yn-orange focus:outline-none focus:ring-2 focus:ring-yn-orange/40"
                          >
                            {invoiceStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-gray-600 md:col-span-2">
                          Comprovante / arquivo
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition hover:border-yn-orange hover:text-yn-orange">
                              <UploadCloud size={16} />
                              <span>Selecionar arquivo</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={handleFaturaChange(index, 'arquivo')}
                              />
                            </label>
                            {fatura.arquivo ? (
                              <span className="text-xs text-gray-600">{fatura.arquivo}</span>
                            ) : (
                              <span className="text-xs text-gray-400">Nenhum arquivo selecionado</span>
                            )}
                          </div>
                        </label>
                      </div>
                      {formState.faturas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFatura(fatura.id)}
                          className="inline-flex items-center gap-2 self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50"
                        >
                          <Trash2 size={16} /> Remover
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-yn-orange hover:text-yn-orange"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-yn-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Salvar contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

