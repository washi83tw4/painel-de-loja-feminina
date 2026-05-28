import { useState } from 'react';
import { Search, Edit2, Trash2, SlidersHorizontal, AlertCircle, ShoppingBag, ArrowUpDown } from 'lucide-react';
import { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  onEditClick: (product: Product) => void;
  onDeleteClick: (id: string, name: string) => void;
  onAddClick: () => void;
}

type SortField = 'nome' | 'preco' | 'estoque' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function ProductTable({ products, onEditClick, onDeleteClick, onAddClick }: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // List unique categories for filter select dropdown
  const categories = ['Todas', ...Array.from(new Set(products.map((p) => p.categoria)))];

  // Filter & Search Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descricao && product.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.tamanho.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || product.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA: any = a[sortField] || '';
    let valB: any = b[sortField] || '';

    if (sortField === 'preco' || sortField === 'estoque') {
      valA = Number(valA);
      valB = Number(valB);
    } else if (sortField === 'created_at') {
      valA = a.created_at ? new Date(a.created_at).getTime() : 0;
      valB = b.created_at ? new Date(b.created_at).getTime() : 0;
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStockStatus = (stockValue: number) => {
    const stock = Number(stockValue);
    if (stock === 0) {
      return { label: 'Indisponível', bg: 'bg-rose-50 border-rose-100 text-rose-700', text: 'Esgotado' };
    }
    if (stock <= 5) {
      return { label: 'Crítico', bg: 'bg-red-50 border-red-105 text-red-700', text: `${stock} un. restantes` };
    }
    if (stock <= 10) {
      return { label: 'Baixo', bg: 'bg-amber-50 border-amber-100 text-amber-700', text: `${stock} un. restantes` };
    }
    return { label: 'Saudável', bg: 'bg-emerald-50 border-emerald-100 text-emerald-800', text: `${stock} un.` };
  };

  const renderSizeBadges = (product: Product) => {
    if (product.tamanhos_estoque && Object.keys(product.tamanhos_estoque).length > 0) {
      return (
        <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
          {Object.entries(product.tamanhos_estoque).map(([size, q]) => {
            const qty = Number(q);
            const isAvailable = qty > 0;
            return (
              <span
                key={size}
                title={`${size}: ${qty} pçs em estoque`}
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border transition ${
                  isAvailable
                    ? 'bg-pink-50 border-pink-100 text-pink-700'
                    : 'bg-slate-100 border-slate-250 text-slate-400 line-through opacity-75'
                }`}
              >
                {size}
                <span className="text-[8px] font-semibold ml-0.5 opacity-90">
                  ({qty})
                </span>
              </span>
            );
          })}
        </div>
      );
    }

    const sizes = product.tamanho ? product.tamanho.split(',').map(s => s.trim()).filter(Boolean) : [];
    return (
      <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
        {sizes.map((size) => (
          <span
            key={size}
            className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold"
          >
            {size}
          </span>
        ))}
      </div>
    );
  };

  const renderSizeBadgesOnMobile = (product: Product) => {
    if (product.tamanhos_estoque && Object.keys(product.tamanhos_estoque).length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {Object.entries(product.tamanhos_estoque).map(([size, q]) => {
            const qty = Number(q);
            const isAvailable = qty > 0;
            return (
              <span
                key={size}
                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${
                  isAvailable
                    ? 'bg-pink-50 border-pink-100 text-pink-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-75'
                }`}
              >
                {size} ({qty})
              </span>
            );
          })}
        </div>
      );
    }

    const sizes = product.tamanho ? product.tamanho.split(',').map(s => s.trim()).filter(Boolean) : [];
    return (
      <div className="flex flex-wrap gap-1">
        {sizes.map((size) => (
          <span
            key={size}
            className="inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-black"
          >
            {size}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div id="product-panel-body" className="space-y-4">
      
      {/* Search, Filter, Sort and Options Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search bar */}
          <div className="relative sm:col-span-6 md:col-span-7">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Buscar produtos por nome, tamanho, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative sm:col-span-3 md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-3.5 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer bg-no-repeat"
            >
              <option value="Todas">Categorias (Todas)</option>
              {categories.filter(c => c !== 'Todas').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Order Dropdown Filter */}
          <div className="relative sm:col-span-3 md:col-span-2">
            <select
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
              className="block w-full pl-3.5 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer bg-no-repeat"
              defaultValue="created_at-desc"
            >
              <option value="created_at-desc">Mais Recentes</option>
              <option value="created_at-asc">Mais Antigos</option>
              <option value="nome-asc">Nome (A - Z)</option>
              <option value="nome-desc">Nome (Z - A)</option>
              <option value="preco-asc">Menor Preço</option>
              <option value="preco-desc">Maior Preço</option>
              <option value="estoque-asc">Menos Estoque</option>
              <option value="estoque-desc">Mais Estoque</option>
            </select>
          </div>
        </div>

        {/* Add Product Shortcut Button */}
        <button
          onClick={onAddClick}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 text-center transition tracking-wide hover:shadow-sm"
        >
          + Adicionar Roupa
        </button>
      </div>

      {/* Directory Content Area */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center p-3 bg-slate-50 rounded-xl text-slate-400 mb-4 border border-slate-150">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Nenhum produto encontrado</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Nenhuma peça de vestuário atende aos critérios de busca ou filtros de categoria ativos no momento.
          </p>
          {(searchTerm || selectedCategory !== 'Todas') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas');
              }}
              className="mt-4 inline-flex px-3.5 py-1.5 border border-slate-250 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Card list on mobile / Table on larger screens */}
          <div className="block lg:hidden space-y-3">
            {sortedProducts.map((p) => {
              const stockInfo = getStockStatus(p.estoque);
              return (
                <div 
                  key={p.id} 
                  id={`product-card-${p.id}`} 
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex gap-3">
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-150 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.categoria}</span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{p.nome}</h4>
                      <p className="text-xs text-pink-600 font-bold">R$ {p.preco.toFixed(2)}</p>
                      {renderSizeBadgesOnMobile(p)}
                    </div>
                  </div>

                  {p.descricao && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic leading-relaxed pt-0.5 border-t border-slate-100">
                      {p.descricao}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${stockInfo.bg}`}>
                      Estoque: {stockInfo.text}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditClick(p)}
                        className="p-1 px-2 border border-slate-200 text-slate-600 rounded-md text-xs hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => onDeleteClick(p.id, p.nome)}
                        className="p-1 px-2 border border-red-100 bg-red-50/50 text-red-600 rounded-md text-xs hover:bg-red-50 hover:text-red-700 transition flex items-center gap-1 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-16">Item</th>
                    <th 
                      onClick={() => handleSort('nome')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition whitespace-nowrap"
                    >
                      Produto <ArrowUpDown className="w-3 h-3 inline-block ml-1" />
                    </th>
                    <th 
                      onClick={() => handleSort('preco')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition text-right whitespace-nowrap"
                    >
                      Preço <ArrowUpDown className="w-3 h-3 inline-block ml-1" />
                    </th>
                    <th className="py-3 px-4 w-28 text-center">Categoria</th>
                    <th className="py-3 px-4 w-20 text-center">Tamanho</th>
                    <th 
                      onClick={() => handleSort('estoque')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition text-center whitespace-nowrap"
                    >
                      Estoque <ArrowUpDown className="w-3 h-3 inline-block ml-1" />
                    </th>
                    <th className="py-3 px-4 w-28 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedProducts.map((p) => {
                    const stockInfo = getStockStatus(p.estoque);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition">
                        {/* Thumbnail photo */}
                        <td className="py-3.5 px-4">
                          <img
                            src={p.imagem}
                            alt={p.nome}
                            className="w-11 h-11 object-cover rounded-lg bg-slate-100 border border-slate-200 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        </td>

                        {/* Name & Desc */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 leading-snug">{p.nome}</div>
                          {p.descricao && (
                            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic font-normal">
                              {p.descricao}
                            </div>
                          )}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          R$ {p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-150 text-slate-700 text-[11px] font-bold rounded-full">
                            {p.categoria}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="py-3.5 px-4 text-center">
                          {renderSizeBadges(p)}
                        </td>

                        {/* Stock label */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${stockInfo.bg}`}>
                            {stockInfo.text}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => onEditClick(p)}
                              className="p-1 px-2 border border-slate-200 hover:border-pink-500 hover:text-pink-600 text-slate-600 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer bg-white"
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => onDeleteClick(p.id, p.nome)}
                              className="p-1 px-2 border border-rose-100 bg-rose-50/30 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              title="Deletar Produto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50/75 p-3.5 text-center text-[11px] font-mono text-slate-400 border-t border-slate-200">
              Exibindo {sortedProducts.length} de {products.length} produtos cadastrados &bull; Clique no cabeçalho das colunas para ordenar
            </div>
          </div>
        </>
      )}

    </div>
  );
}
