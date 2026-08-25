import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format';
import type { Transaction } from '../../api/types';
import Amount from '../../components/Amount';
import { TYPE_LABELS } from '../transactions/transactionLabels';

interface RecentTransactionsCardProps {
  transactions?: Transaction[];
}

/** The last handful of money movements, newest first. */
export default function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  const recent = transactions ?? [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
        <Link to="/transactions" className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
          View all
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {recent.map(t => (
          <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {t.description}
                {t.memberName && <span className="text-gray-500"> · {t.memberName}</span>}
              </p>
              <p className="text-xs text-gray-400">
                {TYPE_LABELS[t.type]} · {formatDate(t.occurredAt)}
              </p>
            </div>
            <Amount value={t.amount} side={t.side === 'Credit' ? 'credit' : 'debit'} className="text-sm" />
          </div>
        ))}

        {!recent.length && (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
