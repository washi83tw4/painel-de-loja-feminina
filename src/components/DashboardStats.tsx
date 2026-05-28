import { Package, DollarSign, Layers, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface DashboardStatsProps {
  products: Product[];
}

export default function DashboardStats({ products }: DashboardStatsProps) {
  // Calculations
  const totalProducts = products.length;
  
  const totalStockPieces = products.reduce((sum, item) => sum + Number(item.estoque || 0), 0);

  const totalValuation = products.reduce((sum, item) => {
    const price = Number(item.preco || 0);
    const stock = Number(item.estoque || 0);
    return sum + (price * stock);
  }, 0);

  const lowStockThreshold = 10;
  const lowStockItemsCount = products.filter(item => Number(item.estoque || 0) <= lowStockThreshold).length;

  const stats = [
    {
      id: 'stat-total-products',
      title: 'Total de Itens',
      value: totalProducts,
      subtitle: 'Modelos no catálogo',
      icon: Package,
      color: 'text-pink-600 bg-pink-50 border border-pink-100',
    },
    {
      id: 'stat-total-stock',
      title: 'Estoque de Peças',
      value: totalStockPieces.toLocaleString('pt-BR'),
      subtitle: 'Unidades físicas totais',
      icon: Layers,
      color: 'text-emerald-700 bg-emerald-50 border border-emerald-100',
    },
    {
      id: 'stat-valuation',
      title: 'Patrimônio em Estoque',
      value: totalValuation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      subtitle: 'Soma de Preço × Estoque',
      icon: DollarSign,
      color: 'text-sky-700 bg-sky-50 border border-sky-100',
    },
    {
      id: 'stat-low-stock',
      title: 'Critério Alerta Estoque',
      value: lowStockItemsCount,
      subtitle: `Produtos com ${lowStockThreshold} un. ou menos`,
      icon: AlertTriangle,
      color: lowStockItemsCount > 0 
        ? 'text-amber-700 bg-amber-50 border border-amber-100 animate-pulse' 
        : 'text-slate-500 bg-slate-100 border border-slate-200',
    }
  ];

  return (
    <div id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            id={stat.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1 font-sans tracking-tight">
                {stat.value}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-normal">{stat.subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.color} shrink-0 ml-2`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
