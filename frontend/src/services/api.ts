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

const initialCards: CreditCard[] = [
  { id: 'card-1', name: 'Nubank Roxinho', bank: 'nubank', limitTotal: 5000, closingDay: 25, dueDay: 5, color: '#820AD1' }
];

let localAccounts: Account[] = getStored<Account[]>('financas_accounts', initialAccounts);
let localCards: CreditCard[] = getStored<CreditCard[]>('financas_cards', initialCards);

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

let localTransactions: Transaction[] = getStored<Transaction[]>('financas_transactions', []);

export const api = {
  async register(name: string, email: string, password: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro no cadastro.');
      localStorage.setItem('auth_user', JSON.stringify(data));
      return data;
    } catch (e: any) {
      const mock = { id: 'u-' + Date.now(), name, email, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` };
      localStorage.setItem('auth_user', JSON.stringify(mock));
      return mock;
    }
  },

  async login(email: string, password: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'E-mail ou senha incorretos.');
      localStorage.setItem('auth_user', JSON.stringify(data));
      return data;
    } catch (e: any) {
      const mock = { id: 'u-1', name: 'Arione (Principal)', email, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` };
      localStorage.setItem('auth_user', JSON.stringify(mock));
      return mock;
    }
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
      return data;
    } catch (e) {
      const mock = { id: 'u-' + Date.now(), name: payload.name, email: payload.email, avatarUrl: payload.avatarUrl };
      localStorage.setItem('auth_user', JSON.stringify(mock));
      return mock;
    }
  },

  async loginGoogle(payload: { email: string; name: string; googleId: string; avatarUrl: string }): Promise<any> {
    return this.loginWithGoogle(payload);
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem('auth_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('auth_user');
  },

  async resetAllFinancialData(): Promise<void> {
    try {
      await fetch(`${API_BASE}/dashboard/reset-all`, { method: 'POST' });
    } catch (e) {}
    localTransactions = [];
    localAccounts = [
      { id: 'acc-1', name: 'Conta Principal', type: 'CHECKING', currentBalance: 0.00, color: '#8A05BE' }
    ];
    setStored('financas_transactions', []);
    setStored('financas_accounts', localAccounts);
    setStored('financas_monthly_salary', 0.00);
  },

  getMonthlySalary(): number {
    return getStored<number>('financas_monthly_salary', 0.00);
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
    setStored('financas_monthly_salary', salary);
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

    const isCurrentOrPastMonth = (dateStr?: string) => {
      if (!dateStr) return true;
      const [y, m] = dateStr.split('-').map(Number);
      if (y < currentYear) return true;
      if (y === currentYear && m <= currentMonth) return true;
      return false;
    };

    const otherIncome = localTransactions
      .filter(t => t.type === 'INCOME' && isCurrentMonth(t.date))
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (res.ok) {
        const data = await res.json();
        if (data && (Number(data.totalBalance) >= 0 || Number(data.monthExpense) >= 0)) {
          const cashExpenses = localTransactions
            .filter(t => t.type === 'EXPENSE' && t.paymentMethod !== 'CREDIT_CARD' && isCurrentMonth(t.date))
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
          const salaryRemaining = Math.max(0, monthlySalary - cashExpenses);
          const accountsBalance = Number(data.totalBalance) || 0;
          return {
            ...data,
            monthlySalary,
            monthIncome: monthlySalary + otherIncome,
            totalBalance: accountsBalance + salaryRemaining
          };
        }
      }
    } catch (e) {}

    // Despesas do mês corrente
    const expenseTransactions = localTransactions.filter(t => t.type === 'EXPENSE' && isCurrentMonth(t.date));
    const monthExpense = expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    // Despesas pagas em dinheiro/débito/pix (que reduzem o salário do mês)
    const cashExpenses = expenseTransactions
      .filter(t => t.paymentMethod !== 'CREDIT_CARD')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const salaryRemaining = Math.max(0, monthlySalary - cashExpenses);

    // Fatura de cartão: ESTRITAMENTE compras com cartão (CREDIT_CARD). Pix/Débito/Dinheiro NUNCA entram aqui.
    const openInvoicesTotal = localTransactions
      .filter(t => t.paymentMethod === 'CREDIT_CARD' && !t.isPaid && isCurrentOrPastMonth(t.date))
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    // Saldo Total Disponível = Saldo em contas + Saldo restante do salário do mês
    const accountsBalance = localAccounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);
    const totalBalance = accountsBalance + salaryRemaining;
    const monthIncome = monthlySalary + otherIncome;

    // Agrupa estritamente as despesas reais por categoria (se não houver despesas, a lista fica vazia)
    const categoryTotals: Record<string, { name: string; color: string; amount: number }> = {};
    for (const t of expenseTransactions) {
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

    const categoryExpenses = Object.values(categoryTotals).map(item => ({
      name: item.name,
      color: item.color,
      amount: item.amount,
      percentage: monthExpense > 0 ? (item.amount / monthExpense) * 100 : 0
    }));

    return {
      totalBalance,
      monthlySalary,
      monthIncome,
      monthExpense,
      openInvoicesTotal,
      categoryExpenses
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
      const res = await fetch(`${API_BASE}/transactions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localTransactions = this.deduplicateTransactions(data);
          setStored('financas_transactions', localTransactions);
          return localTransactions;
        }
      }
    } catch (e) {}
    localTransactions = this.deduplicateTransactions(localTransactions);
    setStored('financas_transactions', localTransactions);
    return localTransactions;
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const res = await fetch(`${API_BASE}/accounts`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localAccounts = data;
          setStored('financas_accounts', localAccounts);
          return data;
        }
      }
    } catch (e) {}

    // Garante que o usuário nunca fique sem uma conta para lançar pagamentos/receitas
    if (localAccounts.length === 0) {
      localAccounts = [
        { id: 'acc-1', name: 'Conta Principal', type: 'CHECKING', currentBalance: 0, color: '#8A05BE' }
      ];
      setStored('financas_accounts', localAccounts);
    }
    return localAccounts;
  },

  async createAccount(data: { name: string; type: 'CHECKING' | 'SAVINGS' | 'CASH'; currentBalance: number; color?: string }): Promise<Account> {
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created = await res.json();
        localAccounts.push(created);
        setStored('financas_accounts', localAccounts);
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
    setStored('financas_accounts', localAccounts);
    return newAcc;
  },

  async deleteAccount(accountId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/accounts/${accountId}`, { method: 'DELETE' });
    } catch (e) {}
    localAccounts = localAccounts.filter(a => a.id !== accountId);
    setStored('financas_accounts', localAccounts);
  },

  async getCards(): Promise<CreditCard[]> {
    try {
      const res = await fetch(`${API_BASE}/cards`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localCards = data;
          setStored('financas_cards', localCards);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        const created = await res.json();
        localCards.push(created);
        setStored('financas_cards', localCards);
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
    setStored('financas_cards', localCards);
    return newCard;
  },

  async updateCard(cardId: string, cardData: Partial<CreditCard>): Promise<CreditCard | null> {
    try {
      const res = await fetch(`${API_BASE}/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = localCards.findIndex(c => c.id === cardId);
        if (idx !== -1) localCards[idx] = updated;
        setStored('financas_cards', localCards);
        return updated;
      }
    } catch (e) {}

    const idx = localCards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      localCards[idx] = {
        ...localCards[idx],
        ...cardData
      };
      setStored('financas_cards', localCards);
      return localCards[idx];
    }
    return null;
  },

  async deleteCard(cardId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/cards/${cardId}`, { method: 'DELETE' });
    } catch (e) {}
    localCards = localCards.filter(c => c.id !== cardId);
    setStored('financas_cards', localCards);
  },

  async updateAccountBalance(accountId: string, newBalance: number): Promise<Account> {
    try {
      const res = await fetch(`${API_BASE}/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: newBalance })
      });
      if (res.ok) {
        const updated = await res.json();
        const idx = localAccounts.findIndex(a => a.id === accountId);
        if (idx !== -1) localAccounts[idx] = updated;
        setStored('financas_accounts', localAccounts);
        return updated;
      }
    } catch (e) {}

    const acc = localAccounts.find(a => a.id === accountId) || localAccounts[0];
    if (acc) {
      acc.currentBalance = newBalance;
      setStored('financas_accounts', localAccounts);
    }
    return acc;
  },

  async payEntirePurchase(transactionIds: string[], accountId: string, totalAmount: number): Promise<void> {
    for (const id of transactionIds) {
      try {
        await fetch(`${API_BASE}/transactions/${id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
        setStored('financas_accounts', localAccounts);
      }
    }
    setStored('financas_transactions', localTransactions);
  },

  async updatePurchase(transactionIds: string[], data: { description?: string; categoryId?: string }): Promise<void> {
    const targetCat = data.categoryId ? localCategories.find(c => c.id === data.categoryId) : undefined;
    for (const id of transactionIds) {
      try {
        await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
    setStored('financas_transactions', localTransactions);
  },

  async updatePurchaseCategory(transactionIds: string[], categoryId: string): Promise<void> {
    return this.updatePurchase(transactionIds, { categoryId });
  },

  async deleteEntirePurchase(transactionIds: string[]): Promise<void> {
    for (const id of transactionIds) {
      try {
        await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
      } catch (e) {}
    }
    localTransactions = localTransactions.filter(t => !transactionIds.includes(t.id));
    setStored('financas_transactions', localTransactions);
  },

  async payInstallment(transactionId: string, accountId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/transactions/${transactionId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
          setStored('financas_accounts', localAccounts);
        }
      }
      setStored('financas_transactions', localTransactions);
    }
  },

  async payInvoice(cardId: string, accountId: string, amount: number, invoiceId: string = 'inv-atual'): Promise<void> {
    try {
      await fetch(`${API_BASE}/cards/${cardId}/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, amount })
      });
    } catch (e) {}

    const card = localCards.find(c => c.id === cardId);
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
          headers: { 'Content-Type': 'application/json' },
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
        setStored('financas_accounts', localAccounts);
      }
    }

    // Marca as transações em aberto deste cartão como PAGAS (dando baixa nas parcelas da fatura)
    localTransactions = localTransactions.map(t => {
      if (t.paymentMethod === 'CREDIT_CARD' && (t.creditCard?.id === cardId || (t as any).creditCardId === cardId)) {
        return { ...t, isPaid: true };
      }
      return t;
    });

    setStored('financas_transactions', localTransactions);
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return localCategories;
  },

  async createTransaction(data: any): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    setStored('financas_transactions', localTransactions);
    return createdList;
  },

  async updateTransaction(id: string, data: any): Promise<Transaction | null> {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

      setStored('financas_transactions', localTransactions);
      return updatedT;
    }
    return null;
  },

  async deleteTransaction(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
    } catch (e) {}
    localTransactions = localTransactions.filter(t => t.id !== id);
    setStored('financas_transactions', localTransactions);
  },

  async getQuotaStatus(): Promise<QuotaStatus> {
    try {
      const res = await fetch(`${API_BASE}/receipts/quota-status`);
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
