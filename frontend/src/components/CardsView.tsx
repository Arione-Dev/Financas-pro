import React, { useState } from 'react';
import { CreditCard as CardIcon, Calendar, Layers, ShieldCheck, ChevronRight } from 'lucide-react';
import { CreditCard, Transaction } from '../types';

interface CardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  isPrivacyMode: boolean;
}

export const CardsView: React.FC<CardsViewProps> = ({ cards, transactions, isPrivacyMode }) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  const cardTransactions = transactions.filter(t => t.paymentMethod === 'CREDIT_CARD');

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cartões & Faturas Futuras</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Controle de limites, datas de corte e parcelamentos futuros</p>
      </div>

      {/* Seletor de Cartões em Estilo Card de Banco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map(c => {
          const isSelected = c.id === selectedCardId;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCardId(c.id)}
              className={`p-6 rounded-3xl cursor-pointer transition-all border relative overflow-hidden ${
                isSelected
                  ? 'border-indigo-500 shadow-2xl shadow-indigo-600/30 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white ring-2 ring-indigo-500/50'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-900 dark:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <span className={`font-bold text-sm flex items-center gap-2 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className={`text-[11px] font-semibold flex items-center gap-1 ${isSelected ? 'text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Virtual / Físico
                </span>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <span className={`text-[11px] font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>Limite Total</span>
                  <p className={`text-xl font-extrabold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{formatCurrency(c.limitTotal)}</p>
                </div>
                <div className={`text-right text-xs ${isSelected ? 'text-indigo-100 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                  <p>Fecha dia <strong className={isSelected ? 'text-white font-bold' : 'text-slate-800 dark:text-slate-200'}>{c.closingDay}</strong></p>
                  <p>Vence dia <strong className={isSelected ? 'text-white font-bold' : 'text-slate-800 dark:text-slate-200'}>{c.dueDay}</strong></p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Projeção das Faturas Mensais */}
      {selectedCard && (
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Fatura de Outubro / 2026 (Atual)</h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Fechamento em {selectedCard.closingDay}/10 • Vencimento em {selectedCard.dueDay}/11</p>
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-3 py-1 rounded-full">
              Fatura Aberta
            </span>
          </div>

          {/* Lançamentos e Parcelas desta fatura */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {cardTransactions.map(t => (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <CardIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {t.description}
                      {t.totalInstallments && t.totalInstallments > 1 && (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Layers className="w-2.5 h-2.5" /> {t.installmentNumber}/{t.totalInstallments}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500">{t.date} • {t.category?.name}</p>
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

