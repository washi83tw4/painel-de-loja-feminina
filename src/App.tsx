import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles,
  LogOut, 
  Plus, 
  Database, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Product, AdminUser, SupabaseConfig } from './types';
import { 
  getProductsList, 
  createProductItem, 
  updateProductItem, 
  deleteProductItem, 
  getSupabaseKeys,
  getSupabaseClient
} from './supabaseClient';
import LoginScreen from './components/LoginScreen';
import DashboardStats from './components/DashboardStats';
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import SupabaseHelp from './components/SupabaseHelp';
import OrdersTab from './components/OrdersTab';

export default function App() {
  // Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const session = localStorage.getItem('clothing_shop_admin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Do not use mock sessions anymore as requested by user
        if (parsed.token === 'mock-jwt-token-clothing-admin' || parsed.token === 'custom-user-token') {
          localStorage.removeItem('clothing_shop_admin_session');
          return null;
        }
        return parsed;
      } catch (e) {
        localStorage.removeItem('clothing_shop_admin_session');
      }
    }
    return null;
  });

  // Products Database State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'catalogo' | 'pedidos' | 'ajuda'>('catalogo');

  // Supabase Connection State Setup
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConfigured: false,
    usingFallback: true
  });

  // Modal Control States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Elegant Delete Dialog State
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global Notification Alerts State
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Check login and sync keys from localStorage session key on mount, and handle Supabase auth listening
  useEffect(() => {
    syncSupabaseConfig();
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      // 1. Get current active session
      client.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          const userObj: AdminUser = {
            email: session.user.email || '',
            token: session.access_token || ''
          };
          setAdminUser(userObj);
          localStorage.setItem('clothing_shop_admin_session', JSON.stringify(userObj));
        } else {
          // If no active session in Supabase, check if we have a legacy mock session to clear
          const localSession = localStorage.getItem('clothing_shop_admin_session');
          if (localSession) {
            try {
              const parsed = JSON.parse(localSession);
              if (parsed.token === 'mock-jwt-token-clothing-admin' || parsed.token === 'custom-user-token') {
                localStorage.removeItem('clothing_shop_admin_session');
                setAdminUser(null);
              }
            } catch (e) {
              localStorage.removeItem('clothing_shop_admin_session');
              setAdminUser(null);
            }
          }
        }
      });

      // 2. Listen for auth state changes
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session && session.user) {
          const userObj: AdminUser = {
            email: session.user.email || '',
            token: session.access_token || ''
          };
          setAdminUser(userObj);
          localStorage.setItem('clothing_shop_admin_session', JSON.stringify(userObj));
        } else {
          setAdminUser(null);
          localStorage.removeItem('clothing_shop_admin_session');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback session reading
      const session = localStorage.getItem('clothing_shop_admin_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.token === 'mock-jwt-token-clothing-admin' || parsed.token === 'custom-user-token') {
            localStorage.removeItem('clothing_shop_admin_session');
            setAdminUser(null);
          } else {
            setAdminUser(parsed);
          }
        } catch (e) {
          setAdminUser(null);
        }
      }
    }
  }, [supabaseConfig.isConfigured]);

  // Fetch products catalogue whenever user logs in or configuration shifts
  useEffect(() => {
    if (adminUser) {
      fetchProducts();
    }
  }, [adminUser, supabaseConfig.isConfigured]);

  // Synchronizes visual state of keys
  const syncSupabaseConfig = () => {
    const keys = getSupabaseKeys();
    setSupabaseConfig({
      url: keys.url,
      anonKey: keys.anonKey,
      isConfigured: keys.isConfigured,
      usingFallback: !keys.isConfigured
    });
  };

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const result = await getProductsList();
      setProducts(result.data);
      setUsingFallback(result.usingFallback);
      
      if (result.error) {
        setDbError(result.error);
        showNotification(result.error, 'error');
      }
    } catch (err: any) {
      setDbError(`Falha ao obter produtos: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = (user: AdminUser) => {
    setAdminUser(user);
    localStorage.setItem('clothing_shop_admin_session', JSON.stringify(user));
    showNotification(`Seja bem-vindo, ${user.email}!`, 'success');
  };

  // Sign out handler
  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.error('Erro ao deslogar do Supabase:', e);
      }
    }
    localStorage.removeItem('clothing_shop_admin_session');
    setAdminUser(null);
  };

  // Handle Create or Edit submission
  const handleFormSubmit = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    if (editingProduct) {
      // Edit Action
      const result = await updateProductItem(editingProduct.id, productData);
      if (result.error) {
        showNotification(result.error, 'error');
      } else {
        showNotification('Peça de vestuário atualizada com sucesso!', 'success');
      }
    } else {
      // Create Action
      const result = await createProductItem(productData);
      if (result.error) {
        showNotification(result.error, 'error');
      } else {
        showNotification('Nova peça adicionada ao catálogo!', 'success');
      }
    }
    fetchProducts();
  };

  // Delete Action Confirm
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteProductItem(productToDelete.id);
      if (result.error) {
        showNotification(result.error, 'error');
      } else {
        showNotification(`Produto "${productToDelete.name}" foi excluído com sucesso!`, 'success');
      }
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      showNotification(`Erro ao deletar: ${err.message || err}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle config updates from Help view
  const handleConfigChanged = () => {
    syncSupabaseConfig();
    showNotification('Configuração de conexão do Supabase alterada!', 'info');
  };

  // If user is not logged in, render the fashion Login Panel
  if (!adminUser) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLogin} 
        supabaseConfig={supabaseConfig} 
      />
    );
  }

  return (
    <div id="app-workspace" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-950 antialiased">
      
      {/* Premium Admin Header Banner */}
      <header className="bg-slate-900 text-white border-b border-pink-950/20 shrink-0 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-pink-600 text-white rounded-xl flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black uppercase tracking-widest block font-sans">
                Maison Atelier
              </span>
              <span className="text-[10px] text-pink-400 block font-mono">
                HAUTE COUTURE GESTÃO
              </span>
            </div>
            
            {/* Database indicator node next to logo */}
            <span className={`hidden sm:inline-flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border translate-y-0.5 ${supabaseConfig.isConfigured ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30' : 'bg-amber-950/40 text-amber-400 border-amber-900/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfig.isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {supabaseConfig.isConfigured ? 'Supabase' : 'Offline'}
            </span>
          </div>

          {/* Right Session Control / User Email */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <span className="text-xs text-slate-400 block">Sessão Ativa:</span>
              <span className="text-xs font-bold font-mono text-slate-200 block">{adminUser.email}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Desconectar do Painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desconectar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        
        {/* Connection Offline Status warning banner */}
        {!supabaseConfig.isConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs animate-fade-in">
            <div className="flex gap-3">
              <div className="p-2.5 bg-amber-100/80 rounded-xl text-amber-800 shrink-0 h-10 w-10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-950">Atualmente no modo demonstrativo do catálogo (Local Storage)</h5>
                <p className="text-[11px] text-amber-800 leading-relaxed max-w-2xl mt-0.5">
                  Os produtos estão sendo armazenados localmente no seu navegador para testes imediatos. Acesse a aba <strong>Integração Supabase</strong> para executar o script SQL no seu projeto e conectar sua chave sem complicações!
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ajuda')}
              className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Configurar Conexão
            </button>
          </div>
        )}

        {/* Global Notifications Alert Toast in top side if exists */}
        {notification && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold tracking-wide shadow-sm animate-bounce ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-800' :
            notification.type === 'error' ? 'bg-rose-50 border-rose-150 text-rose-800' :
            'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>{notification.text}</span>
          </div>
        )}

        {/* Navigation Tabs bar layout */}
        <div className="border-b border-slate-200 flex items-center justify-between pb-1.5 shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('catalogo')}
              className={`pb-2.5 text-sm font-bold tracking-wide border-b-2 transition relative cursor-pointer ${
                activeTab === 'catalogo' 
                  ? 'border-pink-600 text-pink-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Gerenciar Catálogo
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`pb-2.5 text-sm font-bold tracking-wide border-b-2 transition relative cursor-pointer ${
                activeTab === 'pedidos' 
                  ? 'border-pink-600 text-pink-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setActiveTab('ajuda')}
              className={`pb-2.5 text-sm font-bold tracking-wide border-b-2 transition relative cursor-pointer ${
                activeTab === 'ajuda' 
                  ? 'border-pink-600 text-pink-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Integração Supabase & Ajuda
            </button>
          </div>

          {activeTab === 'catalogo' && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Produto</span>
            </button>
          )}
        </div>

        {/* Views Router Render list */}
        {activeTab === 'ajuda' ? (
          <SupabaseHelp 
            onConfigChanged={handleConfigChanged} 
            supabaseConfig={supabaseConfig} 
          />
        ) : activeTab === 'pedidos' ? (
          <OrdersTab onShowNotification={showNotification} />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Dashboard Analytics Card Row */}
            <DashboardStats products={products} />

            {/* Main Catalogue Search/Filter Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-none font-sans">Roupas Cadastradas</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualize o estoque total, tamanhos ativos e faça operações de exclusão ou edição instantâneas.
                  </p>
                </div>
                
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-pink-600 rounded-full animate-spin"></div>
                    <span>Sincronizando...</span>
                  </div>
                )}
              </div>

              {/* Main Clothes Directory */}
              <ProductTable
                products={products}
                onEditClick={(p) => {
                  setEditingProduct(p);
                  setIsFormOpen(true);
                }}
                onDeleteClick={(id, name) => {
                  setProductToDelete({ id, name });
                }}
                onAddClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
              />
            </div>
          </div>
        )}

      </main>

      {/* Clothing specs Entry dialog Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialProduct={editingProduct}
      />

      {/* Safe Aesthetic Delete Confirmation Popup Dialog instead of browser alerts */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-md w-full p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900">Excluir Produto Permanentemente</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Você tem certeza de que deseja remover a peça <strong className="text-slate-900">"{productToDelete.name}"</strong> do catálogo do seu estabelecimento? Esta modificação alterará instantaneamente seus dados no Supabase e é irreversível.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir Peça</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimalistic footer page credits */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center shrink-0">
        <span className="text-xs text-slate-400">
          Painel Administrador © 2026 ClosetAdmin Boutique &bull; Conectado à API do Supabase Engine
        </span>
      </footer>

    </div>
  );
}
