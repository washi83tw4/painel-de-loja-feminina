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

export interface OrderItem {
  id?: string;
  nome: string;
  preco: number;
  quantidade: number;
  tamanho?: string;
  imagem?: string;
}

export interface Order {
  id: string; // Wait, orders will always have ids, either uuid or generated string for mock
  created_at?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_cpf?: string;
  address_zipcode: string;
  address_street: string;
  address_number: string;
  address_complement?: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  notes?: string;
  items: OrderItem[];
  total: number;
  status: 'novo' | 'em separação' | 'enviado' | 'entregue' | 'cancelado';
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
