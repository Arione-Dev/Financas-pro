import React from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, CreditCard as CardIcon, ArrowUpRight, ArrowDownRight, Layers, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { DashboardSummary, Transaction, Account, CreditCard } from '../types';

interface DashboardViewProps {
  summary: DashboardSummary;
  transactions: Transaction[];
  accounts: Account[];
  cards: CreditCard[];
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenScan: () => void;
  onOpenNewTransaction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  transactions,
  accounts,
  cards,
  isPrivacyMode,
  onTogglePrivacy,
  onOpenScan,
  onOpenNewTransaction
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary.totalBalance)}
          </h2>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% este mês
          </span>
        </div>

        {/* Três métricas do mês com alto contraste */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Entradas</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.monthIncome)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Saídas</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base text-rose-600 dark:text-rose-400">
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

        {/* Botão Chamativo de Leitura com IA */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onOpenScan}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-transform active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Digitalizar Comprovante com IA</span>
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
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
            <span>Minhas Contas</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">Ver todas</span>
          </h3>

          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: acc.color }}>
                    {acc.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{acc.name}</h4>
                    <p className="text-[11px] text-slate-500">{acc.type === 'CHECKING' ? 'Conta Corrente' : acc.type === 'SAVINGS' ? 'Poupança' : 'Dinheiro'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatCurrency(acc.currentBalance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Cartões de Crédito com Faturas e Limites */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl transition-colors">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 flex items-center justify-between">
          <span>Cartões de Crédito</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Limite e Vencimento</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => {
            const used = 399.90; // Exemplo de fatura atual
            const percentUsed = Math.min(100, (used / card.limitTotal) * 100);

            return (
              <div key={card.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }}></div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{card.name}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Fecha dia {card.closingDay} • Vence dia {card.dueDay}</span>
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
                      backgroundColor: percentUsed > 80 ? '#F43F5E' : card.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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

