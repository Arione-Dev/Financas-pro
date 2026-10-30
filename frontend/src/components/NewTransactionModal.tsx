import React, { useState } from 'react';
import { X, Check, CreditCard as CardIcon } from 'lucide-react';
import { api } from '../services/api';
import { Account, CreditCard, Category, PaymentMethod, TransactionType } from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  cards,
  categories
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [creditCardId, setCreditCardId] = useState(cards[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [installments, setInstallments] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setIsSubmitting(true);
    try {
      await api.createTransaction({
        description,
        amount: parseFloat(amount),
        date,
        type,
        paymentMethod: type === 'INCOME' ? 'PIX' : paymentMethod,
        accountId: paymentMethod !== 'CREDIT_CARD' || type === 'INCOME' ? accountId : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' ? creditCardId : undefined,
        categoryId: categoryId || undefined,
        totalInstallments: paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' ? installments : 1
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao salvar lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 transition-colors">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Novo Lançamento Manual</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Tipo: Despesa ou Receita */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'EXPENSE' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Supermercado, Salário"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {type === 'EXPENSE' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-2">
                {(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'] as PaymentMethod[]).map(pm => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2 text-xs font-bold rounded-xl border ${
                      paymentMethod === pm ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {pm === 'PIX' && 'Pix'}
                    {pm === 'CREDIT_CARD' && 'Crédito'}
                    {pm === 'DEBIT_CARD' && 'Débito'}
                    {pm === 'CASH' && 'Dinheiro'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-indigo-500/20">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cartão</label>
                <select
                  value={creditCardId}
                  onChange={e => setCreditCardId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                >
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Parcelas</label>
                <select
                  value={installments}
                  onChange={e => setInstallments(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
                >
                  <option value={1}>À vista (1x)</option>
                  {[2,3,4,5,6,10,12].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}
          </button>
        </form>

      </div>
    </div>
  );
};

