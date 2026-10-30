import React, { useState } from 'react';
import { X, Check, Wallet, PlusCircle, DollarSign } from 'lucide-react';
import { Account } from '../types';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBalance: (accountId: string, newBalance: number) => void;
  onAddIncome: (accountId: string, amount: number, description: string) => void;
  accounts: Account[];
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  onSaveBalance,
  onAddIncome,
  accounts
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [mode, setMode] = useState<'SALARY' | 'BALANCE'>('SALARY');
  const [amount, setAmount] = useState<string>('3500.00');
  const [description, setDescription] = useState<string>('Salário Mensal');

  if (!isOpen) return null;

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val)) return;

    if (mode === 'SALARY') {
      onAddIncome(selectedAccountId, val, description);
    } else {
      onSaveBalance(selectedAccountId, val);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Gerenciar Saldo & Salário</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Alternador de Ação */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('SALARY'); setDescription('Salário Mensal'); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'SALARY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              + Lançar Salário
            </button>
            <button
              type="button"
              onClick={() => { setMode('BALANCE'); setAmount(String(currentAccount?.currentBalance || 0)); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'BALANCE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Ajustar Saldo Atual
            </button>
          </div>

          {/* Selecionar Conta */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Qual conta?</label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (Saldo Atual: R$ {a.currentBalance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {mode === 'SALARY' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Descrição da Receita</label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                placeholder="Ex: Salário, Rendimentos, Pix recebido"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {mode === 'SALARY' ? 'Valor do Salário / Receita (R$)' : 'Novo Saldo Real da Conta (R$)'}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              mode === 'SALARY'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{mode === 'SALARY' ? 'Confirmar Salário (+ Entradas)' : 'Atualizar Saldo da Conta'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
