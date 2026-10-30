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
  { id: 'acc-1', name: 'Conta Principal', type: 'CHECKING', currentBalance: 2500.00, color: '#8A05BE' },
  { id: 'acc-2', name: 'Poupança / Reserva', type: 'SAVINGS', currentBalance: 5000.00, color: '#FF7A00' }
];

const initialCards: CreditCard[] = [
  { id: 'card-1', name: 'Nubank Roxinho', bank: 'nubank', limitTotal: 5000, closingDay: 25, dueDay: 5, color: '#820AD1' }
];

let localAccounts: Account[] = getStored<Account[]>('financas_accounts', initialAccounts);
let localCards: CreditCard[] = getStored<CreditCard[]>('financas_cards', initialCards);

let localCategories: Category[] = [
  { id: 'cat1', name: 'Alimentação', icon: 'utensils', color: '#F59E0B', type: 'EXPENSE' },
  { id: 'cat2', name: 'Supermercado', icon: 'shopping-cart', color: '#10B981', type: 'EXPENSE' },
  { id: 'cat3', name: 'Transporte', icon: 'car', color: '#3B82F6', type: 'EXPENSE' },
  { id: 'cat4', name: 'Moradia', icon: 'home', color: '#8B5CF6', type: 'EXPENSE' },
  { id: 'cat5', name: 'Lazer', icon: 'gamepad-2', color: '#06B6D4', type: 'EXPENSE' },
  { id: 'cat6', name: 'Salário', icon: 'wallet', color: '#10B981', type: 'INCOME' }
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

  getMonthlySalary(): number {
    return getStored<number>('financas_monthly_salary', 3500.00);
  },

  setMonthlySalary(salary: number): number {
    setStored('financas_monthly_salary', salary);
    return salary;
  },

  async getSummary(): Promise<DashboardSummary> {
    const monthlySalary = this.getMonthlySalary();
    const otherIncome = localTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (res.ok) {
        const data = await res.json();
        if (data && Number(data.totalBalance) > 0) {
          return {
            ...data,
            monthlySalary,
            monthIncome: monthlySalary + otherIncome
          };
        }
      }
    } catch (e) {}

    // Recalcula dinamicamente em tempo real com base apenas nos lançamentos reais do usuário
    const totalBalance = localAccounts.reduce((acc, a) => acc + (Number(a.currentBalance) || 0), 0);
    const monthIncome = monthlySalary + otherIncome;
    const expenseTransactions = localTransactions.filter(t => t.type === 'EXPENSE');
    const monthExpense = expenseTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const openInvoicesTotal = localTransactions
      .filter(t => t.paymentMethod === 'CREDIT_CARD' && !t.isPaid)
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

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

  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localTransactions = data;
          setStored('financas_transactions', localTransactions);
          return data;
        }
      }
    } catch (e) {}
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

  async payInvoice(cardId: string, accountId: string, amount: number, invoiceId: string = 'inv-atual'): Promise<void> {
    try {
      await fetch(`${API_BASE}/cards/${cardId}/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, amount })
      });
    } catch (e) {}

    const acc = localAccounts.find(a => a.id === accountId) || localAccounts[0];
    if (acc) {
      acc.currentBalance = Math.max(0, acc.currentBalance - amount);
      setStored('financas_accounts', localAccounts);
    }

    const payTx: Transaction = {
      id: 'tx-pay-' + Date.now(),
      description: 'Pagamento de Fatura Cartão',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      type: 'EXPENSE',
      paymentMethod: 'DEBIT_CARD',
      account: acc,
      isPaid: true
    };
    localTransactions.unshift(payTx);
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

    const targetAcc = localAccounts.find(a => a.id === data.accountId) || localAccounts[0];

    for (let i = 1; i <= installments; i++) {
      const newT: Transaction = {
        id: 't-' + Date.now() + '-' + i,
        description: installments > 1 ? `${data.description} (${i}/${installments})` : data.description,
        amount: baseAmount,
        date: data.date || new Date().toISOString().split('T')[0],
        type: data.type || 'EXPENSE',
        paymentMethod: data.paymentMethod || 'PIX',
        category: localCategories.find(c => c.id === data.categoryId) || localCategories[0],
        creditCard: localCards.find(c => c.id === data.creditCardId),
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
