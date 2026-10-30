import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, PlusCircle, DollarSign, CheckCircle2, Trash2, Plus, Sparkles, Building2 } from 'lucide-react';
import { Account } from '../types';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBalance: (accountId: string, newBalance: number) => void;
  onSaveSalary: (salary: number) => void;
  onDeleteAccount?: (accountId: string) => void;
  onCreateAccount?: (account: { name: string; type: 'CHECKING' | 'SAVINGS' | 'CASH'; currentBalance: number; color?: string }) => void;
  accounts: Account[];
  initialSalary?: number;
  initialMode?: 'SALARY' | 'BALANCE' | 'NEW_ACCOUNT';
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  onSaveBalance,
  onSaveSalary,
  onDeleteAccount,
  onCreateAccount,
  accounts,
  initialSalary = 3500,
  initialMode = 'SALARY'
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [mode, setMode] = useState<'SALARY' | 'BALANCE' | 'NEW_ACCOUNT'>(initialMode);
  const [salaryAmount, setSalaryAmount] = useState<string>(String(initialSalary));
  const [balanceAmount, setBalanceAmount] = useState<string>('0.00');
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountType, setNewAccountType] = useState<'CHECKING' | 'SAVINGS' | 'CASH'>('CHECKING');
  const [newAccountBalance, setNewAccountBalance] = useState<string>('0.00');

  useEffect(() => {
    if (initialSalary) {
      setSalaryAmount(String(initialSalary));
    }
  }, [initialSalary]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Sincroniza a conta selecionada
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId)) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [accounts, selectedAccountId]);

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  useEffect(() => {
    if (currentAccount) {
      setBalanceAmount(String(currentAccount.currentBalance ?? 0));
    }
  }, [currentAccount, selectedAccountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'SALARY') {
      const val = parseFloat(salaryAmount);
      if (!isNaN(val) && val >= 0) {
        onSaveSalary(val);
        onClose();
      }
      return;
    }

    if (mode === 'BALANCE') {
      const val = parseFloat(balanceAmount);
      const targetId = selectedAccountId || accounts[0]?.id;
      if (!isNaN(val) && val >= 0 && targetId) {
        onSaveBalance(targetId, val);
        onClose();
      }
      return;
    }

    if (mode === 'NEW_ACCOUNT') {
      if (!newAccountName.trim() || !onCreateAccount) return;
      onCreateAccount({
        name: newAccountName.trim(),
        type: newAccountType,
        currentBalance: parseFloat(newAccountBalance) || 0,
        color: newAccountType === 'CHECKING' ? '#8A05BE' : newAccountType === 'SAVINGS' ? '#FF7A00' : '#10B981'
      });
      setNewAccountName('');
      setNewAccountBalance('0.00');
      onClose();
      return;
    }
  };

  const handleDelete = () => {
    if (!currentAccount || !onDeleteAccount) return;
    if (confirm(`Tem certeza que deseja apagar permanentemente a conta "${currentAccount.name}"?`)) {
      onDeleteAccount(currentAccount.id);
      const remaining = accounts.filter(a => a.id !== currentAccount.id);
      if (remaining.length > 0) {
        setSelectedAccountId(remaining[0].id);
      } else {
        setSelectedAccountId('');
      }
      onClose();
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {mode === 'SALARY' ? 'Salário Fixo Mensal' : mode === 'BALANCE' ? 'Ajustar Saldo da Conta' : 'Nova Conta Bancária'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'SALARY' ? 'Configuração da sua renda fixa mensal' : mode === 'BALANCE' ? 'Atualização de saldo sem criar Pix' : 'Adicione bancos e carteiras'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          
          {/* Seletor de Modo */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('SALARY')}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'SALARY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Salário Fixo
            </button>
            <button
              type="button"
              onClick={() => setMode('BALANCE')}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'BALANCE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ajustar Saldo
            </button>
            <button
              type="button"
              onClick={() => setMode('NEW_ACCOUNT')}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'NEW_ACCOUNT'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              + Nova Conta
            </button>
          </div>

          {/* MODO 1: Salário Fixo Mensal */}
          {mode === 'SALARY' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl">
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                  💡 <strong>Salário é um valor fixo mensal</strong>. Ajustar aqui define a sua renda base oficial sem poluir o extrato com depósitos de Pix fictícios.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Valor do Salário Fixo Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={salaryAmount}
                  onChange={e => setSalaryAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Salário Fixo</span>
                </button>
              </div>
            </div>
          )}

          {/* MODO 2: Ajustar Saldo de Conta */}
          {mode === 'BALANCE' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Selecione a conta que deseja ajustar
                </label>
                {accounts.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    Nenhuma conta cadastrada. Use a aba "+ Nova Conta" acima.
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo Atual: {formatBRL(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Novo Saldo Real da Conta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={accounts.length === 0}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Atualizar Saldo da Conta</span>
                </button>
              </div>

              {currentAccount && onDeleteAccount && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline py-1 px-3 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Apagar a conta "{currentAccount.name}"</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODO 3: Criar Nova Conta */}
          {mode === 'NEW_ACCOUNT' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Nome da Conta / Banco
                </label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  placeholder="Ex: Nubank, Banco Inter, Carteira, Itaú"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Tipo de Conta
                </label>
                <select
                  value={newAccountType}
                  onChange={e => setNewAccountType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="CHECKING">Conta Corrente</option>
                  <option value="SAVINGS">Conta Poupança / Reserva</option>
                  <option value="CASH">Dinheiro Físico / Carteira</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Saldo Inicial (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAccountBalance}
                  onChange={e => setNewAccountBalance(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Nova Conta</span>
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </div>
  );
};
