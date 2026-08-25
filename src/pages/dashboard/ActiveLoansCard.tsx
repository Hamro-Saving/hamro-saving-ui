import type { Loan } from "../../api/types";
import Amount from '../../components/Amount';
import { loanAmountSide } from '../loans/loanMath';

interface ActiveLoansCardProps {
  loans?: Loan[];
}

export default function ActiveLoansCard({ loans }: ActiveLoansCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Active Loans</h2>
        <span className="text-xs text-gray-400">{loans?.length ?? 0} loans</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(loans ?? []).slice(0, 6).map((loan) => (
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
            <Amount value={loan.amount} side={loanAmountSide(loan)} className="text-sm" />
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
