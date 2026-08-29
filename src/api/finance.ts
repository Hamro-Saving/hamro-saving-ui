import { apiClient } from "./client";
import type {
  Deposit,
  Loan,
  LoanPayment,
  LoanPaymentListItem,
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
  update: (id: string, body: { amount: number; interestRate: number | null; startDate: string; dueDate: string | null; notes?: string }) =>
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
  // Payments across every loan in the group, unlike getPayments which is scoped to one.
  listPayments: (params?: { groupId?: string; borrowerId?: string; isVerified?: boolean }) =>
    apiClient.get<LoanPaymentListItem[]>("/loan-payments", { params }).then((r) => r.data),
  verifyPayment: (paymentId: string) =>
    apiClient.put(`/loan-payments/${paymentId}/verify`),
  // Only while unverified. The API replays the loan's remaining payments over the correction,
  // so the interest that ran after it is settled again from the new position.
  updatePayment: (
    paymentId: string,
    body: { principalAmount: number; interestAmount: number; paidDate: string; notes?: string },
  ) => apiClient.put(`/loan-payments/${paymentId}`, body).then((r) => r.data),
  deletePayment: (paymentId: string) => apiClient.delete(`/loan-payments/${paymentId}`),
  approveLoan: (id: string) =>
    apiClient.post(`/loans/${id}/approve`).then((r) => r.data),
  declineLoan: (id: string) =>
    apiClient.post(`/loans/${id}/decline`).then((r) => r.data),
  // Omit disbursedAmount to pay out the full amount the loan was approved for.
  completeDisbursement: (id: string, body?: { disbursedOn?: string; disbursedAmount?: number }) =>
    apiClient.put(`/loans/${id}/complete-disbursement`, body ?? {}).then((r) => r.data),
  forceDisburse: (id: string, body?: { disbursedOn?: string; disbursedAmount?: number }) =>
    apiClient.put(`/loans/${id}/force-disburse`, body ?? {}).then((r) => r.data),
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
  // Both only while unverified: after that the spend is in the books and is corrected by an
  // opposite entry instead.
  updateExpense: (id: string, body: { amount: number; category: string; description: string; expenseDate: string }) =>
    apiClient.put(`/expenses/${id}`, body).then((r) => r.data),
  deleteExpense: (id: string) => apiClient.delete(`/expenses/${id}`),
  verifyExpense: (id: string) => apiClient.put(`/expenses/${id}/verify`),
  getFixedDeposits: (params?: { groupId?: string }) =>
    apiClient
      .get<FixedDeposit[]>("/fixed-deposits", { params })
      .then((r) => r.data),
  createFixedDeposit: (body: Partial<FixedDeposit>) =>
    apiClient
      .post<{ id: string }>("/fixed-deposits", body)
      .then((r) => r.data),
  updateFixedDeposit: (
    id: string,
    body: { institutionName: string; amount: number; interestRate: number; startDate: string; maturityDate: string; notes?: string },
  ) => apiClient.put(`/fixed-deposits/${id}`, body).then((r) => r.data),
  deleteFixedDeposit: (id: string) => apiClient.delete(`/fixed-deposits/${id}`),
  // A deposit cannot be withdrawn until this has happened.
  verifyFixedDeposit: (id: string) => apiClient.put(`/fixed-deposits/${id}/verify`),
  // Closes the deposit and records the interest the institution actually returned
  withdrawFixedDeposit: (id: string, body: { interestEarned: number; withdrawnAt: string }) =>
    apiClient.put(`/fixed-deposits/${id}/withdraw`, body).then((r) => r.data),
  // Restating a withdrawal already recorded. Kept apart from withdrawFixedDeposit so that
  // withdrawing stays a once-only act and a second attempt at it is still refused.
  reviseWithdrawal: (id: string, body: { interestEarned: number; withdrawnAt: string }) =>
    apiClient.put(`/fixed-deposits/${id}/revise-withdrawal`, body).then((r) => r.data),
  // Takes back an unverified withdrawal, leaving the deposit placed as it was.
  cancelWithdrawal: (id: string) => apiClient.delete(`/fixed-deposits/${id}/withdraw`),
  // A second movement, verified on its own.
  verifyFixedDepositWithdrawal: (id: string) =>
    apiClient.put(`/fixed-deposits/${id}/verify-withdrawal`),
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
  update: (id: string, body: { amount: number; paidDate: string; remarks: string }) =>
    apiClient.put(`/other-incoming-funds/${id}`, body).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/other-incoming-funds/${id}`),
  verify: (id: string) => apiClient.put(`/other-incoming-funds/${id}/verify`),
};
