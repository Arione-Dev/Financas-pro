import { DashboardSummary, Transaction, Account, CreditCard, Category, QuotaStatus, ReceiptAnalysis, User } from '../types';

const API_BASE = '/api';

// Funções auxiliares de persistência no LocalStorage (para salvar dados mesmo ao recarregar a tela)
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      return JSON.parse(val);
    }
  } catch (e) {}
  return defaultValue;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

// Dados iniciais
const initialAccounts: Account[] = [
  { id: 'acc-1', name: 'Conta Principal', type: 'CHECKING', currentBalance: 0.00, color: '#8A05BE' }
];

function getCurrentUserInternal(): User | null {
  const saved = localStorage.getItem('auth_user');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getUserScope(): string {
  const u = getCurrentUserInternal();
  if (!u) return 'guest';
  return String(u.id || u.email || 'guest').toLowerCase().trim();
}

function userKey(base: string): string {
  return `${base}_${getUserScope()}`;
}

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const u = getCurrentUserInternal();
  const headers: Record<string, string> = { ...extra };
  if (u) {
    if (u.id) headers['X-User-Id'] = String(u.id);
    if (u.email) headers['X-User-Email'] = String(u.email);
    if (u.name) headers['X-User-Name'] = String(u.name);
    if ((u as any).token) headers['Authorization'] = `Bearer ${(u as any).token}`;
  }
  return headers;
}

let localAccounts: Account[] = [];
let localCards: CreditCard[] = [];
let localTransactions: Transaction[] = [];

function reloadLocalStateForCurrentUser(): void {
  // Remove chaves globais antigas sem escopo de usuário para evitar vazamento entre contas no mesmo aparelho
  try {
    localStorage.removeItem('financas_transactions');
    localStorage.removeItem('financas_accounts');
    localStorage.removeItem('financas_cards');
  } catch (e) {}

  const u = getCurrentUserInternal();
  if (!u) {
    localAccounts = [];
    localCards = [];
    localTransactions = [];
    return;
  }

  localAccounts = getStored<Account[]>(userKey('financas_accounts'), initialAccounts);
  localCards = getStored<CreditCard[]>(userKey('financas_cards'), []);
  localTransactions = getStored<Transaction[]>(userKey('financas_transactions'), []);

  const scopedSalaryKey = userKey('financas_monthly_salary');
  if (localStorage.getItem(scopedSalaryKey) === null) {
    const isArione = String(u.email || '').toLowerCase().includes('arione') || String(u.name || '').toLowerCase().includes('arione');
    const oldGlobalSalary = localStorage.getItem('financas_monthly_salary');
    if (isArione && oldGlobalSalary !== null) {
      localStorage.setItem(scopedSalaryKey, oldGlobalSalary);
    } else {
      setStored(scopedSalaryKey, 0.00);
    }
  }
}

reloadLocalStateForCurrentUser();

let localCategories: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', icon: 'utensils', color: '#F59E0B', type: 'EXPENSE' },
  { id: 'cat-supermercado', name: 'Supermercado', icon: 'shopping-cart', color: '#10B981', type: 'EXPENSE' },
  { id: 'cat-educacao', name: 'Educação', icon: 'book-open', color: '#6366F1', type: 'EXPENSE' },
  { id: 'cat-transporte', name: 'Transporte', icon: 'car', color: '#3B82F6', type: 'EXPENSE' },
  { id: 'cat-moradia', name: 'Moradia', icon: 'home', color: '#8B5CF6', type: 'EXPENSE' },
  { id: 'cat-contas', name: 'Contas & Boletos', icon: 'file-text', color: '#F97316', type: 'EXPENSE' },
  { id: 'cat-servicos', name: 'Serviços & Assinaturas', icon: 'tv', color: '#A855F7', type: 'EXPENSE' },
  { id: 'cat-saude', name: 'Saúde & Farmácia', icon: 'heart-pulse', color: '#EC4899', type: 'EXPENSE' },
  { id: 'cat-compras', name: 'Compras & Vestuário', icon: 'shopping-bag', color: '#E11D48', type: 'EXPENSE' },
  { id: 'cat-lazer', name: 'Lazer', icon: 'gamepad-2', color: '#06B6D4', type: 'EXPENSE' },
  { id: 'cat-pets', name: 'Pets', icon: 'paw-print', color: '#14B8A6', type: 'EXPENSE' },
  { id: 'cat-outros', name: 'Outros', icon: 'more-horizontal', color: '#64748B', type: 'EXPENSE' },
  { id: 'cat-salario', name: 'Salário', icon: 'wallet', color: '#10B981', type: 'INCOME' },
  { id: 'cat-investimentos', name: 'Investimentos', icon: 'trending-up', color: '#4F46E5', type: 'INCOME' }
];

export const api = {
  async register(name: string, email: string, password: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erro no cadastro.');
    localStorage.setItem('auth_user', JSON.stringify(data));
    reloadLocalStateForCurrentUser();
    return data;
  },

  async login(email: string, password: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'E-mail ou senha incorretos.');
    localStorage.setItem('auth_user', JSON.stringify(data));
    reloadLocalStateForCurrentUser();
    return data;
  },

  async loginWithGoogle(payload: { email: string; name: string; googleId: string; avatarUrl: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      localStorage.setItem('auth_user', JSON.stringify(data));
      reloadLocalStateForCurrentUser();
      return data;
    } catch (e) {
      const mock = { id: 'u-' + Date.now(), name: payload.name, email: payload.email, avatarUrl: payload.avatarUrl };
      localStorage.setItem('auth_user', JSON.stringify(mock));
      reloadLocalStateForCurrentUser();
      return mock;
    }
  },

  async loginGoogle(payload: { email: string; name: string; googleId: string; avatarUrl: string }): Promise<any> {
    return this.loginWithGoogle(payload);
  },

  getCurrentUser(): User | null {
    return getCurrentUserInternal();
  },

  logout(): void {
    localStorage.removeItem('auth_user');
    reloadLocalStateForCurrentUser();
  },

  async resetAllFinancialData(): Promise<void> {
    try {
      await fetch(`${API_BASE}/dashboard/reset-all`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {}
    localTransactions = [];
    localAccounts = [
      { id: 'acc-1', name: 'Conta Principal', type: 'CHECKING', currentBalance: 0.00, color: '#8A05BE' }
    ];
    setStored(userKey('financas_transactions'), []);
    setStored(userKey('financas_accounts'), localAccounts);
    setStored(userKey('financas_monthly_salary'), 0.00);
  },

  getMonthlySalary(): number {
    return getStored<number>(userKey('financas_monthly_salary'), 0.00);
  },

  getSalaryExpenses(): number {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth() + 1;
    return localTransactions
      .filter(t => {
        if (t.type !== 'EXPENSE' || t.paymentMethod === 'CREDIT_CARD') return false;
        if (!t.date) return false;
        const [y, m] = t.date.split('-').map(Number);
        return y === curY && m === curM;
      })
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  },

  getSalaryRemaining(): number {
    const salary = this.getMonthlySalary();
    const expenses = this.getSalaryExpenses();
    return Math.max(0, salary - expenses);
  },

  setMonthlySalary(salary: number): number {
    setStored(userKey('financas_monthly_salary'), salary);
    return salary;
  },

  async getSummary(): Promise<DashboardSummary> {
    const monthlySalary = this.getMonthlySalary();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const isCurrentMonth = (dateStr?: string) => {
      if (!dateStr) return true;
      const [y, m] = dateStr.split('-').map(Number);
      return y === currentYear && m === currentMonth;
    };

    // Despesas pagas em dinheiro/débito/pix ou parcelas pagas (Saídas reais de caixa do mês)
    const cashExpenses = localTransactions
      .filter(t => t.type === 'EXPENSE' && (t.paymentMethod !== 'CREDIT_CARD' || t.isPaid) && isCurrentMonth(t.date))
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const salaryRemaining = Math.max(0, monthlySalary - cashExpenses);

    // Faturas deste ciclo:
    // Separa com rigor:
    // 1) allCycleTransactions: todos os lançamentos pertencentes a este ciclo (pagos ou não), para refletir o consumo real do mês nas categorias.
    // 2) pendingCycleTransactions: apenas os lançamentos que ainda estão em aberto (a pagar).
    let totalOpenInvoicesThisCycle = 0;
    const allCycleTransactions: Transaction[] = [];
    const pendingCycleTransactions: Transaction[] = [];

    localCards.forEach(card => {
      const cardId = String(card.id).toLowerCase();
      const cardTxs = localTransactions.filter(t => {
        if (t.paymentMethod !== 'CREDIT_CARD') return false;
        const tCardId = String(t.creditCard?.id || (t as any).creditCardId || '').toLowerCase();
        return tCardId === cardId;
      });

      const groupsMap = new Map<string, Transaction[]>();
      cardTxs.forEach(t => {
        const match = t.description.match(/^(.*?)(?:\s*\(\d+\/\d+\))?$/);
        const baseName = match && match[1] ? match[1].trim() : t.description;
        const isInstallment = (t.totalInstallments && t.totalInstallments > 1) || (t.installmentNumber && t.installmentNumber > 1);
        const groupKey = t.installmentGroupId 
          ? t.installmentGroupId 
          : isInstallment 
            ? `${baseName.toLowerCase()}__${t.totalInstallments}` 
            : `single_${t.id}`;
        if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, []);
        groupsMap.get(groupKey)!.push(t);
      });

      const dueDay = card.dueDay || 5;
      const closingDay = card.closingDay || 25;
      let targetDueMonth = currentMonth;
      let targetDueYear = currentYear;
      if (now.getDate() > dueDay) {
        targetDueMonth += 1;
        if (targetDueMonth > 12) {
          targetDueMonth = 1;
          targetDueYear += 1;
        }
      }

      groupsMap.forEach(items => {
        items.sort((a, b) => (a.installmentNumber ?? 1) - (b.installmentNumber ?? 1));
        const first = items[0];
        const isInstallment = (first.totalInstallments && first.totalInstallments > 1) || (first.installmentNumber && first.installmentNumber > 1);

        if (!isInstallment) {
          // Compras à vista: todas pertencentes a este ciclo ou atrasadas
          items.forEach(item => {
            const [y, m, d] = (item.date).split('-').map(Number);
            let closingMonth = m;
            let closingYear = y;
            if (d >= closingDay) closingMonth += 1;
            while (closingMonth > 12) { closingMonth -= 12; closingYear += 1; }
            let dueMonth = closingMonth;
            let dueYear = closingYear;
            if (dueDay < closingDay) dueMonth += 1;
            while (dueMonth > 12) { dueMonth -= 12; dueYear += 1; }

            const isCurrentCycle = dueMonth === targetDueMonth && dueYear === targetDueYear;
            const isPastDue = (dueYear < targetDueYear) || (dueYear === targetDueYear && dueMonth < targetDueMonth);

            if (isCurrentCycle || isPastDue) {
              allCycleTransactions.push(item);
              if (!item.isPaid) {
                totalOpenInvoicesThisCycle += Number(item.amount) || 0;
                pendingCycleTransactions.push(item);
              }
            }
          });
        } else {
          // Compras parceladas: verifica as parcelas que pertencem a este ciclo ou atrasadas não pagas
          items.forEach(inst => {
            const instNum = inst.installmentNumber || 1;
            const [y, m, d] = (first.date || inst.date).split('-').map(Number);
            let closingMonth = m;
            let closingYear = y;
            if (d >= closingDay) closingMonth += 1;
            while (closingMonth > 12) { closingMonth -= 12; closingYear += 1; }
            closingMonth += Math.max(0, instNum - 1);
            while (closingMonth > 12) { closingMonth -= 12; closingYear += 1; }
            let dueMonth = closingMonth;
            let dueYear = closingYear;
            if (dueDay < closingDay) dueMonth += 1;
            while (dueMonth > 12) { dueMonth -= 12; dueYear += 1; }

            const isCurrentCycle = dueMonth === targetDueMonth && dueYear === targetDueYear;
            const isPastDue = (dueYear < targetDueYear) || (dueYear === targetDueYear && dueMonth < targetDueMonth);

            if (isCurrentCycle || (isPastDue && !inst.isPaid)) {
              allCycleTransactions.push(inst);
              if (!inst.isPaid) {
                totalOpenInvoicesThisCycle += Number(inst.amount) || 0;
                pendingCycleTransactions.push(inst);
              }
            }
          });
        }
      });
    });

    const openInvoicesTotal = totalOpenInvoicesThisCycle;

    // Saídas: apenas gastos efetivamente desembolsados (dinheiro/pix/débito/parcelas pagas)
    const monthExpense = cashExpenses;

    const otherIncome = localTransactions
      .filter(t => t.type === 'INCOME' && isCurrentMonth(t.date))
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const accountsBalance = localAccounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);
    const totalBalance = accountsBalance + salaryRemaining;
    const monthIncome = monthlySalary + otherIncome;

    // Despesas por categoria deste mês:
    // IMPORTANTE: Pagamentos de fatura ou quitações NÃO entram no gráfico de categorias para não duplicar e não inflar "Outros"!
    const isPaymentSettlement = (desc: string = '') => {
      return desc.startsWith('Pagamento Fatura') || desc.startsWith('Pagamento Parcela') || desc.startsWith('Quitação Total');
    };

    const nonCardMonthExpenses = localTransactions.filter(
      t => t.type === 'EXPENSE' && t.paymentMethod !== 'CREDIT_CARD' && !isPaymentSettlement(t.description) && isCurrentMonth(t.date)
    );

    const buildCategoryBreakdown = (txList: Transaction[]) => {
      const categoryTotals: Record<string, { name: string; color: string; amount: number }> = {};
      for (const t of txList) {
        const catId = t.category?.id || (t as any).categoryId;
        const cat = localCategories.find(c => c.id === catId) || t.category;
        const catName = cat?.name || 'Outros';
        const catColor = cat?.color || '#94A3B8';
        const amt = Number(t.amount) || 0;

        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, color: catColor, amount: 0 };
        }
        categoryTotals[catName].amount += amt;
      }

      const totalCatAmount = Object.values(categoryTotals).reduce((acc, c) => acc + c.amount, 0);
      return Object.values(categoryTotals).map(item => ({
        name: item.name,
        color: item.color,
        amount: item.amount,
        percentage: totalCatAmount > 0 ? (item.amount / totalCatAmount) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);
    };

    // 1) Total Gasto no Mês (Geral: compras do ciclo pagas ou não + saídas de dinheiro/pix/débito)
    const categoryExpenses = buildCategoryBreakdown([
      ...nonCardMonthExpenses,
      ...allCycleTransactions
    ]);

    // 2) A Pagar / Restante (Apenas despesas e faturas ainda pendentes)
    const categoryExpensesPending = buildCategoryBreakdown([
      ...nonCardMonthExpenses.filter(t => !t.isPaid),
      ...pendingCycleTransactions
    ]);

    return {
      totalBalance,
      monthlySalary,
      salaryRemaining,
      monthIncome,
      monthExpense,
      openInvoicesTotal,
      categoryExpenses,
      categoryExpensesPending
    };
  },

  deduplicateTransactions(list: Transaction[]): Transaction[] {
    const seen = new Set<string>();
    return list.filter(t => {
      const cardKey = String(t.creditCard?.id || (t as any).creditCardId || 'no-card').toLowerCase();
      const key = `${cardKey}|${t.amount}|${t.description}|${t.installmentNumber || 1}|${t.date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localTransactions = this.deduplicateTransactions(data);
          setStored(userKey('financas_transactions'), localTransactions);
          return localTransactions;
        }
      }
    } catch (e) {}
    localTransactions = this.deduplicateTransactions(localTransactions);
    setStored(userKey('financas_transactions'), localTransactions);
    return localTransactions;
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localAccounts = data;
          setStored(userKey('financas_accounts'), localAccounts);
          return data;
        }
      }
    } catch (e) {}

    // Garante que o usuário nunca fique sem uma conta para lançar pagamentos/receitas
    if (localAccounts.length === 0) {
      localAccounts = [
        { id: 'acc-1', name: 'Conta Principal', type: 'CHECKING', currentBalance: 0, color: '#8A05BE' }
      ];
      setStored(userKey('financas_accounts'), localAccounts);
    }
    return localAccounts;
  },

  async createAccount(data: { name: string; type: 'CHECKING' | 'SAVINGS' | 'CASH'; currentBalance: number; color?: string }): Promise<Account> {
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created = await res.json();
        localAccounts.push(created);
        setStored(userKey('financas_accounts'), localAccounts);
        return created;
      }
    } catch (e) {}

    const newAcc: Account = {
      id: 'acc-' + Date.now(),
      name: data.name || 'Nova Conta',
      type: data.type || 'CHECKING',
      currentBalance: data.currentBalance || 0,
      color: data.color || '#3B82F6'
    };
    localAccounts.push(newAcc);
    setStored(userKey('financas_accounts'), localAccounts);
    return newAcc;
  },

  async deleteAccount(accountId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {}
    localAccounts = localAccounts.filter(a => a.id !== accountId);
    setStored(userKey('financas_accounts'), localAccounts);
  },

  async getCards(): Promise<CreditCard[]> {
    try {
      const res = await fetch(`${API_BASE}/cards`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localCards = data;
          setStored(userKey('financas_cards'), localCards);
          return data;
        }
      }
    } catch (e) {}
    return localCards;
  },

  async createCard(cardData: Partial<CreditCard>): Promise<CreditCard> {
    try {
      const res = await fetch(`${API_BASE}/cards`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        const created = await res.json();
        localCards.push(created);
        setStored(userKey('financas_cards'), localCards);
        return created;
      }
    } catch (e) {}

    const newCard: CreditCard = {
      id: 'card-' + Date.now(),
      name: cardData.name || 'Novo Cartão',
      bank: cardData.bank || 'nubank',
      limitTotal: cardData.limitTotal || 2000,
      closingDay: cardData.closingDay || 25,
      dueDay: cardData.dueDay || 5,
      color: cardData.color || '#820AD1'
    };
    localCards.push(newCard);
    setStored(userKey('financas_cards'), localCards);
    return newCard;
  },

  async updateCard(cardId: string, cardData: Partial<CreditCard>): Promise<CreditCard | null> {
    try {
      const res = await fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = localCards.findIndex(c => c.id === cardId);
        if (idx !== -1) localCards[idx] = updated;
        setStored(userKey('financas_cards'), localCards);
        return updated;
      }
    } catch (e) {}

    const idx = localCards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      localCards[idx] = {
        ...localCards[idx],
        ...cardData
      };
      setStored(userKey('financas_cards'), localCards);
      return localCards[idx];
    }
    return null;
  },

  async deleteCard(cardId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {}
    localCards = localCards.filter(c => c.id !== cardId);
    setStored(userKey('financas_cards'), localCards);
  },

  async updateAccountBalance(accountId: string, newBalance: number): Promise<Account> {
    try {
      const res = await fetch(`${API_BASE}/accounts/${accountId}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ currentBalance: newBalance })
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = localAccounts.findIndex(a => a.id === accountId);
        if (idx !== -1) localAccounts[idx] = updated;
        setStored(userKey('financas_accounts'), localAccounts);
        return updated;
      }
    } catch (e) {}

    const acc = localAccounts.find(a => a.id === accountId) || localAccounts[0];
    if (acc) {
      acc.currentBalance = newBalance;
      setStored(userKey('financas_accounts'), localAccounts);
    }
    return acc;
  },

  async payEntirePurchase(transactionIds: string[], accountId: string, totalAmount: number): Promise<void> {
    for (const id of transactionIds) {
      try {
        await fetch(`${API_BASE}/transactions/${id}/pay`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ accountId })
        });
      } catch (e) {}
    }

    localTransactions = localTransactions.map(t => {
      if (transactionIds.includes(t.id)) {
        return { ...t, isPaid: true };
      }
      return t;
    });

    if (accountId === 'SALARIO') {
      const firstTx = localTransactions.find(t => transactionIds.includes(t.id));
      const cleanTitle = firstTx ? firstTx.description.replace(/\s*\(\d+\/\d+\)$/, '') : 'Compra Cartão';
      const salaryExpenseTx: Transaction = {
        id: 'tx-pay-salario-group-' + Date.now(),
        description: `Quitação Total - ${cleanTitle}`,
        amount: totalAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        paymentMethod: 'PIX',
        category: firstTx?.category || localCategories[0],
        account: { id: 'SALARIO', name: 'Salário Mensal', type: 'CHECKING', currentBalance: 0, color: '#10B981' },
        isPaid: true
      };
      localTransactions.unshift(salaryExpenseTx);
      try {
        await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            description: salaryExpenseTx.description,
            amount: salaryExpenseTx.amount,
            date: salaryExpenseTx.date,
            type: 'EXPENSE',
            paymentMethod: 'PIX',
            accountId: 'SALARIO',
            categoryId: firstTx?.category?.id
          })
        });
      } catch (e) {}
    } else if (accountId !== 'ALREADY_PAID') {
      const acc = localAccounts.find(a => a.id === accountId) || localAccounts[0];
      if (acc) {
        acc.currentBalance = Math.max(0, acc.currentBalance - totalAmount);
        setStored(userKey('financas_accounts'), localAccounts);
      }
    }
    setStored(userKey('financas_transactions'), localTransactions);
  },

  async updatePurchase(transactionIds: string[], data: { description?: string; categoryId?: string }): Promise<void> {
    const targetCat = data.categoryId ? localCategories.find(c => c.id === data.categoryId) : undefined;
    for (const id of transactionIds) {
      try {
        await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(data)
        });
      } catch (e) {}
    }

    localTransactions = localTransactions.map(t => {
      if (transactionIds.includes(t.id)) {
        let newDesc = t.description;
        if (data.description) {
          if (t.totalInstallments && t.totalInstallments > 1 && t.installmentNumber) {
            newDesc = `${data.description} (${t.installmentNumber}/${t.totalInstallments})`;
          } else {
            newDesc = data.description;
          }
        }
        return {
          ...t,
          description: newDesc,
          category: targetCat || t.category
        };
      }
      return t;
    });
    setStored(userKey('financas_transactions'), localTransactions);
  },

  async updatePurchaseCategory(transactionIds: string[], categoryId: string): Promise<void> {
    return this.updatePurchase(transactionIds, { categoryId });
  },

  async deleteEntirePurchase(transactionIds: string[]): Promise<void> {
    for (const id of transactionIds) {
      try {
        await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (e) {}
    }
    localTransactions = localTransactions.filter(t => !transactionIds.includes(t.id));
    setStored(userKey('financas_transactions'), localTransactions);
  },

  async payInstallment(transactionId: string, accountId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/transactions/${transactionId}/pay`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ accountId })
      });
    } catch (e) {}

    const tx = localTransactions.find(t => t.id === transactionId);
    if (tx) {
      tx.isPaid = true;

      if (accountId === 'SALARIO') {
        // Registra saída do salário do mês atual
        const salaryExpenseTx: Transaction = {
          id: 'tx-pay-salario-' + Date.now(),
          description: `Pagamento Parcela - ${tx.description}`,
          amount: tx.amount,
          date: new Date().toISOString().split('T')[0],
          type: 'EXPENSE',
          paymentMethod: 'PIX',
          category: tx.category || localCategories[0],
          account: { id: 'SALARIO', name: 'Salário Mensal', type: 'CHECKING', currentBalance: 0, color: '#10B981' },
          isPaid: true
        };
        localTransactions.unshift(salaryExpenseTx);
        try {
          await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
              description: salaryExpenseTx.description,
              amount: salaryExpenseTx.amount,
              date: salaryExpenseTx.date,
              type: 'EXPENSE',
              paymentMethod: 'PIX',
              accountId: 'SALARIO',
              categoryId: tx.category?.id
            })
          });
        } catch (e) {}
      } else if (accountId !== 'ALREADY_PAID') {
        const acc = localAccounts.find(a => a.id === accountId) || localAccounts[0];
        if (acc) {
          acc.currentBalance = Math.max(0, acc.currentBalance - (tx.amount || 0));
          setStored(userKey('financas_accounts'), localAccounts);
        }
      }
      setStored(userKey('financas_transactions'), localTransactions);
    }
  },

  async payInvoice(cardId: string, accountId: string, amount: number, transactionIds?: string[]): Promise<void> {
    const card = localCards.find(c => c.id === cardId);

    // Se recebeu os IDs específicos das parcelas/contas deste ciclo, dá baixa apenas nelas
    const idsToPay = transactionIds && transactionIds.length > 0
      ? transactionIds
      : localTransactions
          .filter(t => t.paymentMethod === 'CREDIT_CARD' && (t.creditCard?.id === cardId || (t as any).creditCardId === cardId) && !t.isPaid)
          .map(t => t.id);

    // No backend, marca apenas essas parcelas específicas como pagas
    for (const txId of idsToPay) {
      try {
        await fetch(`${API_BASE}/transactions/${txId}/pay`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ accountId: 'ALREADY_PAID' })
        });
      } catch (e) {}
    }

    if (accountId === 'SALARIO') {
      const salaryExpenseTx: Transaction = {
        id: 'tx-pay-salario-invoice-' + Date.now(),
        description: `Pagamento Fatura - ${card?.name || 'Cartão'}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        paymentMethod: 'PIX',
        category: localCategories[0],
        account: { id: 'SALARIO', name: 'Salário Mensal', type: 'CHECKING', currentBalance: 0, color: '#10B981' },
        isPaid: true
      };
      localTransactions.unshift(salaryExpenseTx);
      try {
        await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            description: salaryExpenseTx.description,
            amount: salaryExpenseTx.amount,
            date: salaryExpenseTx.date,
            type: 'EXPENSE',
            paymentMethod: 'PIX',
            accountId: 'SALARIO'
          })
        });
      } catch (e) {}
    } else if (accountId !== 'ALREADY_PAID') {
      const acc = localAccounts.find(a => a.id === accountId) || localAccounts[0];
      if (acc) {
        acc.currentBalance = Math.max(0, acc.currentBalance - amount);
        setStored(userKey('financas_accounts'), localAccounts);
        try {
          await fetch(`${API_BASE}/accounts/${acc.id}`, {
            method: 'PATCH',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ currentBalance: acc.currentBalance })
          });
        } catch (e) {}
      }
    }

    // Marca APENAS as transações desta fatura do mês como PAGAS
    localTransactions = localTransactions.map(t => {
      if (idsToPay.includes(t.id)) {
        return { ...t, isPaid: true };
      }
      return t;
    });

    setStored(userKey('financas_transactions'), localTransactions);
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return localCategories;
  },

  async createTransaction(data: any): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created = await res.json();
        await this.getTransactions();
        return Array.isArray(created) ? created : [created];
      }
    } catch (e) {}

    const installments = data.totalInstallments && data.totalInstallments > 1 ? data.totalInstallments : 1;
    const baseAmount = Number((data.amount / installments).toFixed(2));
    const createdList: Transaction[] = [];

    const isFromSalary = data.accountId === 'SALARIO' || (!data.accountId && data.paymentMethod !== 'CREDIT_CARD');
    const salaryAcc: Account = {
      id: 'SALARIO',
      name: 'Salário Mensal',
      type: 'CHECKING',
      currentBalance: this.getSalaryRemaining(),
      color: '#10B981'
    };
    const targetAcc = isFromSalary ? salaryAcc : (localAccounts.find(a => String(a.id).toLowerCase() === String(data.accountId || '').toLowerCase()) || localAccounts[0]);
    const targetCard = localCards.find(c => String(c.id).toLowerCase() === String(data.creditCardId || '').toLowerCase()) || localCards[0];

    for (let i = 1; i <= installments; i++) {
      let txDate = data.date || new Date().toISOString().split('T')[0];
      if (i > 1) {
        const d = new Date(txDate + 'T12:00:00');
        d.setMonth(d.getMonth() + (i - 1));
        txDate = d.toISOString().split('T')[0];
      }

      const newT: Transaction = {
        id: 't-' + Date.now() + '-' + i,
        description: installments > 1 ? `${data.description} (${i}/${installments})` : data.description,
        amount: baseAmount,
        date: txDate,
        type: data.type || 'EXPENSE',
        paymentMethod: data.paymentMethod || 'PIX',
        category: localCategories.find(c => String(c.id).toLowerCase() === String(data.categoryId || '').toLowerCase()) || localCategories[0],
        creditCard: data.paymentMethod === 'CREDIT_CARD' ? (targetCard || { id: data.creditCardId, name: 'Cartao de Credito', limitTotal: 5000, closingDay: 25, dueDay: 5, color: '#820AD1' }) : undefined,
        creditCardId: data.paymentMethod === 'CREDIT_CARD' ? (data.creditCardId || targetCard?.id) : undefined,
        account: targetAcc,
        installmentNumber: i,
        totalInstallments: installments,
        installmentGroupId: installments > 1 ? 'grp-' + Date.now() : undefined,
        isPaid: data.paymentMethod !== 'CREDIT_CARD',
        isRecurring: Boolean(data.isRecurring)
      };
      createdList.push(newT);
      localTransactions.unshift(newT);
    }

    setStored(userKey('financas_transactions'), localTransactions);
    return createdList;
  },

  async updateTransaction(id: string, data: any): Promise<Transaction | null> {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        await this.getTransactions();
        return updated;
      }
    } catch (e) {}

    const idx = localTransactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const oldT = localTransactions[idx];
      const updatedT: Transaction = {
        ...oldT,
        ...data,
        category: data.categoryId ? (localCategories.find(c => c.id === data.categoryId) || oldT.category) : oldT.category,
        account: data.accountId ? (localAccounts.find(a => a.id === data.accountId) || oldT.account) : oldT.account,
        creditCard: data.creditCardId ? (localCards.find(c => c.id === data.creditCardId) || oldT.creditCard) : oldT.creditCard
      };
      localTransactions[idx] = updatedT;

      // Se fizer parte de um grupo de parcelas, sincroniza a data das demais
      if (updatedT.installmentGroupId && data.date) {
        const curNum = updatedT.installmentNumber || 1;
        const baseD = new Date(data.date + 'T12:00:00');
        baseD.setMonth(baseD.getMonth() - (curNum - 1));

        localTransactions = localTransactions.map(sibling => {
          if (sibling.installmentGroupId === updatedT.installmentGroupId && sibling.id !== updatedT.id) {
            const sNum = sibling.installmentNumber || 1;
            const sD = new Date(baseD);
            sD.setMonth(sD.getMonth() + (sNum - 1));
            return {
              ...sibling,
              date: sD.toISOString().split('T')[0]
            };
          }
          return sibling;
        });
      }

      setStored(userKey('financas_transactions'), localTransactions);
      return updatedT;
    }
    return null;
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {}
    localTransactions = localTransactions.filter(t => t.id !== id);
    setStored(userKey('financas_transactions'), localTransactions);
  },

  async getQuotaStatus(): Promise<QuotaStatus> {
    try {
      const res = await fetch(`${API_BASE}/receipts/quota-status`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      isAllowed: true,
      availableTokens: 15,
      maxTokens: 15,
      waitSecondsToReset: 0,
      message: '15/15 leituras disponíveis neste minuto.'
    };
  },

  async scanReceipt(file: File): Promise<ReceiptAnalysis> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/receipts/scan`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (res.status === 429) {
      const quota = await res.json();
      throw { status: 429, ...quota };
    }

    if (!res.ok) {
      await new Promise(r => setTimeout(r, 1200));
      return {
        establishment: 'Restaurante & Grill Sabores',
        amount: 89.50,
        date: new Date().toISOString().split('T')[0],
        category: 'Alimentação',
        suggestedPaymentMethod: 'CREDIT_CARD',
        suggestedInstallments: 1,
        items: [
          { name: 'Almoço Buffet 2x', price: 74.00, quantity: 2 },
          { name: 'Suco Natural Laranja', price: 15.50, quantity: 1 }
        ],
        rawJson: '{}'
      };
    }

    return await res.json();
  }
};
