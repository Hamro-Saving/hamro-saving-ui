import { apiClient } from './client';
import type { Deposit, Loan, LoanPayment, Expense, FixedDeposit, FinancialSummary, SavingsSummary } from './types';

export const savingsApi = {
  getDeposits: (params?: { groupId?: string; memberId?: string; month?: number; year?: number; isVerified?: boolean }) =>
    apiClient.get<Deposit[]>('/savings/deposits', { params }).then(r => r.data),
  createDeposit: (body: Partial<Deposit>) => apiClient.post<Deposit>('/savings/deposits', body).then(r => r.data),
  verifyDeposit: (id: string) => apiClient.put(`/savings/deposits/${id}/verify`),
  getSummary: (params?: { groupId?: string }) =>
    apiClient.get<SavingsSummary>('/savings/summary', { params }).then(r => r.data),
};

export const loansApi = {
  getAll: (params?: { groupId?: string; borrowerId?: string; status?: string }) =>
    apiClient.get<Loan[]>('/loans', { params }).then(r => r.data),
  getById: (id: string) => apiClient.get<Loan>(`/loans/${id}`).then(r => r.data),
  create: (body: Partial<Loan> & { borrowerId: string; borrowerType: string }) =>
    apiClient.post<Loan>('/loans', body).then(r => r.data),
  getPayments: (loanId: string) => apiClient.get<LoanPayment[]>(`/loans/${loanId}/payments`).then(r => r.data),
  recordPayment: (loanId: string, body: Partial<LoanPayment>) =>
    apiClient.post<LoanPayment>(`/loans/${loanId}/payments`, body).then(r => r.data),
  verifyPayment: (loanId: string, paymentId: string) =>
    apiClient.put(`/loans/${loanId}/payments/${paymentId}/verify`),
  getSummary: (params?: { groupId?: string }) =>
    apiClient.get('/loans/summary', { params }).then(r => r.data),
};

export const financeApi = {
  getExpenses: (params?: { groupId?: string }) => apiClient.get<Expense[]>('/finance/expenses', { params }).then(r => r.data),
  createExpense: (body: Partial<Expense>) => apiClient.post<Expense>('/finance/expenses', body).then(r => r.data),
  getFixedDeposits: (params?: { groupId?: string }) => apiClient.get<FixedDeposit[]>('/finance/fixed-deposits', { params }).then(r => r.data),
  createFixedDeposit: (body: Partial<FixedDeposit>) => apiClient.post<FixedDeposit>('/finance/fixed-deposits', body).then(r => r.data),
  getSummary: (params?: { groupId?: string }) => apiClient.get<FinancialSummary>('/finance/summary', { params }).then(r => r.data),
};
