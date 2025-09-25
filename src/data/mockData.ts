import { Lead, Proposta, DealComissao, Cliente } from '../types';

export const mockLeads: Lead[] = [
  {
    id: 1,
    nome: 'Empresa Alpha Ltda',
    cnpj: '12.345.678/0001-90',
    segmento: 'Industrial',
    statusFunil: 'verde',
    statusMigracao: 'aprovado',
    ultimaInteracao: '2025-01-15',
    contato: 'João Silva',
    telefone: '(11) 99999-9999',
    email: 'joao@alpha.com.br',
  },
  {
    id: 2,
    nome: 'Beta Comércio SA',
    cnpj: '98.765.432/0001-10',
    segmento: 'Comercial',
    statusFunil: 'amarelo',
    statusMigracao: 'em_analise',
    ultimaInteracao: '2025-01-14',
    contato: 'Maria Santos',
    telefone: '(11) 88888-8888',
    email: 'maria@beta.com.br',
  },
];

export const mockKpis = {
  leads_ativos: 24,
  taxa_conversao: 27,
  receita_potencial: 1250000,
  propostas_em_negociacao: 5,
  contratos_volume_mwh: 12000,
};

export const mockPropostas: Proposta[] = [
  {
    id: 1,
    leadId: 1,
    data: '2025-01-10',
    status: 'aceita',
    valorSimulado: 150000,
    condicoes: 'Prazo 24 meses',
    pptUrl: '/mock-proposta.ppt',
  },
];

export const mockComissoes: DealComissao[] = [
  {
    dealId: 1,
    leadId: 1,
    valorContrato: 150000,
    comissao: 15000,
    statusPagamento: 'pago',
    data: '2025-01-01',
  },
];

export const mockUser = {
  name: 'João Consultor',
  email: 'joao@ynova.com',
};

export const mockClientes: Cliente[] = [
  {
    id: 1,
    nome: 'Cliente Energia A',
    bandeira: 'Verde',
    imposto: '12%',
    consumo: 1000,
    geracao: 1200,
    balanco: 200,
    saldo: 'Saldo +200 kWh',
  },
  {
    id: 2,
    nome: 'Cliente Energia B',
    bandeira: 'Amarela',
    imposto: '15%',
    consumo: 800,
    geracao: 600,
    balanco: -200,
    saldo: 'Saldo -200 kWh',
  },
];
