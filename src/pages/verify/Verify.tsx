import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositsApi, loansApi } from "../../api/finance";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDate } from "../../utils/format";
import Amount from '../../components/Amount';
import { depositLabel } from '../../utils/format';
import type { Deposit, LoanPaymentListItem } from '../../api/types';
import IconButton from '../../components/IconButton';
import ConfirmDialog from '../../components/ConfirmDialog';

/** What a payment settled, spelled out — the split is the useful part when verifying. */
function paymentLabel(p: LoanPaymentListItem) {
  const parts: string[] = [];
  if (p.principalAmount > 0) parts.push(`${formatCurrency(p.principalAmount)} principal`);
  if (p.interestAmount > 0) parts.push(`${formatCurrency(p.interestAmount)} interest`);
  return parts.length ? parts.join(' + ') : 'Loan repayment';
}

/** Shared chrome so both queues read as one page rather than two transplanted ones. */
function QueueSection({
  title,
  count,
  emptyLabel,
  children,
}: {
  title: string;
  count: number;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {count} pending
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {count > 0 ? children : (
          <div className="px-5 py-10 text-center">
            <svg
              className="w-10 h-10 text-emerald-200 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-gray-400">{emptyLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Verify() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Verifying posts the record to the books and cannot be undone, so both queues confirm first.
  const [verifyingDeposit, setVerifyingDeposit] = useState<Deposit | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<LoanPaymentListItem | null>(null);

  const { data: pendingDeposits } = useQuery({
    queryKey: ["deposits", user?.activeGroupId, "pending"],
    queryFn: () =>
      depositsApi.getDeposits({ isVerified: false }),
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ["loan-payments", user?.activeGroupId, "pending"],
    queryFn: () => loansApi.listPayments({ isVerified: false }),
  });

  const verifyDepositMutation = useMutation({
    mutationFn: (id: string) => depositsApi.verifyDeposit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposits"] });
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (id: string) => loansApi.verifyPayment(id),
    onSuccess: () => {
      // A verified payment moves the loan's balances as well as the group's cash.
      qc.invalidateQueries({ queryKey: ["loan-payments"] });
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
    },
  });

  const depositCount = pendingDeposits?.length ?? 0;
  const paymentCount = pendingPayments?.length ?? 0;
  const total = depositCount + paymentCount;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {total > 0
            ? `${total} ${total === 1 ? 'record' : 'records'} waiting to be posted to the books`
            : 'Review and verify pending deposits and loan payments'}
        </p>
      </div>

      <QueueSection
        title="Pending Deposits"
        count={depositCount}
        emptyLabel="All caught up! No pending deposits."
      >
        {(pendingDeposits ?? []).map((d) => (
          <div
            key={d.id}
            className="px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-800">{d.memberName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {depositLabel(d.type, d.depositMonth, d.depositYear)} · Submitted {formatDate(d.createdAt)}
              </p>
              {d.notes && (
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  "{d.notes}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  <Amount value={d.amount} side="credit" />
                </p>
              </div>
              <IconButton
                icon="verify"
                label={verifyDepositMutation.variables === d.id && verifyDepositMutation.isPending ? "Verifying..." : "Verify deposit"}
                variant="success"
                onClick={() => setVerifyingDeposit(d)}
                disabled={verifyDepositMutation.isPending}
              />
            </div>
          </div>
        ))}
      </QueueSection>

      <QueueSection
        title="Pending Loan Payments"
        count={paymentCount}
        emptyLabel="All caught up! No pending loan payments."
      >
        {(pendingPayments ?? []).map((p) => (
          <div
            key={p.id}
            className="px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-gray-800">{p.borrowerName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {paymentLabel(p)} · Paid {formatDate(p.paidDate)} · Submitted {formatDate(p.createdAt)}
              </p>
              {p.notes && (
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  "{p.notes}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  <Amount value={p.amount} side="credit" />
                </p>
              </div>
              <IconButton
                icon="verify"
                label={verifyPaymentMutation.variables === p.id && verifyPaymentMutation.isPending ? "Verifying..." : "Verify payment"}
                variant="success"
                onClick={() => setVerifyingPayment(p)}
                disabled={verifyPaymentMutation.isPending}
              />
            </div>
          </div>
        ))}
      </QueueSection>

      {verifyingDeposit && (
        <ConfirmDialog
          title="Verify this deposit?"
          body={`This records ${formatCurrency(verifyingDeposit.amount)} from ${verifyingDeposit.memberName} in the group's books. It cannot be undone.`}
          confirmLabel="Verify deposit"
          busyLabel="Verifying..."
          variant="success"
          busy={verifyDepositMutation.isPending}
          onConfirm={() => { verifyDepositMutation.mutate(verifyingDeposit.id); setVerifyingDeposit(null); }}
          onCancel={() => setVerifyingDeposit(null)}
        />
      )}

      {verifyingPayment && (
        <ConfirmDialog
          title="Verify this loan payment?"
          body={`This records ${formatCurrency(verifyingPayment.amount)} from ${verifyingPayment.borrowerName} against their loan and in the group's books. It cannot be undone.`}
          confirmLabel="Verify payment"
          busyLabel="Verifying..."
          variant="success"
          busy={verifyPaymentMutation.isPending}
          onConfirm={() => { verifyPaymentMutation.mutate(verifyingPayment.id); setVerifyingPayment(null); }}
          onCancel={() => setVerifyingPayment(null)}
        />
      )}
    </div>
  );
}
