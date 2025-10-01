import React, { useMemo, useState } from 'react';
import ModalEnergyDetails from '../components/ModalEnergyDetails';
import { Link, useParams } from 'react-router-dom';
import { useSimulationClientes } from '../hooks/useSimulationClientes';

export default function SimulationClientPage() {
  const { clientId } = useParams();
  const { clientes, loading, error, isUsingFallback } = useSimulationClientes();

  const cliente = useMemo(
    () => clientes.find((c) => c.id.toString() === (clientId ?? '')),
    [clientes, clientId]
  );

  const backLinkClass =
    'inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2b3238] rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-[#232932] transition-colors';

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          to="/leads"
          className={backLinkClass}
        >
          ← Voltar
        </Link>
        <div className="rounded-lg border border-gray-200 dark:border-[#2b3238] bg-white dark:bg-[#1a1f24] p-6 text-sm text-gray-600 dark:text-gray-300">
          Carregando dados do cliente...
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="space-y-4">
        <Link
          to="/leads"
          className={backLinkClass}
        >
          ← Voltar
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Cliente não encontrado.
        </div>
      </div>
    );
  }

  // Helpers e simulação de custos (placeholders visuais)
  const parsePercent = (txt: string) => {
    const n = parseFloat(txt.replace('%', '').replace(',', '.'));
    return isNaN(n) ? 0 : n / 100;
  };
  const impostoRate = parsePercent(cliente.imposto);
  const PIS = 0.0108;
  const COFINS = 0.05;
  const ICMS = 0.17;

  // Tarifas de referência (exemplo simples)
  const tarifaAtual = 0.62; // R$/kWh
  const tarifaCativo = 0.50; // R$/kWh (estimada)

  const consumoLiquido = Math.max(cliente.consumo - cliente.geracao, 0);

  // Itens de linha (resumo + detalhes) para as duas tabelas
  type Item = { label: string; quantidade: number; tarifa: number };
  const baseItem: Item = { label: 'Energia (kWh)', quantidade: consumoLiquido, tarifa: tarifaAtual };
  const itensDetalheAtual: Item[] = [
    { label: 'Encargo Ponta', quantidade: consumoLiquido * 0.05, tarifa: 0.20 },
    { label: 'Encargo Fora Ponta', quantidade: consumoLiquido * 0.15, tarifa: 0.10 },
    { label: 'Demanda', quantidade: consumoLiquido * 0.02, tarifa: 0.30 },
    { label: 'Demanda sem ICMS', quantidade: consumoLiquido * 0.01, tarifa: 0.30 },
    { label: 'Energia Reativa Ponta', quantidade: consumoLiquido * 0.01, tarifa: 0.35 },
    { label: 'Energia Reativa Fora Ponta', quantidade: consumoLiquido * 0.06, tarifa: 0.35 },
    { label: 'CIP', quantidade: consumoLiquido * 0.005, tarifa: 0.05 },
  ];
  const itensDetalheCativo: Item[] = itensDetalheAtual.map((i) => ({ ...i, tarifa: i.tarifa * 0.85 }));

  const [showAtual, setShowAtual] = useState(false);
  const [showCativo, setShowCativo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalComImposto = (quantidade: number, tarifa: number) =>
    quantidade * tarifa * (1 + PIS + COFINS + ICMS + impostoRate);

  const totalTabela = (items: Item[]) =>
    items.reduce((acc, it) => acc + totalComImposto(it.quantidade, it.tarifa), 0);

  const totalAtual = totalTabela([baseItem, ...(showAtual ? itensDetalheAtual : [])]);
  const totalCativo = totalTabela([
    { ...baseItem, tarifa: tarifaCativo },
    ...(showCativo ? itensDetalheCativo : []),
  ]);

  const economia = Math.max(totalAtual - totalCativo, 0);
  const economiaPct = totalAtual > 0 ? (economia / totalAtual) * 100 : 0;

  const fBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fKwh = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh`;

  const Linha = ({
    label,
    quantidade,
    tarifa,
  }: { label: string; quantidade: number; tarifa: number }) => {
    const tarifaComImposto = tarifa * (1 + PIS + COFINS + ICMS + impostoRate);
    const total = quantidade * tarifaComImposto;
    return (
      <tr className="border-b border-gray-100 dark:border-[#2b3238]">
        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">{label}</td>
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-right">{fKwh(quantidade)}</td>
        <td className="px-4 py-2 text-sm text-right text-gray-800 dark:text-gray-200">{fBRL(tarifa)}</td>
        <td className="px-4 py-2 text-sm text-right text-gray-800 dark:text-gray-200">{fBRL(tarifaComImposto)}</td>
        <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{fBRL(total)}</td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {isUsingFallback && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Não foi possível conectar ao BFF mock. Exibindo dados de demonstração.
          {error ? ` (${error})` : ''}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/leads"
            className={backLinkClass}
          >
            ← Voltar
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {cliente.nome}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Balanço energético, custos atuais e economia estimada.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-yn-orange hover:bg-yn-orange/90 text-white px-4 py-2 rounded-lg"
          >
            Abrir em popup
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1f24] rounded-xl p-5 border border-gray-200 dark:border-[#2b3238] shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300">Consumo</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{fKwh(cliente.consumo)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1f24] rounded-xl p-5 border border-gray-200 dark:border-[#2b3238] shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300">Geração</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{fKwh(cliente.geracao)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1f24] rounded-xl p-5 border border-gray-200 dark:border-[#2b3238] shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300">Custo Atual</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{fBRL(totalAtual)}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1f24] rounded-xl p-5 border border-gray-200 dark:border-[#2b3238] shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300">Custo Estimado</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{fBRL(totalCativo)}</p>
        </div>
      </div>

      {/* Economia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white dark:bg-[#1a1f24] rounded-xl border border-gray-200 dark:border-[#2b3238] shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-[#2b3238] flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Economia de Migração</h3>
            <span className="text-sm text-yn-orange">estimativa</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-200">Economia</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-200">{fBRL(economia)}</p>
            </div>
            <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-200">Percentual</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{economiaPct.toFixed(0)}%</p>
            </div>
            <div className="rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-orange-700 dark:text-orange-200">Saldo Energético</p>
              <p className={`text-2xl font-bold ${cliente.balanco >= 0 ? 'text-green-600' : 'text-red-600'}`}>{cliente.balanco} kWh</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1f24] rounded-xl border border-gray-200 dark:border-[#2b3238] shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-[#2b3238]">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Impostos</h3>
          </div>
          <ul className="p-5 space-y-2 text-sm">
            <li className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">PIS</span><span className="font-medium">1,08%</span></li>
            <li className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">COFINS</span><span className="font-medium">5,00%</span></li>
            <li className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">ICMS</span><span className="font-medium">17%</span></li>
            <li className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">Alíquota extra</span><span className="font-medium">{cliente.imposto}</span></li>
          </ul>
        </div>
      </div>

      {/* Tabelas estilo planilha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1a1f24] rounded-2xl border border-gray-200 dark:border-[#2b3238] shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-yn-blue text-white font-medium flex items-center justify-between">
            <span>Fatura Atual</span>
            <button
              onClick={() => setShowAtual((s) => !s)}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full"
            >
              {showAtual ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-[#161b20] sticky top-0 z-10">
                <tr className="text-left text-xs uppercase text-gray-600 dark:text-gray-300">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Quantidade</th>
                  <th className="px-4 py-2 text-right">Tarifa</th>
                  <th className="px-4 py-2 text-right">Tarifa c/ Imp.</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <Linha label={baseItem.label} quantidade={baseItem.quantidade} tarifa={baseItem.tarifa} />
                {showAtual && itensDetalheAtual.map((it) => (
                  <Linha key={it.label} label={it.label} quantidade={it.quantidade} tarifa={it.tarifa} />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-[#161b20]">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100" colSpan={4}>Custos Realizados</td>
                  <td className="px-4 py-3 text-right font-bold text-[#1F2775] dark:text-white">{fBRL(totalAtual)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1f24] rounded-2xl border border-gray-200 dark:border-[#2b3238] shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-yn-blue text-white font-medium flex items-center justify-between">
            <span>Simulação Cativo</span>
            <button
              onClick={() => setShowCativo((s) => !s)}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full"
            >
              {showCativo ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-[#161b20] sticky top-0 z-10">
                <tr className="text-left text-xs uppercase text-gray-600 dark:text-gray-300">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Quantidade</th>
                  <th className="px-4 py-2 text-right">Tarifa</th>
                  <th className="px-4 py-2 text-right">Tarifa c/ Imp.</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <Linha label="Energia (kWh)" quantidade={baseItem.quantidade} tarifa={tarifaCativo} />
                {showCativo && itensDetalheCativo.map((it) => (
                  <Linha key={it.label} label={it.label} quantidade={it.quantidade} tarifa={it.tarifa} />
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#E0F0FB] dark:bg-blue-900/30">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100" colSpan={4}>Custo Estimado</td>
                  <td className="px-4 py-3 text-right font-bold text-[#1F2775] dark:text-white">{fBRL(totalCativo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      <ModalEnergyDetails
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        consumoLiquido={consumoLiquido}
        tarifaAtual={tarifaAtual}
        tarifaCativo={tarifaCativo}
        impostoExtraRate={impostoRate}
      />
    </div>
  );
}
