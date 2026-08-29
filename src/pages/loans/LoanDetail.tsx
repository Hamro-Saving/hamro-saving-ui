import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import { useAuth } from '../../context/AuthContext';
import type { LoanPayment } from '../../api/types';
import ConfirmDialog from '../../components/ConfirmDialog';
import Button from '../../components/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import { STATUS_COLORS, isLive, wasReducedAtDisbursement } from './loanMath';
import { useLoanActions } from './useLoanActions';
import LoanWorkflowPanel from './LoanWorkflowPanel';
import RecordPaymentModal from './RecordPaymentModal';
import EditPaymentModal from './EditPaymentModal';
import Amount from '../../components/Amount';
import IconButton from '../../components/IconButton';

function Stat({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'amber' | 'emerald' }) {
  const valueTone = tone === 'amber' ? 'text-amber-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueTone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function LoanDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isGroupAdmin } = useAuth();
  const isAdmin = isGroupAdmin;
  const [showPayment, setShowPayment] = useState(false);
  // Verifying posts the payment to the books and cannot be undone.
  const [verifyingPayment, setVerifyingPayment] = useState<LoanPayment | null>(null);
  // Only while unverified: once in the books a payment is corrected by an opposite entry.
  const [editingPayment, setEditingPayment] = useState<LoanPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<LoanPayment | null>(null);

  const { data: loan, isLoading, isError } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loansApi.getById(id),
    enabled: !!id,
  });

  const { data: payments } = useQuery({
    queryKey: ['loan-payments', id],
    queryFn: () => loansApi.getPayments(id),
    enabled: !!id,
  });

  const { verifyPayment, deletePayment } = useLoanActions(id);

  // The API refuses a delete that would disturb something already posted — say a later
  // payment on the loan that has since been verified — so the reason belongs in the dialog.
  const deleteError = (deletePayment.error as { response?: { data?: { detail?: string } } } | null)
    ?.response?.data?.detail;

  const closeDelete = () => { deletePayment.reset(); setDeletingPayment(null); };

  if (isLoading) {
    return <div className="p-6"><div className="bg-white rounded-xl p-10 text-center text-gray-400 border border-gray-100">Loading loan...</div></div>;
  }

  if (isError || !loan) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
          <p className="text-gray-500">This loan could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/loans')}>Back to loans</Button>
        </div>
      </div>
    );
  }

  const live = isLive(loan);

  return (
    <div className="p-6 space-y-6">
      <Button size="sm" onClick={() => navigate('/loans')} className="!px-2.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to loans
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{loan.borrowerName}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status]}`}>{loan.status}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{loan.borrowerType}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {formatCurrency(loan.amount)} at {loan.interestRate}% per year
            {wasReducedAtDisbursement(loan) && ` · reduced from ${formatCurrency(loan.requestedAmount)} approved`}
            {loan.disbursedAt ? ` · disbursed ${formatDate(loan.disbursedAt)}` : ` · starts ${formatDate(loan.startDate)}`}
            {loan.dueDate && ` · due ${formatDate(loan.dueDate)}`}
          </p>
        </div>
        {live && isAdmin && (
          <Button variant="primary" onClick={() => setShowPayment(true)}>Record Payment</Button>
        )}
      </div>

      <LoanWorkflowPanel loan={loan} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Principal Outstanding" value={formatCurrency(loan.outstandingPrincipal)} sub={`${formatCurrency(loan.totalPrincipalPaid)} repaid`} />
        <Stat label="Interest Accrued" value={formatCurrency(loan.accruedInterest)} tone="amber"
          sub={live ? `${formatCurrency(loan.dailyInterest)} per day` : 'Not accruing'} />
        <Stat label="Payoff Today" value={formatCurrency(loan.payoffAmount)} sub="Principal + interest" />
        <Stat label="Interest Paid" value={formatCurrency(loan.totalInterestPaid)} tone="emerald"
          sub={loan.lastAccrualDate ? `Settled to ${formatDate(loan.lastAccrualDate)}` : undefined} />
      </div>

      {(loan.approvers.length > 0 || loan.decliners.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap gap-x-8 gap-y-3">
          {loan.approvers.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Approved by</p>
              <div className="flex flex-wrap gap-1">
                {loan.approvers.map(a => (
                  <span key={a.approverId} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{a.approverName}</span>
                ))}
              </div>
            </div>
          )}
          {loan.decliners.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Declined by</p>
              <div className="flex flex-wrap gap-1">
                {loan.decliners.map(a => (
                  <span key={a.approverId} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-xs">{a.approverName}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Payment History</h2>
            <p className="text-xs text-gray-400 mt-0.5">Each row shows the interest it settled and the balance it left</p>
          </div>
          <span className="text-xs text-gray-400">{payments?.length ?? 0} payments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                {['Date', 'Days', 'Interest', 'Principal', 'Total', 'Principal After', 'Status', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} className={`px-5 py-3 font-medium ${h === 'Date' || h === 'Status' || h === 'Actions' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(payments ?? []).map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-700">{formatDate(p.paidDate)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{p.daysAccrued}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-gray-800">{formatCurrency(p.interestAmount)}</span>
                    <span className="block text-[11px] text-gray-400">of {formatCurrency(p.interestOwedBefore)} owed</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-800">{formatCurrency(p.principalAmount)}</td>
                  <td className="px-5 py-3 text-right"><Amount value={p.amount} side="credit" /></td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-gray-800">{formatCurrency(p.outstandingPrincipalAfter)}</span>
                    {/* Under a rupee is not a debt the group will chase — and it renders as
                        "NPR 0" anyway, since amounts are shown in whole rupees. */}
                    {p.unpaidInterestAfter >= 1 && (
                      <span className="block text-[11px] text-amber-600">+ {formatCurrency(p.unpaidInterestAfter)} interest left</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {p.isVerified
                      ? <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Verified</span>
                      : <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>}
                  </td>
                  {/* A payment can be corrected or removed right up until it is verified;
                      after that it is in the books and only an opposite entry changes it. */}
                  {isAdmin && (
                    <td className="px-5 py-3">
                      {!p.isVerified && (
                        <div className="flex items-center gap-2">
                          <IconButton icon="verify" label="Verify payment" disabled={verifyPayment.isPending} onClick={() => setVerifyingPayment(p)} />
                          <IconButton icon="edit" label="Edit payment" onClick={() => setEditingPayment(p)} />
                          <IconButton icon="delete" label="Delete payment" disabled={deletePayment.isPending} onClick={() => setDeletingPayment(p)} />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!payments?.length && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-400">No payments recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loan.notes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{loan.notes}</p>
        </div>
      )}

      {showPayment && <RecordPaymentModal loan={loan} onClose={() => setShowPayment(false)} />}

      {editingPayment && (
        <EditPaymentModal loan={loan} payment={editingPayment} onClose={() => setEditingPayment(null)} />
      )}

      {deletingPayment && (
        <ConfirmDialog
          title="Delete this payment?"
          body={`This removes the unverified ${formatCurrency(deletingPayment.amount)} recorded on ${formatDate(deletingPayment.paidDate)}. The interest it settled will start running again.`}
          confirmLabel="Delete payment"
          busyLabel="Deleting..."
          busy={deletePayment.isPending}
          error={deleteError}
          onConfirm={() => deletePayment.mutate(deletingPayment.id, { onSuccess: closeDelete })}
          onCancel={closeDelete}
        />
      )}

      {verifyingPayment && (
        <ConfirmDialog
          title="Verify this payment?"
          body={`This records ${formatCurrency(verifyingPayment.amount)} against the loan and cannot be undone.`}
          confirmLabel="Verify payment"
          busyLabel="Verifying..."
          variant="success"
          busy={verifyPayment.isPending}
          onConfirm={() => { verifyPayment.mutate(verifyingPayment.id); setVerifyingPayment(null); }}
          onCancel={() => setVerifyingPayment(null)}
        />
      )}
    </div>
  );
}
