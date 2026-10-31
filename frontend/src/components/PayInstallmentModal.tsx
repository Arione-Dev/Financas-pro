import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Wallet, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, Account } from '../types';

interface PayInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transactionId: string, accountId: string) => void;
  transaction: Transaction | null;
  accounts: Account[];
}

export const PayInstallmentModal: React.FC<PayInstallmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  accounts
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (accounts.length > 0 && (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId))) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, isOpen]);

  if (!isOpen || !transaction) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAccountId = selectedAccountId || accounts[0]?.id;
    if (!targetAccountId) {
      alert('Selecione uma conta bancária para debitar o pagamento.');
      return;
    }

    setIsSubmitting(true);
    try {
      onConfirm(transaction.id, targetAccountId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Pagar Parcela Individual</h3>
              <p className="text-xs text-slate-500">Confirmação de baixa da parcela</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          
          {/* Detalhes da Parcela */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Lançamento</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {transaction.totalInstallments && transaction.totalInstallments > 1
                  ? `Parcela ${transaction.installmentNumber}/${transaction.totalInstallments}`
                  : 'Compra Avulsa'}
              </span>
            </div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{transaction.description}</p>
            
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Valor da Parcela:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Seleção da Conta para Débito */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-indigo-500" />
              <span>Debitar de qual conta bancária?</span>
            </label>

            {accounts.length === 0 ? (
              <p className="text-xs text-amber-600 p-2.5 bg-amber-50 rounded-xl">
                Nenhuma conta bancária encontrada. Cadastre uma conta primeiro.
              </p>
            ) : (
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: {formatCurrency(acc.currentBalance)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
            Ao confirmar, o valor de <strong>{formatCurrency(transaction.amount)}</strong> será descontado do saldo da conta e o limite do cartão será liberado.
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || accounts.length === 0}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirmando...' : 'Confirmar Pagamento'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

