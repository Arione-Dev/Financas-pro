import React from 'react';
import { LayoutDashboard, Receipt, CreditCard as CardIcon, Sparkles, PlusCircle, Sun, Moon, LogOut } from 'lucide-react';
import { QuotaBadge } from './QuotaBadge';
import { User } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'transactions' | 'cards';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'cards') => void;
  onOpenScan: () => void;
  onOpenNewTransaction: () => void;
  waitSeconds: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenScan,
  onOpenNewTransaction,
  waitSeconds,
  theme,
  onToggleTheme,
  currentUser,
  onLogout
}) => {
  return (
    <>
      {/* HEADER SUPERIOR (Visível em celular e PC) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
            F
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">Finanças Pro</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">PWA • Gestão Inteligente com IA</p>
          </div>
        </div>

        {/* Badge de Cota de IA, Botão de Tema, Perfil e Lançamento */}
        <div className="flex items-center gap-2 sm:gap-3">
          <QuotaBadge externalWaitSeconds={waitSeconds} />
          
          {/* Botão de Alternar Modo Claro / Escuro */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Usuário Logado & Botão de Sair */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                title={currentUser.name}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:block max-w-[90px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sair / Trocar de conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-indigo-600 sm:bg-slate-100 sm:dark:bg-slate-800 hover:bg-indigo-700 sm:hover:bg-slate-200 sm:dark:hover:bg-slate-700 text-white sm:text-slate-800 sm:dark:text-slate-200 text-xs font-semibold rounded-xl border border-transparent sm:border-slate-300 sm:dark:border-slate-700 shadow-sm transition-transform active:scale-95"
            title="Novo Lançamento"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white sm:text-indigo-500" />
            <span className="hidden sm:inline">Lançar</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR PARA DESKTOP / PC */}
      <aside className="hidden lg:flex fixed left-0 top-[65px] bottom-0 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] p-5 flex-col justify-between transition-colors">
        <nav className="space-y-1.5">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Geral</span>
          </button>

          <button
            onClick={() => onSelectTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Extrato & Transações</span>
          </button>

          <button
            onClick={() => onSelectTab('cards')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              currentTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <CardIcon className="w-4 h-4" />
            <span>Cartões & Faturas</span>
          </button>
        </nav>

        {/* Card de Ação Rápida de Comprovante na Sidebar */}
        <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/60 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Leitor de Notas</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Envie o comprovante para extrair loja e parcelas.</p>
          </div>
          <button
            onClick={onOpenScan}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Analisar Cupom
          </button>
        </div>
      </aside>
    </>
  );
};

