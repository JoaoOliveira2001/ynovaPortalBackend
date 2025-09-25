import { http, HttpResponse } from 'msw';

export type Contrato = {
  id: string;
  numero: string;
  cliente: string;
  cnpj?: string;
  segmento?: string;
  contato?: string;
  status: 'ATIVO' | 'INATIVO';
  ciclo_faturamento: string; // YYYY-MM
  volume_contratado_mwh: number;
  preco_r_mwh: number;
  fonte: 'Convencional' | 'Incentivada';
  flexibilidade_pct: number; // ex.: 0.05 = 5%
};

// Generate fixtures across 3+ months
const months = ['2025-06', '2025-07', '2025-08'];
const clientes = ['Energia Alfa', 'Comercial Beta', 'Indústria Gama', 'Grupo Delta', 'Cooperativa Épsilon'];
const segmentos = ['Industrial', 'Comercial', 'Serviços', 'Agro', 'Logística'];
const contatos = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Souza', 'Carlos Lima'];
const fontes: Contrato['fonte'][] = ['Convencional', 'Incentivada'];

const mockEnergyClients = [
  {
    id: 1,
    nome: 'Cliente Energia A',
    bandeira: 'Verde',
    imposto: '12%',
    consumo: '1.000 kWh',
    geracao: '1.200 kWh',
    saldo: 'Saldo +200 kWh',
  },
  {
    id: 2,
    nome: 'Cliente Energia B',
    bandeira: 'Amarela',
    imposto: '15%',
    consumo: '800 kWh',
    geracao: '600 kWh',
    saldo: 'Saldo -200 kWh',
  },
  {
    id: 3,
    nome: 'Cliente Energia C',
    bandeira: 'Vermelha',
    imposto: '10%',
    consumo: '950 kWh',
    geracao: '900 kWh',
    saldo: 'Saldo -50 kWh',
  },
];

const allContratos: Contrato[] = Array.from({ length: 24 }).map((_, i) => {
  const mes = months[i % months.length];
  const fonte = fontes[i % fontes.length];
  return {
    id: String(i + 1),
    numero: `CT-${String(1000 + i)}`,
    cliente: clientes[i % clientes.length],
    cnpj: `${String(12).padStart(2,'0')}.${String(345).padStart(3,'0')}.${String(678 + (i%300)).padStart(3,'0')}/${String(1 + (i%999)).padStart(4,'0')}-9${i%10}`,
    segmento: segmentos[i % segmentos.length],
    contato: contatos[i % contatos.length],
    status: i % 4 === 0 ? 'INATIVO' : 'ATIVO',
    ciclo_faturamento: mes,
    volume_contratado_mwh: 80 + (i % 10) * 10,
    preco_r_mwh: 210 + (i % 7) * 5,
    fonte,
    flexibilidade_pct: [0.05, 0.1, 0.15][i % 3],
  };
});

function seededRng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function gerarSerie24Meses(seedStr: string, base: number, amplitude: number) {
  const seed = Array.from(seedStr).reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = seededRng(seed);
  const hoje = new Date();
  const pontos: { competencia: string; valor: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const noise = (rnd() - 0.5) * amplitude;
    const valor = Math.max(0, base + noise);
    pontos.push({ competencia: `${yy}-${mm}`, valor: Number(valor.toFixed(2)) });
  }
  return pontos;
}

export const handlers = [
  http.get('https://n8n.ynovamarketplace.com/webhook-test/mockScde', () =>
    HttpResponse.json(mockEnergyClients),
  ),
  http.get('/api/webhook-test/mockScde', () => HttpResponse.json(mockEnergyClients)),
  // Listagem de contratos com paginação
  http.get('/api/contratos', ({ request }) => {
    const url = new URL(request.url);
    const mes = url.searchParams.get('mes') || '';
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '10');
    const include = url.searchParams.get('include') || '';
    const ciclo = url.searchParams.get('ciclo') || mes;

    const filtered = mes
      ? allContratos.filter((c) => c.ciclo_faturamento === mes)
      : allContratos;

    const totalItens = filtered.length;
    const totalPaginas = Math.max(1, Math.ceil(totalItens / pageSize));
    const start = (page - 1) * pageSize;
    const contratosBase = filtered.slice(start, start + pageSize);

    // Helper: consumo real do ciclo (alguma variação em torno do contratado)
    const consumoRealDoCiclo = (id: string, mesRef: string, contratado: number) => {
      const seed = Array.from(id + ':' + (mesRef || '0000-00'))
        .reduce((a, c) => a + c.charCodeAt(0), 0);
      const rnd = seededRng(seed)();
      // 12% de chance de não haver dado ainda
      if (rnd < 0.12) return undefined as number | undefined;
      // Variação entre 90% e 140% do contratado
      const fator = 0.9 + rnd * 0.5;
      return Number((contratado * fator).toFixed(2));
    };

    const contratos = contratosBase.map((c) => {
      const contratado = c.volume_contratado_mwh;
      const limite = contratado * (1 + c.flexibilidade_pct);
      const consumoReal = consumoRealDoCiclo(c.id, mes, contratado);

      let status_oportunidade_contrato: 'COM' | 'SEM' | 'SOLICITAR' = 'SOLICITAR';
      let observacao_oportunidade: string | undefined = undefined;

      if (consumoReal === undefined) {
        status_oportunidade_contrato = 'SOLICITAR';
      } else if (consumoReal > limite) {
        status_oportunidade_contrato = 'COM';
        const pct = ((consumoReal - limite) / limite) * 100;
        observacao_oportunidade = `${pct.toFixed(0)}% acima do limite no ciclo`;
      } else {
        status_oportunidade_contrato = 'SEM';
      }

      return {
        ...c,
        status_oportunidade_contrato,
        observacao_oportunidade,
      };
    });

    // Specialized payload for optimization (top opportunities)
    if (include === 'otimizacao-contrato') {
      // For this view, compute metrics using ciclo parameter
      const mapped = filtered.map((c) => {
        const contratado = c.volume_contratado_mwh;
        const limite_superior = contratado * (1 + c.flexibilidade_pct);
        const consumo_acumulado = consumoRealDoCiclo(c.id, ciclo, contratado);
        const diferenca_percentual_vs_limite =
          consumo_acumulado === undefined
            ? null
            : ((consumo_acumulado - limite_superior) / limite_superior) * 100;
        let status: 'COM' | 'SEM' | 'SOLICITAR' = 'SOLICITAR';
        let observacao: string | undefined;
        if (consumo_acumulado === undefined) {
          status = 'SOLICITAR';
        } else if (consumo_acumulado > limite_superior) {
          status = 'COM';
          observacao = `${Math.round(
            ((consumo_acumulado - limite_superior) / limite_superior) * 100
          )}% acima do limite`;
        } else {
          status = 'SEM';
        }
        return {
          id: c.id,
          numero: c.numero,
          cliente: c.cliente,
          status_oportunidade_contrato: status,
          observacao_oportunidade: observacao,
          consumo_contrato: {
            consumo_contratado: contratado,
            flexibilidade: c.flexibilidade_pct,
            limite_superior,
            consumo_acumulado: consumo_acumulado ?? null,
            diferenca_percentual_vs_limite,
          },
        };
      });

      const onlyCOM = mapped.filter(
        (m) => m.status_oportunidade_contrato === 'COM'
      );
      onlyCOM.sort(
        (a, b) =>
          (b.consumo_contrato.diferenca_percentual_vs_limite || -Infinity) -
          (a.consumo_contrato.diferenca_percentual_vs_limite || -Infinity)
      );

      const top = onlyCOM.slice(0, Number(url.searchParams.get('pageSize') || '5'));
      return HttpResponse.json({
        contratos: top,
        paginacao: { paginaAtual: 1, totalPaginas: 1, totalItens: top.length },
      });
    }

    // Gerar resumo de conformidades por contrato
    const toResumo = (id: string) => {
      const seed = Array.from('resumo:' + id).reduce((a, c) => a + c.charCodeAt(0), 0);
      const rnd = seededRng(seed);
      const pick = <T extends string>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
      const maybe = <T extends string>(arr: readonly T[]): T | null => (rnd() < 0.15 ? null : pick(arr));
      const s1 = maybe(['Conforme', 'Divergente'] as const);
      const s2 = maybe(['Conforme', 'Divergente'] as const);
      const s3 = maybe(['Conforme', 'Divergente'] as const);
      return {
        nf_energia: (s1 ?? 'Indefinido') as 'Conforme' | 'Divergente' | 'Indefinido',
        nf_icms: (s2 ?? 'Indefinido') as 'Conforme' | 'Divergente' | 'Indefinido',
        fatura: (s3 ?? 'Indefinido') as 'Conforme' | 'Divergente' | 'Indefinido',
      };
    };

    const contratosComResumo = contratos.map((c) => ({
      ...c,
      resumo_conformidades: toResumo(c.id),
    }));

    return HttpResponse.json({
      contratos: contratosComResumo,
      paginacao: { paginaAtual: page, totalPaginas, totalItens },
    });
  }),

  // Dashboard overview agregada por mês
  http.get('/api/dashboard/overview', ({ request }) => {
    const url = new URL(request.url);
    const mes = url.searchParams.get('mes') || '';
    const seed = Array.from('ov:' + mes).reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = seededRng(seed);

    const totalContratosAtivos = allContratos.filter((c) => c.status === 'ATIVO').length;
    // Distribuição simulada e coerente
    const base = [
      Math.floor(rnd() * 30) + 20, // Subutilizado
      Math.floor(rnd() * 40) + 30, // Conforme
      Math.floor(rnd() * 20) + 10, // Excedente
      Math.floor(rnd() * 10) + 5,  // Indefinido
    ];
    const soma = base.reduce((a, b) => a + b, 0);
    const normaliza = (v: number) => Math.round((v / soma) * totalContratosAtivos);

    const distribuicaoConformidade = {
      Subutilizado: normaliza(base[0]),
      Conforme: normaliza(base[1]),
      Excedente: normaliza(base[2]),
      Indefinido: normaliza(base[3]),
    } as const;

    const totalOportunidades = Math.max(
      0,
      Math.min(
        totalContratosAtivos,
        Math.round((distribuicaoConformidade.Excedente + distribuicaoConformidade.Indefinido * 0.2) * (0.8 + rnd() * 0.4))
      )
    );
    const totalDivergenciasNF = Math.floor(rnd() * 20) + 5;
    const totalDivergenciasFatura = Math.floor(rnd() * 15) + 5;

    return HttpResponse.json({
      totalContratosAtivos,
      distribuicaoConformidade,
      totalOportunidades,
      totalDivergenciasNF,
      totalDivergenciasFatura,
    });
  }),

  // Dashboard inteligência agregada por mês
  http.get('/api/dashboard/inteligencia', ({ request }) => {
    const url = new URL(request.url);
    const mes = url.searchParams.get('mes') || '';
    const seed = Array.from('intel:' + mes).reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = seededRng(seed);

    function trio(base: number) {
      const v = Math.max(0, Math.floor(base * (0.6 + rnd())));
      const a = Math.max(0, Math.floor(base * (0.2 + rnd() * 0.4)));
      const r = Math.max(0, Math.floor(base * (0.1 + rnd() * 0.3)));
      return { verde: v, amarelo: a, vermelho: r } as const;
    }

    return HttpResponse.json({
      demanda: trio(20),
      modalidade_tarifaria: trio(15),
      energia_reativa: trio(12),
      contrato: trio(18),
    });
  }),

  // Dashboard conformidades (NF e Fatura) por mês
  http.get('/api/dashboard/conformidades', ({ request }) => {
    const url = new URL(request.url);
    const mes = url.searchParams.get('mes') || '';
    const seed = Array.from('conf:' + mes).reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = seededRng(seed);

    // Helper: gera um subconjunto pseudo-aleatório dos contratos ativos
    const ativos = allContratos.filter((c) => c.status === 'ATIVO');
    const shuffled = [...ativos].sort(() => rnd() - 0.5);
    const pickN = (n: number) => shuffled.slice(0, Math.min(n, shuffled.length));

    // NF divergentes: divergente se energia ou ICMS marcado assim
    const nf_divergentes = pickN(8)
      .map((c) => {
        const energiaDivergente = rnd() > 0.5;
        const icmsDivergente = rnd() > 0.6;
        const valor_energia = Number((1000 + rnd() * 4000).toFixed(2));
        const valor_icms = Number((200 + rnd() * 800).toFixed(2));
        const obs = (energiaDivergente || icmsDivergente)
          ? (energiaDivergente ? 'Energia com diferença vs cálculo. ' : '') +
            (icmsDivergente ? 'ICMS em desacordo com base.' : '')
          : undefined;
        return {
          id: c.id,
          numero: c.numero,
          cliente: c.cliente,
          status_nf: {
            energia: energiaDivergente ? 'Divergente' : 'Conforme',
            icms: icmsDivergente ? 'Divergente' : 'Conforme',
          },
          valores_nf: {
            valor_energia,
            valor_icms,
          },
          observacao: obs,
        };
      })
      .filter((x) => x.status_nf.energia === 'Divergente' || x.status_nf.icms === 'Divergente')
      .slice(0, 5);

    // Fatura divergentes: divergente se demanda > 105% da contratada ou outros campos sinalizados
    const fatura_divergentes = pickN(8)
      .map((c) => {
        const regra = 1.05 as const;
        const contratada = 300 + Math.floor(rnd() * 200);
        // força alguns casos acima da tolerância
        const fator = rnd() > 0.5 ? 1.06 + rnd() * 0.1 : 0.95 + rnd() * 0.09;
        const cobrada = Number((contratada * fator).toFixed(2));
        const demandaDiv = cobrada > contratada * regra;
        const tusdDiv = rnd() > 0.75; // alguns casos
        const icmsDiv = rnd() > 0.8;
        const obs = demandaDiv
          ? `Cobrança ${(100 * (cobrada / contratada)).toFixed(0)}% da contratada`
          : undefined;
        return {
          id: c.id,
          numero: c.numero,
          cliente: c.cliente,
          status_fatura: {
            demanda: demandaDiv ? 'Divergente' : 'Conforme',
            tusd: tusdDiv ? 'Divergente' : 'Conforme',
            icms: icmsDiv ? 'Divergente' : 'Conforme',
          },
          regra_tolerancia_demanda: 1.05 as 1.05,
          observacao: obs,
        };
      })
      .filter((f) => Object.values(f.status_fatura).includes('Divergente'))
      .slice(0, 5);

    return HttpResponse.json({ nf_divergentes, fatura_divergentes });
  }),

  // Detalhe do contrato
  http.get('/api/contratos/:id', ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    if (url.searchParams.get('fail') === '1') {
      return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 });
    }

    const seed = Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0);
    const rnd = seededRng(seed);
    const inicio = new Date(2024, Math.floor(rnd() * 12), 1);
    const fim = new Date(inicio.getFullYear() + 2, inicio.getMonth(), 1);

    const fornecedor = ['Fornecedor A', 'Fornecedor B', 'Fornecedor C'][Math.floor(rnd() * 3)];
    const fonte: 'Convencional' | 'Incentivada' = rnd() > 0.5 ? 'Convencional' : 'Incentivada';
    const precoBase = 220 + Math.floor(rnd() * 60);
    const reajuste = precoBase * (1 + (rnd() * 0.15 - 0.05));
    const volume = 1000 + Math.floor(rnd() * 4000);
    const sazonalizacao = { jan: 1, fev: 1, mar: 1, abr: 1, mai: 1, jun: 1, jul: 1, ago: 1, set: 1, out: 1, nov: 1, dez: 1 };
    const flex = [0.05, 0.1, 0.15][Math.floor(rnd() * 3)];

    const economia = Math.round(rnd() * 2_000_000) / 100; // até 20k
    const custosLivre = Math.round((50000 + rnd() * 50000) * 100) / 100;
    const custosCativo = Math.round((40000 + rnd() * 40000) * 100) / 100;
    const custosEncargos = Math.round((10000 + rnd() * 15000) * 100) / 100;
    const bandeiras = ['Verde', 'Amarela', 'Vermelha 1', 'Vermelha 2'];
    const bandeira = bandeiras[Math.floor(rnd() * bandeiras.length)];
    const te = 0.45 + rnd() * 0.2;
    const tusd = 0.35 + rnd() * 0.25;

    const status_nf: 'Conforme' | 'Divergente' | 'Indefinido' = (['Conforme', 'Divergente', 'Indefinido'] as const)[Math.floor(rnd() * 3)];
    const status_fatura: 'Conforme' | 'Divergente' = (['Conforme', 'Divergente'] as const)[Math.floor(rnd() * 2)];

    const indicadores = ((): any[] => {
      const arr: any[] = [];
      const pickStatus = () => (['verde', 'amarelo', 'vermelho'] as const)[Math.floor(rnd() * 3)];
      arr.push({ tipo: 'DEMANDA', status: pickStatus(), mensagem: 'Diferença recorrente entre demanda contratada e medida', acao: { tipo: 'abrir_modal', rotulo: 'Propor otimização', modalId: 'otimizacao-demanda' } });
      arr.push({ tipo: 'MODALIDADE_TARIFARIA', status: pickStatus(), mensagem: 'Simulação indica economia migrando de modalidade', acao: { tipo: 'link', rotulo: 'Ver simulação', url: 'https://exemplo.ynova/analises/modalidade' } });
      arr.push({ tipo: 'ENERGIA_REATIVA', status: pickStatus(), mensagem: 'Excesso de energia reativa identificado', acao: { tipo: 'abrir_modal', rotulo: 'Propor correção', modalId: 'reativa' } });
      arr.push({ tipo: 'CONTRATO', status: pickStatus(), mensagem: 'Consumo acima da flexibilidade contratual', acao: { tipo: 'link', rotulo: 'Abrir proposta', url: 'https://exemplo.ynova/analises/contrato' } });
      return arr;
    })();

    return HttpResponse.json({
      dados_contrato: {
        vigencia: { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) },
        fornecedor,
        fonte,
        preco_contratado: Number(precoBase.toFixed(2)),
        preco_reajustado: Number(reajuste.toFixed(2)),
        volume_total: volume,
        sazonalizacao,
        flexibilidade_pct: flex,
      },
      financeiros: {
        economia_acumulada: economia,
        custo_por_origem: { livre: custosLivre, cativo: custosCativo, encargos: custosEncargos },
        bandeira_atual: bandeira,
        tarifas: { te: Number(te.toFixed(3)), tusd: Number(tusd.toFixed(3)) },
      },
      // Conformidades detalhadas
      nf_fornecedora: {
        valor_nf_energia: Number((precoBase * 10 + rnd() * 1000).toFixed(2)),
        valor_calculado_energia: Number((precoBase * 10).toFixed(2)),
        status_energia: (['Conforme', 'Divergente'] as const)[Math.floor(rnd() * 2)],
        valor_documento_icms: Number((1000 + rnd() * 500).toFixed(2)),
        detalhes_icms: rnd() > 0.5 ? 'Base ICMS divergente devido a isenção parcial.' : undefined,
        status_icms: (['Conforme', 'Divergente'] as const)[Math.floor(rnd() * 2)],
      },
      fatura_distribuidora: {
        demanda_cobrada: Number((300 + rnd() * 200).toFixed(2)),
        demanda_contratada: Number((300 + rnd() * 100).toFixed(2)),
        regra_pct_tolerancia: 1.05 as 1.05,
        status: (['Conforme', 'Divergente'] as const)[Math.floor(rnd() * 2)],
        observacao: rnd() > 0.5 ? 'Cobrança 108% da contratada' : undefined,
      },
      status_conformidades_resumo: {
        nf_fornecedora: status_nf,
        fatura_distribuidora: status_fatura,
      },
      indicadores,
    });
  }),

  // Séries históricas do contrato
  http.get('/api/contratos/:id/ciclos', ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    const serie = url.searchParams.get('serie') || 'demanda';
    if (url.searchParams.get('fail') === '1') {
      return HttpResponse.json({ message: 'Erro simulado' }, { status: 500 });
    }
    const base = serie === 'demanda' ? 500 : 1200;
    const amp = serie === 'demanda' ? 200 : 600;
    const pontos = gerarSerie24Meses(id + ':' + serie, base, amp);
    return HttpResponse.json({ pontos });
  }),
];

