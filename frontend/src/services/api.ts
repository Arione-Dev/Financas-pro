import { DashboardSummary, Transaction, Account, CreditCard, Category, QuotaStatus, ReceiptAnalysis, User } from '../types';

const API_BASE = '/api';

// Dados de demonstração inicial para teste instantâneo
let localAccounts: Account[] = [
  { id: '1', name: 'Nubank Conta', type: 'CHECKING', currentBalance: 4250.80, color: '#8A05BE' },
  { id: '2', name: 'Inter Poupança', type: 'SAVINGS', currentBalance: 12800.00, color: '#FF7A00' },
  { id: '3', name: 'Carteira Física', type: 'CASH', currentBalance: 320.00, color: '#10B981' }
];

let localCards: CreditCard[] = [
  { id: 'c1', name: 'Nubank Ultravioleta', limitTotal: 15000, closingDay: 25, dueDay: 2, color: '#8A05BE' },
  { id: 'c2', name: 'Inter Black', limitTotal: 8000, closingDay: 15, dueDay: 22, color: '#FF7A00' }
];

let localCategories: Category[] = [
  { id: 'cat1', name: 'Alimentação', icon: 'utensils', color: '#F59E0B', type: 'EXPENSE' },
  { id: 'cat2', name: 'Supermercado', icon: 'shopping-cart', color: '#10B981', type: 'EXPENSE' },
  { id: 'cat3', name: 'Transporte', icon: 'car', color: '#3B82F6', type: 'EXPENSE' },
  { id: 'cat4', name: 'Moradia', icon: 'home', color: '#8B5CF6', type: 'EXPENSE' },
  { id: 'cat5', name: 'Lazer', icon: 'gamepad-2', color: '#06B6D4', type: 'EXPENSE' },
  { id: 'cat6', name: 'Salário', icon: 'wallet', color: '#10B981', type: 'INCOME' }
];

let localTransactions: Transaction[] = [
  {
    id: 't1',
    description: 'Salário Mensal',
    amount: 6500.00,
    date: '2026-10-05',
    type: 'INCOME',
    paymentMethod: 'PIX',
    category: localCategories[5],
    account: localAccounts[0],
    isPaid: true
  },
  {
    id: 't2',
    description: 'Supermercado Pão de Açúcar',
    amount: 450.30,
    date: '2026-10-18',
    type: 'EXPENSE',
    paymentMethod: 'DEBIT_CARD',
    category: localCategories[1],
    account: localAccounts[0],
    isPaid: true
  },
  {
    id: 't3',
    description: 'Smartphone Galaxy S24 (1/10)',
    amount: 399.90,
    date: '2026-10-12',
    type: 'EXPENSE',
    paymentMethod: 'CREDIT_CARD',
    creditCard: localCards[0],
    category: localCategories[4],
    installmentNumber: 1,
    totalInstallments: 10,
    installmentGroupId: 'group-phone',
    isPaid: false
  },
  {
    id: 't4',
    description: 'Uber - Viagem Aeroporto',
    amount: 54.80,
    date: '2026-10-22',
    type: 'EXPENSE',
    paymentMethod: 'PIX',
    category: localCategories[2],
    account: localAccounts[0],
    isPaid: true
  }
];

export const api = {
  async register(name: string, email: string, password: string):Promise<any> {
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
      // Mock local para funcionamento imediato
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
      if (!res.ok) throw new Error(data.message || 'Erro no login.');
      localStorage.setItem('auth_user', JSON.stringify(data));
      return data;
    } catch (e: any) {
      // Mock local
      const mock = { id: 'u-' + Date.now(), name: email.split('@')[0], email, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` };
      localStorage.setItem('auth_user', JSON.stringify(mock));
      return mock;
    }
  },

  async loginGoogle(payload: { name: string; email: string; googleId: string; avatarUrl: string }): Promise<any> {
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

  async getSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetch(`${API_BASE}/dashboard/summary`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const totalBalance = localAccounts.reduce((acc, a) => acc + a.currentBalance, 0);
    const monthIncome = localTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const monthExpense = localTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const openInvoicesTotal = 399.90;

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      openInvoicesTotal,
      categoryExpenses: [
        { name: 'Supermercado', color: '#10B981', amount: 450.30, percentage: 50 },
        { name: 'Lazer / Eletrônicos', color: '#06B6D4', amount: 399.90, percentage: 44 },
        { name: 'Transporte', color: '#3B82F6', amount: 54.80, percentage: 6 }
      ]
    };
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return localTransactions;
  },

  async getAccounts(): Promise<Account[]> {
    try {
      const res = await fetch(`${API_BASE}/accounts`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return localAccounts;
  },

  async getCards(): Promise<CreditCard[]> {
    try {
      const res = await fetch(`${API_BASE}/cards`);
      if (res.ok) return await res.json();
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
      if (res.ok) return await res.json();
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
    return newCard;
  },

  async deleteCard(cardId: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/cards/${cardId}`, { method: 'DELETE' });
    } catch (e) {}
    localCards = localCards.filter(c => c.id !== cardId);
  },

  async updateAccountBalance(accountId: string, newBalance: number): Promise<Account> {
    try {
      const res = await fetch(`${API_BASE}/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: newBalance })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const acc = localAccounts.find(a => a.id === accountId);
    if (acc) {
      acc.currentBalance = newBalance;
    }
    return acc || localAccounts[0];
  },

  async payInvoice(cardId: string, accountId: string, amount: number, invoiceId: string = 'inv-atual'): Promise<void> {
    try {
      await fetch(`${API_BASE}/cards/${cardId}/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, amount })
      });
    } catch (e) {}

    // Deduz o valor da conta bancária escolhida
    const acc = localAccounts.find(a => a.id === accountId);
    if (acc) {
      acc.currentBalance = Math.max(0, acc.currentBalance - amount);
    }

    // Registra a transação de pagamento de fatura
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
      if (res.ok) return await res.json();
    } catch (e) {}

    // Lógica local para teste interativo offline
    const installments = data.totalInstallments && data.totalInstallments > 1 ? data.totalInstallments : 1;
    const baseAmount = Number((data.amount / installments).toFixed(2));
    const createdList: Transaction[] = [];

    for (let i = 1; i <= installments; i++) {
      const newT: Transaction = {
        id: 't-' + Date.now() + '-' + i,
        description: installments > 1 ? `${data.description} (${i}/${installments})` : data.description,
        amount: baseAmount,
        date: data.date,
        type: data.type || 'EXPENSE',
        paymentMethod: data.paymentMethod || 'PIX',
        category: localCategories.find(c => c.id === data.categoryId) || localCategories[0],
        creditCard: localCards.find(c => c.id === data.creditCardId),
        account: localAccounts.find(a => a.id === data.accountId),
        installmentNumber: i,
        totalInstallments: installments,
        installmentGroupId: installments > 1 ? 'grp-' + Date.now() : undefined,
        isPaid: data.paymentMethod !== 'CREDIT_CARD'
      };
      createdList.push(newT);
      localTransactions.unshift(newT);
    }
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
      // Simulação inteligente caso backend ainda esteja sem chave
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

