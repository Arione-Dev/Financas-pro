import React, { useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Layers, Tag, Trash2, Edit2, Calendar, CreditCard as CardIcon, Wallet } from 'lucide-react';
import { Transaction, Account, CreditCard, Category } from '../types';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  cards: CreditCard[];
  categories: Category[];
  isPrivacyMode: boolean;
  onOpenNewTransaction: () => void;
  onUpdateTransaction: (id: string, updatedData: any) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  cards,
  categories,
  isPrivacyMode,
  onOpenNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filtered = transactions.filter(t => {
    const desc = (t.description || '').toLowerCase();
    const cat = (t.category?.name || '').toLowerCase();
    const s = search.toLowerCase();
    const matchesSearch = desc.includes(s) || cat.includes(s);
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (t: Transaction) => {
    const isInst = t.totalInstallments && t.totalInstallments > 1;
    const msg = isInst
      ? `Deseja excluir a Parcela ${t.installmentNumber}/${t.totalInstallments} de "${t.description}" (${formatCurrency(t.amount)})?`
      : `Deseja apagar o lançamento "${t.description}" de ${formatCurrency(t.amount)} dos registros?`;

    if (confirm(msg)) {
      await onDeleteTransaction(t.id);
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Header com Botão de Novo Lançamento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Extrato & Lançamentos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Histórico completo de despesas, receitas e faturas</p>
        </div>
        <button
          onClick={onOpenNewTransaction}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 self-start sm:self-auto transition-transform active:scale-95"
        >
          + Novo Lançamento
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, loja ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-800 dark:border-slate-700'
                : 'bg-white dark:bg-[#131B2E] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('EXPENSE')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterType === 'EXPENSE'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300'
                : 'bg-white dark:bg-[#131B2E] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setFilterType('INCOME')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterType === 'INCOME'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                : 'bg-white dark:bg-[#131B2E] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Receitas
          </button>
        </div>
      </div>

      {/* Lista de Transações com Opções de Editar e Excluir */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl divide-y divide-slate-100 dark:divide-slate-800/80 transition-colors">
        {filtered.length > 0 ? (
          filtered.map(t => (
            <div key={t.id} className="py-3.5 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {t.type === 'INCOME' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {t.description}
                    </h4>
                    {t.totalInstallments && t.totalInstallments > 1 && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                        <Layers className="w-2.5 h-2.5" /> {t.installmentNumber}/{t.totalInstallments}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-600 dark:text-slate-400">{t.category?.name || 'Sem Categoria'}</span>
                    <span>•</span>
                    <span>{t.date}</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                      {t.paymentMethod}
                    </span>
                    {t.paymentMethod === 'CREDIT_CARD' && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        ({t.creditCard?.name || 'Cartão'})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lado Direito: Valor e Botões de Ação (Editar e Apagar) */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className={`font-extrabold text-xs sm:text-sm block ${
                    t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                  </span>
                  {t.paymentMethod === 'CREDIT_CARD' && (
                    <span className={`text-[10px] font-bold ${
                      t.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {t.isPaid ? '✓ Fatura Paga' : 'Pendente'}
                    </span>
                  )}
                </div>

                {/* Botão de Editar */}
                <button
                  type="button"
                  onClick={() => setEditingTransaction(t)}
                  title="Editar este lançamento"
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors ml-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Botão de Apagar */}
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  title="Apagar este lançamento dos registros"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 text-center py-8">Nenhum lançamento encontrado com os filtros selecionados.</p>
        )}
      </div>

      {/* Modal de Edição de Transação */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={async (id, data) => {
          await onUpdateTransaction(id, data);
        }}
        transaction={editingTransaction}
        accounts={accounts}
        cards={cards}
        categories={categories}
      />
    </div>
  );
};
