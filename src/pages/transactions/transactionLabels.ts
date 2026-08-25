import type { TransactionType } from '../../api/types';

/** How each kind of transaction is named in the interface. */
export const TYPE_LABELS: Record<TransactionType, string> = {
  Deposit: 'Deposit',
  LoanDisbursement: 'Loan disbursed',
  LoanPrincipalPayment: 'Principal repaid',
  LoanInterestPayment: 'Loan interest',
  FixedDepositPlaced: 'Fixed deposit placed',
  FixedDepositWithdrawal: 'Fixed deposit withdrawn',
  FixedDepositInterest: 'Fixed deposit interest',
  Expense: 'Expense',
};

export const TRANSACTION_TYPES = Object.keys(TYPE_LABELS) as TransactionType[];
