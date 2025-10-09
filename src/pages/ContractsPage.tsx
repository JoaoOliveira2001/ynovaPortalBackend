import React, { useEffect, useMemo, useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { Contract, createContract } from '../services/contracts';

type FormState = {
  client_name: string;
  cnpj: string;
  segment: string;
  contact_responsible: string;
  contracted_volume_mwh: string;
  status: string;
  energy_source: string;
  contracted_modality: string;
  start_date: string;
  end_date: string;
  billing_cycle: string;
  groupName: string;
};

const initialFormState: FormState = {
  client_name: '',
  cnpj: '',
  segment: '',
  contact_responsible: '',
  contracted_volume_mwh: '',
  status: '',
  energy_source: '',
  contracted_modality: '',
  start_date: '',
  end_date: '',
  billing_cycle: '',
  groupName: '',
};

function ensureIsoDate(value: string) {
  if (!value) return value;
  if (value.includes('T')) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function toCsv(rows: Contract[]) {
  const headers = [
    'ID',
    'Contract Code',
    'Client Name',
    'CNPJ',
    'Segment',
    'Contact Responsible',
    'Contracted Volume (MWh)',
    'Status',
    'Energy Source',
    'Contracted Modality',
    'Billing Cycle',
    'Start Date',
    'End Date',
  ];
  const lines = rows.map((row) => [
    row.id,
    row.contract_code,
    row.client_name,
    row.cnpj,
    row.segment,
    row.contact_responsible,
    row.contracted_volume_mwh ?? '',
    row.status,
    row.energy_source,
    row.contracted_modality,
    row.billing_cycle,
    row.start_date,
    row.end_date,
  ].join(','));
  return [headers.join(','), ...lines].join('\n');
}

export default function ContractsPage() {
  const {
    contracts,
    loading,
    error: contractsError,
    setContracts,
  } = useContracts();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredContracts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const cnpjFilter = cnpj.replace(/[^0-9]/g, '');
    const statusFilter = status.trim().toLowerCase();
    const startDateFilter = startDate ? new Date(`${startDate}-01T00:00:00Z`) : null;
    const endDateFilter = endDate ? new Date(`${endDate}-01T00:00:00Z`) : null;

    return contracts.filter((contract) => {
      const normalizedCnpj = contract.cnpj.replace(/[^0-9]/g, '');
      const contractStart = new Date(contract.start_date);
      const contractEnd = new Date(contract.end_date);

      const matchesSearch = !searchTerm
        || contract.contract_code.toLowerCase().includes(searchTerm)
        || contract.client_name.toLowerCase().includes(searchTerm);

      const matchesCnpj = !cnpjFilter || normalizedCnpj.includes(cnpjFilter);
      const matchesStatus = !statusFilter || contract.status.toLowerCase() === statusFilter;

      const matchesStartDate = !startDateFilter
        || (!Number.isNaN(contractEnd.getTime()) && contractEnd >= startDateFilter);
      const matchesEndDate = !endDateFilter
        || (!Number.isNaN(contractStart.getTime()) && contractStart <= endDateFilter);

      return matchesSearch && matchesCnpj && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [contracts, search, cnpj, status, startDate, endDate]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredContracts.length / pageSize)),
    [filteredContracts.length, pageSize],
  );

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const currentPageItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredContracts.slice(startIndex, startIndex + pageSize);
  }, [filteredContracts, page, pageSize]);

  const formatNumber = (value: string | number | null) => {
    if (value === null || value === undefined || value === '') return '-';
    const numeric = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    if (Number.isNaN(numeric)) return String(value);
    return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('pt-BR');
  };

  const onExport = () => {
    const csv = toCsv(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contracts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFormChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const { groupName, ...rest } = form;
      const sanitizedGroupName = groupName.trim() || 'default';
      const payload = {
        ...rest,
        start_date: ensureIsoDate(form.start_date),
        end_date: ensureIsoDate(form.end_date),
        groupName: sanitizedGroupName,
      };
      const saved = await createContract(payload);
      setContracts((prev) => [saved, ...prev]);
      setForm(initialFormState);
    } catch (err) {
      console.error(err);
      setFormError('Falha ao salvar contrato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Contratos Ativos</h1>

      <form onSubmit={handleSubmit} className="border rounded p-4 space-y-4">
        <h2 className="text-lg font-medium">Novo contrato</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Nome do cliente</span>
            <input
              required
              value={form.client_name}
              onChange={handleFormChange('client_name')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Grupo</span>
            <input
              value={form.groupName}
              onChange={handleFormChange('groupName')}
              className="border rounded px-2 py-1"
              placeholder="default"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>CNPJ</span>
            <input
              required
              value={form.cnpj}
              onChange={handleFormChange('cnpj')}
              className="border rounded px-2 py-1"
              placeholder="00.000.000/0000-00"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Segmento</span>
            <input
              required
              value={form.segment}
              onChange={handleFormChange('segment')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Responsável</span>
            <input
              required
              value={form.contact_responsible}
              onChange={handleFormChange('contact_responsible')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Volume contratado (MWh)</span>
            <input
              required
              type="number"
              step="0.01"
              value={form.contracted_volume_mwh}
              onChange={handleFormChange('contracted_volume_mwh')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Status</span>
            <select
              required
              value={form.status}
              onChange={handleFormChange('status')}
              className="border rounded px-2 py-1"
            >
              <option value="">Selecione</option>
              <option value="Ativo">Ativo</option>
              <option value="Em análise">Em análise</option>
              <option value="Inativo">Inativo</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Fonte</span>
            <input
              required
              value={form.energy_source}
              onChange={handleFormChange('energy_source')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Modalidade</span>
            <input
              required
              value={form.contracted_modality}
              onChange={handleFormChange('contracted_modality')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Início</span>
            <input
              required
              type="date"
              value={form.start_date}
              onChange={handleFormChange('start_date')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Fim</span>
            <input
              required
              type="date"
              value={form.end_date}
              onChange={handleFormChange('end_date')}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-3">
            <span>Ciclo de faturamento</span>
            <input
              required
              value={form.billing_cycle}
              onChange={handleFormChange('billing_cycle')}
              className="border rounded px-2 py-1"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-yn-orange text-white rounded disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar contrato'}
          </button>
        </div>
      </form>

      {contractsError && (
        <div className="px-4 py-2 rounded bg-red-100 text-red-700 text-sm space-y-1">
          <div>Não foi possível carregar os contratos. Tente novamente mais tarde.</div>
          <div className="text-xs opacity-80 break-words">Detalhes: {contractsError}</div>
        </div>
      )}

      {formError && (
        <div className="px-4 py-2 rounded bg-red-100 text-red-700 text-sm">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar Código/Cliente"
          className="border rounded px-2 py-1"
        />
        <input
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          placeholder="CNPJ"
          className="border rounded px-2 py-1"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Em análise">Em análise</option>
          <option value="Inativo">Inativo</option>
        </select>
        <input
          type="month"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="month"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <div className="flex gap-2">
          <button onClick={() => { setPage(1); }} className="px-3 py-1 border rounded">Filtrar</button>
          <button onClick={onExport} className="px-3 py-1 border rounded bg-yn-orange text-white">Exportar CSV</button>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="p-2 text-left">Código</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">CNPJ</th>
              <th className="p-2 text-left">Segmento</th>
              <th className="p-2 text-left">Responsável</th>
              <th className="p-2 text-right">Volume Contratado (MWh)</th>
              <th className="p-2 text-left">Fonte</th>
              <th className="p-2 text-left">Modalidade</th>
              <th className="p-2 text-left">Ciclo de Faturamento</th>
              <th className="p-2 text-left">Início</th>
              <th className="p-2 text-left">Fim</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentPageItems.map((contract) => {
              const statusVariant = (contract.status || '').toLowerCase();
              const badgeClass = statusVariant === 'ativo'
                ? 'bg-green-100 text-green-700'
                : statusVariant === 'em análise'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700';

              return (
                <tr key={contract.id} className="border-t">
                  <td className="p-2">{contract.contract_code}</td>
                  <td className="p-2">{contract.client_name}</td>
                  <td className="p-2">{contract.cnpj}</td>
                  <td className="p-2">{contract.segment}</td>
                  <td className="p-2">{contract.contact_responsible}</td>
                  <td className="p-2 text-right">{formatNumber(contract.contracted_volume_mwh)}</td>
                  <td className="p-2">{contract.energy_source}</td>
                  <td className="p-2">{contract.contracted_modality}</td>
                  <td className="p-2">{contract.billing_cycle}</td>
                  <td className="p-2">{formatDate(contract.start_date)}</td>
                  <td className="p-2">{formatDate(contract.end_date)}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${badgeClass}`}>
                      {contract.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {loading && (
              <tr><td colSpan={12} className="p-4 text-center text-gray-500">Carregando...</td></tr>
            )}
            {!loading && !contractsError && currentPageItems.length === 0 && (
              <tr><td colSpan={12} className="p-4 text-center text-gray-500">Nenhum contrato encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded" disabled={page <= 1}>Anterior</button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded" disabled={page >= totalPages}>Próxima</button>
        </div>
        <div>
          Página {page} de {totalPages}
        </div>
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="border rounded px-2 py-1"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
}
