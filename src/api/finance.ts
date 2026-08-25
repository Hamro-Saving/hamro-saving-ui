import { apiClient } from "./client";
import type {
  Deposit,
  Loan,
  LoanPayment,
  Expense,
  FixedDeposit,
  FinancialSummary,
  SavingsSummary,
  Transaction,
  TrialBalance,
  OtherIncomingFund,
  PagedResult,
  TransactionType,
  LedgerAccount,
} from "./types";

export const depositsApi = {
  getDeposits: (params?: {
    groupId?: string;
    memberId?: string;
    month?: number;
    year?: number;
    isVerified?: boolean;
  }) => apiClient.get<Deposit[]>("/deposits", { params }).then((r) => r.data),

  createDeposit: (body: Partial<Deposit>) =>
    apiClient.post<Deposit>("/deposits", body).then((r) => r.data),

  updateDeposit: (id: string, body: { amount: number; notes?: string; depositDate: string }) =>
    apiClient.put(`/deposits/${id}`, body).then((r) => r.data),

  verifyDeposit: (id: string) => apiClient.put(`/deposits/${id}/verify`),
  deleteDeposit: (id: string) => apiClient.delete(`/deposits/${id}`),

  getSummary: (params?: { groupId?: string }) =>
    apiClient
      .get<SavingsSummary>("/deposits/summary", { params })
      .then((r) => r.data),
};

export const loansApi = {
  update: (id: string, body: { amount: number; interestRate: number | null; dueDate: string | null; notes?: string }) =>
    apiClient.put(`/loans/${id}`, body).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/loans/${id}`),
  getAll: (params?: {
    groupId?: string;
    borrowerId?: string;
    status?: string;
  }) => apiClient.get<Loan[]>("/loans", { params }).then((r) => r.data),
  getById: (id: string) =>
    apiClient.get<Loan>(`/loans/${id}`).then((r) => r.data),
  create: (
    body: Omit<Partial<Loan>, 'interestRate' | 'dueDate'> & { borrowerId: string; borrowerType: string; interestRate: number | null; dueDate: string | null },
  ) => apiClient.post<Loan>("/loans", body).then((r) => r.data),
  getPayments: (loanId: string) =>
    apiClient
      .get<LoanPayment[]>(`/loans/${loanId}/payments`)
      .then((r) => r.data),
  // The API settles interest up to paidDate and derives the payment type from the split
  recordPayment: (
    loanId: string,
    body: { groupId?: string; principalAmount: number; interestAmount: number; paidDate: string; notes?: string },
  ) => apiClient.post<{ id: string }>(`/loans/${loanId}/payments`, body).then((r) => r.data),
  verifyPayment: (paymentId: string) =>
    apiClient.put(`/loan-payments/${paymentId}/verify`),
  approveLoan: (id: string) =>
    apiClient.post(`/loans/${id}/approve`).then((r) => r.data),
  declineLoan: (id: string) =>
    apiClient.post(`/loans/${id}/decline`).then((r) => r.data),
  completeDisbursement: (id: string, disbursedOn?: string) =>
    apiClient.put(`/loans/${id}/complete-disbursement`, { disbursedOn }).then((r) => r.data),
  forceDisburse: (id: string, disbursedOn?: string) =>
    apiClient.put(`/loans/${id}/force-disburse`, { disbursedOn }).then((r) => r.data),
  cancelLoan: (id: string) =>
    apiClient.post(`/loans/${id}/cancel`).then((r) => r.data),
  getSummary: (params?: { groupId?: string }) =>
    apiClient.get("/loans/summary", { params }).then((r) => r.data),
};

export const financeApi = {
  getExpenses: (params?: { groupId?: string }) =>
    apiClient
      .get<Expense[]>("/expenses", { params })
      .then((r) => r.data),
  createExpense: (body: Partial<Expense>) =>
    apiClient.post<{ id: string }>("/expenses", body).then((r) => r.data),
  getFixedDeposits: (params?: { groupId?: string }) =>
    apiClient
      .get<FixedDeposit[]>("/fixed-deposits", { params })
      .then((r) => r.data),
  createFixedDeposit: (body: Partial<FixedDeposit>) =>
    apiClient
      .post<{ id: string }>("/fixed-deposits", body)
      .then((r) => r.data),
  // Closes the deposit and records the interest the institution actually returned
  withdrawFixedDeposit: (id: string, body: { interestEarned: number; withdrawnAt: string }) =>
    apiClient.put(`/fixed-deposits/${id}/withdraw`, body).then((r) => r.data),
  getSummary: (params?: { groupId?: string }) =>
    apiClient
      .get<FinancialSummary>("/finance/summary", { params })
      .then((r) => r.data),
};

export const transactionsApi = {
  getAll: (params?: {
    groupId?: string; type?: TransactionType; account?: LedgerAccount;
    memberId?: string; from?: string; to?: string;
    side?: 'Debit' | 'Credit'; page?: number; pageSize?: number;
  }) => apiClient.get<PagedResult<Transaction>>('/transactions', { params }).then(r => r.data),
  getTrialBalance: (params?: { groupId?: string }) =>
    apiClient.get<TrialBalance>('/transactions/trial-balance', { params }).then(r => r.data),
};

export const otherIncomingFundsApi = {
  getAll: (params?: { groupId?: string }) =>
    apiClient.get<OtherIncomingFund[]>('/other-incoming-funds', { params }).then(r => r.data),
  record: (body: { memberId: string; amount: number; paidDate: string; remarks: string }) =>
    apiClient.post<{ id: string }>('/other-incoming-funds', body).then(r => r.data),
};
