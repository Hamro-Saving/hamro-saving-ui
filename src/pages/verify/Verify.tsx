import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositsApi, loansApi, financeApi, otherIncomingFundsApi } from "../../api/finance";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDate, depositLabel } from "../../utils/format";
import Amount from '../../components/Amount';
import type { LoanPaymentListItem } from '../../api/types';
import IconButton from '../../components/IconButton';
import ConfirmDialog from '../../components/ConfirmDialog';

/** What a payment settled, spelled out — the split is the useful part when verifying. */
function paymentLabel(p: LoanPaymentListItem) {
  const parts: string[] = [];
  if (p.principalAmount > 0) parts.push(`${formatCurrency(p.principalAmount)} principal`);
  if (p.interestAmount > 0) parts.push(`${formatCurrency(p.interestAmount)} interest`);
  return parts.length ? parts.join(' + ') : 'Loan repayment';
}

function QueueSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
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
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

/** Every queue has the same shape, so they share one row rather than each growing its own. */
function QueueRow({
  title,
  detail,
  note,
  amount,
  side = 'credit',
  actionLabel,
  onVerify,
  busy,
}: {
  title: string;
  detail: string;
  note?: string;
  amount: number;
  side?: 'credit' | 'debit';
  actionLabel: string;
  onVerify: () => void;
  busy: boolean;
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{detail}</p>
        {note && <p className="text-xs text-gray-500 mt-0.5 italic">"{note}"</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            <Amount value={amount} side={side} />
          </p>
        </div>
        <IconButton icon="verify" label={actionLabel} onClick={onVerify} disabled={busy} />
      </div>
    </div>
  );
}

function AllClear() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-16 text-center">
      <svg className="w-12 h-12 text-emerald-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="font-medium text-gray-700">All caught up</p>
      <p className="text-sm text-gray-400 mt-1">Nothing is waiting to be posted to the books.</p>
    </div>
  );
}

type Confirmation = {
  title: string;
  body: string;
  confirmLabel: string;
  run: () => void;
};

export default function Verify() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Verifying posts the record to the books and cannot be undone, so every queue confirms first.
  const [confirming, setConfirming] = useState<Confirmation | null>(null);

  const { data: pendingDeposits } = useQuery({
    queryKey: ["deposits", user?.activeGroupId, "pending"],
    queryFn: () => depositsApi.getDeposits({ isVerified: false }),
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ["loan-payments", user?.activeGroupId, "pending"],
    queryFn: () => loansApi.listPayments({ isVerified: false }),
  });

  // No server-side pending filter for these three. Keys match the Finance page's so both
  // share one fetch.
  const { data: expenses } = useQuery({
    queryKey: ['expenses', user?.activeGroupId],
    queryFn: () => financeApi.getExpenses(),
  });

  const { data: fds } = useQuery({
    queryKey: ['fixed-deposits', user?.activeGroupId],
    queryFn: () => financeApi.getFixedDeposits(),
  });

  const { data: otherIncome } = useQuery({
    queryKey: ['other-incoming-funds', user?.activeGroupId],
    queryFn: () => otherIncomingFundsApi.getAll(),
  });

  const afterVerifying = (...keys: string[]) => () => {
    for (const key of keys) qc.invalidateQueries({ queryKey: [key] });
    // Everything here posts to the ledger, so the group's position has moved.
    qc.invalidateQueries({ queryKey: ["finance-summary"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const verifyDeposit = useMutation({
    mutationFn: (id: string) => depositsApi.verifyDeposit(id),
    onSuccess: afterVerifying("deposits"),
  });

  const verifyPayment = useMutation({
    mutationFn: (id: string) => loansApi.verifyPayment(id),
    // A verified payment moves the loan's balances as well as the group's cash.
    onSuccess: afterVerifying("loan-payments", "loans"),
  });

  const verifyExpense = useMutation({
    mutationFn: (id: string) => financeApi.verifyExpense(id),
    onSuccess: afterVerifying("expenses"),
  });

  const verifyFd = useMutation({
    mutationFn: (id: string) => financeApi.verifyFixedDeposit(id),
    onSuccess: afterVerifying("fixed-deposits"),
  });

  const verifyFdWithdrawal = useMutation({
    mutationFn: (id: string) => financeApi.verifyFixedDepositWithdrawal(id),
    onSuccess: afterVerifying("fixed-deposits"),
  });

  const verifyOtherIncome = useMutation({
    mutationFn: (id: string) => otherIncomingFundsApi.verify(id),
    onSuccess: afterVerifying("other-incoming-funds"),
  });

  const busy = [verifyDeposit, verifyPayment, verifyExpense, verifyFd, verifyFdWithdrawal, verifyOtherIncome]
    .some(m => m.isPending);

  const deposits = pendingDeposits ?? [];
  const payments = pendingPayments ?? [];
  const pendingExpenses = (expenses ?? []).filter(e => !e.isVerified);
  const pendingPlacements = (fds ?? []).filter(fd => !fd.isVerified);
  // A deposit cannot be withdrawn unverified, so these never overlap.
  const pendingWithdrawals = (fds ?? []).filter(fd => fd.status === 'Withdrawn' && !fd.isWithdrawalVerified);
  const pendingIncome = (otherIncome ?? []).filter(r => !r.isVerified);

  const total =
    deposits.length + payments.length + pendingExpenses.length +
    pendingPlacements.length + pendingWithdrawals.length + pendingIncome.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {total > 0
            ? `${total} ${total === 1 ? 'record' : 'records'} waiting to be posted to the books`
            : 'Nothing is waiting on you'}
        </p>
      </div>

      {/* Only queues with something in them are shown. With six of them, rendering an empty
          state for each would bury the one that actually needs attention. */}
      {total === 0 && <AllClear />}

      {deposits.length > 0 && (
        <QueueSection title="Pending Deposits" count={deposits.length}>
          {deposits.map(d => (
            <QueueRow
              key={d.id}
              title={d.memberName}
              detail={`${depositLabel(d.type, d.depositMonth, d.depositYear)} · Submitted ${formatDate(d.createdAt)}`}
              note={d.notes}
              amount={d.amount}
              actionLabel="Verify deposit"
              busy={busy}
              onVerify={() => setConfirming({
                title: 'Verify this deposit?',
                body: `This records ${formatCurrency(d.amount)} from ${d.memberName} in the group's books. It cannot be undone.`,
                confirmLabel: 'Verify deposit',
                run: () => verifyDeposit.mutate(d.id),
              })}
            />
          ))}
        </QueueSection>
      )}

      {payments.length > 0 && (
        <QueueSection title="Pending Loan Payments" count={payments.length}>
          {payments.map(p => (
            <QueueRow
              key={p.id}
              title={p.borrowerName}
              detail={`${paymentLabel(p)} · Paid ${formatDate(p.paidDate)} · Submitted ${formatDate(p.createdAt)}`}
              note={p.notes}
              amount={p.amount}
              actionLabel="Verify payment"
              busy={busy}
              onVerify={() => setConfirming({
                title: 'Verify this loan payment?',
                body: `This records ${formatCurrency(p.amount)} from ${p.borrowerName} against their loan and in the group's books. It cannot be undone.`,
                confirmLabel: 'Verify payment',
                run: () => verifyPayment.mutate(p.id),
              })}
            />
          ))}
        </QueueSection>
      )}

      {pendingExpenses.length > 0 && (
        <QueueSection title="Pending Expenses" count={pendingExpenses.length}>
          {pendingExpenses.map(e => (
            <QueueRow
              key={e.id}
              title={e.category}
              detail={`${e.description} · Spent ${formatDate(e.expenseDate)} · Submitted ${formatDate(e.createdAt)}`}
              amount={e.amount}
              side="debit"
              actionLabel="Verify expense"
              busy={busy}
              onVerify={() => setConfirming({
                title: 'Verify this expense?',
                body: `This spends ${formatCurrency(e.amount)} of the group's money on ${e.category} and posts it to the books. Nobody votes on an expense, so this is the only check it gets. It cannot be undone.`,
                confirmLabel: 'Verify expense',
                run: () => verifyExpense.mutate(e.id),
              })}
            />
          ))}
        </QueueSection>
      )}

      {pendingPlacements.length > 0 && (
        <QueueSection title="Pending Fixed Deposits" count={pendingPlacements.length}>
          {pendingPlacements.map(fd => (
            <QueueRow
              key={fd.id}
              title={fd.institutionName}
              detail={`${fd.interestRate}% p.a. · ${formatDate(fd.startDate)} → ${formatDate(fd.maturityDate)} · Matures at ${formatCurrency(fd.expectedMaturityAmount)}`}
              note={fd.notes}
              amount={fd.amount}
              side="debit"
              actionLabel="Verify placement"
              busy={busy}
              onVerify={() => setConfirming({
                title: 'Verify this fixed deposit?',
                body: `This moves ${formatCurrency(fd.amount)} out of the group's cash and into a deposit with ${fd.institutionName}. It cannot be withdrawn until this is done, and it cannot be undone.`,
                confirmLabel: 'Verify placement',
                run: () => verifyFd.mutate(fd.id),
              })}
            />
          ))}
        </QueueSection>
      )}

      {pendingWithdrawals.length > 0 && (
        <QueueSection title="Pending Fixed Deposit Withdrawals" count={pendingWithdrawals.length}>
          {pendingWithdrawals.map(fd => (
            <QueueRow
              key={fd.id}
              title={fd.institutionName}
              detail={`${formatCurrency(fd.amount)} principal + ${formatCurrency(fd.interestEarned ?? 0)} interest · Withdrawn ${fd.withdrawnAt ? formatDate(fd.withdrawnAt) : '—'}`}
              amount={fd.amount + (fd.interestEarned ?? 0)}
              actionLabel="Verify withdrawal"
              busy={busy}
              onVerify={() => setConfirming({
                title: 'Verify this withdrawal?',
                body: `This brings ${formatCurrency(fd.amount + (fd.interestEarned ?? 0))} back from ${fd.institutionName}, of which ${formatCurrency(fd.interestEarned ?? 0)} is recorded as the group's interest income. Check that against the institution's own figure — it cannot be undone.`,
                confirmLabel: 'Verify withdrawal',
                run: () => verifyFdWithdrawal.mutate(fd.id),
              })}
            />
          ))}
        </QueueSection>
      )}

      {pendingIncome.length > 0 && (
        <QueueSection title="Pending Other Incoming Funds" count={pendingIncome.length}>
          {pendingIncome.map(r => (
            <QueueRow
              key={r.id}
              title={r.memberName}
              detail={`${r.remarks} · Paid ${formatDate(r.paidDate)} · Submitted ${formatDate(r.createdAt)}`}
              amount={r.amount}
              actionLabel="Verify receipt"
              busy={busy}
              onVerify={() => setConfirming({
                title: 'Verify this receipt?',
                body: `This records ${formatCurrency(r.amount)} from ${r.memberName} as income to the group — not savings, so it is not owed back. It cannot be undone.`,
                confirmLabel: 'Verify receipt',
                run: () => verifyOtherIncome.mutate(r.id),
              })}
            />
          ))}
        </QueueSection>
      )}

      {confirming && (
        <ConfirmDialog
          title={confirming.title}
          body={confirming.body}
          confirmLabel={confirming.confirmLabel}
          busyLabel="Verifying..."
          variant="success"
          busy={busy}
          onConfirm={() => { confirming.run(); setConfirming(null); }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}
