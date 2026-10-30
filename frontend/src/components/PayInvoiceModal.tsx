import React, { useState } from 'react';
import { X, Check, CheckCircle2, Wallet, CreditCard as CardIcon } from 'lucide-react';
import { Account, CreditCard } from '../types';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: string) => void;
  card: CreditCard;
  invoiceAmount: number;
  accounts: Account[];
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  card,
  invoiceAmount,
  accounts
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');

  React.useEffect(() => {
    if (accounts.length > 0 && (!selectedAccountId || !accounts.some(a => a.id === selectedAccountId))) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;
    onConfirm(selectedAccountId);
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Dar Baixa na Fatura</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePay} className="p-5 space-y-4">
          
          {/* Card Resumo do Pagamento */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total da Fatura • {card.name}</span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(invoiceAmount)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Vencimento em {card.dueDay}/11
            </p>
          </div>

          {/* Seleção da Conta de Origem */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> De qual conta vai sair o dinheiro?
            </label>
            <div className="space-y-2">
              {accounts.map(acc => {
                const isSelected = selectedAccountId === acc.id;
                const hasBalance = acc.currentBalance >= invoiceAmount;
                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: acc.color }}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</p>
                        <p className="text-[11px] text-slate-500">Saldo: {formatCurrency(acc.currentBalance)}</p>
                      </div>
                    </div>

                    {!hasBalance && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md font-semibold">
                        Saldo insuficiente
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            Ao confirmar, o valor de <strong>{formatCurrency(invoiceAmount)}</strong> será debitado da sua conta e a fatura será liquidada.
          </p>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar Pagamento da Fatura</span>
          </button>
        </form>

      </div>
    </div>
  );
};

