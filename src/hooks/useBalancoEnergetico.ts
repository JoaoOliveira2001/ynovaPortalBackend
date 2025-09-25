import { useQuery } from '@tanstack/react-query';

export interface BalancoEnergetico {
  cliente: string;
  preco: number | null;
  data_base: string | null;
  reajustado: number | null;
  fornecedor: string | null;
  medidor: string | null;
  consumo: number | null;
  medicao: string | null;
  proinfa: number | null;
  contrato: number | null;
  minimo: number | null;
  maximo: number | null;
  faturar: number | null;
  cp: string | null;
  encargos: string | null;
}

export function useBalancoEnergetico() {
  return useQuery<BalancoEnergetico[]>({
    queryKey: ['balancoEnergetico'],
    queryFn: async () => {
      const res = await fetch('https://n8n.ynovamarketplace.com/webhook/mockScde');
      if (!res.ok) throw new Error('Erro ao carregar dados do balanço energético');
      return res.json();
    },
  });
}
