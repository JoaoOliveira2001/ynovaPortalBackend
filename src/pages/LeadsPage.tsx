import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  Phone,
  Mail,
  Building,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import ModalUploadInvoice from '../components/ModalUploadInvoice';
import StatusBadge from '../components/StatusBadge';
import ListRow from '../components/ListRow';
import EmptyState from '../components/EmptyState';
import { mockLeads, mockPropostas } from '../data/mockData';
import { toast } from 'sonner';
import { Lead } from '../types';
import { useSearchParams } from 'react-router-dom';

export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('resumo');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Abrir modal ao vir do header com ?upload=1
  useEffect(() => {
    const shouldOpen = searchParams.get('upload') === '1';
    if (shouldOpen) {
      setIsUploadOpen(true);
      searchParams.delete('upload');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cnpj.includes(searchTerm)
  );

  const handleDelete = () => {
    if (leadToDelete) {
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      setLeadToDelete(null);
      setIsDeleteOpen(false);
      toast.success('Lead excluído com sucesso');
    }
  };

  const handleInvoiceRegistered = (leadData: Omit<Lead, 'id'>) => {
    let createdLead: Lead | null = null;
    setLeads((prev) => {
      const nextId = prev.reduce((max, lead) => Math.max(max, lead.id), 0) + 1;
      createdLead = { ...leadData, id: nextId };
      return [createdLead, ...prev];
    });

    setSearchTerm('');

    if (createdLead) {
      setSelectedLead(createdLead);
      setActiveTab('faturas');
    }

    toast.success('Fatura enviada e cadastrada como lead');
  };

  if (!selectedLead) {
    return (
      <>
        <div className="space-y-6">
          <header className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 min-w-0 w-full">
              <div className="relative flex-1 min-w-0">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg focus:ring-2 focus:ring-yn-orange focus:border-transparent bg-white dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300"
                />
              </div>
              <button
                className="p-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E1E1E] w-full sm:w-auto"
                aria-label="Filtros"
              >
                <Filter size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="bg-yn-orange hover:bg-yn-orange/90 text-white px-4 py-2 rounded-lg w-full"
              >
                Enviar Fatura
              </button>
            </div>
          </header>

          <div className="bg-white dark:bg-[#3E3E3E] rounded-lg shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
            {filteredLeads.length === 0 ? (
              <EmptyState
                message="Você ainda não possui leads. Importe um arquivo ou cadastre manualmente."
                action={
                  <button className="bg-yn-orange hover:bg-yn-orange/90 text-white px-4 py-2 rounded-lg font-medium">
                    Importar Leads
                  </button>
                }
              />
            ) : (
              <>
                <div className="sm:hidden">
                  <ul className="divide-y divide-gray-200 dark:divide-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#3E3E3E]">
                    {filteredLeads.map((lead) => {
                      const statusLabel = lead.statusFunil === 'verde' ? 'Qualificado' : lead.statusFunil === 'amarelo' ? 'Em análise' : lead.statusFunil === 'vermelho' ? 'Frio' : lead.statusFunil;
                      const statusColor = lead.statusFunil === 'verde' ? 'green' : lead.statusFunil === 'vermelho' ? 'red' : 'orange';
                      return (
                        <ListRow
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          title={lead.nome}
                          badgeLabel={`CNPJ: ${lead.cnpj}`}
                          detail={`Segmento: ${lead.segmento}`}
                          rightPill={{ label: statusLabel, color: statusColor as any }}
                        />
                      );
                    })}
                  </ul>
                </div>

                <div className="hidden sm:block">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto min-w-[720px] divide-y divide-gray-200 dark:divide-[#1E1E1E]">
                      <thead className="bg-gray-50 dark:bg-[#3E3E3E]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Empresa</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CNPJ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Segmento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status Funil</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Migração</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#3E3E3E] divide-y divide-gray-200 dark:divide-[#1E1E1E]">
                        {filteredLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="hover:bg-gray-50 dark:hover:bg-[#1E1E1E]"
                          >
                            <td className="px-6 py-4 whitespace-normal break-words truncate">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-normal break-words truncate">
                                  {lead.nome}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-300 whitespace-normal break-words truncate">
                                  {lead.contato}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-normal break-words truncate text-sm text-gray-900 dark:text-gray-100">
                              {lead.cnpj}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {lead.segmento}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={lead.statusFunil} type="funil" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge
                                status={lead.statusMigracao}
                                type="migracao"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedLead(lead)}
                          className="text-yn-orange hover:text-yn-orange/80"
                                >
                                  Abrir
                                </button>
                                <button className="text-blue-600 hover:text-blue-900">
                                  Solicitar fatura
                                </button>
                                <button
                                  className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400"
                                  aria-label="Mais ações"
                                  onClick={() =>
                                    setOpenMenuId(
                                      openMenuId === lead.id ? null : lead.id
                                    )
                                  }
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                              {openMenuId === lead.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-[#3E3E3E] border border-gray-200 dark:border-[#1E1E1E] rounded-md shadow-lg z-10">
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                                    onClick={() => {
                                      setLeadToDelete(lead);
                                      setIsDeleteOpen(true);
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      <ModalUploadInvoice
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onInvoiceRegistered={handleInvoiceRegistered}
      />
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#3E3E3E] p-6 rounded-lg w-full max-w-sm">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Deseja realmente excluir?</h2>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-white dark:bg-[#3E3E3E] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-[#1E1E1E] rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] rounded-lg" aria-label="Voltar">
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{selectedLead.nome}</h1>
      </div>

      <div className="bg-white dark:bg-[#3E3E3E] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-[#1E1E1E]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">CNPJ</label>
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLead.cnpj}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Contato</label>
            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLead.contato}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Status Funil</label>
            <div className="mt-1">
              <StatusBadge status={selectedLead.statusFunil} type="funil" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Status Migração</label>
            <div className="mt-1">
              <StatusBadge status={selectedLead.statusMigracao} type="migracao" />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-[#1E1E1E] mb-6">
          <nav
            className="-mb-px flex flex-wrap gap-2 sm:gap-4 lg:gap-6"
            role="tablist"
          >
            {[
              { id: 'resumo', label: 'Resumo' },
              { id: 'cadastro', label: 'Cadastro' },
              { id: 'faturas', label: 'Faturas & Extração' },
              { id: 'propostas', label: 'Propostas' },
              { id: 'contratos', label: 'Contratos' },
              { id: 'migracao', label: 'Migração' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`min-w-0 whitespace-normal text-center sm:text-left sm:whitespace-nowrap py-2 px-2 sm:px-3 border-b-2 font-medium text-sm leading-tight ${
                  activeTab === tab.id
                    ? 'border-yn-orange text-yn-orange dark:text-yn-orange'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-[#1E1E1E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Próximas Ações</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Validar fatura de energia</li>
                  <li>• Agendar apresentação</li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">Status Atual</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Lead qualificado - documentação em análise</p>
              </div>
              <div className="bg-yn-orange/10 dark:bg-yn-orange/20 p-4 rounded-lg">
                <h4 className="font-medium text-yn-orange dark:text-yn-orange mb-2">Última Interação</h4>
                <p className="text-sm text-yn-orange dark:text-yn-orange">{new Date(selectedLead.ultimaInteracao).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Timeline de Eventos</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Fatura enviada - 15/01/2025</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Primeiro contato - 10/01/2025</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastro' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button className="bg-yn-orange hover:bg-yn-orange/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <Edit size={16} />
                Editar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Razão Social</label>
                <input type="text" value={selectedLead.nome} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CNPJ</label>
                <input type="text" value={selectedLead.cnpj} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Segmento</label>
                <input type="text" value={selectedLead.segmento} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contato Principal</label>
                <input type="text" value={selectedLead.contato} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                <input type="text" value={selectedLead.telefone} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
                <input type="email" value={selectedLead.email} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-[#1E1E1E] rounded-lg bg-gray-50 dark:bg-[#3E3E3E] text-gray-900 dark:text-gray-100" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faturas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Faturas Enviadas</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <button className="bg-yn-orange hover:bg-yn-orange/90 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 w-full sm:w-auto">
                  <Upload size={16} />
                  Enviar Fatura
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 w-full sm:w-auto">
                  <Download size={16} />
                  Nova Extração
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arquivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Upload</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">fatura_jan_2025.pdf</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15/01/2025</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Pendente validação
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">Revisar dados</button>
                      <button className="text-yn-orange hover:text-yn-orange/80">Reprocessar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Dados Extraídos - Confiança: 95%</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Consumo kWh:</span>
                  <span className="ml-2">12.450</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Valor Total:</span>
                  <span className="ml-2">R$ 8.750,00</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Tarifa Média:</span>
                  <span className="ml-2">R$ 0,702/kWh</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Distribuidora:</span>
                  <span className="ml-2">ENEL SP</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm w-full sm:w-auto">Aceitar</button>
                <button className="bg-yn-orange hover:bg-yn-orange/90 text-white px-3 py-1 rounded text-sm w-full sm:w-auto">Editar</button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm w-full sm:w-auto">Rejeitar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'propostas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h4 className="font-medium text-gray-900">Histórico de Propostas</h4>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm w-full sm:w-auto">
                Nova Proposta
              </button>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Simulado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockPropostas.map((proposta) => (
                    <tr key={proposta.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(proposta.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            proposta.status === 'aceita'
                              ? 'bg-green-100 text-green-800'
                              : proposta.status === 'rejeitada'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {proposta.status === 'aceita'
                            ? 'Aceita'
                            : proposta.status === 'rejeitada'
                            ? 'Rejeitada'
                            : 'Em negociação'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {proposta.valorSimulado.toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1">
                          <Download size={14} />
                          Baixar PPT
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                          <Eye size={14} />
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contratos' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Histórico de Contratos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-900">Volume Total</h5>
                <p className="text-2xl font-bold text-blue-900">12.000 MWh</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-900">Preço Médio</h5>
                <p className="text-2xl font-bold text-green-900">R$ 285/MWh</p>
              </div>
              <div className="bg-yn-orange/10 p-4 rounded-lg">
                <h5 className="font-medium text-yn-orange">Contratos Ativos</h5>
                <p className="text-2xl font-bold text-yn-orange">3</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-center">Histórico detalhado de contratos será exibido aqui</p>
            </div>
          </div>
        )}

        {activeTab === 'migracao' && (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Status da Migração</h4>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-gray-600">Progresso</span>
                <span className="text-sm text-gray-600">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div className="bg-yn-orange h-2 rounded-full w-3/4"></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Documentação enviada</span>
                  <span className="text-xs text-gray-500 ml-auto">10/01/2025</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Validação interna</span>
                  <span className="text-xs text-gray-500 ml-auto">12/01/2025</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yn-orange" />
                  <span className="text-sm text-gray-700">Protocolado na CCEE</span>
                  <span className="text-xs text-gray-500 ml-auto">Em andamento</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-400">Aprovação final</span>
                  <span className="text-xs text-gray-400 ml-auto">Aguardando</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
