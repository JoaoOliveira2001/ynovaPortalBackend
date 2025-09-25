export type Lead = {
  id: number;
  nome: string;
  cnpj: string;
  segmento: string;
  statusFunil: 'vermelho' | 'amarelo' | 'verde';
  statusMigracao: 'em_analise' | 'aprovado' | 'rejeitado' | 'pendente';
  ultimaInteracao: string;
  contato?: string;
  telefone?: string;
  email?: string;
};

export type Proposta = {
  id: number;
  leadId: number;
  data: string;
  status: 'aceita' | 'rejeitada' | 'negociacao';
  valorSimulado: number;
  condicoes: string;
  pptUrl: string;
};

export type DealComissao = {
  dealId: number;
  leadId: number;
  valorContrato: number;
  comissao: number;
  statusPagamento: 'pago' | 'pendente' | 'processando';
  data: string;
};

export type Cliente = {
  id: number;
  nome: string;
  bandeira: string;
  imposto: string;
  consumo: number; // kWh consumidos
  geracao: number; // kWh gerados
  balanco: number; // saldo energético (geracao - consumo)
  saldo?: string; // representação formatada do saldo energético
};
