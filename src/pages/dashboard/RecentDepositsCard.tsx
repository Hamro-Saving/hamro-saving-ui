import { formatCurrency, formatDate } from "../../utils/format";
import type { Deposit } from "../../api/types";

interface RecentDepositsCardProps {
  deposits?: Deposit[];
}

export default function RecentDepositsCard({
  deposits,
}: RecentDepositsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Recent Deposits</h2>
        <span className="text-xs text-gray-400">
          {deposits?.length ?? 0} total
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {(deposits ?? []).slice(0, 6).map((dep) => (
          <div
            key={dep.id}
            className="px-5 py-3 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {dep.memberName}
              </p>
              <p className="text-xs text-gray-400">
                {dep.type} · {formatDate(dep.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(dep.amount)}
              </p>
              {dep.isVerified ? (
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                  Verified
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
        {!deposits?.length && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            No deposits yet
          </p>
        )}
      </div>
    </div>
  );
}
