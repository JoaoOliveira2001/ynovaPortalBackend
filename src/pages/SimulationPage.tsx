import React, { ChangeEvent, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  Check,
  Download,
  Edit2,
  FileText,
  Upload,
} from 'lucide-react';

type Etapa = 'upload' | 'dados' | 'simulacao' | 'proposta';

type Cliente = {
  nome: string;
  unidade: number;
  distribuidora: string;
  subgrupo: string;
  modalidade: string;
  demanda_contratada_kW: number;
  consumo_medio_MWh_mes: number;
  observacao: string;
};

type ConsumoMensalItem = {
  mes: number;
  consumo_ponta_kWh: number;
  consumo_fora_ponta_kWh: number;
  consumo_reservado_kWh: number | null;
  demanda_ponta_kW: number;
  demanda_fora_ponta_kW: number;
};

type ResumoConsumo = {
  media_ponta_kWh: number;
  media_fora_ponta_kWh: number;
  total_kWh_mes: number;
  total_com_perdas_kWh_mes: number;
  percentual_perdas: number;
};

type TarifaMedicao = {
  medicao_MWh: number;
  tarifa_R$_MWh: number;
  total_R$: number;
};

type TarifaEnergia = {
  energia_fp: TarifaMedicao;
  energia_p: TarifaMedicao;
  energia_icms: {
    valor_R$: number;
  };
  ccee: TarifaMedicao;
  distribuicao_fp: TarifaMedicao;
  distribuicao_p: TarifaMedicao;
};

type DemandaDetalhe = {
  contratada_kW?: number;
  tarifa_R$_kW?: number;
  total_R$?: number;
  kW?: number;
  valor_R$?: number;
} | null;

type DemandaInfo = {
  fp: DemandaDetalhe;
  p: DemandaDetalhe;
  nao_utilizada_fp: DemandaDetalhe;
  nao_utilizada_p: DemandaDetalhe;
  ultrapassada_fp: DemandaDetalhe;
  ultrapassada_p: DemandaDetalhe;
};

type CustosAdicionais = {
  gestao_mensal_R$: number;
  gerador_R$: number;
};

type Totais = {
  atual_R$: number;
  proposta_verde_R$: number;
  proposta_azul_R$: number;
  economia_percentual_verde: number;
  economia_percentual_azul: number;
};

type EconomiaTemporal = {
  verde: {
    ano_R$: number;
    '3_anos_R$': number;
    '10_anos_R$': number;
  };
  azul: {
    ano_R$: number;
    '3_anos_R$': number | null;
    '10_anos_R$': number | null;
  };
  percentuais_economia_bandeiras: {
    verde: number;
    amarela: number;
    vermelha_1: number;
    vermelha_2: number;
    escassez_hidrica: number;
  };
  economia_media_percentual: number;
  valores_economia_10_anos_por_bandeira: {
    verde_R$: number;
    amarela_R$: number;
    vermelha_1_R$: number;
    vermelha_2_R$: number;
    escassez_hidrica_R$: number;
  };
};

type EconomiaAmbiental = {
  arvores_preservadas: number;
  campos_futebol_equivalentes: number;
  toneladas_carbono_evitadas: number;
};

type TarifasReferencia = {
  energia_P_R$_MWh: number;
  energia_FP_R$_MWh: number;
  ccee_R$_MWh: number;
  distribuicao_P_R$_MWh: number;
  distribuicao_FP_R$_MWh: number;
  demanda_P_R$_kW: number;
  demanda_FP_R$_kW: number;
  gerador_P_R$: number;
  gerador_FP_R$: number;
  gestao_mensal_atual_R$: number;
  gestao_mensal_proposta_R$: number;
};

type TarifasProposta = {
  energia_P_R$_MWh: number;
  energia_FP_R$_MWh: number;
  ccee_R$_MWh: number;
  distribuicao_P_R$_MWh: number;
  distribuicao_FP_R$_MWh: number;
  demanda_total_R$: number;
};

type ContextoProposta = {
  submercado: string;
  encargos: {
    valor_R$: number;
  };
};

type EconomiaAnualModalidades = {
  verde_R$: number;
  azul_R$: number | null;
  sobrecontratacao_verde_R$: number | null;
};

type SimulationData = {
  cliente: Cliente;
  consumo_mensal: ConsumoMensalItem[];
  resumo_consumo: ResumoConsumo;
  tarifas_energia_atual: TarifaEnergia;
  tarifas_energia_proposta_verde: TarifaEnergia;
  tarifas_energia_proposta_azul: TarifaEnergia;
  demanda_atual: DemandaInfo;
  demanda_proposta_verde: DemandaInfo;
  demanda_proposta_azul: DemandaInfo;
  custos_adicionais: CustosAdicionais;
  totais: Totais;
  multa_ultrapassagem: {
    modalidade: string;
  };
  sobrecontratacao: {
    modalidade: string;
  };
  economia_temporal: EconomiaTemporal;
  economia_ambiental: EconomiaAmbiental;
  tarifas_referencia: TarifasReferencia;
  tarifas_proposta: TarifasProposta;
  contexto_proposta: ContextoProposta;
  economia_anual_modalidades: EconomiaAnualModalidades;
};

const mockSimulationData: SimulationData = {
  cliente: {
    nome: 'AUTO POSTO PETROBRASILIA',
    unidade: 1,
    distribuidora: 'NeoEnergia Brasilia',
    subgrupo: 'A4',
    modalidade: 'Verde',
    demanda_contratada_kW: 49,
    consumo_medio_MWh_mes: 5.619,
    observacao: '',
  },
  consumo_mensal: [
    {
      mes: 1,
      consumo_ponta_kWh: 761,
      consumo_fora_ponta_kWh: 4858,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 14,
    },
    {
      mes: 2,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 3,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 4,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 5,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 6,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 7,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 8,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 9,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 10,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 11,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
    {
      mes: 12,
      consumo_ponta_kWh: 0,
      consumo_fora_ponta_kWh: 0,
      consumo_reservado_kWh: null,
      demanda_ponta_kW: 0,
      demanda_fora_ponta_kW: 0,
    },
  ],
  resumo_consumo: {
    media_ponta_kWh: 761,
    media_fora_ponta_kWh: 4858,
    total_kWh_mes: 5619,
    total_com_perdas_kWh_mes: 5788,
    percentual_perdas: 3,
  },
  tarifas_energia_atual: {
    energia_fp: {
      medicao_MWh: 4.858,
      tarifa_R$_MWh: 509,
      total_R$: 2473,
    },
    energia_p: {
      medicao_MWh: 0.761,
      tarifa_R$_MWh: 804,
      total_R$: 612,
    },
    energia_icms: {
      valor_R$: 0,
    },
    ccee: {
      medicao_MWh: 5.619,
      tarifa_R$_MWh: 0,
      total_R$: 0,
    },
    distribuicao_fp: {
      medicao_MWh: 4.858,
      tarifa_R$_MWh: 165,
      total_R$: 801,
    },
    distribuicao_p: {
      medicao_MWh: 0.761,
      tarifa_R$_MWh: 1105,
      total_R$: 841,
    },
  },
  tarifas_energia_proposta_verde: {
    energia_fp: {
      medicao_MWh: 4.858,
      tarifa_R$_MWh: 262,
      total_R$: 1271,
    },
    energia_p: {
      medicao_MWh: 0.761,
      tarifa_R$_MWh: 262,
      total_R$: 199,
    },
    energia_icms: {
      valor_R$: 367,
    },
    ccee: {
      medicao_MWh: 5.619,
      tarifa_R$_MWh: 15,
      total_R$: 84,
    },
    distribuicao_fp: {
      medicao_MWh: 4.858,
      tarifa_R$_MWh: 165,
      total_R$: 801,
    },
    distribuicao_p: {
      medicao_MWh: 0.761,
      tarifa_R$_MWh: 1105,
      total_R$: 841,
    },
  },
  tarifas_energia_proposta_azul: {
    energia_fp: {
      medicao_MWh: 4.858,
      tarifa_R$_MWh: 262,
      total_R$: 1271,
    },
    energia_p: {
      medicao_MWh: 0.761,
      tarifa_R$_MWh: 262,
      total_R$: 199,
    },
    energia_icms: {
      valor_R$: -1456,
    },
    ccee: {
      medicao_MWh: 5.619,
      tarifa_R$_MWh: 15,
      total_R$: 84,
    },
    distribuicao_fp: {
      medicao_MWh: 4.858,
      tarifa_R$_MWh: 165,
      total_R$: 801,
    },
    distribuicao_p: {
      medicao_MWh: 0.761,
      tarifa_R$_MWh: 1105,
      total_R$: 841,
    },
  },
  demanda_atual: {
    fp: {
      contratada_kW: 14,
      tarifa_R$_kW: 17,
      total_R$: 236,
    },
    p: {
      contratada_kW: 0,
      tarifa_R$_kW: 39,
      total_R$: 0,
    },
    nao_utilizada_fp: {
      kW: 35,
      tarifa_R$_kW: 13,
      total_R$: 472,
    },
    nao_utilizada_p: {
      kW: 0,
      tarifa_R$_kW: 31,
      total_R$: 0,
    },
    ultrapassada_fp: null,
    ultrapassada_p: null,
  },
  demanda_proposta_verde: {
    fp: {
      contratada_kW: 30,
      tarifa_R$_kW: 8,
      total_R$: 253,
    },
    p: {
      contratada_kW: 0,
      tarifa_R$_kW: 19,
      total_R$: 0,
    },
    nao_utilizada_fp: {
      valor_R$: 491,
    },
    nao_utilizada_p: null,
    ultrapassada_fp: null,
    ultrapassada_p: null,
  },
  demanda_proposta_azul: {
    fp: {
      contratada_kW: 30,
      tarifa_R$_kW: 8,
      total_R$: 253,
    },
    p: {
      contratada_kW: 30,
      tarifa_R$_kW: 19,
      total_R$: 580,
    },
    nao_utilizada_fp: null,
    nao_utilizada_p: null,
    ultrapassada_fp: null,
    ultrapassada_p: null,
  },
  custos_adicionais: {
    gestao_mensal_R$: 500,
    gerador_R$: 0,
  },
  totais: {
    atual_R$: 5435,
    proposta_verde_R$: 4808,
    proposta_azul_R$: 4808,
    economia_percentual_verde: 12,
    economia_percentual_azul: 12,
  },
  multa_ultrapassagem: {
    modalidade: 'Verde',
  },
  sobrecontratacao: {
    modalidade: 'Verde',
  },
  economia_temporal: {
    verde: {
      ano_R$: 16109.05,
      '3_anos_R$': 48327,
      '10_anos_R$': 180497,
    },
    azul: {
      ano_R$: 12997,
      '3_anos_R$': null,
      '10_anos_R$': null,
    },
    percentuais_economia_bandeiras: {
      verde: 25,
      amarela: 27,
      vermelha_1: 29,
      vermelha_2: 33,
      escassez_hidrica: 39,
    },
    economia_media_percentual: 28,
    valores_economia_10_anos_por_bandeira: {
      verde_R$: 161090,
      amarela_R$: 173801,
      vermelha_1_R$: 191184,
      vermelha_2_R$: 214204,
      escassez_hidrica_R$: 256838,
    },
  },
  economia_ambiental: {
    arvores_preservadas: 132,
    campos_futebol_equivalentes: 0.1,
    toneladas_carbono_evitadas: 3,
  },
  tarifas_referencia: {
    energia_P_R$_MWh: 3085,
    energia_FP_R$_MWh: 1837,
    ccee_R$_MWh: 0,
    distribuicao_P_R$_MWh: 1642,
    distribuicao_FP_R$_MWh: 926,
    demanda_P_R$_kW: 708,
    demanda_FP_R$_kW: 744,
    gerador_P_R$: 0,
    gerador_FP_R$: 0,
    gestao_mensal_atual_R$: 0,
    gestao_mensal_proposta_R$: 500,
  },
  tarifas_proposta: {
    energia_P_R$_MWh: 5435,
    energia_FP_R$_MWh: 4092,
    ccee_R$_MWh: 84,
    distribuicao_P_R$_MWh: 65217,
    distribuicao_FP_R$_MWh: 49108,
    demanda_total_R$: 1342,
  },
  contexto_proposta: {
    submercado: 'SE/CO',
    encargos: {
      valor_R$: 0,
    },
  },
  economia_anual_modalidades: {
    verde_R$: 5662,
    azul_R$: null,
    sobrecontratacao_verde_R$: null,
  },
};
const monthLabels = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '-';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatNumber = (
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 0,
  },
) => {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', options).format(value);
};

const tarifaRows: { key: keyof TarifaEnergia; label: string }[] = [
  { key: 'energia_fp', label: 'Energia fora ponta' },
  { key: 'energia_p', label: 'Energia ponta' },
  { key: 'energia_icms', label: 'ICMS' },
  { key: 'ccee', label: 'CCEE' },
  { key: 'distribuicao_fp', label: 'Distribuição fora ponta' },
  { key: 'distribuicao_p', label: 'Distribuição ponta' },
];

const demandaRows: { key: keyof DemandaInfo; label: string }[] = [
  { key: 'fp', label: 'Fora ponta' },
  { key: 'p', label: 'Ponta' },
  { key: 'nao_utilizada_fp', label: 'Não utilizada FP' },
  { key: 'nao_utilizada_p', label: 'Não utilizada P' },
  { key: 'ultrapassada_fp', label: 'Ultrapassada FP' },
  { key: 'ultrapassada_p', label: 'Ultrapassada P' },
];

const tarifaTabs: {
  id: 'atual' | 'verde' | 'azul';
  label: string;
  description: string;
}[] = [
  { id: 'atual', label: 'Tarifas atuais', description: 'Valores praticados no mercado cativo' },
  { id: 'verde', label: 'Proposta Verde', description: 'Simulação considerando modalidade verde' },
  { id: 'azul', label: 'Proposta Azul', description: 'Simulação considerando modalidade azul' },
];

const demandaTabs: {
  id: 'atual' | 'verde' | 'azul';
  label: string;
}[] = [
  { id: 'atual', label: 'Cenário atual' },
  { id: 'verde', label: 'Proposta Verde' },
  { id: 'azul', label: 'Proposta Azul' },
];
export default function SimulationPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [tarifaTab, setTarifaTab] = useState<'atual' | 'verde' | 'azul'>('atual');
  const [demandaTab, setDemandaTab] = useState<'atual' | 'verde' | 'azul'>('atual');
  const [possuiGeracaoSolar, setPossuiGeracaoSolar] = useState<'Sim' | 'Não'>('Não');

  const currentStepIndex = useMemo(() => {
    const order: Etapa[] = ['upload', 'dados', 'simulacao', 'proposta'];
    return order.indexOf(etapa);
  }, [etapa]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setArquivo(file);
    setSimulationData(null);
    setModoEdicao(false);
    setTarifaTab('atual');
    setDemandaTab('atual');
    setPossuiGeracaoSolar('Não');

    // Simulação de extração automática
    setTimeout(() => {
      setSimulationData(mockSimulationData);
      setPossuiGeracaoSolar(mockSimulationData.custos_adicionais.gerador_R$ > 0 ? 'Sim' : 'Não');
      setTarifaTab('atual');
      setDemandaTab('atual');
      setModoEdicao(false);
      setEtapa('dados');
    }, 1200);
  };

  const handleClienteChange = <K extends keyof Cliente>(campo: K, valor: Cliente[K]) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        cliente: {
          ...prev.cliente,
          [campo]: valor,
        },
      };
    });
  };

  const handleConsumoMensalChange = <K extends keyof ConsumoMensalItem>(
    indice: number,
    campo: K,
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      const consumoAtualizado = prev.consumo_mensal.map((item, index) => {
        if (index !== indice) {
          return item;
        }

        const novoValor =
          campo === 'consumo_reservado_kWh'
            ? (valor === '' ? null : Number(valor))
            : Number(valor);

        return {
          ...item,
          [campo]: novoValor,
        } as ConsumoMensalItem;
      });

      return {
        ...prev,
        consumo_mensal: consumoAtualizado,
      };
    });
  };

  const handleResumoConsumoChange = <K extends keyof ResumoConsumo>(campo: K, valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        resumo_consumo: {
          ...prev.resumo_consumo,
          [campo]: Number(valor),
        },
      };
    });
  };

  const handleCustosAdicionaisChange = <K extends keyof CustosAdicionais>(campo: K, valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        custos_adicionais: {
          ...prev.custos_adicionais,
          [campo]: Number(valor),
        },
      };
    });
  };

  const handleTotaisChange = <K extends keyof Totais>(campo: K, valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        totais: {
          ...prev.totais,
          [campo]: Number(valor),
        },
      };
    });
  };

  const handleTarifaEnergiaChange = (
    contexto: 'tarifas_energia_atual' | 'tarifas_energia_proposta_verde' | 'tarifas_energia_proposta_azul',
    categoria: keyof TarifaEnergia,
    campo: 'medicao_MWh' | 'tarifa_R$_MWh' | 'total_R$' | 'valor_R$',
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      const proximo = { ...prev };
      const tabela = { ...proximo[contexto] } as TarifaEnergia;

      if (categoria === 'energia_icms') {
        tabela[categoria] = {
          valor_R$: Number(valor),
        };
      } else {
        const atual = tabela[categoria] as TarifaMedicao;
        tabela[categoria] = {
          ...atual,
          [campo]: Number(valor),
        } as TarifaMedicao;
      }

      proximo[contexto] = tabela as (typeof proximo)[typeof contexto];
      return proximo;
    });
  };

  const handleDemandaChange = (
    contexto: 'demanda_atual' | 'demanda_proposta_verde' | 'demanda_proposta_azul',
    categoria: keyof DemandaInfo,
    campo: 'contratada_kW' | 'tarifa_R$_kW' | 'total_R$' | 'kW' | 'valor_R$',
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      const proximo = { ...prev };
      const demandaAtual = { ...proximo[contexto] } as DemandaInfo;
      const detalheAtual = demandaAtual[categoria];

      if (!detalheAtual) {
        demandaAtual[categoria] = {
          [campo]: Number(valor),
        } as DemandaDetalhe;
      } else {
        demandaAtual[categoria] = {
          ...detalheAtual,
          [campo]: Number(valor),
        };
      }

      proximo[contexto] = demandaAtual as (typeof proximo)[typeof contexto];
      return proximo;
    });
  };

  const handleEconomiaTemporalModalidadeChange = (
    modalidade: 'verde' | 'azul',
    campo: 'ano_R$' | '3_anos_R$' | '10_anos_R$',
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      const proximo = { ...prev };
      const atual = { ...proximo.economia_temporal[modalidade] };
      atual[campo] = valor === '' ? null : Number(valor);
      proximo.economia_temporal = {
        ...proximo.economia_temporal,
        [modalidade]: atual,
      };

      return proximo;
    });
  };

  const handleEconomiaTemporalPercentualChange = (
    bandeira: keyof EconomiaTemporal['percentuais_economia_bandeiras'],
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        economia_temporal: {
          ...prev.economia_temporal,
          percentuais_economia_bandeiras: {
            ...prev.economia_temporal.percentuais_economia_bandeiras,
            [bandeira]: Number(valor),
          },
        },
      };
    });
  };

  const handleEconomiaTemporalValorBandeiraChange = (
    bandeira: keyof EconomiaTemporal['valores_economia_10_anos_por_bandeira'],
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        economia_temporal: {
          ...prev.economia_temporal,
          valores_economia_10_anos_por_bandeira: {
            ...prev.economia_temporal.valores_economia_10_anos_por_bandeira,
            [bandeira]: Number(valor),
          },
        },
      };
    });
  };

  const handleEconomiaMediaPercentualChange = (valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        economia_temporal: {
          ...prev.economia_temporal,
          economia_media_percentual: Number(valor),
        },
      };
    });
  };

  const handleEconomiaAnualModalidadesChange = (
    campo: keyof EconomiaAnualModalidades,
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        economia_anual_modalidades: {
          ...prev.economia_anual_modalidades,
          [campo]: valor === '' ? null : Number(valor),
        },
      };
    });
  };

  const handleEconomiaAmbientalChange = (
    campo: keyof EconomiaAmbiental,
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        economia_ambiental: {
          ...prev.economia_ambiental,
          [campo]: Number(valor),
        },
      };
    });
  };

  const handleContextoPropostaChange = (
    campo: 'submercado' | 'modalidade_multa' | 'modalidade_sobrecontratacao',
    valor: string,
  ) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      if (campo === 'submercado') {
        return {
          ...prev,
          contexto_proposta: {
            ...prev.contexto_proposta,
            submercado: valor,
          },
        };
      }

      if (campo === 'modalidade_multa') {
        return {
          ...prev,
          multa_ultrapassagem: {
            ...prev.multa_ultrapassagem,
            modalidade: valor,
          },
        };
      }

      return {
        ...prev,
        sobrecontratacao: {
          ...prev.sobrecontratacao,
          modalidade: valor,
        },
      };
    });
  };

  const handleEncargosChange = (valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        contexto_proposta: {
          ...prev.contexto_proposta,
          encargos: {
            valor_R$: Number(valor),
          },
        },
      };
    });
  };

  const handleTarifasReferenciaChange = (campo: keyof TarifasReferencia, valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        tarifas_referencia: {
          ...prev.tarifas_referencia,
          [campo]: Number(valor),
        },
      };
    });
  };

  const handleTarifasPropostaChange = (campo: keyof TarifasProposta, valor: string) => {
    setSimulationData((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        tarifas_proposta: {
          ...prev.tarifas_proposta,
          [campo]: Number(valor),
        },
      };
    });
  };

  const calcularSimulacao = () => {
    setEtapa('simulacao');
  };

  const gerarProposta = () => {
    setEtapa('proposta');
  };

  const handleReset = () => {
    setArquivo(null);
    setSimulationData(null);
    setEtapa('upload');
    setModoEdicao(false);
    setTarifaTab('atual');
    setDemandaTab('atual');
    setPossuiGeracaoSolar('Não');
  };

  const steps = useMemo(
    () => [
      { id: 'upload' as Etapa, label: 'Upload de Dados' },
      { id: 'dados' as Etapa, label: 'Validação' },
      { id: 'simulacao' as Etapa, label: 'Simulação' },
      { id: 'proposta' as Etapa, label: 'Proposta' },
    ],
    [],
  );

  const selectedTarifa = simulationData
    ? tarifaTab === 'atual'
      ? simulationData.tarifas_energia_atual
      : tarifaTab === 'verde'
      ? simulationData.tarifas_energia_proposta_verde
      : simulationData.tarifas_energia_proposta_azul
    : null;

  const selectedDemanda = simulationData
    ? demandaTab === 'atual'
      ? simulationData.demanda_atual
      : demandaTab === 'verde'
      ? simulationData.demanda_proposta_verde
      : simulationData.demanda_proposta_azul
    : null;

  const tarifaContextKey = useMemo(
    () =>
      tarifaTab === 'atual'
        ? 'tarifas_energia_atual'
        : tarifaTab === 'verde'
        ? 'tarifas_energia_proposta_verde'
        : 'tarifas_energia_proposta_azul',
    [tarifaTab],
  );

  const demandaContextKey = useMemo(
    () =>
      demandaTab === 'atual'
        ? 'demanda_atual'
        : demandaTab === 'verde'
        ? 'demanda_proposta_verde'
        : 'demanda_proposta_azul',
    [demandaTab],
  );

  const propostaKey = useMemo<'proposta_azul_R$' | 'proposta_verde_R$'>(
    () => (tarifaTab === 'azul' ? 'proposta_azul_R$' : 'proposta_verde_R$'),
    [tarifaTab],
  );

  const canProceedToSimulation = useMemo(() => {
    if (!simulationData) {
      return false;
    }

    const { cliente } = simulationData;
    const camposObrigatoriosPreenchidos =
      cliente.nome.trim().length > 0 &&
      cliente.distribuidora.trim().length > 0 &&
      cliente.modalidade.trim().length > 0 &&
      Number.isFinite(cliente.demanda_contratada_kW) &&
      cliente.demanda_contratada_kW > 0;

    return camposObrigatoriosPreenchidos;
  }, [simulationData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Simulação de Propostas</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Envie a planilha de consumo, revise as informações e gere uma proposta personalizada.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-yn-orange/40 px-4 py-2 text-sm font-medium text-yn-orange transition-colors hover:bg-yn-orange/10"
        >
          <FileText size={18} />
          Ver planilha modelo
        </button>
      </div>

      <nav aria-label="Etapas da simulação" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
        <ol className="flex flex-col gap-4 md:flex-row md:items-center">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;

            const circleClasses = isCompleted
              ? 'bg-yn-blue text-white'
              : isActive
              ? 'bg-yn-orange text-white'
              : 'bg-gray-200 text-gray-600 dark:bg-[#2b3238] dark:text-gray-300';

            const connectorClasses = isCompleted
              ? 'bg-yn-orange'
              : isActive
              ? 'bg-yn-orange/60'
              : 'bg-gray-200 dark:bg-[#2b3238]';

            return (
              <li key={step.id} className="flex flex-1 items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold transition-colors ${circleClasses}`}>
                  {isCompleted ? <Check size={22} /> : index + 1}
                </div>
                <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{step.label}</div>
                {index < steps.length - 1 && (
                  <div className="hidden flex-1 md:block">
                    <div className={`h-1 rounded-full ${connectorClasses}`} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {etapa === 'upload' && (
        <section className="rounded-xl border border-dashed border-yn-orange/40 bg-white p-10 text-center shadow-sm dark:border-yn-orange/30 dark:bg-[#1a1f24]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yn-orange/10 text-yn-orange">
            <Upload size={32} />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Carregue a planilha de consumo</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Arraste e solte o arquivo aqui ou clique no botão abaixo para escolher um arquivo com os últimos 12 meses.
          </p>
          <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-lg bg-yn-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-yn-orange/90">
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            Selecionar arquivo
          </label>
          {arquivo && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <FileText size={16} />
              <span className="truncate font-medium">{arquivo.name}</span>
              <span className="text-yn-blue">Extraindo dados…</span>
            </div>
          )}
        </section>
      )}
      {etapa === 'dados' && (
        <section className="space-y-6">
          {!simulationData ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
              <p className="text-sm text-gray-600 dark:text-gray-300">Carregando dados extraídos...</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dados extraídos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      Revise as informações antes de seguir para a simulação.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModoEdicao((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-yn-orange/50 px-4 py-2 text-sm font-medium text-yn-orange transition-colors hover:bg-yn-orange/10"
                  >
                    {modoEdicao ? <Check size={18} /> : <Edit2 size={18} />}
                    {modoEdicao ? 'Salvar alterações' : 'Editar dados'}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[2fr,1fr]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nome do cliente *</label>
                      <input
                        type="text"
                        value={simulationData.cliente.nome}
                        onChange={(event) => handleClienteChange('nome', event.target.value)}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Unidade *</label>
                      <input
                        type="number"
                        value={simulationData.cliente.unidade}
                        onChange={(event) => handleClienteChange('unidade', Number(event.target.value))}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Distribuidora *</label>
                      <input
                        type="text"
                        value={simulationData.cliente.distribuidora}
                        onChange={(event) => handleClienteChange('distribuidora', event.target.value)}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Subgrupo *</label>
                      <input
                        type="text"
                        value={simulationData.cliente.subgrupo}
                        onChange={(event) => handleClienteChange('subgrupo', event.target.value)}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Modalidade tarifária *</label>
                      <input
                        type="text"
                        value={simulationData.cliente.modalidade}
                        onChange={(event) => handleClienteChange('modalidade', event.target.value)}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Demanda contratada (kW) *</label>
                      <input
                        type="number"
                        value={simulationData.cliente.demanda_contratada_kW}
                        onChange={(event) => handleClienteChange('demanda_contratada_kW', Number(event.target.value))}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Consumo médio (MWh/mês)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={simulationData.cliente.consumo_medio_MWh_mes}
                        onChange={(event) => handleClienteChange('consumo_medio_MWh_mes', Number(event.target.value))}
                        disabled={!modoEdicao}
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Observações</label>
                      <textarea
                        value={simulationData.cliente.observacao}
                        onChange={(event) => handleClienteChange('observacao', event.target.value)}
                        disabled={!modoEdicao}
                        className="min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-[#2b3238] dark:bg-[#111418] dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-[#2b3238] dark:bg-[#111418]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Geração própria
                    </span>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Você possui geração solar?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Sim', 'Não'] as const).map((opcao) => {
                        const isActive = possuiGeracaoSolar === opcao;
                        return (
                          <button
                            type="button"
                            key={opcao}
                            onClick={() => setPossuiGeracaoSolar(opcao)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isActive
                                ? 'border-yn-orange bg-yn-orange/10 text-yn-orange'
                                : 'border-gray-200 text-gray-600 hover:border-yn-orange/40 hover:text-yn-orange dark:border-[#2b3238] dark:text-gray-300'
                            }`}
                          >
                            {opcao}
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-lg bg-white p-3 text-sm text-gray-600 shadow-sm dark:bg-[#0b1014] dark:text-gray-300">
                      <p>
                        {possuiGeracaoSolar === 'Sim'
                          ? 'Consideraremos abatimento da geração distribuída nos cálculos.'
                          : 'Os valores foram calculados desconsiderando geração própria.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
                  <AlertCircle size={18} />
                  <p>
                    {canProceedToSimulation
                      ? 'Todos os campos obrigatórios estão preenchidos. Você pode avançar para a simulação.'
                      : 'Revise os campos obrigatórios (*) antes de avançar para a simulação.'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Consumo mensal</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Histórico dos últimos 12 meses em kWh e kW.</p>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-[#2b3238]">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-[#1a1f24] dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-3">Mês</th>
                        <th className="px-4 py-3 text-right">Consumo ponta (kWh)</th>
                        <th className="px-4 py-3 text-right">Consumo fora ponta (kWh)</th>
                        <th className="px-4 py-3 text-right">Consumo reservado (kWh)</th>
                        <th className="px-4 py-3 text-right">Demanda ponta (kW)</th>
                        <th className="px-4 py-3 text-right">Demanda fora ponta (kW)</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2b3238]">
                    {simulationData.consumo_mensal.map((item, index) => (
                      <tr key={item.mes} className="hover:bg-gray-50/70 dark:hover:bg-[#111418]">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                          {monthLabels[item.mes - 1] || `Mês ${item.mes}`}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.001"
                              value={item.consumo_ponta_kWh}
                              onChange={(event) =>
                                handleConsumoMensalChange(index, 'consumo_ponta_kWh', event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatNumber(item.consumo_ponta_kWh)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.001"
                              value={item.consumo_fora_ponta_kWh}
                              onChange={(event) =>
                                handleConsumoMensalChange(index, 'consumo_fora_ponta_kWh', event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatNumber(item.consumo_fora_ponta_kWh)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.001"
                              value={item.consumo_reservado_kWh ?? ''}
                              onChange={(event) =>
                                handleConsumoMensalChange(index, 'consumo_reservado_kWh', event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : item.consumo_reservado_kWh === null ? (
                            '-'
                          ) : (
                            formatNumber(item.consumo_reservado_kWh)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.001"
                              value={item.demanda_ponta_kW}
                              onChange={(event) =>
                                handleConsumoMensalChange(index, 'demanda_ponta_kW', event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatNumber(item.demanda_ponta_kW)
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.001"
                              value={item.demanda_fora_ponta_kW}
                              onChange={(event) =>
                                handleConsumoMensalChange(index, 'demanda_fora_ponta_kW', event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatNumber(item.demanda_fora_ponta_kW)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Resumo do consumo</h3>
                  <dl className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Média ponta</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.001"
                            value={simulationData.resumo_consumo.media_ponta_kWh}
                            onChange={(event) => handleResumoConsumoChange('media_ponta_kWh', event.target.value)}
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          <>{formatNumber(simulationData.resumo_consumo.media_ponta_kWh)} kWh</>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Média fora ponta</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.001"
                            value={simulationData.resumo_consumo.media_fora_ponta_kWh}
                            onChange={(event) => handleResumoConsumoChange('media_fora_ponta_kWh', event.target.value)}
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          <>{formatNumber(simulationData.resumo_consumo.media_fora_ponta_kWh)} kWh</>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Total mensal</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.001"
                            value={simulationData.resumo_consumo.total_kWh_mes}
                            onChange={(event) => handleResumoConsumoChange('total_kWh_mes', event.target.value)}
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          <>{formatNumber(simulationData.resumo_consumo.total_kWh_mes)} kWh</>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Total com perdas</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.001"
                            value={simulationData.resumo_consumo.total_com_perdas_kWh_mes}
                            onChange={(event) => handleResumoConsumoChange('total_com_perdas_kWh_mes', event.target.value)}
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          <>{formatNumber(simulationData.resumo_consumo.total_com_perdas_kWh_mes)} kWh</>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Perdas</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={simulationData.resumo_consumo.percentual_perdas}
                              onChange={(event) => handleResumoConsumoChange('percentual_perdas', event.target.value)}
                              className="w-full max-w-[120px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-300">%</span>
                          </div>
                        ) : (
                          <>
                            {formatNumber(simulationData.resumo_consumo.percentual_perdas, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 1,
                            })}
                            %
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tarifas de energia</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Compare os cenários atual e propostos.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {tarifaTabs.map((tab) => {
                        const isActive = tarifaTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setTarifaTab(tab.id)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isActive
                                ? 'border-yn-orange bg-yn-orange/10 text-yn-orange'
                                : 'border-gray-200 text-gray-600 hover:border-yn-orange/40 hover:text-yn-orange dark:border-[#2b3238] dark:text-gray-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tarifaTabs.find((tab) => tab.id === tarifaTab)?.description}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Custos adicionais</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Itens que impactam diretamente o fluxo mensal.</p>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Gestão mensal</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.01"
                            value={simulationData.custos_adicionais.gestao_mensal_R$}
                            onChange={(event) => handleCustosAdicionaisChange('gestao_mensal_R$', event.target.value)}
                            className="w-full max-w-[160px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatCurrency(simulationData.custos_adicionais.gestao_mensal_R$)
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Gerador</dt>
                      <dd className="flex-1 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.01"
                            value={simulationData.custos_adicionais.gerador_R$}
                            onChange={(event) => handleCustosAdicionaisChange('gerador_R$', event.target.value)}
                            className="w-full max-w-[160px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatCurrency(simulationData.custos_adicionais.gerador_R$)
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              {selectedTarifa && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detalhamento de tarifas</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Estrutura detalhada dos componentes tarifários selecionados.
                  </p>
                  <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-[#2b3238]">
                    <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-[#2b3238]">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-[#1a1f24] dark:text-gray-300">
                        <tr>
                          <th scope="col" className="px-4 py-3">
                            Item
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Medição (MWh)
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Tarifa (R$/MWh)
                          </th>
                          <th scope="col" className="px-4 py-3 text-right">
                            Total (R$)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-[#2b3238]">
                        {tarifaRows.map((row) => {
                          const dado = selectedTarifa[row.key];

                          if (row.key === 'energia_icms') {
                            const valor = (dado as { valor_R$: number }).valor_R$;
                            return (
                              <tr key={row.key} className="bg-orange-50/40 dark:bg-[#1f262d]">
                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{row.label}</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">-</td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">-</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">
                                  {modoEdicao ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={valor}
                                      onChange={(event) =>
                                        handleTarifaEnergiaChange(tarifaContextKey, row.key, 'valor_R$', event.target.value)
                                      }
                                      className="w-full max-w-[160px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                    />
                                  ) : (
                                    formatCurrency(valor)
                                  )}
                                </td>
                              </tr>
                            );
                          }

                          const medicao = (dado as TarifaMedicao).medicao_MWh;
                          const tarifaValor = (dado as TarifaMedicao).tarifa_R$_MWh;
                          const total = (dado as TarifaMedicao).total_R$;

                          return (
                            <tr key={row.key}>
                              <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{row.label}</td>
                              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                                {modoEdicao ? (
                                  <input
                                    type="number"
                                    step="0.001"
                                    value={medicao}
                                    onChange={(event) =>
                                      handleTarifaEnergiaChange(tarifaContextKey, row.key, 'medicao_MWh', event.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                  />
                                ) : (
                                  formatNumber(medicao, {
                                    minimumFractionDigits: 3,
                                    maximumFractionDigits: 3,
                                  })
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                                {modoEdicao ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={tarifaValor}
                                    onChange={(event) =>
                                      handleTarifaEnergiaChange(tarifaContextKey, row.key, 'tarifa_R$_MWh', event.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                  />
                                ) : (
                                  formatCurrency(tarifaValor)
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">
                                {modoEdicao ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={total}
                                    onChange={(event) =>
                                      handleTarifaEnergiaChange(tarifaContextKey, row.key, 'total_R$', event.target.value)
                                    }
                                    className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                  />
                                ) : (
                                  formatCurrency(total)
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedDemanda && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Demanda contratada</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Analise os diferentes cenários de contratação.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {demandaTabs.map((tab) => {
                        const isActive = demandaTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setDemandaTab(tab.id)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isActive
                                ? 'border-yn-orange bg-yn-orange/10 text-yn-orange'
                                : 'border-gray-200 text-gray-600 hover:border-yn-orange/40 hover:text-yn-orange dark:border-[#2b3238] dark:text-gray-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {demandaRows.map((row) => {
                      const detalhe = selectedDemanda[row.key];
                      if (!detalhe) {
                        return null;
                      }

                      return (
                        <div
                          key={row.key}
                          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-[#2b3238] dark:bg-[#111418]"
                        >
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{row.label}</h4>
                          <dl className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                            {'contratada_kW' in detalhe && detalhe.contratada_kW !== undefined && (
                              <div className="flex items-center justify-between gap-3">
                                <dt>Contratada</dt>
                                <dd className="flex-1 text-right font-semibold text-gray-800 dark:text-gray-100">
                                  {modoEdicao ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={detalhe.contratada_kW ?? ''}
                                        onChange={(event) =>
                                          handleDemandaChange(demandaContextKey, row.key, 'contratada_kW', event.target.value)
                                        }
                                        className="w-full max-w-[120px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                      />
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300">kW</span>
                                    </div>
                                  ) : (
                                    <>{formatNumber(detalhe.contratada_kW, { maximumFractionDigits: 0 })} kW</>
                                  )}
                                </dd>
                              </div>
                            )}
                            {'kW' in detalhe && detalhe.kW !== undefined && (
                              <div className="flex items-center justify-between gap-3">
                                <dt>kW</dt>
                                <dd className="flex-1 text-right font-semibold text-gray-800 dark:text-gray-100">
                                  {modoEdicao ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <input
                                        type="number"
                                        step="0.1"
                                        value={detalhe.kW ?? ''}
                                        onChange={(event) => handleDemandaChange(demandaContextKey, row.key, 'kW', event.target.value)}
                                        className="w-full max-w-[120px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                      />
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300">kW</span>
                                    </div>
                                  ) : (
                                    <>{formatNumber(detalhe.kW, { maximumFractionDigits: 0 })} kW</>
                                  )}
                                </dd>
                              </div>
                            )}
                            {'tarifa_R$_kW' in detalhe && detalhe.tarifa_R$_kW !== undefined && (
                              <div className="flex items-center justify-between gap-3">
                                <dt>Tarifa</dt>
                                <dd className="flex-1 text-right font-semibold text-gray-800 dark:text-gray-100">
                                  {modoEdicao ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={detalhe.tarifa_R$_kW ?? ''}
                                        onChange={(event) =>
                                          handleDemandaChange(demandaContextKey, row.key, 'tarifa_R$_kW', event.target.value)
                                        }
                                        className="w-full max-w-[120px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                      />
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300">/kW</span>
                                    </div>
                                  ) : (
                                    <>
                                      {formatCurrency(detalhe.tarifa_R$_kW)}
                                      <span className="text-xs text-gray-500"> /kW</span>
                                    </>
                                  )}
                                </dd>
                              </div>
                            )}
                            {'total_R$' in detalhe && detalhe.total_R$ !== undefined && (
                              <div className="flex items-center justify-between gap-3">
                                <dt>Total</dt>
                                <dd className="flex-1 text-right font-semibold text-gray-800 dark:text-gray-100">
                                  {modoEdicao ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={detalhe.total_R$ ?? ''}
                                      onChange={(event) => handleDemandaChange(demandaContextKey, row.key, 'total_R$', event.target.value)}
                                      className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                    />
                                  ) : (
                                    formatCurrency(detalhe.total_R$)
                                  )}
                                </dd>
                              </div>
                            )}
                            {'valor_R$' in detalhe && detalhe.valor_R$ !== undefined && (
                              <div className="flex items-center justify-between gap-3">
                                <dt>Valor</dt>
                                <dd className="flex-1 text-right font-semibold text-gray-800 dark:text-gray-100">
                                  {modoEdicao ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={detalhe.valor_R$ ?? ''}
                                      onChange={(event) => handleDemandaChange(demandaContextKey, row.key, 'valor_R$', event.target.value)}
                                      className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                    />
                                  ) : (
                                    formatCurrency(detalhe.valor_R$)
                                  )}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Totais mensais</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                        Cenário atual
                      </p>
                      <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-200">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.01"
                            value={simulationData.totais.atual_R$}
                            onChange={(event) => handleTotaisChange('atual_R$', event.target.value)}
                            className="w-full rounded-lg border border-blue-200 bg-white px-2 py-1 text-right text-base font-semibold text-blue-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-blue-900/60 dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatCurrency(simulationData.totais.atual_R$)
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-yn-orange/40 bg-yn-orange/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-yn-orange">Proposta</p>
                      <p className="mt-1 text-2xl font-bold text-yn-orange">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.01"
                            value={simulationData.totais[propostaKey]}
                            onChange={(event) => handleTotaisChange(propostaKey, event.target.value)}
                            className="w-full rounded-lg border border-yn-orange/50 bg-white px-2 py-1 text-right text-base font-semibold text-yn-orange shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-yn-orange/50 dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatCurrency(simulationData.totais[propostaKey])
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-900/10">
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-200">
                        Economia verde
                      </p>
                      <p className="mt-1 text-xl font-semibold text-green-700 dark:text-green-200">
                        {modoEdicao ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={simulationData.totais.economia_percentual_verde}
                              onChange={(event) => handleTotaisChange('economia_percentual_verde', event.target.value)}
                              className="w-full max-w-[120px] rounded-lg border border-green-200 bg-white px-2 py-1 text-right text-sm font-semibold text-green-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-green-900/60 dark:bg-[#0b1014] dark:text-gray-100"
                            />
                            <span className="text-xs font-semibold text-green-700 dark:text-green-200">%</span>
                          </div>
                        ) : (
                          <>{simulationData.totais.economia_percentual_verde}%</>
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                        Economia azul
                      </p>
                      <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-200">
                        {modoEdicao ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={simulationData.totais.economia_percentual_azul}
                              onChange={(event) => handleTotaisChange('economia_percentual_azul', event.target.value)}
                              className="w-full max-w-[120px] rounded-lg border border-emerald-200 bg-white px-2 py-1 text-right text-sm font-semibold text-emerald-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-emerald-900/60 dark:bg-[#0b1014] dark:text-gray-100"
                            />
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">%</span>
                          </div>
                        ) : (
                          <>{simulationData.totais.economia_percentual_azul}%</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Economia temporal</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4 text-sm dark:border-[#2b3238] dark:bg-[#111418]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Modalidade verde
                      </p>
                      <ul className="mt-3 space-y-2">
                        {(
                          [
                            { campo: 'ano_R$' as const, rotulo: '1 ano' },
                            { campo: '3_anos_R$' as const, rotulo: '3 anos' },
                            { campo: '10_anos_R$' as const, rotulo: '10 anos' },
                          ]
                        ).map(({ campo, rotulo }) => {
                          const valor = simulationData.economia_temporal.verde[campo];
                          return (
                            <li key={campo} className="flex items-center justify-between">
                              <span>{rotulo}</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {modoEdicao ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={valor ?? ''}
                                    onChange={(event) =>
                                      handleEconomiaTemporalModalidadeChange('verde', campo, event.target.value)
                                    }
                                    className="w-full max-w-[150px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                  />
                                ) : valor === null ? (
                                  '-'
                                ) : (
                                  formatCurrency(valor)
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 text-sm dark:border-[#2b3238] dark:bg-[#111418]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Modalidade azul
                      </p>
                      <ul className="mt-3 space-y-2">
                        {(
                          [
                            { campo: 'ano_R$' as const, rotulo: '1 ano' },
                            { campo: '3_anos_R$' as const, rotulo: '3 anos' },
                            { campo: '10_anos_R$' as const, rotulo: '10 anos' },
                          ]
                        ).map(({ campo, rotulo }) => {
                          const valor = simulationData.economia_temporal.azul[campo];
                          return (
                            <li key={campo} className="flex items-center justify-between">
                              <span>{rotulo}</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {modoEdicao ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={valor ?? ''}
                                    onChange={(event) =>
                                      handleEconomiaTemporalModalidadeChange('azul', campo, event.target.value)
                                    }
                                    className="w-full max-w-[150px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                  />
                                ) : valor === null ? (
                                  '-'
                                ) : (
                                  formatCurrency(valor)
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-3 dark:border-[#2b3238] dark:bg-[#111418]">
                      <p className="font-semibold text-gray-700 dark:text-gray-200">Economia média</p>
                      <p className="mt-1 text-lg font-bold text-yn-orange">
                        {modoEdicao ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={simulationData.economia_temporal.economia_media_percentual}
                              onChange={(event) => handleEconomiaMediaPercentualChange(event.target.value)}
                              className="w-full max-w-[120px] rounded-lg border border-yn-orange/40 bg-white px-2 py-1 text-right text-sm font-semibold text-yn-orange shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                            <span className="text-xs font-semibold text-yn-orange">%</span>
                          </div>
                        ) : (
                          <>{simulationData.economia_temporal.economia_media_percentual}%</>
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-3 dark:border-[#2b3238] dark:bg-[#111418]">
                      <p className="font-semibold text-gray-700 dark:text-gray-200">Bandeiras tarifárias</p>
                      <ul className="mt-2 space-y-1">
                        {Object.entries(simulationData.economia_temporal.percentuais_economia_bandeiras).map(([chave, valor]) => (
                          <li key={chave} className="flex items-center justify-between gap-3">
                            <span className="capitalize">{chave.replace('_', ' ')}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {modoEdicao ? (
                                <div className="flex items-center justify-end gap-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={valor}
                                    onChange={(event) =>
                                      handleEconomiaTemporalPercentualChange(
                                        chave as keyof EconomiaTemporal['percentuais_economia_bandeiras'],
                                        event.target.value,
                                      )
                                    }
                                    className="w-full max-w-[110px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                                  />
                                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-300">%</span>
                                </div>
                              ) : (
                                `${valor}%`
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                    {Object.entries(simulationData.economia_temporal.valores_economia_10_anos_por_bandeira).map(([chave, valor]) => (
                      <div
                        key={chave}
                        className="rounded-lg border border-gray-200 p-3 dark:border-[#2b3238] dark:bg-[#111418]"
                      >
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{chave.replace('_', ' ')}</p>
                        <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.01"
                              value={valor}
                              onChange={(event) =>
                                handleEconomiaTemporalValorBandeiraChange(
                                  chave as keyof EconomiaTemporal['valores_economia_10_anos_por_bandeira'],
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatCurrency(valor)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Economia ambiental</h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center justify-between">
                      <span>Árvores preservadas</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="1"
                            value={simulationData.economia_ambiental.arvores_preservadas}
                            onChange={(event) => handleEconomiaAmbientalChange('arvores_preservadas', event.target.value)}
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatNumber(simulationData.economia_ambiental.arvores_preservadas)
                        )}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Campos de futebol equivalentes</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.1"
                            value={simulationData.economia_ambiental.campos_futebol_equivalentes}
                            onChange={(event) =>
                              handleEconomiaAmbientalChange('campos_futebol_equivalentes', event.target.value)
                            }
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatNumber(simulationData.economia_ambiental.campos_futebol_equivalentes, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })
                        )}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Toneladas de CO₂ evitadas</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.1"
                            value={simulationData.economia_ambiental.toneladas_carbono_evitadas}
                            onChange={(event) => handleEconomiaAmbientalChange('toneladas_carbono_evitadas', event.target.value)}
                            className="w-full max-w-[140px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatNumber(simulationData.economia_ambiental.toneladas_carbono_evitadas)
                        )}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contexto da proposta</h3>
                  <dl className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <dt>Submercado</dt>
                      <dd className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="text"
                            value={simulationData.contexto_proposta.submercado}
                            onChange={(event) => handleContextoPropostaChange('submercado', event.target.value)}
                            className="w-full max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          simulationData.contexto_proposta.submercado
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Encargos</dt>
                      <dd className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="number"
                            step="0.01"
                            value={simulationData.contexto_proposta.encargos.valor_R$}
                            onChange={(event) => handleEncargosChange(event.target.value)}
                            className="w-full max-w-[160px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          formatCurrency(simulationData.contexto_proposta.encargos.valor_R$)
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Modalidade multa ultrapassagem</dt>
                      <dd className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="text"
                            value={simulationData.multa_ultrapassagem.modalidade}
                            onChange={(event) => handleContextoPropostaChange('modalidade_multa', event.target.value)}
                            className="w-full max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          simulationData.multa_ultrapassagem.modalidade
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Modalidade sobrecontratação</dt>
                      <dd className="font-semibold text-gray-900 dark:text-gray-100">
                        {modoEdicao ? (
                          <input
                            type="text"
                            value={simulationData.sobrecontratacao.modalidade}
                            onChange={(event) => handleContextoPropostaChange('modalidade_sobrecontratacao', event.target.value)}
                            className="w-full max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                          />
                        ) : (
                          simulationData.sobrecontratacao.modalidade
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tarifas de referência</h3>
                  <div className="mt-4 grid gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                    {Object.entries(simulationData.tarifas_referencia).map(([chave, valor]) => (
                      <div key={chave} className="rounded-lg border border-gray-200 p-3 dark:border-[#2b3238] dark:bg-[#111418]">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{chave}</p>
                        <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.01"
                              value={valor}
                              onChange={(event) =>
                                handleTarifasReferenciaChange(chave as keyof TarifasReferencia, event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatCurrency(valor)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tarifas da proposta</h3>
                  <div className="mt-4 grid gap-3 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                    {Object.entries(simulationData.tarifas_proposta).map(([chave, valor]) => (
                      <div key={chave} className="rounded-lg border border-gray-200 p-3 dark:border-[#2b3238] dark:bg-[#111418]">
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{chave}</p>
                        <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                          {modoEdicao ? (
                            <input
                              type="number"
                              step="0.01"
                              value={valor}
                              onChange={(event) =>
                                handleTarifasPropostaChange(chave as keyof TarifasProposta, event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                            />
                          ) : (
                            formatCurrency(valor)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Economia por modalidade</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900/40 dark:bg-green-900/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-200">Verde</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {modoEdicao ? (
                        <input
                          type="number"
                          step="0.01"
                          value={simulationData.economia_anual_modalidades.verde_R$ ?? ''}
                          onChange={(event) => handleEconomiaAnualModalidadesChange('verde_R$', event.target.value)}
                          className="w-full rounded-lg border border-green-200 bg-white px-2 py-1 text-right text-sm font-semibold text-green-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-green-900/60 dark:bg-[#0b1014] dark:text-gray-100"
                        />
                      ) : (
                        formatCurrency(simulationData.economia_anual_modalidades.verde_R$)
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Azul</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {modoEdicao ? (
                        <input
                          type="number"
                          step="0.01"
                          value={simulationData.economia_anual_modalidades.azul_R$ ?? ''}
                          onChange={(event) => handleEconomiaAnualModalidadesChange('azul_R$', event.target.value)}
                          className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1 text-right text-sm font-semibold text-emerald-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-emerald-900/60 dark:bg-[#0b1014] dark:text-gray-100"
                        />
                      ) : (
                        formatCurrency(simulationData.economia_anual_modalidades.azul_R$)
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-[#2b3238] dark:bg-[#111418]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Sobrecontratação</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {modoEdicao ? (
                        <input
                          type="number"
                          step="0.01"
                          value={simulationData.economia_anual_modalidades.sobrecontratacao_verde_R$ ?? ''}
                          onChange={(event) => handleEconomiaAnualModalidadesChange('sobrecontratacao_verde_R$', event.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm font-semibold text-gray-700 shadow-sm focus:border-yn-orange focus:outline-none focus:ring-1 focus:ring-yn-orange dark:border-[#2b3238] dark:bg-[#0b1014] dark:text-gray-100"
                        />
                      ) : (
                        formatCurrency(simulationData.economia_anual_modalidades.sobrecontratacao_verde_R$)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEtapa('upload')}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#2b3238] dark:text-gray-200 dark:hover:bg-[#111418]"
                >
                  Voltar
                </button>
              <button
                type="button"
                onClick={calcularSimulacao}
                disabled={!canProceedToSimulation}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition ${
                  canProceedToSimulation
                    ? 'bg-yn-orange text-white hover:bg-yn-orange/90'
                    : 'cursor-not-allowed bg-gray-200 text-gray-500'
                }`}
              >
                <Calculator size={18} />
                Calcular simulação
              </button>
              </div>
            </>
          )}
        </section>
      )}
      {etapa === 'simulacao' && simulationData && (
        <section className="space-y-6">
          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Resultados da simulação</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-left dark:border-green-900/40 dark:bg-green-900/10">
                <p className="text-sm text-gray-600 dark:text-gray-300">Economia anual estimada</p>
                <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(simulationData.economia_temporal.verde.ano_R$)}
                </p>
                <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-300">
                  {simulationData.totais.economia_percentual_verde}% de redução
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-left dark:border-blue-900/40 dark:bg-blue-900/10">
                <p className="text-sm text-gray-600 dark:text-gray-300">Custo atual médio</p>
                <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-300">
                  {formatCurrency(simulationData.totais.atual_R$)}
                </p>
                <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-200">Mercado cativo</p>
              </div>
              <div className="rounded-lg border border-yn-orange/40 bg-yn-orange/10 p-4 text-left">
                <p className="text-sm text-gray-600">Custo mercado livre</p>
                <p className="mt-1 text-3xl font-bold text-yn-orange">
                  {formatCurrency(simulationData.totais.proposta_verde_R$)}
                </p>
                <p className="mt-1 text-sm font-medium text-yn-orange">Modalidade verde</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-[#2b3238]">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Impacto ambiental</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>🌱 Árvores preservadas: <strong>{formatNumber(simulationData.economia_ambiental.arvores_preservadas)}</strong></li>
                  <li>🏞️ Campos equivalentes: <strong>{formatNumber(simulationData.economia_ambiental.campos_futebol_equivalentes, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}</strong></li>
                  <li>🌍 CO₂ evitado: <strong>{formatNumber(simulationData.economia_ambiental.toneladas_carbono_evitadas)}</strong> t</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-[#2b3238]">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Parâmetros do contrato</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>📅 Modalidade sugerida: <strong>{simulationData.cliente.modalidade}</strong></li>
                  <li>⚡ Geração própria: <strong>{possuiGeracaoSolar}</strong></li>
                  <li>📊 Gestão mensal: <strong>{formatCurrency(simulationData.custos_adicionais.gestao_mensal_R$)}</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setEtapa('dados')}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#2b3238] dark:text-gray-200 dark:hover:bg-[#111418]"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={gerarProposta}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-yn-orange px-5 py-2 text-sm font-semibold text-white transition hover:bg-yn-orange/90"
            >
              <FileText size={18} />
              Gerar proposta
            </button>
          </div>
        </section>
      )}
      {etapa === 'proposta' && (
        <section className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-[#2b3238] dark:bg-[#1a1f24]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-600">
            <Check size={40} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Proposta gerada com sucesso!</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Faça o download da apresentação comercial ou exporte os dados para planilha.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-yn-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-yn-orange/90"
            >
              <Download size={18} />
              Baixar proposta (PDF)
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-yn-orange/40 px-6 py-3 text-sm font-semibold text-yn-orange transition hover:bg-yn-orange/10"
            >
              <Download size={18} />
              Exportar dados (XLSX)
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-6 text-sm font-medium text-gray-600 underline transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Iniciar nova simulação
          </button>
        </section>
      )}
    </div>
  );
}
