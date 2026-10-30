import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CardsView } from './components/CardsView';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { NewTransactionModal } from './components/NewTransactionModal';
import { EditAccountModal } from './components/EditAccountModal';
import { AuthView } from './components/AuthView';
import { api } from './services/api';
import { DashboardSummary, Transaction, Account, CreditCard, Category, User } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'cards'>('dashboard');
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('privacy_mode') === 'true';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    loadAllData();
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState<boolean>(false);
  const [rateLimitWaitSeconds, setRateLimitWaitSeconds] = useState<number>(0);

  const [summary, setSummary] = useState<DashboardSummary>({
    totalBalance: 0,
    monthIncome: 0,
    monthExpense: 0,
    openInvoicesTotal: 0,
    categoryExpenses: []
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [sum, txs, accs, crds, cats] = await Promise.all([
        api.getSummary(),
        api.getTransactions(),
        api.getAccounts(),
        api.getCards(),
        api.getCategories()
      ]);
      setSummary(sum);
      setTransactions(txs);
      setAccounts(accs);
      setCards(crds);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = () => {
    setIsPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem('privacy_mode', String(next));
      return next;
    });
  };

  // Funções de Gestão de Cartões
  const handleAddCard = async (cardData: Partial<CreditCard>) => {
    await api.createCard(cardData);
    await loadAllData();
  };

  const handleDeleteCard = async (cardId: string) => {
    await api.deleteCard(cardId);
    await loadAllData();
  };

  const handlePayInvoice = async (cardId: string, accountId: string, amount: number) => {
    await api.payInvoice(cardId, accountId, amount);
    await loadAllData();
  };

  // Funções de Gestão de Saldo e Salário
  const handleSaveAccountBalance = async (accountId: string, newBalance: number) => {
    await api.updateAccountBalance(accountId, newBalance);
    await loadAllData();
  };

  const handleAddSalaryOrIncome = async (accountId: string, amount: number, description: string) => {
    const acc = accounts.find(a => a.id === accountId) || accounts[0];
    await api.createTransaction({
      description: description || 'Salário Mensal',
      amount,
      type: 'INCOME',
      paymentMethod: 'PIX',
      accountId: acc.id,
      date: new Date().toISOString().split('T')[0],
      isPaid: true
    });
    // Incrementa saldo atual
    await api.updateAccountBalance(accountId, acc.currentBalance + amount);
    await loadAllData();
  };

  // Se não estiver logado, exibe a Tela de Login e Cadastro
  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Navbar Superior & Sidebar no Desktop */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenScan={() => setIsScanModalOpen(true)}
        onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
        waitSeconds={rateLimitWaitSeconds}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 lg:pl-64 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                summary={summary}
                transactions={transactions}
                accounts={accounts}
                cards={cards}
                isPrivacyMode={isPrivacyMode}
                onTogglePrivacy={handleTogglePrivacy}
                onOpenScan={() => setIsScanModalOpen(true)}
                onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
                onOpenEditAccount={() => setIsEditAccountModalOpen(true)}
                onSelectTab={setCurrentTab}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                isPrivacyMode={isPrivacyMode}
                onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
              />
            )}

            {currentTab === 'cards' && (
              <CardsView
                cards={cards}
                transactions={transactions}
                accounts={accounts}
                isPrivacyMode={isPrivacyMode}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
                onPayInvoice={handlePayInvoice}
              />
            )}
          </>
        )}
      </main>

      {/* Barra de Navegação Inferior no Mobile */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenScan={() => setIsScanModalOpen(true)}
      />

      {/* Modal de Leitura com IA */}
      <ReceiptScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={loadAllData}
        accounts={accounts}
        cards={cards}
        categories={categories}
        onRateLimited={seconds => setRateLimitWaitSeconds(seconds)}
      />

      {/* Modal de Lançamento Manual */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        onSuccess={loadAllData}
        accounts={accounts}
        cards={cards}
        categories={categories}
        onOpenAddCard={() => {
          setIsNewTxModalOpen(false);
          setCurrentTab('cards');
        }}
      />

      {/* Modal de Edição de Saldo e Salário */}
      <EditAccountModal
        isOpen={isEditAccountModalOpen}
        onClose={() => setIsEditAccountModalOpen(false)}
        onSaveBalance={handleSaveAccountBalance}
        onAddIncome={handleAddSalaryOrIncome}
        accounts={accounts}
      />

    </div>
  );
};
export default App;
