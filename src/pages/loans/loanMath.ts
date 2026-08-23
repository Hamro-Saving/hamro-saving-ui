import type { Loan, LoanStatus } from '../../api/types';

export const STATUS_COLORS: Record<LoanStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-indigo-100 text-indigo-700',
  Active: 'bg-blue-100 text-blue-700',
  PaidOff: 'bg-emerald-100 text-emerald-700',
  Overdue: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-600',
  Declined: 'bg-rose-100 text-rose-700',
};

export const LOAN_STATUS_FILTERS = ['', 'Pending', 'Approved', 'Active', 'PaidOff', 'Overdue', 'Declined', 'Cancelled'] as const;

/** A loan that is out with the borrower and still accruing. */
export const isLive = (loan: Loan) => loan.status === 'Active' || loan.status === 'Overdue';

export const round2 = (v: number) => Math.round(v * 100) / 100;

/** Whole days between the loan's last settled date and a YYYY-MM-DD payment date, counted in UTC like the API. */
export function daysSinceLastAccrual(lastAccrualDate: string, dateOnly: string): number {
  const last = new Date(lastAccrualDate);
  const [y, m, d] = dateOnly.split('-').map(Number);
  const lastUtc = Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate());
  return Math.max(0, Math.round((Date.UTC(y, m - 1, d) - lastUtc) / 86_400_000));
}

/** Mirrors Loan.InterestAccruedAsOf on the API: interest carried forward plus what has run since. */
export function interestAccruedOn(loan: Loan, dateOnly: string): number {
  if (!loan.lastAccrualDate) return 0;
  return round2(loan.unpaidInterest + round2(loan.dailyInterest * daysSinceLastAccrual(loan.lastAccrualDate, dateOnly)));
}
