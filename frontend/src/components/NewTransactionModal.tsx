import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard as CardIcon, Plus, Calendar, Layers, ShieldCheck, ChevronDown, CheckCircle2, Repeat, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Account, CreditCard, Category, PaymentMethod, TransactionType } from '../types';
import { getBankPreset } from '../constants/banks';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  onOpenAddCard?: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  cards,
  categories,
  onOpenAddCard
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [accountId, setAccountId] = useState('SALARIO');
  const salaryBalance = api.getSalaryRemaining();
  const [creditCardId, setCreditCardId] = useState(cards[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [installments, setInstallments] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cards.length > 0 && (!creditCardId || !cards.some(c => c.id === creditCardId))) {
      setCreditCardId(cards[0].id);
    }
  }, [cards, creditCardId, isOpen]);

  useEffect(() => {
    if (accountId === 'SALARIO') return;
    if (accounts.length > 0 && (!accountId || !accounts.some(a => a.id === accountId))) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (paymentMethod !== 'CREDIT_CARD' && type === 'EXPENSE') {
        if (!accountId) {
          setAccountId('SALARIO');
        }
      }
    }
  }, [isOpen, paymentMethod, type]);

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const installmentValue = installments > 0 && parsedAmount > 0 ? (parsedAmount / installments) : 0;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await api.createTransaction({
        description,
        amount: parsedAmount,
        date,
        type,
        paymentMethod: type === 'INCOME' ? 'PIX' : paymentMethod,
        accountId: paymentMethod !== 'CREDIT_CARD' || type === 'INCOME' ? (accountId || accounts[0]?.id) : undefined,
        creditCardId: paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' ? (creditCardId || cards[0]?.id) : undefined,
        categoryId: categoryId || undefined,
        totalInstallments: paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' && !isRecurring ? installments : 1,
        isRecurring: type === 'EXPENSE' ? isRecurring : false
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
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 border transition-all ${
        isRecurring
          ? 'bg-amber-50/50 dark:bg-[#1A181E] border-amber-300 dark:border-amber-700/70 shadow-amber-500/10'
          : 'bg-white dark:bg-[#131B2E] border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Cabeçalho */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between transition-colors ${
          isRecurring
            ? 'border-amber-200/80 dark:border-amber-800/40 bg-amber-100/40 dark:bg-amber-950/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Novo Lançamento Manual</h3>
              {isRecurring && (
                <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Repeat className="w-3 h-3" /> Fixa Todo Mês
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isRecurring ? 'Despesa fixa mensal automática sem parcelamento' : 'Registre compras, contas a pagar ou receitas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Alternador: Despesa ou Receita */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Despesa / Gasto
            </button>
            <button
              type="button"
              onClick={() => { setType('INCOME'); setIsRecurring(false); }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Receita Avulsa
            </button>
          </div>

          {/* CAIXA MASSA: DESPESA FIXA RECORRENTE (TODO MÊS) */}
          {type === 'EXPENSE' && (
            <div
              onClick={() => setIsRecurring(prev => !prev)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                isRecurring
                  ? 'bg-amber-500/15 border-amber-400 dark:border-amber-500/80 text-amber-950 dark:text-amber-100 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isRecurring ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold flex items-center gap-2">
                    <span>Despesa Fixa / Recorrente</span>
                    {isRecurring && (
                      <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Ativa
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] opacity-75">
                    {isRecurring
                      ? 'Cobrança contínua todo mês (Aluguel, Internet, Netflix, Academia)'
                      : 'Marque se for uma conta mensal fixa que se repete todo mês'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                  isRecurring
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {isRecurring && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Descrição do Lançamento
            </label>
            <input
              type="text"
              required
              placeholder={isRecurring ? "Ex: Aluguel, Internet, Netflix, Academia" : "Ex: Compra Mercado Livre, Supermercado"}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Valor {isRecurring ? 'Mensal (R$)' : '(R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-base font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                {isRecurring ? 'Dia do Vencimento' : 'Data do Gasto'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Forma de Pagamento */}
          {type === 'EXPENSE' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'PIX', label: 'Pix' },
                  { id: 'CREDIT_CARD', label: 'Crédito' },
                  { id: 'DEBIT_CARD', label: 'Débito' },
                  { id: 'CASH', label: 'Dinheiro' }
                ].map(item => {
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(item.id as PaymentMethod);
                        if (item.id !== 'CREDIT_CARD') {
                          setAccountId('SALARIO');
                        }
                      }}
                      className={`py-2.5 px-3 text-xs font-bold rounded-2xl border transition-all ${
                        isSelected
                          ? isRecurring
                            ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40'
                            : 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-500/30'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seleção Visual de Cartão de Crédito */}
          {paymentMethod === 'CREDIT_CARD' && type === 'EXPENSE' && (
            <div className={`p-4 rounded-2xl border space-y-4 transition-colors ${
              isRecurring
                ? 'bg-amber-50/60 dark:bg-slate-900/90 border-amber-200 dark:border-amber-800/60'
                : 'bg-indigo-50/50 dark:bg-slate-900/80 border-indigo-100 dark:border-indigo-900/50'
            }`}>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CardIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Escolha o Cartão de Crédito:</span>
                </span>

                {onOpenAddCard && (
                  <button
                    type="button"
                    onClick={onOpenAddCard}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Novo Cartão</span>
                  </button>
                )}
              </div>

              {cards.length === 0 ? (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-center space-y-2">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    Nenhum cartão cadastrado ainda.
                  </p>
                  {onOpenAddCard && (
                    <button
                      type="button"
                      onClick={onOpenAddCard}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow hover:bg-indigo-700"
                    >
                      Cadastrar Cartão Agora
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cards.map(card => {
                    const isSelected = card.id === creditCardId;
                    const preset = getBankPreset(card.bank || card.name);

                    return (
                      <div
                        key={card.id}
                        onClick={() => setCreditCardId(card.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                            : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm"
                            style={{ backgroundColor: preset.color }}
                          >
                            {preset.logoLetter}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {card.name}
                              <span className="text-[10px] font-normal text-slate-500">({preset.name})</span>
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Fecha dia {card.closingDay} • Vence dia {card.dueDay} • Limite: {formatBRL(card.limitTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SE FOR DESPESA FIXA: NÃO MOSTRA PARCELAS (COBRANÇA MENSAL CONTÍNUA) */}
              {isRecurring ? (
                <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60">
                  <div className="p-3 bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>
                      <strong>Assinatura / Cobrança Contínua:</strong> Sem parcelamento. O valor de <strong>{formatBRL(parsedAmount)}</strong> será cobrado 1x em cada fatura mensal automaticamente.
                    </span>
                  </div>
                </div>
              ) : (
                /* SE NÃO FOR FIXA: MOSTRA SELETOR DE PARCELAS NORMAL */
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Número de Parcelas</span>
                    </label>
                    {parsedAmount > 0 && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {installments}x de {formatBRL(installmentValue)}
                      </span>
                    )}
                  </div>

                  <select
                    value={installments}
                    onChange={e => setInstallments(parseInt(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>À vista (1x de {formatBRL(parsedAmount)})</option>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map(n => (
                      <option key={n} value={n}>
                        {n}x de {parsedAmount > 0 ? formatBRL(parsedAmount / n) : 'R$ 0,00'} (sem juros)
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </div>
          )}

          {/* Seleção de Conta de Origem (para Débito/Pix/Dinheiro) */}
          {(paymentMethod !== 'CREDIT_CARD' || type === 'INCOME') && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                {type === 'INCOME' ? 'Conta de Destino' : 'Conta de Origem'}
              </label>
              {accounts.length === 0 ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <span>Nenhuma conta cadastrada para debitar.</span>
                  {onOpenAddCard && (
                    <button
                      type="button"
                      onClick={onOpenAddCard}
                      className="font-bold underline text-amber-900 dark:text-amber-200"
                    >
                      + Criar Conta
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SALARIO">
                    💰 Salário do Mês — Saldo: {formatBRL(salaryBalance)}
                  </option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — Saldo: {formatBRL(a.currentBalance)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || (paymentMethod === 'CREDIT_CARD' && cards.length === 0)}
              className={`w-full py-3.5 text-white font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 ${
                isRecurring
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 ring-2 ring-amber-400/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Salvando...'
                  : isRecurring
                  ? 'Salvar Despesa Fixa Recorrente'
                  : 'Salvar Lançamento'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
