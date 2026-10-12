import { Link } from 'react-router-dom';
import type { Loan } from "../../api/types";
import Amount from '../../components/Amount';
import { loanAmountSide } from '../loans/loanMath';
import { formatCurrency } from '../../utils/format';

interface ActiveLoansCardProps {
  loans?: Loan[];
}

/** How many loans the card lists; the rest are a click away on the loans page. */
const SHOWN = 5;

export default function ActiveLoansCard({ loans }: ActiveLoansCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Active Loans</h2>
        <Link
          to="/loans?status=Active"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
        >
          {loans?.length ?? 0} {loans?.length === 1 ? 'loan' : 'loans'}
        </Link>
      </div>
      <div className="divide-y divide-gray-50">
        {(loans ?? []).slice(0, SHOWN).map((loan) => (
          <div
            key={loan.id}
            className="px-5 py-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {loan.borrowerName}
              </p>
              <p className="text-xs text-gray-400">
                {loan.borrowerType} · {loan.interestRate}% interest
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <Amount value={loan.outstandingPrincipal} side={loanAmountSide(loan)} className="text-sm" />
              {loan.accruedInterest > 0 && (
                <p className="text-[11px] leading-none text-gray-400 mt-1">
                  + {formatCurrency(loan.accruedInterest)} interest
                </p>
              )}
            </div>
          </div>
        ))}
        {!loans?.length && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            No active loans
          </p>
        )}
      </div>
    </div>
  );
}
