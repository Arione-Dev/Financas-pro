import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, Tag, DollarSign, Wallet, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, Account, CreditCard, Category, PaymentMethod } from '../types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txId: string, updatedData: any) => Promise<void> | void;
  transaction: Transaction | null;
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  accounts,
  cards,
  categories
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [accountId, setAccountId] = useState('');
  const [creditCardId, setCreditCardId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setAmount(transaction.amount || 0);
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setCategoryId(transaction.category?.id || categories[0]?.id || '');
      setPaymentMethod(transaction.paymentMethod || 'PIX');
      setAccountId(transaction.account?.id || (transaction as any).accountId || accounts[0]?.id || '');
      setCreditCardId(transaction.creditCard?.id || (transaction as any).creditCardId || cards[0]?.id || '');
    }
  }, [transaction, isOpen, categories, accounts, cards]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0 || !date) {
      alert('Preencha os campos obrigatórios corretamente.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(transaction.id, {
        description: description.trim(),
        amount: Number(amount),
        date,
        categoryId: categoryId || undefined,
        paymentMethod,
        accountId: paymentMethod !== 'CREDIT_CARD' ? accountId : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' ? creditCardId : undefined
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInstallment = transaction.totalInstallments && transaction.totalInstallments > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Editar Lançamento</h3>
            <p className="text-xs text-slate-500">Corrija valores, categoria ou data do registro</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {isInstallment && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-300">
              💡 <strong>Compra Parcelada:</strong> Você está editando a <strong>Parcela {transaction.installmentNumber}/{transaction.totalInstallments}</strong>. Ao alterar a data, o ciclo e vencimento das parcelas serão sincronizados automaticamente.
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Supermercado, Curso, Farmácia"
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Valor (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data do Gasto
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'PIX', label: 'Pix' },
                { id: 'CREDIT_CARD', label: 'Crédito' },
                { id: 'DEBIT_CARD', label: 'Débito' },
                { id: 'CASH', label: 'Dinheiro' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    paymentMethod === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conta de Origem ou Cartão */}
          {paymentMethod === 'CREDIT_CARD' ? (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Cartão de Crédito
              </label>
              <select
                value={creditCardId}
                onChange={e => setCreditCardId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {cards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.name} (Fecha dia {card.closingDay} • Vence dia {card.dueDay})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Conta Bancária
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botões de Ação */}
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
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

