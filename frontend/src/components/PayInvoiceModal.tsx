import React, { useState, useEffect } from 'react';
import { X, Check, CheckCircle2, Wallet, CreditCard as CardIcon } from 'lucide-react';
import { Account, CreditCard } from '../types';
import { api } from '../services/api';

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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('SALARIO');
  const salaryBalance = api.getSalaryRemaining();

  useEffect(() => {
    if (isOpen) {
      setSelectedAccountId('SALARIO');
    }
  }, [isOpen]);

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
              Vencimento dia {card.dueDay}
            </p>
          </div>

          {/* Seleção da Conta de Origem */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-indigo-500" /> De qual conta vai sair o pagamento?
            </label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="SALARIO">
                💰 Salário do Mês Atual — Saldo: {formatCurrency(salaryBalance)} (Descontar do Salário)
              </option>
              <option value="ALREADY_PAID">
                ✓ Já Paga Anteriormente (Marcar fatura paga sem descontar saldo)
              </option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Saldo: {formatCurrency(acc.currentBalance)}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
            {selectedAccountId === 'ALREADY_PAID'
              ? 'A fatura será liquidada e o limite do cartão será liberado sem debitar de nenhuma conta ou salário.'
              : selectedAccountId === 'SALARIO'
              ? `Ao confirmar, o valor de ${formatCurrency(invoiceAmount)} será debitado do Salário do Mês Atual e a fatura será liquidada.`
              : `Ao confirmar, o valor de ${formatCurrency(invoiceAmount)} será debitado da conta selecionada e a fatura será liquidada.`}
          </div>

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

