export interface Product {
  id?: string;
  created_at?: string;
  nome: string;
  preco: number;
  categoria: string;
  tamanho: string;
  descricao?: string;
  imagem?: string;
  estoque: number;
  tamanhos_estoque?: Record<string, number>;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  usingFallback: boolean;
}

export interface AdminUser {
  email: string;
  token?: string;
}
