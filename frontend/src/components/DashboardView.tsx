import React from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, CreditCard as CardIcon, ArrowUpRight, ArrowDownRight, Layers, Sparkles, Wallet, Edit3, Plus, ChevronRight, Trash2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DashboardSummary, Transaction, Account, CreditCard } from '../types';
import { getBankPreset } from '../constants/banks';

interface DashboardViewProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  accounts: Account[];
  cards: CreditCard[];
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenScan: () => void;
  onOpenNewTransaction: () => void;
  onOpenEditAccount?: (account?: Account, initialMode?: 'SALARY' | 'BALANCE' | 'NEW_ACCOUNT') => void;
  onDeleteAccount?: (accountId: string) => void;
  onSelectTab?: (tab: 'dashboard' | 'transactions' | 'cards') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  transactions,
  accounts,
  cards,
  isPrivacyMode,
  onTogglePrivacy,
  onOpenScan,
  onOpenNewTransaction,
  onOpenEditAccount,
  onDeleteAccount,
  onSelectTab
}) => {

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      
      {/* Card Principal de Saldo (Totalmente Adaptado ao Modo Claro e Escuro) */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl transition-all">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Patrimônio Líquido / Saldo Total</span>
          <button
            onClick={onTogglePrivacy}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(summary.totalBalance)}
          </h1>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.4% este mês
          </span>
        </div>

        {/* Mini cards de resumo: Salário Fixo Mensal, Saídas, Faturas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Salário Fixo</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
              {formatCurrency(summary.monthlySalary || 3500)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Saídas</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-rose-700 dark:text-rose-400">
              {formatCurrency(summary.monthExpense)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <CardIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Faturas</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-amber-600 dark:text-amber-400">
              {formatCurrency(summary.openInvoicesTotal)}
            </p>
          </div>
        </div>

        {/* Botões Chamativos: Digitalizar com IA & Ajustar Salário Fixo */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOpenScan}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-transform active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Digitalizar Comprovante com IA</span>
          </button>

          <button
            onClick={() => onOpenEditAccount && onOpenEditAccount(undefined, 'SALARY')}
            className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-transform active:scale-[0.98]"
          >
            <Wallet className="w-4 h-4" />
            <span>Ajustar Salário Fixo</span>
          </button>
        </div>
      </div>

      {/* Grid com Gráfico de Gastos por Categoria e Contas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gráfico Donut de Despesas */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl transition-colors">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
            <span>Despesas por Categoria</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Este mês</span>
          </h3>

          {summary.categoryExpenses.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-44 h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryExpenses}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="amount"
                    >
                      {summary.categoryExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ backgroundColor: '#131B2E', borderColor: '#1E293B', borderRadius: '12px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full space-y-2">
                {summary.categoryExpenses.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(cat.amount)}</span>
                      <span className="text-[11px] text-slate-500 w-8 text-right">{cat.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Nenhum gasto registrado neste mês ainda.</p>
          )}
        </div>

        {/* Contas Bancárias & Carteiras */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Minhas Contas</h3>
            <button
              onClick={() => onOpenEditAccount && onOpenEditAccount(undefined, 'BALANCE')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajustar Saldos / Contas</span>
            </button>
          </div>

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">Nenhuma conta cadastrada.</p>
                <button
                  onClick={() => onOpenEditAccount && onOpenEditAccount(undefined, 'NEW_ACCOUNT')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  + Adicionar Conta
                </button>
              </div>
            ) : (
              accounts.map(acc => (
                <div
                  key={acc.id}
                  onClick={() => onOpenEditAccount && onOpenEditAccount(acc, 'BALANCE')}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm" style={{ backgroundColor: acc.color }}>
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {acc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{acc.type === 'CHECKING' ? 'Conta Corrente' : acc.type === 'SAVINGS' ? 'Poupança' : 'Dinheiro'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatCurrency(acc.currentBalance)}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditAccount && onOpenEditAccount(acc, 'BALANCE');
                      }}
                      title="Editar saldo"
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteAccount && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Tem certeza que deseja apagar a conta "${acc.name}"?`)) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        title="Apagar esta conta"
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Cartões de Crédito com Faturas, Limites e Presets de Bancos */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Cartões de Crédito</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Limite e Vencimento das Faturas</p>
          </div>
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('cards')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Gerenciar Cartões & Faturas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {cards.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Nenhum cartão adicionado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map(card => {
              const preset = getBankPreset(card.bank || card.name);
              const cardTxs = transactions.filter(t =>
                t.paymentMethod === 'CREDIT_CARD' &&
                (t.creditCard?.id === card.id || (t as any).creditCardId === card.id)
              );
              const used = cardTxs.reduce((acc, t) => acc + (t.amount || 0), 0);
              const percentUsed = card.limitTotal > 0 ? Math.min(100, (used / card.limitTotal) * 100) : 0;

              return (
                <div
                  key={card.id}
                  onClick={() => onSelectTab && onSelectTab('cards')}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] text-white"
                        style={{ backgroundColor: preset.color }}
                      >
                        {preset.logoLetter}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{card.name}</span>
                        <span className="text-[10px] text-slate-500">{preset.name}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Fatura Atual</span>
                      <p className="font-extrabold text-base text-rose-500 dark:text-rose-400">{formatCurrency(used)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Limite Total</span>
                      <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">{formatCurrency(card.limitTotal)}</p>
                    </div>
                  </div>

                  {/* Barra de Progresso do Limite */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentUsed}%`,
                        backgroundColor: percentUsed > 80 ? '#F43F5E' : preset.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Últimas Transações */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Últimos Lançamentos</h3>
          <button onClick={onOpenNewTransaction} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            + Lançar Manual
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {transactions.slice(0, 5).map(t => (
            <div key={t.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                }`}>
                  {t.type === 'INCOME' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t.description}</h4>
                    {t.totalInstallments && t.totalInstallments > 1 && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5" /> {t.installmentNumber}/{t.totalInstallments}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{t.category?.name || 'Geral'}</span>
                    <span>•</span>
                    <span>{t.date}</span>
                    <span>•</span>
                    <span className="uppercase text-[10px] text-slate-400">{t.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-bold text-xs sm:text-sm ${
                  t.type === 'INCOME' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'
                }`}>
                  {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
