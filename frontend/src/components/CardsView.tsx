import React, { useState } from 'react';
import { CreditCard as CardIcon, Calendar, Layers, ShieldCheck, Plus, Trash2, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { CreditCard, Transaction, Account } from '../types';
import { BANK_PRESETS, getBankPreset } from '../constants/banks';
import { CardModal } from './CardModal';
import { PayInvoiceModal } from './PayInvoiceModal';

interface CardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  accounts: Account[];
  isPrivacyMode: boolean;
  onAddCard: (card: Partial<CreditCard>) => void;
  onDeleteCard: (cardId: string) => void;
  onPayInvoice: (cardId: string, accountId: string, amount: number) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  cards,
  transactions,
  accounts,
  isPrivacyMode,
  onAddCard,
  onDeleteCard,
  onPayInvoice
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  const cardTransactions = transactions.filter(t => 
    t.paymentMethod === 'CREDIT_CARD' && 
    (t.creditCard?.id === selectedCard?.id || (t as any).creditCardId === selectedCard?.id)
  );

  // Cálculo da fatura atual do cartão selecionado (estritamente real, sem valores fixos de teste)
  const currentInvoiceTotal = cardTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const handleDelete = (cardId: string, cardName: string) => {
    if (confirm(`Tem certeza que deseja remover o cartão "${cardName}"?`)) {
      onDeleteCard(cardId);
      if (selectedCardId === cardId) {
        const remaining = cards.filter(c => c.id !== cardId);
        if (remaining.length > 0) setSelectedCardId(remaining[0].id);
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header com Botão de Novo Cartão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cartões & Faturas Futuras</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Controle de limites, datas de corte e parcelamentos futuros</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cartão</span>
        </button>
      </div>

      {/* Lista de Cartões em Estilo Físico/Digital com Preset de Banco */}
      {cards.length === 0 ? (
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CardIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Nenhum cartão cadastrado</h3>
            <p className="text-xs text-slate-500">Adicione seu primeiro cartão (Nubank, Inter, Bradesco, etc.) para controlar faturas.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow hover:bg-indigo-700"
          >
            Cadastrar Cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(c => {
            const isSelected = c.id === selectedCardId;
            const preset = getBankPreset(c.bank || c.name);

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCardId(c.id)}
                className={`p-5 rounded-3xl cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between h-48 border shadow-lg ${
                  isSelected
                    ? `border-indigo-400 ring-2 ring-indigo-500/50 scale-[1.02] bg-gradient-to-br ${preset.gradient} text-white`
                    : `border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-800 dark:text-white hover:border-slate-400`
                }`}
              >
                {/* Linha Superior: Logo/Nome do Banco e Chip/Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md"
                      style={{ backgroundColor: preset.color, color: '#fff' }}
                    >
                      {preset.logoLetter}
                    </div>
                    <div>
                      <span className={`font-bold text-xs block ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {c.name}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {preset.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <ShieldCheck className="w-3 h-3" /> Físico/Virtual
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id, c.name);
                      }}
                      title="Excluir Cartão"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isSelected ? 'hover:bg-white/20 text-white/80 hover:text-white' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Linha Central: Chip Simulado e Numeração */}
                <div className="my-auto flex items-center gap-2">
                  <div className={`w-8 h-6 rounded-md border flex items-center justify-center ${
                    isSelected ? 'bg-amber-400/80 border-amber-300' : 'bg-amber-300 border-amber-400'
                  }`}>
                    <div className="w-4 h-3 border-t border-b border-amber-600/40"></div>
                  </div>
                  <span className={`font-mono text-xs tracking-widest ${isSelected ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>
                    •••• •••• •••• 2026
                  </span>
                </div>

                {/* Linha Inferior: Limite e Vencimento */}
                <div className="flex justify-between items-end border-t border-black/5 dark:border-white/5 pt-2">
                  <div>
                    <span className={`text-[10px] font-medium block ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>Limite Total</span>
                    <p className={`text-base font-extrabold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(c.limitTotal)}
                    </p>
                  </div>
                  <div className={`text-right text-[11px] ${isSelected ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>
                    <p>Fecha dia <strong className="font-bold">{c.closingDay}</strong></p>
                    <p>Vence dia <strong className="font-bold">{c.dueDay}</strong></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Projeção e Gestão da Fatura Atual */}
      {selectedCard && (
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 transition-colors">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Fatura Atual • {selectedCard.name}
                </h3>
                {currentInvoiceTotal > 0 ? (
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-0.5 rounded-full">
                    Fatura Aberta
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    Fatura Zerada
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                Fechamento dia {selectedCard.closingDay} • Vencimento dia {selectedCard.dueDay}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total a pagar</span>
                <span className={`text-xl font-extrabold ${currentInvoiceTotal > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {formatCurrency(currentInvoiceTotal)}
                </span>
              </div>
              <button
                disabled={currentInvoiceTotal <= 0}
                onClick={() => setIsPayModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-transform active:scale-95 ${
                  currentInvoiceTotal > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentInvoiceTotal > 0 ? 'Dar Baixa na Fatura' : 'Fatura em Dia'}</span>
              </button>
            </div>
          </div>

          {/* Lançamentos e Parcelas desta fatura */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Lançamentos & Parcelamentos desta Fatura
            </h4>

            {cardTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhum lançamento no cartão neste ciclo.</p>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* Modal de Adicionar Cartão com Seletor de Banco */}
      <CardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddCard}
      />

      {/* Modal de Dar Baixa na Fatura */}
      {selectedCard && (
        <PayInvoiceModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onConfirm={(accountId) => onPayInvoice(selectedCard.id, accountId, currentInvoiceTotal)}
          card={selectedCard}
          invoiceAmount={currentInvoiceTotal}
          accounts={accounts}
        />
      )}
    </div>
  );
};
