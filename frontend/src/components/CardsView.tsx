import React, { useState } from 'react';
import { CreditCard as CardIcon, Calendar, Layers, ShieldCheck, Plus, Trash2, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, AlertCircle, Check, Wallet, Edit2 } from 'lucide-react';
import { CreditCard, Transaction, Account, Category } from '../types';
import { BANK_PRESETS, getBankPreset } from '../constants/banks';
import { CardModal } from './CardModal';
import { PayInvoiceModal } from './PayInvoiceModal';
import { PayInstallmentModal } from './PayInstallmentModal';
import { EditPurchaseModal } from './EditPurchaseModal';
import { PayEntirePurchaseModal } from './PayEntirePurchaseModal';

interface CardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  accounts: Account[];
  categories?: Category[];
  isPrivacyMode: boolean;
  onAddCard: (card: Partial<CreditCard>) => void;
  onDeleteCard: (cardId: string) => void;
  onPayInvoice: (cardId: string, accountId: string, amount: number) => void;
  onPayInstallment?: (transactionId: string, accountId: string) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  onPayEntirePurchase?: (transactionIds: string[], accountId: string, totalAmount: number) => void;
  onDeleteEntirePurchase?: (transactionIds: string[]) => void;
  onUpdatePurchase?: (transactionIds: string[], data: { description: string; categoryId: string }) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  cards,
  transactions,
  accounts,
  categories = [],
  isPrivacyMode,
  onAddCard,
  onDeleteCard,
  onPayInvoice,
  onPayInstallment,
  onDeleteTransaction,
  onPayEntirePurchase,
  onDeleteEntirePurchase,
  onUpdatePurchase
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [payingInstallmentTx, setPayingInstallmentTx] = useState<Transaction | null>(null);
  const [editingPurchaseGroup, setEditingPurchaseGroup] = useState<any | null>(null);
  const [payingEntirePurchaseGroup, setPayingEntirePurchaseGroup] = useState<any | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const calculateDueDate = (
    baseDateStr: string,
    closingDay: number = 25,
    dueDay: number = 5,
    instNum: number = 1
  ): string => {
    if (!baseDateStr) return '';
    const [y, m, d] = baseDateStr.split('-').map(Number);
    if (!y || !m || !d) return baseDateStr;

    // 1. Mês/Ano de fechamento da 1ª parcela
    let closingMonth = m;
    let closingYear = y;

    if (d >= closingDay) {
      closingMonth += 1;
      if (closingMonth > 12) {
        closingMonth = 1;
        closingYear += 1;
      }
    }

    // 2. Avança para a parcela i (1-based)
    const offset = Math.max(0, instNum - 1);
    closingMonth += offset;
    while (closingMonth > 12) {
      closingMonth -= 12;
      closingYear += 1;
    }

    // 3. Vencimento da fatura
    let dueMonth = closingMonth;
    let dueYear = closingYear;
    if (dueDay < closingDay) {
      dueMonth += 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
    }

    const maxDays = new Date(dueYear, dueMonth, 0).getDate();
    const actualDueDay = Math.min(dueDay, maxDays);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(actualDueDay)}/${pad(dueMonth)}/${dueYear}`;
  };

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Sincroniza o cartão selecionado caso a lista de cartões mude
  React.useEffect(() => {
    if (cards.length > 0 && (!selectedCardId || !cards.some(c => String(c.id).toLowerCase() === String(selectedCardId).toLowerCase()))) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  const selectedCard = cards.find(c => String(c.id).toLowerCase() === String(selectedCardId).toLowerCase()) || cards[0];
  const cardTransactions = transactions.filter(t => {
    if (t.paymentMethod !== 'CREDIT_CARD' || !selectedCard) return false;
    const tCardId = String(t.creditCard?.id || (t as any).creditCardId || '').toLowerCase();
    const sCardId = String(selectedCard.id || '').toLowerCase();
    return tCardId && sCardId && tCardId === sCardId;
  });

  // Agrupamento Inteligente de Compras e Parcelas
  const groupedPurchases = React.useMemo(() => {
    const groupsMap = new Map<string, Transaction[]>();

    cardTransactions.forEach(t => {
      // Extrai nome base removendo o sufixo (X/Y) se existir
      const match = t.description.match(/^(.*?)(?:\s*\(\d+\/\d+\))?$/);
      const baseName = match && match[1] ? match[1].trim() : t.description;
      
      // Agrupa por installmentGroupId ou por nome base + total de parcelas
      const groupKey = t.installmentGroupId || `${baseName}__${t.totalInstallments || 1}`;
      
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey)!.push(t);
    });

    const list: {
      key: string;
      title: string;
      categoryName?: string;
      totalInstallments: number;
      installmentAmount: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      paidCount: number;
      unpaidCount: number;
      activeInstallment?: Transaction;
      items: Transaction[];
      hasMultipleInstallments: boolean;
    }[] = [];

    groupsMap.forEach((items, key) => {
      // Ordenação rigorosa da primeira parcela até a última (1/N até N/N)
      items.sort((a, b) => {
        const numA = a.installmentNumber ?? 1;
        const numB = b.installmentNumber ?? 1;
        if (numA !== numB) return numA - numB;
        return a.date.localeCompare(b.date);
      });

      const first = items[0];
      const match = first.description.match(/^(.*?)(?:\s*\(\d+\/\d+\))?$/);
      const title = match && match[1] ? match[1].trim() : first.description;
      
      const totalInstallments = first.totalInstallments || items.length;
      const totalAmount = items.reduce((acc, t) => acc + (t.amount || 0), 0);
      const paidItems = items.filter(t => t.isPaid);
      const unpaidItems = items.filter(t => !t.isPaid);
      const paidAmount = paidItems.reduce((acc, t) => acc + (t.amount || 0), 0);
      const unpaidAmount = unpaidItems.reduce((acc, t) => acc + (t.amount || 0), 0);

      // A parcela ativa da fatura atual é ESTRITAMENTE a primeira parcela ainda não paga!
      const activeInstallment = items.find(t => !t.isPaid) || items[0];

      list.push({
        key,
        title,
        categoryName: first.category?.name,
        totalInstallments,
        installmentAmount: first.amount,
        totalAmount,
        paidAmount,
        unpaidAmount,
        paidCount: paidItems.length,
        unpaidCount: unpaidItems.length,
        activeInstallment,
        items,
        hasMultipleInstallments: totalInstallments > 1 || items.length > 1
      });
    });

    return list;
  }, [cardTransactions]);

  // Total da Fatura Atual:
  // Cada compra parcelada contribui com APENAS UMA parcela por ciclo (a primeira não paga)!
  // Compras à vista entram integralmente se não pagas.
  const currentInvoiceTransactions: Transaction[] = React.useMemo(() => {
    const activeList: Transaction[] = [];

    groupedPurchases.forEach(group => {
      if (!group.hasMultipleInstallments) {
        group.items.forEach(t => {
          if (!t.isPaid) activeList.push(t);
        });
      } else {
        if (group.activeInstallment && !group.activeInstallment.isPaid) {
          activeList.push(group.activeInstallment);
        }
      }
    });

    return activeList;
  }, [groupedPurchases]);

  const currentInvoiceTotal = currentInvoiceTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cartões & Faturas</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Controle de limites, datas de corte e parcelas do ciclo</p>
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
            const cardUnpaidTxs = transactions.filter(t => {
              if (t.paymentMethod !== 'CREDIT_CARD' || t.isPaid) return false;
              const tCardId = String(t.creditCard?.id || (t as any).creditCardId || '').toLowerCase();
              return tCardId && tCardId === String(c.id).toLowerCase();
            });

            // Limite comprometido considera todas as parcelas não pagas (presentes e futuras)
            const cardUsedTotal = cardUnpaidTxs.reduce((acc, t) => acc + (t.amount || 0), 0);
            const cardAvailable = Math.max(0, (c.limitTotal || 0) - cardUsedTotal);
            const percentUsed = c.limitTotal > 0 ? Math.min(100, (cardUsedTotal / c.limitTotal) * 100) : 0;

            // Fatura deste mês deste cartão
            const isThisCardSelected = c.id === selectedCard?.id;
            const cardMonthInvoice = isThisCardSelected ? currentInvoiceTotal : 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCardId(c.id)}
                className={`p-5 rounded-3xl cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between h-52 border shadow-lg ${
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
                <div className="my-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-6 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-amber-400/80 border-amber-300' : 'bg-amber-300 border-amber-400'
                    }`}>
                      <div className="w-4 h-3 border-t border-b border-amber-600/40"></div>
                    </div>
                    <span className={`font-mono text-xs tracking-widest ${isSelected ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>
                      •••• •••• •••• 2026
                    </span>
                  </div>
                  
                  {/* Fatura Aberta Atual do Ciclo */}
                  {cardMonthInvoice > 0 ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-rose-500/80 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      Fatura Atual: {formatCurrency(cardMonthInvoice)}
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-500/80 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      Fatura em Dia
                    </span>
                  )}
                </div>

                {/* Linha Inferior: Limites (Total e Disponível) */}
                <div className="border-t border-black/5 dark:border-white/5 pt-2 space-y-1.5">
                  <div className="flex justify-between items-baseline text-[11px]">
                    <div>
                      <span className={`text-[10px] font-medium block ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>Limite Disponível</span>
                      <p className={`text-sm font-extrabold ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(cardAvailable)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-medium block ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>Limite Total</span>
                      <p className={`text-xs font-bold ${isSelected ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}`}>
                        {formatCurrency(c.limitTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progresso do limite */}
                  <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentUsed > 80 ? 'bg-rose-400' : percentUsed > 50 ? 'bg-amber-400' : isSelected ? 'bg-white' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
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
                Fechamento dia {selectedCard.closingDay} • Vencimento dia {selectedCard.dueDay} • Apenas valores deste ciclo
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total a pagar deste mês</span>
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

          {/* Lançamentos & Parcelamentos Agrupados com Expansão Inteligente */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Compras & Parcelamentos do Cartão
              </h4>
              <span className="text-[11px] text-slate-400">
                {groupedPurchases.length} {groupedPurchases.length === 1 ? 'compra registrada' : 'compras registradas'}
              </span>
            </div>

            {groupedPurchases.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum lançamento no cartão neste ciclo.</p>
            ) : (
              <div className="space-y-3">
                {groupedPurchases.map(group => {
                  const isExpanded = !!expandedGroups[group.key];
                  const allPaid = group.unpaidCount === 0;
                  const activeInst = group.activeInstallment;

                  return (
                    <div
                      key={group.key}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 overflow-hidden transition-all shadow-sm"
                    >
                      {/* Linha Resumo da Compra (Clicável para expandir parcelas) */}
                      <div
                        onClick={() => toggleGroup(group.key)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            allPaid
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {group.hasMultipleInstallments ? (
                              <Layers className="w-5 h-5" />
                            ) : (
                              <CardIcon className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {group.title}
                              </h4>
                              {group.hasMultipleInstallments && (
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Layers className="w-2.5 h-2.5" />
                                  {group.totalInstallments}x de {formatCurrency(group.installmentAmount)}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>Total da compra: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(group.totalAmount)}</strong></span>
                              {group.categoryName && (
                                <>
                                  <span>•</span>
                                  <span>{group.categoryName}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Lado Direito do Resumo da Compra: Exibe a parcela do ciclo atual */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            {group.hasMultipleInstallments ? (
                              <>
                                <span className="text-[11px] text-slate-500 block">Nesta fatura:</span>
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                                  {formatCurrency(group.installmentAmount)}
                                </span>
                                {allPaid ? (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Todas Pagas
                                  </span>
                                ) : activeInst ? (
                                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    Parcela {activeInst.installmentNumber}/{group.totalInstallments}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    Pendente
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                                  {formatCurrency(group.totalAmount)}
                                </span>
                                {allPaid ? (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" /> Liquidada
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    Pendente
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Ações da Compra: Quitar Compra, Editar Categoria/Nome, Excluir Compra */}
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            {!allPaid && onPayEntirePurchase && (
                              <button
                                type="button"
                                onClick={() => setPayingEntirePurchaseGroup(group)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-transform active:scale-95"
                                title="Quitar todas as parcelas restantes desta compra"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Quitar Compra</span>
                              </button>
                            )}

                            {onUpdatePurchase && (
                              <button
                                type="button"
                                onClick={() => setEditingPurchaseGroup(group)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                title="Editar categoria e nome da compra"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {onDeleteEntirePurchase && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja excluir toda a compra "${group.title}" (${group.items.length} parcelas)? Todas as parcelas serão apagadas definitivamente.`)) {
                                    onDeleteEntirePurchase(group.items.map(t => t.id));
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Excluir compra inteira"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title={isExpanded ? 'Ocultar parcelas' : 'Ver parcelas'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Seção Expandida: Lista das Parcelas (1 a N, sempre da primeira à última) */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-3 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 pb-1">
                            <span>Ordem das Parcelas (1/{group.totalInstallments} a {group.totalInstallments}/{group.totalInstallments})</span>
                            <span>Ação Individual</span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {group.items.map((t) => {
                              const instNumber = t.installmentNumber || 1;
                              const totalInst = t.totalInstallments || group.totalInstallments;

                              // Status inteligente de cada parcela
                              const isThisCycleActive = activeInst && t.id === activeInst.id && !t.isPaid;
                              const isFuture = activeInst && instNumber > (activeInst.installmentNumber || 1) && !t.isPaid;

                              return (
                                <div
                                  key={t.id}
                                  className={`py-2.5 px-2 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-900/60 rounded-xl transition-colors ${
                                    isThisCycleActive ? 'bg-indigo-50/50 dark:bg-indigo-950/25 ring-1 ring-indigo-500/20' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                                      t.isPaid
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : isThisCycleActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}>
                                      {instNumber}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          Parcela {instNumber}/{totalInst}
                                        </p>
                                        {isThisCycleActive && (
                                          <span className="text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                                            Fatura Aberta Atual
                                          </span>
                                        )}
                                        {isFuture && (
                                          <span className="text-[9px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                            Fatura Futura
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                          Vencimento: {calculateDueDate(
                                            group.items[0]?.date || t.date,
                                            selectedCard.closingDay || 25,
                                            selectedCard.dueDay || 5,
                                            instNumber
                                          )}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-400">
                                          Compra: {t.date}
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                                        {formatCurrency(t.amount)}
                                      </span>
                                      {t.isPaid ? (
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Fatura Paga
                                        </span>
                                      ) : isThisCycleActive ? (
                                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                          Aberta no Ciclo
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                          Pendente Futura
                                        </span>
                                      )}
                                    </div>

                                    {/* Botão Pagar Parcela Individual */}
                                    {!t.isPaid && onPayInstallment && (
                                      <button
                                        type="button"
                                        onClick={() => setPayingInstallmentTx(t)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/25 transition-transform active:scale-95"
                                        title="Pagar esta parcela com confirmação"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Pagar</span>
                                      </button>
                                    )}

                                    {/* Botão de Excluir Parcela */}
                                    {onDeleteTransaction && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`Deseja excluir esta parcela (${instNumber}/${totalInst}) de ${formatCurrency(t.amount)}?`)) {
                                            onDeleteTransaction(t.id);
                                          }
                                        }}
                                        title="Excluir esta parcela"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

      {/* Modal de Dar Baixa na Fatura Total do Mês */}
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

      {/* Modal de Pagamento de Parcela Individual */}
      <PayInstallmentModal
        isOpen={!!payingInstallmentTx}
        onClose={() => setPayingInstallmentTx(null)}
        onConfirm={(txId, accId) => {
          if (onPayInstallment) {
            onPayInstallment(txId, accId);
          }
        }}
        transaction={payingInstallmentTx}
        accounts={accounts}
      />

      {/* Modal de Edição de Compra e Categoria */}
      <EditPurchaseModal
        isOpen={!!editingPurchaseGroup}
        onClose={() => setEditingPurchaseGroup(null)}
        onSave={(ids, data) => {
          if (onUpdatePurchase) {
            onUpdatePurchase(ids, data);
          }
        }}
        purchase={editingPurchaseGroup}
        categories={categories}
      />

      {/* Modal de Quitação Total da Compra */}
      <PayEntirePurchaseModal
        isOpen={!!payingEntirePurchaseGroup}
        onClose={() => setPayingEntirePurchaseGroup(null)}
        onConfirm={(ids, accId, totalAmount) => {
          if (onPayEntirePurchase) {
            onPayEntirePurchase(ids, accId, totalAmount);
          }
        }}
        purchase={payingEntirePurchaseGroup}
        accounts={accounts}
      />
    </div>
  );
};
