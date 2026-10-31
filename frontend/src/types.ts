export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  color: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank?: string;
  limitTotal: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

export interface Invoice {
  id: string;
  creditCardId: string;
  referenceMonth: number;
  referenceYear: number;
  closingDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  category?: Category;
  account?: Account;
  accountId?: string;
  creditCard?: CreditCard;
  creditCardId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: string;
  isPaid: boolean;
  isRecurring?: boolean;
}

export interface QuotaStatus {
  isAllowed: boolean;
  availableTokens: number;
  maxTokens: number;
  waitSecondsToReset: number;
  message: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptAnalysis {
  establishment: string;
  amount: number;
  date: string;
  category: string;
  suggestedPaymentMethod: PaymentMethod;
  suggestedInstallments: number;
  items: ReceiptItem[];
  rawJson: string;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlySalary: number;
  salaryRemaining?: number;
  salaryExpenses?: number;
  monthIncome: number;
  monthExpense: number;
  openInvoicesTotal: number;
  categoryExpenses: {
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
}

