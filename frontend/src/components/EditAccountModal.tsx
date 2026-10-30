import React, { useState, useEffect } from 'react';
import { X, Check, Wallet, PlusCircle, DollarSign, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { Account } from '../types';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBalance: (accountId: string, newBalance: number) => void;
  onAddIncome: (accountId: string, amount: number, description: string) => void;
  onDeleteAccount?: (accountId: string) => void;
  onCreateAccount?: (account: { name: string; type: 'CHECKING' | 'SAVINGS' | 'CASH'; currentBalance: number; color?: string }) => void;
  accounts: Account[];
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  onSaveBalance,
  onAddIncome,
  onDeleteAccount,
  onCreateAccount,
  accounts
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [mode, setMode] = useState<'SALARY' | 'BALANCE' | 'NEW_ACCOUNT'>('SALARY');
  const [amount, setAmount] = useState<string>('3500.00');
  const [description, setDescription] = useState<string>('Salário Mensal');
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountType, setNewAccountType] = useState<'CHECKING' | 'SAVINGS' | 'CASH'>('CHECKING');
  const [newAccountBalance, setNewAccountBalance] = useState<string>('0.00');

  // Garante que a conta selecionada seja sincronizada assim que accounts for carregado
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId)) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [accounts, selectedAccountId]);

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  useEffect(() => {
    if (mode === 'BALANCE' && currentAccount) {
      setAmount(String(currentAccount.currentBalance || 0));
    }
  }, [mode, currentAccount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) return;

    const targetId = selectedAccountId || accounts[0]?.id;
    if (!targetId) return;

    if (mode === 'SALARY') {
      onAddIncome(targetId, val, description);
    } else {
      onSaveBalance(targetId, val);
    }

    onClose();
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
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Gerenciar Contas & Saldo</h3>
              <p className="text-xs text-slate-500">Lançar salário, ajustar saldos ou gerenciar contas</p>
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
          
          {/* Alternador de Ação (3 opções: Salário, Ajustar Saldo, Nova Conta) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('SALARY'); setDescription('Salário Mensal'); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
                mode === 'SALARY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              + Salário
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('BALANCE');
                if (currentAccount) setAmount(String(currentAccount.currentBalance));
              }}
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

          {/* MODO 1 & 2: Salário ou Ajuste de Saldo */}
          {mode !== 'NEW_ACCOUNT' && (
            <>
              {/* Selecionar Conta */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Qual conta você deseja gerenciar?
                </label>
                {accounts.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    Nenhuma conta encontrada. Clique em "+ Nova Conta" acima para criar sua primeira conta.
                  </div>
                ) : (
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — Saldo: {formatBRL(a.currentBalance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Se modo Salário: Descrição */}
              {mode === 'SALARY' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Descrição da Receita
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Ex: Salário Mensal, Renda Extra, Bônus"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Valor */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  {mode === 'SALARY' ? 'Valor do Salário / Receita (R$)' : 'Novo Saldo da Conta (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Botão de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={accounts.length === 0}
                  className={`w-full py-3.5 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 ${
                    mode === 'SALARY'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'SALARY' ? 'Confirmar Salário (+ Entradas)' : 'Atualizar Saldo da Conta'}</span>
                </button>
              </div>

              {/* Opção para Apagar a Conta Selecionada */}
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
            </>
          )}

          {/* MODO 3: Criar Nova Conta */}
          {mode === 'NEW_ACCOUNT' && (
            <>
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
            </>
          )}

        </form>

      </div>
    </div>
  );
};
