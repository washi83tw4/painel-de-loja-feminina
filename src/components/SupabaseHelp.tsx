import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, RefreshCw, Key } from 'lucide-react';
import { getSupabaseKeys, saveSupabaseOverrideKeys, clearSupabaseOverrideKeys } from '../supabaseClient';
import { SupabaseConfig } from '../types';

interface SupabaseHelpProps {
  onConfigChanged: () => void;
  supabaseConfig: SupabaseConfig;
}

export default function SupabaseHelp({ onConfigChanged, supabaseConfig }: SupabaseHelpProps) {
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const sqlCode = `-- 1. Execute estes comandos no Editor de SQL do seu painel Supabase
-- para criar tanto as tabelas de PRODUTOS quanto de PEDIDOS (ORDERS)

-- =======================================================
-- TABELA DE PRODUTOS
-- =======================================================
create table if not exists produtos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  preco numeric not null,
  categoria text not null,
  tamanho text not null, -- PP, P, M, G, etc (ex: "P, M, G")
  descricao text,
  imagem text, -- URL da imagem do produto
  estoque integer not null default 0, -- Estoque total somado
  tamanhos_estoque jsonb not null default '{}'::jsonb, -- Grade de estoques específicos (ex: {"P": 5, "M": 0, "G": 10})
  em_promocao boolean not null default false,
  preco_promocional numeric,
  destaque boolean not null default false,
  banner boolean not null default false,
  ativo boolean not null default true,
  banner_image text, -- URL da imagem de fundo do banner (bucket banners)
  banner_bg text -- Cor ou gradiente de fundo do banner (ex: "#fdf2f8")
);

alter table produtos enable row level security;

drop policy if exists "Permitir leitura pública de produtos" on produtos;
drop policy if exists "Permitir controle total para administradores" on produtos;

create policy "Permitir leitura pública de produtos" 
on produtos for select 
using (true);

create policy "Permitir controle total para administradores" 
on produtos for all 
using (true) 
with check (true);

-- =======================================================
-- TABELA DE PEDIDOS (ORDERS)
-- =======================================================
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  customer_cpf text,

  address_zipcode text not null,
  address_street text not null,
  address_number text not null,
  address_complement text,
  address_neighborhood text not null,
  address_city text not null,
  address_state text not null,

  notes text,
  items jsonb not null, -- [{ id, nome, preco, quantidade, tamanho, imagem }]
  total numeric not null default 0,
  status text not null default 'novo'
);

alter table orders enable row level security;

drop policy if exists "Permitir criar pedidos" on orders;
drop policy if exists "Permitir ler pedidos" on orders;
drop policy if exists "Permitir atualizar pedidos" on orders;

create policy "Permitir criar pedidos"
on orders for insert
with check (true);

create policy "Permitir ler pedidos"
on orders for select
using (true);

create policy "Permitir atualizar pedidos"
on orders for update
using (true)
with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveOverrides = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim() && customKey.trim()) {
      saveSupabaseOverrideKeys(customUrl, customKey);
      setSaveSuccess(true);
      onConfigChanged();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleClearOverrides = () => {
    clearSupabaseOverrideKeys();
    setCustomUrl('');
    setCustomKey('');
    onConfigChanged();
  };

  const currentKeys = getSupabaseKeys();

  return (
    <div id="supabase-help-tabs" className="space-y-6">
      {/* 2-Columns Grid: Config Settings Left / SQL Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive UI Conn Credentials Panel */}
        <div className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-600 rounded-lg text-white">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 leading-tight font-sans">Conexão em Tempo Real</h4>
              <p className="text-xs text-slate-500 mt-0.5">Defina suas credenciais do banco Supabase</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Por padrão, o painel tenta carregar as variáveis <code className="bg-slate-100 p-0.5 rounded font-mono">VITE_SUPABASE_URL</code> e <code className="bg-slate-100 p-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> do arquivo <code className="font-mono bg-slate-100 p-0.5 rounded">.env</code>.
          </p>

          <div className={`p-4 rounded-xl border ${supabaseConfig.isConfigured ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-amber-50/50 border-amber-100 text-amber-900'}`}>
            <div className="flex items-center gap-1.5 font-bold text-xs font-mono mb-1.5 uppercase tracking-wide">
              <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              Status Atual do Cliente:
            </div>
            <p className="text-xs leading-relaxed">
              {supabaseConfig.isConfigured ? (
                <span>
                   <strong>Ativo e Operante!</strong> {currentKeys.source === 'local' ? 'Conectado usando chaves do formulário abaixo.' : 'Conectado usando as seguranças de ambiente .env do servidor.'}
                </span>
              ) : (
                <span>
                  <strong>Modo Demonstrativo!</strong> O app está isolado no localStorage corporativo. Preencha abaixo ou configure o arquivo .env para persistir no Supabase global.
                </span>
              )}
            </p>
          </div>

          {/* Connection overrides form */}
          <form onSubmit={handleSaveOverrides} className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Configuração via Interface</h5>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Supabase URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://sua-id-projeto.supabase.co"
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Supabase Anon Key (Public Key)
              </label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white"
              />
            </div>

            {saveSuccess && (
              <p className="text-[11px] font-semibold text-emerald-600 animate-fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Chaves ativas com sucesso! Atualizando conexão...
              </p>
            )}

            <div className="flex gap-2.5 pt-1.5">
              <button
                type="submit"
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-3 rounded-xl font-semibold text-xs transition text-center cursor-pointer shadow-sm"
              >
                Conectar Banco
              </button>
              
              {supabaseConfig.usingFallback && currentKeys.source === 'local' && (
                <button
                  type="button"
                  onClick={handleClearOverrides}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs text-slate-600 font-medium transition cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>

          {currentKeys.source === 'local' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleClearOverrides}
                className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Remover chaves customizadas e voltar para o .env padrão
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Copyable SQL & Settings Instructions */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-tight font-sans">Estrutura do Banco SQL</h4>
                <p className="text-xs text-slate-500 mt-0.5">Instruções para a criação das tabelas</p>
              </div>
            </div>

            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Abra o painel do seu projeto no{' '}
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-slate-900 hover:underline inline-flex items-center gap-0.5"
            >
              Supabase <ExternalLink className="w-3 h-3 text-pink-500" />
            </a>
            , acesse o menu <strong>SQL Editor</strong>, clique em <strong>New Query</strong>, cole o código abaixo e execute para criar os campos necessários integrados:
          </p>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 text-xs font-mono bg-slate-950 text-slate-200 p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
              <span>SQL Query Editor</span>
              <Terminal className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <pre className="overflow-x-auto max-h-72 text-[11px] leading-relaxed custom-scrollbar">
              {sqlCode}
            </pre>
          </div>

          <div className="px-3.5 py-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <h6 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
              📋 Campos Criados na Tabela:
            </h6>
             <ul className="text-xs text-slate-600 grid grid-cols-2 gap-x-4 gap-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
              <li>&bull; <strong className="text-slate-950 font-semibold">nome:</strong> Título da roupa</li>
              <li>&bull; <strong className="text-slate-950 font-semibold">preco:</strong> Preço numérico</li>
              <li>&bull; <strong className="text-slate-950 font-semibold">categoria:</strong> Camisas, etc.</li>
              <li>&bull; <strong className="text-slate-950 font-semibold font-mono">tamanho:</strong> PP, P, M, G, etc.</li>
              <li>&bull; <strong className="text-slate-950 font-semibold">descricao:</strong> Texto livre</li>
              <li>&bull; <strong className="text-slate-950 font-semibold">imagem:</strong> URL da foto</li>
              <li>&bull; <strong className="text-slate-950 font-semibold">estoque:</strong> Estoque total</li>
              <li>&bull; <strong className="text-slate-950 font-semibold font-mono">tamanhos_estoque:</strong> Grade individual JSONB</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
