import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product } from './types';

// Storage keys
const LOCAL_OVERRIDE_URL_KEY = 'supabase_url_override';
const LOCAL_OVERRIDE_KEY_KEY = 'supabase_key_override';
const PRODUCTS_LOCAL_STORAGE_KEY = 'clothing_shop_admin_products';
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
          tamanhos_estoque: productData.tamanhos_estoque || {}
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
        tamanhos_estoque: productData.tamanhos_estoque || {}
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
