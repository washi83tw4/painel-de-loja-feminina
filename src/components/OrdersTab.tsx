import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  X, 
  Check, 
  Package, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Database,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Order, OrderItem } from '../types';
import { getOrdersList, updateOrderStatus } from '../supabaseClient';

interface OrdersTabProps {
  onShowNotification: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OrdersTab({ onShowNotification }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await getOrdersList();
      setOrders(result.data);
      setUsingFallback(result.usingFallback);
      if (result.error) {
        setErrorMsg(result.error);
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao buscar pedidos: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdatingStatus(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.error) {
        onShowNotification(result.error, 'error');
      } else {
        onShowNotification(`Status do pedido #${orderId.substring(0, 8)} atualizado para "${newStatus}"!`, 'success');
        // Refresh local list state
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        // Refresh selected orders in modal
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err: any) {
      onShowNotification(`Falha ao alterar status: ${err.message || err}`, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Calculations for Metrics
  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter(o => o.status === 'novo').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'enviado').length;
  
  // Total billing excluding cancelled orders
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelado')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Filter & Search match
  const filteredOrders = orders.filter(order => {
    // Filter status
    if (statusFilter !== 'todos' && order.status !== statusFilter) {
      return false;
    }
    
    // Search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchName = order.customer_name?.toLowerCase().includes(query);
      const matchPhone = order.customer_phone?.includes(query);
      const matchId = order.id?.toLowerCase().includes(query);
      const matchCpf = order.customer_cpf?.includes(query);
      
      return matchName || matchPhone || matchId || matchCpf;
    }
    
    return true;
  });

  // Helpers to Render beautiful Status Badges
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'novo':
        return {
          bg: 'bg-indigo-50 border-indigo-100 text-indigo-700',
          dot: 'bg-indigo-500',
          label: 'Novo',
          icon: Clock
        };
      case 'em separação':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Em separação',
          icon: Package
        };
      case 'enviado':
        return {
          bg: 'bg-cyan-50 border-cyan-150 text-cyan-700',
          dot: 'bg-cyan-500',
          label: 'Enviado',
          icon: Truck
        };
      case 'entregue':
        return {
          bg: 'bg-emerald-50 border-emerald-150 text-emerald-700',
          dot: 'bg-emerald-500',
          label: 'Entregue',
          icon: CheckCircle2
        };
      case 'cancelado':
        return {
          bg: 'bg-rose-50 border-rose-150 text-rose-700',
          dot: 'bg-rose-500',
          label: 'Cancelado',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          label: status,
          icon: Clock
        };
    }
  };

  // Helper to safely get list of items
  const getSafeItemsList = (items: any): any[] => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Falha ao analisar JSON dos itens do pedido:", e);
      }
    }
    return [];
  };

  // Helper to safely get short order ID
  const getShortOrderId = (id: any): string => {
    if (!id) return '';
    const idStr = String(id);
    return idStr.startsWith('ord-') ? idStr.replace('ord-', '') : idStr.substring(0, 8);
  };

  const formatCnpjCpf = (val?: any) => {
    if (!val) return 'Não preenchido';
    const clean = String(val).replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return String(val);
  };

  const formatDate = (isoStr?: any) => {
    if (!isoStr) return 'Não informada';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) {
        return String(isoStr);
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(isoStr);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Faturamento total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
              Faturamento Total
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block">
              Exclui cancelados
            </span>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total de pedidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
              Total de Pedidos
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block">
              {totalOrdersCount}
            </span>
            <span className="text-[9px] text-slate-500 font-medium inline-block">
              Registrados no sistema
            </span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pedidos novos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
              Pedidos Novos
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block">
              {newOrdersCount}
            </span>
            <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block animate-pulse">
              Aguardando ação
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pedidos Enviados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
              Pedidos Enviados
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block">
              {shippedOrdersCount}
            </span>
            <span className="text-[9px] text-cyan-600 font-bold bg-cyan-50 px-1.5 py-0.5 rounded-md inline-block">
              Em transporte público
            </span>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Database Warning indicator bar */}
      {usingFallback && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between gap-1 text-[11px] text-amber-800 shadow-3xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Usando fallback offline (dados simulados com persistência local). Ative a chave Supabase para usar em tempo real.</span>
          </div>
          <button 
            onClick={fetchOrders}
            className="text-[10px] font-bold text-amber-900 hover:underline flex items-center gap-0.5"
          >
            <RefreshCw className="w-3 h-3" /> Tentar Sincronizar
          </button>
        </div>
      )}

      {/* 2. Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search input field */}
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por cliente, telefone, CPF ou ID do pedido..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filters tags list */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mr-1.5 hidden lg:inline">
            Filtrar:
          </span>
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'novo', label: 'Novos' },
            { value: 'em separação', label: 'Em Separação' },
            { value: 'enviado', label: 'Enviados' },
            { value: 'entregue', label: 'Entregues' },
            { value: 'cancelado', label: 'Cancelados' }
          ].map(opt => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isActive 
                    ? 'bg-pink-600 border-pink-600 text-white shadow-3xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Tabela de Pedidos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-pink-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Lendo pedidos do banco de dados...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Filter className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-slate-900 mt-4">Nenhum pedido encontrado</h5>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Nenhuma transação atende aos critérios do filtro ou busca selecionada atualmente.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                    <th className="py-3 px-4">ID do Pedido</th>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4 text-center">Itens</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs">
                  {filteredOrders.map(order => {
                    const statusInfo = getStatusStyle(order.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition">
                        
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                          #{getShortOrderId(order.id)}
                        </td>
                        
                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDate(order.created_at)}
                        </td>
                        
                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{order.customer_name || 'Desconhecido'}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{order.customer_phone || 'Sem telefone'}</div>
                        </td>
                        
                        {/* Itens Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-700 font-extrabold rounded-full text-[10px]">
                            {getSafeItemsList(order.items).reduce((accum, i) => accum + (i?.quantidade || 1), 0)}
                          </span>
                        </td>
                        
                        {/* Total */}
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {Number(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        
                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[10px] font-bold tracking-wide ${statusInfo.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                            <StatusIcon className="w-3.5 h-3.5 inline-block shrink-0" />
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>
                        
                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-pink-650 hover:bg-pink-600 hover:text-white rounded-xl text-[11px] font-bold text-slate-700 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalhes</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-slate-150">
              {filteredOrders.map(order => {
                const statusInfo = getStatusStyle(order.status);
                const StatusIcon = statusInfo.icon;
                const itemsCount = getSafeItemsList(order.items).reduce((accum, i) => accum + (i?.quantidade || 1), 0);
                return (
                  <div key={order.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-550 text-xs">
                        #{getShortOrderId(order.id)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div>
                      <h6 className="font-bold text-slate-900 text-sm">{order.customer_name || 'Desconhecido'}</h6>
                      <span className="text-xs text-slate-500 block mt-0.5">{order.customer_phone || 'Sem telefone'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block">Total ({itemsCount} {itemsCount === 1 ? 'item' : 'itens'})</span>
                        <span className="font-extrabold text-slate-950 text-sm">
                          {Number(order.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-[10px] font-bold tracking-wide ${statusInfo.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                        <span>Visualizar Detalhes</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination / Total indicator Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 text-center text-[10px] text-slate-400 font-medium">
              Listando {filteredOrders.length} de {orders.length} pedidos encontrados
            </div>
          </>
        )}

      </div>

      {/* 4. Detalhes do Pedido - Modal Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end z-50 animate-fade-in p-0 sm:p-4">
          <div className="bg-white h-full sm:h-[95vh] w-full max-w-2xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-screen">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 shrink-0 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono font-black text-pink-400 tracking-widest block">
                  Acompanhamento de Venda
                </span>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  Pedido #{getShortOrderId(selectedOrder.id)}
                  <span className="text-xs text-slate-400 font-normal">
                    &bull; {formatDate(selectedOrder.created_at)}
                  </span>
                </h4>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
              
              {/* Order Status Action Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-pink-600" />
                  Gerenciar Fluxo de Atendimento
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  As atualizações de status notificam os fluxos internos de empacotamento e entrega. Selecione a etapa correspondente abaixo:
                </p>

                {/* Status selection list */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1.5">
                  {[
                    { value: 'novo', label: 'Novo', color: 'indigo' },
                    { value: 'em separação', label: 'Separando', color: 'amber' },
                    { value: 'enviado', label: 'Enviado', color: 'cyan' },
                    { value: 'entregue', label: 'Entregue', color: 'emerald' },
                    { value: 'cancelado', label: 'Cancelar', color: 'rose' }
                  ].map(step => {
                    const isCurrent = selectedOrder.status === step.value;
                    let btnStyle = "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
                    if (isCurrent) {
                      if (step.value === 'novo') btnStyle = "bg-indigo-600 border-indigo-600 text-white shadow-xs";
                      if (step.value === 'em separação') btnStyle = "bg-amber-500 border-amber-500 text-white shadow-xs";
                      if (step.value === 'enviado') btnStyle = "bg-cyan-600 border-cyan-600 text-white shadow-xs";
                      if (step.value === 'entregue') btnStyle = "bg-emerald-600 border-emerald-600 text-white shadow-xs";
                      if (step.value === 'cancelado') btnStyle = "bg-rose-600 border-rose-600 text-white shadow-xs";
                    }

                    return (
                      <button
                        key={step.value}
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus(selectedOrder.id, step.value as Order['status'])}
                        className={`py-2 px-1 text-center rounded-lg text-[10px] font-bold transition border cursor-pointer ${btnStyle} ${isUpdatingStatus ? 'opacity-50' : ''}`}
                      >
                        {isCurrent && <Check className="w-3.5 h-3.5 inline-block mr-1 -translate-y-0.5" />}
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2 Grid columns: Customer Info / Address Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Customer Details */}
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <User className="w-4 h-4 text-slate-500" />
                    Informações do Cliente
                  </h5>
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Nome Completo:</span>
                      <span className="font-bold text-slate-900">{selectedOrder.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">E-mail de Contato:</span>
                      <span className="font-mono text-slate-700">{selectedOrder.customer_email || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Número de Telefone:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedOrder.customer_phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">CPF do Comprador:</span>
                      <span className="font-mono text-slate-700">{formatCnpjCpf(selectedOrder.customer_cpf)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    Endereço de Entrega
                  </h5>
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Logradouro:</span>
                      <span className="font-bold text-slate-900">
                        {selectedOrder.address_street}, Nº {selectedOrder.address_number}
                      </span>
                    </div>
                    {selectedOrder.address_complement && (
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 block">Complemento:</span>
                        <span className="font-bold text-slate-900">{selectedOrder.address_complement}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Bairro:</span>
                      <span className="font-bold text-slate-900">{selectedOrder.address_neighborhood}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Cidade / UF:</span>
                      <span className="font-bold text-slate-900">
                        {selectedOrder.address_city} - {selectedOrder.address_state}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-slate-400 block">Código Postal (CEP):</span>
                      <span className="font-mono font-bold text-slate-755 text-pink-650 font-semibold">{selectedOrder.address_zipcode}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Observation Notes if exist */}
              {selectedOrder.notes && (
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Observações do Pedido
                  </h5>
                  <div className="bg-amber-50/40 border border-amber-200/60 p-3 rounded-xl text-slate-755 text-amber-900 italic font-medium leading-relaxed">
                    "{selectedOrder.notes}"
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Package className="w-4 h-4 text-slate-500" />
                  Relação de Produtos Comprados
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase tracking-wider font-bold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3 text-center">Tamanho</th>
                        <th className="py-2.5 px-3 text-center">Qtd</th>
                        <th className="py-2.5 px-3 text-right">Unitário</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getSafeItemsList(selectedOrder.items).map((item, idx) => {
                        const itemSubtotal = (item?.preco || 0) * (item?.quantidade || 1);
                        const itemName = item?.nome || 'Produto';
                        return (
                          <tr key={(item?.id || '') + idx}>
                            
                            {/* Product Info Preview */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                {item?.imagem ? (
                                  <img 
                                    src={item.imagem} 
                                    alt={itemName}
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-150 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0 uppercase">
                                    {itemName.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-slate-900 block leading-tight">{itemName}</span>
                                </div>
                              </div>
                            </td>

                            {/* Size */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-1.5 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-black rounded border border-pink-100 uppercase">
                                {item?.tamanho || 'único'}
                              </span>
                            </td>

                            {/* Quantity */}
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                              x{item?.quantidade || 1}
                            </td>

                            {/* Unit price */}
                            <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                              {Number(item?.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>

                            {/* Subtotal */}
                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 font-mono">
                              {itemSubtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Summary row inside items block */}
                  <div className="bg-slate-50 p-3 flex justify-end gap-10 border-t border-slate-200">
                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] font-medium text-slate-450 block uppercase text-slate-550">Total Final do Pedido:</span>
                      <span className="text-sm font-black text-slate-950 font-mono">
                        {Number(selectedOrder.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Fechar Painel
              </button>

              <span className="text-[10px] text-slate-400 font-medium">
                Concluindo operações de conferência do estabelecimento
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
