import { useBalancoEnergetico } from '../hooks/useBalancoEnergetico';

export default function BalancoEnergeticoPage() {
  const { data, isLoading, error } = useBalancoEnergetico();

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro ao carregar os dados</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Balanço Energético</h1>
      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Cliente</th>
            <th className="p-2">Fornecedor</th>
            <th className="p-2">Consumo (MWh)</th>
            <th className="p-2">Preço</th>
            <th className="p-2">Reajustado</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{item.cliente}</td>
              <td className="p-2">{item.fornecedor ?? '-'}</td>
              <td className="p-2">{item.consumo ?? '-'}</td>
              <td className="p-2">{item.preco ?? '-'}</td>
              <td className="p-2">{item.reajustado ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
