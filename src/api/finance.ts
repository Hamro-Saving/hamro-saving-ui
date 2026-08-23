import { apiClient } from "./client";
import type {
  Deposit,
  Loan,
  LoanPayment,
  Expense,
  FixedDeposit,
  FinancialSummary,
  SavingsSummary,
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

  updateDeposit: (id: string, body: { amount: number; notes?: string }) =>
    apiClient.put(`/deposits/${id}`, body).then((r) => r.data),

  verifyDeposit: (id: string) => apiClient.put(`/deposits/${id}/verify`),

  getSummary: (params?: { groupId?: string }) =>
    apiClient
      .get<SavingsSummary>("/deposits/summary", { params })
      .then((r) => r.data),
};

export const loansApi = {
  update: (id: string, body: { amount: number; interestRate: number | null; dueDate: string | null; notes?: string }) =>
    apiClient.put(`/loans/${id}`, body).then((r) => r.data),
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
  completeDisbursement: (id: string) =>
    apiClient.put(`/loans/${id}/complete-disbursement`).then((r) => r.data),
  cancelLoan: (id: string) =>
    apiClient.post(`/loans/${id}/cancel`).then((r) => r.data),
  getSummary: (params?: { groupId?: string }) =>
    apiClient.get("/loans/summary", { params }).then((r) => r.data),
};

export const financeApi = {
  getExpenses: (params?: { groupId?: string }) =>
    apiClient
      .get<Expense[]>("/finance/expenses", { params })
      .then((r) => r.data),
  createExpense: (body: Partial<Expense>) =>
    apiClient.post<Expense>("/finance/expenses", body).then((r) => r.data),
  getFixedDeposits: (params?: { groupId?: string }) =>
    apiClient
      .get<FixedDeposit[]>("/finance/fixed-deposits", { params })
      .then((r) => r.data),
  createFixedDeposit: (body: Partial<FixedDeposit>) =>
    apiClient
      .post<FixedDeposit>("/finance/fixed-deposits", body)
      .then((r) => r.data),
  getSummary: (params?: { groupId?: string }) =>
    apiClient
      .get<FinancialSummary>("/finance/summary", { params })
      .then((r) => r.data),
};
