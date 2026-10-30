import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, Sparkles, ArrowRight, Sun, Moon, Users } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 3 usuários de demonstração rápida para alternar com 1 clique
  const quickUsers = [
    { name: 'Arione (Principal)', email: 'arione@financas.app', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arione' },
    { name: 'Usuário 2 (Família)', email: 'familia@financas.app', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Familia' },
    { name: 'Usuário 3 (Convidado)', email: 'convidado@financas.app', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Convidado' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      let res;
      if (isRegister) {
        res = await api.register(name, email, password);
      } else {
        res = await api.login(email, password);
      }
      onLoginSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao autenticar. Verifique seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulação instantânea de login com Google
      const mockGoogle = {
        name: name || 'Arione',
        email: email || 'arione@gmail.com',
        googleId: 'google-oauth-' + Date.now(),
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleArione'
      };
      const res = await api.loginGoogle(mockGoogle);
      onLoginSuccess(res);
    } catch (e: any) {
      setErrorMessage('Falha ao conectar com Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = async (u: { name: string; email: string; avatar: string }) => {
    setIsLoading(true);
    try {
      const res = await api.loginGoogle({
        name: u.name,
        email: u.email,
        googleId: 'quick-' + u.email,
        avatarUrl: u.avatar
      });
      onLoginSuccess(res);
    } catch (e) {
      // Fallback
      onLoginSuccess({ id: 'u-' + u.email, name: u.name, email: u.email, avatarUrl: u.avatar });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative transition-colors duration-200">
      
      {/* Botão de Alternar Tema no Canto Superior */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-md hover:scale-105 transition-all"
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">

        {/* Logo & Boas-vindas */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            F
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Finanças Pro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? 'Crie sua conta para gerenciar seu patrimônio' : 'Acesse seu painel financeiro inteligente'}
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 transition-colors">
          
          {/* Seletor de Abas: Entrar vs Criar Conta */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMessage(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMessage(''); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Botão de Login com Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {/* Logo Oficial do Google em SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continuar com Google</span>
          </button>

          {/* Divisor */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            <span className="bg-white dark:bg-[#131B2E] px-3 text-[11px] font-medium text-slate-400 absolute">
              ou com e-mail
            </span>
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Formulário de E-mail / Senha */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Criar Minha Conta' : 'Acessar Finanças'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Alternância Rápida entre os 3 Usuários (Perfeito para a família) */}
        <div className="bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-indigo-500" /> Acesso Rápido (3 Usuários da Casa)
          </div>

          <div className="grid grid-cols-1 gap-2">
            {quickUsers.map((qu, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSelect(qu)}
                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <img src={qu.avatar} alt={qu.name} className="w-7 h-7 rounded-full bg-indigo-500/10" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{qu.name}</p>
                    <p className="text-[10px] text-slate-400">{qu.email}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Entrar &rarr;</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
