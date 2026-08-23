import { formatCurrency } from "../../utils/format";
import type { Loan } from "../../api/types";

const loanStatusColor: Record<string, string> = {
  Active: "bg-blue-100 text-blue-700",
  PaidOff: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

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
            className="px-5 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {loan.borrowerName}
              </p>
              <p className="text-xs text-gray-400">
                {loan.borrowerType} · {loan.interestRate}% interest
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(loan.amount)}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${loanStatusColor[loan.status]}`}
              >
                {loan.status}
              </span>
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
