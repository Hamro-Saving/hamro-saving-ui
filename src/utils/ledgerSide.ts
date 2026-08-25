/**
 * Which side of the books a figure sits on. Deliberately not "in" and "out": a debit to
 * Cash is money arriving, a debit to Expenses is money leaving, so colouring by direction
 * would contradict itself. The colour names the side, and stays true everywhere.
 */
export type LedgerSide = 'debit' | 'credit' | 'cash' | 'inactive' | 'neutral';

/**
 * One convention for the whole app: red for money going out, teal for money coming in,
 * indigo for the cash the group is holding. "cash" is its own treatment rather than a
 * debit so a running balance never reads as a movement, even though Cash is a
 * debit-balance account.
 */
export const SIDE_TEXT: Record<LedgerSide, string> = {
  debit: 'text-red-600',
  credit: 'text-teal-700',
  cash: 'text-indigo-700',
  // No money currently out: not yet disbursed, or already repaid. Showing either as a
  // debit would claim an outflow the group is not actually carrying.
  inactive: 'text-indigo-700',
  neutral: 'text-gray-900',
};

export const SIDE_CHIP: Record<LedgerSide, string> = {
  debit: 'bg-red-50 text-red-700',
  credit: 'bg-teal-50 text-teal-700',
  cash: 'bg-indigo-50 text-indigo-700',
  inactive: 'bg-indigo-50 text-indigo-700',
  neutral: 'bg-gray-100 text-gray-600',
};
