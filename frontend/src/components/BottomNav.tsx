import React from 'react';
import { LayoutDashboard, Receipt, CreditCard as CardIcon, Plus, Camera } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'transactions' | 'cards';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'cards') => void;
  onOpenScan: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenScan
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-2 safe-bottom flex items-center justify-around shadow-2xl transition-colors">
      
      {/* Botão Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
          currentTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Início</span>
      </button>

      {/* Botão Extrato */}
      <button
        onClick={() => onSelectTab('transactions')}
        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
          currentTab === 'transactions' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Receipt className="w-5 h-5" />
        <span className="text-[10px]">Extrato</span>
      </button>

      {/* Botão Central de Destaque: Câmera / Comprovante com IA */}
      <div className="-mt-6">
        <button
          onClick={onOpenScan}
          className="w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-slate-50 dark:border-[#0B0F19] active:scale-95 transition-transform"
          title="Tirar foto do comprovante"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>

      {/* Botão Cartões */}
      <button
        onClick={() => onSelectTab('cards')}
        className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
          currentTab === 'cards' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <CardIcon className="w-5 h-5" />
        <span className="text-[10px]">Cartões</span>
      </button>

    </div>
  );
};

