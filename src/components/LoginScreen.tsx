import React, { useState } from 'react';
import { Lock, Mail, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AdminUser, SupabaseConfig } from '../types';
import { getSupabaseClient } from '../supabaseClient';

interface LoginScreenProps {
  onLoginSuccess: (user: AdminUser) => void;
  supabaseConfig: SupabaseConfig;
}

export default function LoginScreen({ onLoginSuccess, supabaseConfig }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const client = getSupabaseClient();
    if (!client) {
      setError('Cliente do Supabase não conectado. Configure as credenciais na aba correspondente do painel ou use o arquivo .env.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos no Supabase. Por favor, insira uma conta que já esteja cadastrada.'
          : authError.message);
        setIsLoading(false);
        return;
      }

      if (data && data.user) {
        onLoginSuccess({
          email: data.user.email || email,
          token: data.session?.access_token || 'supabase-authenticated'
        });
      } else {
        setError('Ocorreu um erro ao obter os dados da sessão.');
      }
    } catch (err: any) {
      setError(`Erro de autenticação no Supabase: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex bg-slate-50 font-sans">
      {/* Editorial/High-fashion Photo Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-90 bg-cover bg-center transition-transform hover:scale-105 duration-1000" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80')" }}></div>
        {/* Soft, very light overlay to let the beautiful fashion photo shine through brightly while keeping text legible */}
        <div className="absolute inset-0 bg-black/10 animate-fade-in"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-md text-white text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md mb-6 border border-white/20">
            <Sparkles id="title-icon" className="w-4 h-4 text-pink-300" />
            <span className="text-xs uppercase tracking-widest font-mono font-medium">Maison Atelier Moda</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-sm font-sans text-white">
            Maison Atelier
          </h1>
          <p className="text-slate-200 text-sm leading-relaxed mb-6 font-normal">
            A plataforma de administração de alta costura para controle impecável de produtos, estoque inteligente em tempo real e análise de faturamento integrado ao Supabase.
          </p>
          <div className="text-xs text-slate-400 font-mono mt-12">
            CONCEITO EXCLUSIVO DE GESTÃO &bull; 2026
          </div>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-600 text-white mb-4 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950 tracking-tight">Maison Atelier</h2>
            <p className="text-sm text-slate-500 mt-1.5">Acesso administrativo de controle de faturamento e estoque premium</p>
          </div>

          {/* Database Info Banner */}
          <div className={`p-3 rounded-lg text-xs leading-relaxed mb-6 border ${supabaseConfig.isConfigured ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            <div className="font-semibold mb-1 flex items-center gap-1.5 font-mono">
              <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              Status do Banco de Dados:
            </div>
            {supabaseConfig.isConfigured ? (
              <p>Conectado ao seu Supabase remoto de forma robusta e persistente.</p>
            ) : (
              <p>Chaves do Supabase não configuradas no <code className="font-mono bg-amber-100/60 px-1 py-0.5 rounded">.env</code>. Utilizando <strong>Modo Demonstração (Local Storage)</strong>. Suas modificações serão salvas localmente até configurar as credenciais.</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs flex gap-2 items-start animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail do Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
                  placeholder="admin@admin.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-pink-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-55 flex items-center justify-center gap-2 mt-2 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>

          {/* Safe instructions banner indicating real Supabase credentials should be used */}
          <div className="mt-8 pt-6 border-t border-slate-150 text-center">
            <span className="text-xs text-slate-400 block mb-1">
              Conexão com Banco de Dados Ativada:
            </span>
            <span className="text-[11px] font-sans text-pink-600 font-bold bg-pink-50 border border-pink-100 rounded-lg py-1 px-3 inline-block">
              Insira o e-mail e senha de uma conta cadastrada no seu Supabase Auth para acessar.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
