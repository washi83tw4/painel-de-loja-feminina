import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order } from './types';

// Storage keys
const LOCAL_OVERRIDE_URL_KEY = 'supabase_url_override';
const LOCAL_OVERRIDE_KEY_KEY = 'supabase_key_override';
const PRODUCTS_LOCAL_STORAGE_KEY = 'clothing_shop_admin_products';
const ORDERS_LOCAL_STORAGE_KEY = 'clothing_shop_admin_orders';
const SESSION_LOCAL_STORAGE_KEY = 'clothing_shop_admin_session';

// Helper to check and resolve keys
export function getSupabaseKeys() {
  const meta = import.meta as any;
  const env = meta.env || {};
  const url_env = env.VITE_SUPABASE_URL || '';
  const key_env = env.VITE_SUPABASE_ANON_KEY || '';

  const url_override = localStorage.getItem(LOCAL_OVERRIDE_URL_KEY) || '';
  const key_override = localStorage.getItem(LOCAL_OVERRIDE_KEY_KEY) || '';

  // Use the user's specific Supabase keys as fallback in case .env is missing/deleted
  let url = (url_override || url_env || 'https://ginrupwmrdoilkybsgsz.supabase.co').trim();
  const key = (key_override || key_env || 'sb_publishable_S3snboPa4Q0v1xVbd4FRtg_EtaORtBc').trim();

  // Sanitize Supabase URL (strip /rest/v1/ or trailing slash)
  if (url) {
    if (url.endsWith('/rest/v1/')) {
      url = url.substring(0, url.length - 9);
    } else if (url.endsWith('/rest/v1')) {
      url = url.substring(0, url.length - 8);
    }
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
  }

  const isConfigured = !!(url && key && url !== '' && key !== '');

  return {
    url,
    anonKey: key,
    isConfigured,
    source: url_override ? 'local' : (url_env ? 'env' : 'none'),
  };
}

// Global Supabase Client Instance (lazy initialized or re-initialized on key change)
let supabaseInstance: SupabaseClient | null = null;
let activeSupabaseUrl = '';

export function getSupabaseClient(): SupabaseClient | null {
  const keys = getSupabaseKeys();
  if (!keys.isConfigured) {
    supabaseInstance = null;
    activeSupabaseUrl = '';
    return null;
  }

  // Create client if not already created, or if keys changed
  if (!supabaseInstance || activeSupabaseUrl !== keys.url) {
    try {
      supabaseInstance = createClient(keys.url, keys.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
      activeSupabaseUrl = keys.url;
    } catch (e) {
      console.error('Falha ao inicializar cliente do Supabase:', e);
      supabaseInstance = null;
      activeSupabaseUrl = '';
    }
  }

  return supabaseInstance;
}

// Initial Mock clothing products to populate the local fallback database
const initialMockProducts: Product[] = [
  {
    id: 'prod-1',
    nome: 'Camisa Linho Classic Off-White',
    preco: 189.90,
    categoria: 'Camisas',
    tamanho: 'M',
    descricao: 'Camisa manga longa em linho puro, ideal para dias quentes e looks sofisticados e casuais.',
    imagem: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    estoque: 45,
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
  },
  {
    id: 'prod-2',
    nome: 'Calça Chino Alfaiataria Khaki',
    preco: 229.00,
    categoria: 'Calças',
    tamanho: '42',
    descricao: 'Calça chino em sarja premium com elastano. Modelagem slim de caimento impecável.',
    imagem: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&auto=format&fit=crop&q=80',
    estoque: 28,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'prod-3',
    nome: 'Vestido Midi Canelado Terracota',
    preco: 159.90,
    categoria: 'Vestidos',
    tamanho: 'G',
    descricao: 'Vestido midi canelado premium, com decote reto e alças finas reguláveis. Extremamente confortável.',
    imagem: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
    estoque: 15,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'prod-4',
    nome: 'Jaqueta Puffer Térmica Preta',
    preco: 349.00,
    categoria: 'Casacos',
    tamanho: 'G',
    descricao: 'Jaqueta puffer acolchoada com isolamento térmico premium e acabamento repelente à água.',
    imagem: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    estoque: 12,
    created_at: new Date(Date.now() - 3600000 * 24 * 0.5).toISOString()
  },
  {
    id: 'prod-5',
    nome: 'Blazer Estruturado Linho Areia',
    preco: 299.90,
    categoria: 'Casacos',
    tamanho: 'P',
    descricao: 'Blazer estruturado em mistura de linho e viscose. Ombreiras leves e forro interno acetinado.',
    imagem: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    estoque: 8,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
  }
];

// Initialize local storage products if empty
if (!localStorage.getItem(PRODUCTS_LOCAL_STORAGE_KEY)) {
  localStorage.setItem(PRODUCTS_LOCAL_STORAGE_KEY, JSON.stringify(initialMockProducts));
}

// Initial Mock Orders
const initialMockOrders: Order[] = [
  {
    id: 'ord-1001',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    customer_name: 'Ana Júlia de Oliveira',
    customer_email: 'anajulia@uol.com.br',
    customer_phone: '(11) 98765-4321',
    customer_cpf: '123.456.789-00',
    address_zipcode: '01311-200',
    address_street: 'Avenida Paulista',
    address_number: '1500',
    address_complement: 'Apto 101',
    address_neighborhood: 'Bela Vista',
    address_city: 'São Paulo',
    address_state: 'SP',
    notes: 'Por favor, deixar na portaria com o porteiro Silva.',
    items: [
      {
        id: 'prod-1',
        nome: 'Camisa Linho Classic Off-White',
        preco: 189.90,
        quantidade: 1,
        tamanho: 'M',
        imagem: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod-3',
        nome: 'Vestido Midi Canelado Terracota',
        preco: 159.90,
        quantidade: 1,
        tamanho: 'G',
        imagem: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80'
      }
    ],
    total: 349.80,
    status: 'novo'
  },
  {
    id: 'ord-1002',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
    customer_name: 'Beatriz Martins Santos',
    customer_email: 'bia.martins@gmail.com',
    customer_phone: '(21) 99123-4567',
    customer_cpf: '987.654.321-99',
    address_zipcode: '22021-001',
    address_street: 'Avenida Atlântica',
    address_number: '420',
    address_complement: 'Bloco B',
    address_neighborhood: 'Copacabana',
    address_city: 'Rio de Janeiro',
    address_state: 'RJ',
    notes: 'Embalar para presente, é aniversário da minha irmã!',
    items: [
      {
        id: 'prod-5',
        nome: 'Blazer Estruturado Linho Areia',
        preco: 299.90,
        quantidade: 1,
        tamanho: 'P',
        imagem: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80'
      }
    ],
    total: 299.90,
    status: 'em separação'
  },
  {
    id: 'ord-1003',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    customer_name: 'Carolina Mendes Costa',
    customer_email: 'carol.mendes@bol.com.br',
    customer_phone: '(31) 97555-8822',
    customer_cpf: '456.789.012-34',
    address_zipcode: '30140-120',
    address_street: 'Rua da Bahia',
    address_number: '2015',
    address_complement: 'Sala 402',
    address_neighborhood: 'Lourdes',
    address_city: 'Belo Horizonte',
    address_state: 'MG',
    notes: '',
    items: [
      {
        id: 'prod-2',
        nome: 'Calça Chino Alfaiataria Khaki',
        preco: 229.00,
        quantidade: 2,
        tamanho: '42',
        imagem: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&auto=format&fit=crop&q=80'
      }
    ],
    total: 458.00,
    status: 'enviado'
  },
  {
    id: 'ord-1004',
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(), // 6 days ago
    customer_name: 'Débora silva Faria',
    customer_email: 'debora.faria@gmail.com',
    customer_phone: '(19) 98111-2233',
    customer_cpf: '234.567.890-11',
    address_zipcode: '13010-001',
    address_street: 'Rua Francisco Glicério',
    address_number: '88',
    address_complement: '',
    address_neighborhood: 'Centro',
    address_city: 'Campinas',
    address_state: 'SP',
    notes: 'Entregar de tarde depois das 14h, se possível.',
    items: [
      {
        id: 'prod-3',
        nome: 'Vestido Midi Canelado Terracota',
        preco: 159.90,
        quantidade: 1,
        tamanho: 'G',
        imagem: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80'
      }
    ],
    total: 159.90,
    status: 'entregue'
  }
];

if (!localStorage.getItem(ORDERS_LOCAL_STORAGE_KEY)) {
  localStorage.setItem(ORDERS_LOCAL_STORAGE_KEY, JSON.stringify(initialMockOrders));
}

// Save custom Keys to LocalStorage (User utility setting)
export function saveSupabaseOverrideKeys(url: string, key: string) {
  if (url.trim() === '' || key.trim() === '') {
    localStorage.removeItem(LOCAL_OVERRIDE_URL_KEY);
    localStorage.removeItem(LOCAL_OVERRIDE_KEY_KEY);
  } else {
    localStorage.setItem(LOCAL_OVERRIDE_URL_KEY, url.trim());
    localStorage.setItem(LOCAL_OVERRIDE_KEY_KEY, key.trim());
  }
}

// Clear custom Keys from LocalStorage
export function clearSupabaseOverrideKeys() {
  localStorage.removeItem(LOCAL_OVERRIDE_URL_KEY);
  localStorage.removeItem(LOCAL_OVERRIDE_KEY_KEY);
  supabaseInstance = null;
}

// API for CRUD Operations (handles both Supabase and LocalStorage automatic swap)
export async function getProductsList(): Promise<{ data: Product[]; usingFallback: boolean; error: string | null }> {
  const client = getSupabaseClient();
  const keys = getSupabaseKeys();

  if (!keys.isConfigured || !client) {
    // Return LocalStorage products
    const stored = localStorage.getItem(PRODUCTS_LOCAL_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : [];
    // Sort reverse chronological
    data.sort((a: Product, b: Product) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    return { data, usingFallback: true, error: null };
  }

  try {
    const { data, error } = await client
      .from('produtos')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Product[], usingFallback: false, error: null };
  } catch (err: any) {
    console.error('Erro ao buscar produtos do Supabase:', err);
    // Auto fallback to local storage on error
    const stored = localStorage.getItem(PRODUCTS_LOCAL_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : [];
    return {
      data,
      usingFallback: true,
      error: `Erro ao conectar com Supabase (usando dados locais salvos): ${err.message || err}`
    };
  }
}

export async function createProductItem(productData: Omit<Product, 'id' | 'created_at'>): Promise<{ data: Product | null; error: string | null }> {
  const client = getSupabaseClient();
  const keys = getSupabaseKeys();
  const newId = 'prod-' + Math.random().toString(36).substr(2, 9);
  const createdAt = new Date().toISOString();

  const newProduct: Product = {
    ...productData,
    id: newId,
    created_at: createdAt
  };

  // Add to Local Storage database in both cases (as double sync / cache)
  const stored = localStorage.getItem(PRODUCTS_LOCAL_STORAGE_KEY);
  const localProductsList: Product[] = stored ? JSON.parse(stored) : [];
  localProductsList.unshift(newProduct);
  localStorage.setItem(PRODUCTS_LOCAL_STORAGE_KEY, JSON.stringify(localProductsList));

  if (!keys.isConfigured || !client) {
    return { data: newProduct, error: null };
  }

  try {
    // Write in Supabase 'produtos' table
    // Supabase table can have 'created_at' and 'id' generated automatically or passed
    const { data, error } = await client
      .from('produtos')
      .insert([
        {
          nome: productData.nome,
          preco: Number(productData.preco),
          categoria: productData.categoria,
          tamanho: productData.tamanho,
          descricao: productData.descricao,
          imagem: productData.imagem,
          estoque: Number(productData.estoque),
          tamanhos_estoque: productData.tamanhos_estoque || {},
          preco_promocional: productData.preco_promocional !== undefined && productData.preco_promocional !== null ? Number(productData.preco_promocional) : null,
          em_promocao: productData.em_promocao !== undefined ? !!productData.em_promocao : false,
          destaque: productData.destaque !== undefined ? !!productData.destaque : false,
          banner: productData.banner !== undefined ? !!productData.banner : false,
          ativo: productData.ativo !== undefined ? !!productData.ativo : true
        }
      ])
      .select();

    if (error) {
      // In case they didn't create the table yet, describe what to do
      throw error;
    }

    return { data: data ? data[0] : newProduct, error: null };
  } catch (err: any) {
    console.error('Erro ao inserir produto no Supabase:', err);
    return {
      data: newProduct, // fallback successfully returned
      error: `Salvo no local storage apenas. Erro Supabase: ${err.message || err}. Verifique se a tabela 'produtos' com os campos corretos existe.`
    };
  }
}

export async function updateProductItem(id: string, productData: Omit<Product, 'id' | 'created_at'>): Promise<{ data: Product | null; error: string | null }> {
  const client = getSupabaseClient();
  const keys = getSupabaseKeys();

  // Update in Local Storage
  const stored = localStorage.getItem(PRODUCTS_LOCAL_STORAGE_KEY);
  let localProductsList: Product[] = stored ? JSON.parse(stored) : [];
  let updatedProduct: Product | null = null;

  localProductsList = localProductsList.map(p => {
    if (p.id === id) {
      updatedProduct = { ...p, ...productData };
      return updatedProduct;
    }
    return p;
  });
  localStorage.setItem(PRODUCTS_LOCAL_STORAGE_KEY, JSON.stringify(localProductsList));

  if (!keys.isConfigured || !client) {
    return { data: updatedProduct, error: null };
  }

  try {
    // In Supabase, table ID might be a number or custom string. Some tables use numeric primary keys.
    // If our ID is 'prod-xxx' it is from local storage fallback.
    // Let's check if the ID contains 'prod-'. If so and they set up Supabase afterwards, we can match by nome or allow it to try string id.
    const queryId = id.startsWith('prod-') ? id : id;

    const { data, error } = await client
      .from('produtos')
      .update({
        nome: productData.nome,
        preco: Number(productData.preco),
        categoria: productData.categoria,
        tamanho: productData.tamanho,
        descricao: productData.descricao,
        imagem: productData.imagem,
        estoque: Number(productData.estoque),
        tamanhos_estoque: productData.tamanhos_estoque || {},
        preco_promocional: productData.preco_promocional !== undefined && productData.preco_promocional !== null ? Number(productData.preco_promocional) : null,
        em_promocao: productData.em_promocao !== undefined ? !!productData.em_promocao : false,
        destaque: productData.destaque !== undefined ? !!productData.destaque : false,
        banner: productData.banner !== undefined ? !!productData.banner : false,
        ativo: productData.ativo !== undefined ? !!productData.ativo : true
      })
      .eq('id', queryId)
      .select();

    if (error) throw error;
    return { data: data ? data[0] : updatedProduct, error: null };
  } catch (err: any) {
    console.error('Erro ao atualizar produto no Supabase:', err);
    return {
      data: updatedProduct,
      error: `Atualizado localmente. Erro no Supabase: ${err.message || err}`
    };
  }
}

export async function deleteProductItem(id: string): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  const keys = getSupabaseKeys();

  // Delete from Local Storage
  const stored = localStorage.getItem(PRODUCTS_LOCAL_STORAGE_KEY);
  let localProductsList: Product[] = stored ? JSON.parse(stored) : [];
  localProductsList = localProductsList.filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_LOCAL_STORAGE_KEY, JSON.stringify(localProductsList));

  if (!keys.isConfigured || !client) {
    return { success: true, error: null };
  }

  try {
    const { error } = await client
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao deletar produto do Supabase:', err);
    return {
      success: true, // we still delete it from local view
      error: `Deletado localmente. Erro no Supabase: ${err.message || err}`
    };
  }
}

// ORDER MANAGEMENT OPERATIONS

export async function getOrdersList(): Promise<{ data: Order[]; usingFallback: boolean; error: string | null }> {
  const client = getSupabaseClient();
  const keys = getSupabaseKeys();

  if (!keys.isConfigured || !client) {
    const stored = localStorage.getItem(ORDERS_LOCAL_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : [];
    // Sort reverse chronological
    data.sort((a: Order, b: Order) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    return { data, usingFallback: true, error: null };
  }

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Order[], usingFallback: false, error: null };
  } catch (err: any) {
    console.error('Erro ao buscar pedidos do Supabase:', err);
    const stored = localStorage.getItem(ORDERS_LOCAL_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : [];
    data.sort((a: Order, b: Order) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    return {
      data,
      usingFallback: true,
      error: `Erro ao buscar pedidos no Supabase (usando dados locais salvos): ${err.message || err}`
    };
  }
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<{ data: Order | null; error: string | null }> {
  const client = getSupabaseClient();
  const keys = getSupabaseKeys();

  // Update locally first
  const stored = localStorage.getItem(ORDERS_LOCAL_STORAGE_KEY);
  let localOrdersList: Order[] = stored ? JSON.parse(stored) : [];
  let updatedOrder: Order | null = null;

  localOrdersList = localOrdersList.map(o => {
    if (o.id === id) {
      updatedOrder = { ...o, status };
      return updatedOrder;
    }
    return o;
  });
  localStorage.setItem(ORDERS_LOCAL_STORAGE_KEY, JSON.stringify(localOrdersList));

  if (!keys.isConfigured || !client) {
    return { data: updatedOrder, error: null };
  }

  try {
    const { data, error } = await client
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data: data ? data[0] : updatedOrder, error: null };
  } catch (err: any) {
    console.error('Erro ao atualizar status do pedido no Supabase:', err);
    return {
      data: updatedOrder,
      error: `Atualizado localmente. Erro no Supabase: ${err.message || err}`
    };
  }
}
