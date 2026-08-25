import { useQuery } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import Amount from '../../components/Amount';

export default function MyLoan() {
  const { user, logout } = useAuth();
  const { data: loans, isLoading } = useQuery({
    queryKey: ['my-loans', user?.memberId],
    queryFn: () => loansApi.getAll({ borrowerId: user?.memberId }),
    // The server scopes a non-member to their own loans regardless; this filter is
    // just to avoid a pointless round trip before the member id is known.
    enabled: !!user?.memberId,
  });

  const activeLoan = loans?.find(l => l.status === 'Active' || l.status === 'Overdue');
  const { data: payments } = useQuery({
    queryKey: ['loan-payments', activeLoan?.id],
    queryFn: () => loansApi.getPayments(activeLoan!.id),
    enabled: !!activeLoan,
  });

  const totalPaid = activeLoan ? activeLoan.totalPrincipalPaid + activeLoan.totalInterestPaid : 0;
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Loan</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your current loan details</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-sm font-medium text-gray-800 leading-tight truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Button size="sm" onClick={logout}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign out
            </Button>
          </div>
        </div>

        {isLoading && <div className="bg-white rounded-xl p-10 text-center text-gray-400">Loading...</div>}

        {!isLoading && !activeLoan && (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No active loan</p>
          </div>
        )}

        {activeLoan && (
          <>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-blue-200 text-sm mb-1">Loan Amount</p>
              <p className="text-4xl font-bold">{formatCurrency(activeLoan.amount)}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-blue-200">Interest Rate</p><p className="font-semibold">{activeLoan.interestRate}% per year</p></div>
                <div><p className="text-blue-200">Interest so far</p><p className="font-semibold">{formatCurrency(activeLoan.accruedInterest)}</p></div>
                <div><p className="text-blue-200">Payoff today</p><p className="font-semibold">{formatCurrency(activeLoan.payoffAmount)}</p></div>
                <div><p className="text-blue-200">Disbursed</p><p className="font-semibold">{activeLoan.disbursedAt ? formatDate(activeLoan.disbursedAt) : '—'}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                <p className="text-lg"><Amount value={totalPaid} side="credit" className="text-lg" /></p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Interest Paid</p>
                <p className="text-lg"><Amount value={activeLoan.totalInterestPaid} side="credit" className="text-lg" /></p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Principal Left</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(activeLoan.outstandingPrincipal)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Payment History</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(payments ?? []).map(p => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">{formatDate(p.paidDate)}</p>
                      <p className="text-xs text-gray-400">P: {formatCurrency(p.principalAmount)} + I: {formatCurrency(p.interestAmount)}</p>
                    </div>
                    <div className="text-right">
                      <Amount value={p.amount} side="credit" />
                      {p.isVerified
                        ? <span className="text-xs text-emerald-600">✓ Verified</span>
                        : <span className="text-xs text-amber-600">Pending</span>}
                    </div>
                  </div>
                ))}
                {!payments?.length && <p className="px-5 py-8 text-center text-sm text-gray-400">No payments recorded</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
