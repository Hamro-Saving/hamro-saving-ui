import { useState } from 'react';
import { todayIso } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { participates } from '../../api/types';
import Button from '../../components/Button';
import { useLoanActions } from './useLoanActions';
import type { Loan } from '../../api/types';

/**
 * The one thing a pending or approved loan is waiting on, and the buttons to move it along:
 * members approve or decline, admins disburse or cancel.
 */
export default function LoanWorkflowPanel({ loan }: { loan: Loan }) {
  const { user, isGroupAdmin } = useAuth();
  const { approve, decline, completeDisbursement, forceDisburse, cancel, busy } = useLoanActions(loan.id);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'decline' | 'disburse' | 'force' | 'cancel' | null>(null);
  // Defaults to today. Backdating is for a loan the group made before it kept records here,
  // so the interest clock starts when the borrower actually got the money.
  const [disbursedOn, setDisbursedOn] = useState(todayIso());

  if (loan.status !== 'Pending' && loan.status !== 'Approved') return null;

  const isAdmin = isGroupAdmin;
  const isBorrower = loan.borrowerId === user?.memberId;
  const hasVoted = loan.hasCurrentUserApproved || loan.hasCurrentUserDeclined;
  // Approval is the members' call: admins never vote, and non-members can't either.
  const isVoter = participates(user?.groupRole);
  const canVote = loan.status === 'Pending' && isVoter && !isBorrower && !hasVoted;
  const canComplete = loan.status === 'Approved' && isAdmin;
  const canCancel = isAdmin || (loan.borrowerType === 'Member' && isBorrower);
  const needsYou = canVote || canComplete;
  // Clamped for the progress bar and the counts, which must not divide by zero.
  const approvalsNeeded = Math.max(loan.requiredApprovals, 1);
  const declinesNeeded = Math.max(loan.requiredDeclines, 1);

  // An admin can pay out a loan the members never answered — but a group that has already
  // said no keeps its answer, so the button goes away once the declines settle it. This
  // reads the unclamped figure, mirroring the server: no eligible voters is not a refusal.
  const groupHasRefused = loan.requiredDeclines > 0 && loan.declineCount >= loan.requiredDeclines;
  const canForce = loan.status === 'Pending' && isAdmin && !groupHasRefused;

  const title = loan.status === 'Pending'
    ? canVote ? 'Your vote is needed — approve or decline'
      : loan.hasCurrentUserApproved ? '✓ You approved this loan'
      : loan.hasCurrentUserDeclined ? '✕ You declined this loan'
      : isBorrower ? 'Waiting on your group to vote'
      : isAdmin ? 'The members are voting on this loan'
      : 'Only group members can vote on loans'
    : isAdmin ? 'Approved by the members — ready to disburse'
      : 'Approved — waiting for an admin to disburse it';

  const detail = loan.status === 'Pending'
    ? `${loan.approvalCount} of ${approvalsNeeded} to approve · ${loan.declineCount} of ${declinesNeeded} to decline`
    : isAdmin
      ? `Carried by ${loan.approvalCount} of ${approvalsNeeded} needed approvals · marking the disbursement complete activates the loan and starts interest`
      : `Carried by ${loan.approvalCount} of ${approvalsNeeded} needed approvals`;

  return (
    <div className={`rounded-lg border px-4 py-3 ${needsYou ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className={`text-sm font-semibold ${needsYou ? 'text-amber-900' : 'text-gray-700'}`}>{title}</p>
          <p className="text-xs text-gray-600 mt-0.5">{detail}</p>
        </div>
        <div className="flex items-center gap-2">
          {confirmAction ? (
            <>
              {(confirmAction === 'disburse' || confirmAction === 'force') && (
                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                  Disbursed on
                  <input
                    type="date"
                    value={disbursedOn}
                    max={todayIso()}
                    onChange={e => setDisbursedOn(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                  />
                </label>
              )}
              <span className="text-xs text-rose-700">
                {confirmAction === 'approve' ? 'Approve this loan?'
                  : confirmAction === 'decline' ? 'Decline this loan?'
                  : confirmAction === 'disburse' ? 'Money handed over?'
                  : confirmAction === 'force' ? 'Pay out without the members\u2019 approval?'
                  : 'Cancel this loan for good?'}
              </span>
              <Button
                variant={confirmAction === 'approve' ? 'success' : confirmAction === 'disburse' ? 'primary' : confirmAction === 'force' ? 'warning' : 'dangerSolid'}
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (confirmAction === 'disburse') completeDisbursement.mutate(disbursedOn);
                  else if (confirmAction === 'force') forceDisburse.mutate(disbursedOn);
                  else if (confirmAction === 'approve') approve.mutate();
                  else if (confirmAction === 'decline') decline.mutate();
                  else cancel.mutate();
                  setConfirmAction(null);
                }}>
                {confirmAction === 'approve' ? 'Yes, approve'
                  : confirmAction === 'decline' ? 'Yes, decline'
                  : confirmAction === 'disburse' ? 'Yes, it is disbursed'
                  : confirmAction === 'force' ? 'Yes, disburse it'
                  : 'Yes, cancel it'}
              </Button>
              <Button size="sm" onClick={() => setConfirmAction(null)}>
                {confirmAction === 'decline' || confirmAction === 'cancel' ? 'Keep it' : 'Not yet'}
              </Button>
            </>
          ) : (
            <>
              {canVote && (
                <>
                  <Button variant="success" size="sm" disabled={busy} onClick={() => setConfirmAction('approve')}>
                    {approve.isPending ? 'Saving...' : 'Approve'}
                  </Button>
                  <Button variant="danger" size="sm" disabled={busy} onClick={() => setConfirmAction('decline')}>
                    Decline
                  </Button>
                </>
              )}
              {canComplete && (
                <Button variant="primary" size="sm" disabled={busy} onClick={() => setConfirmAction('disburse')}>
                  {completeDisbursement.isPending ? 'Saving...' : 'Disbursement complete'}
                </Button>
              )}
              {canForce && (
                <Button variant="warning" size="sm" disabled={busy} onClick={() => setConfirmAction('force')}>
                  {forceDisburse.isPending ? 'Saving...' : 'Force disburse'}
                </Button>
              )}
              {canCancel && (
                <Button size="sm" disabled={busy} onClick={() => setConfirmAction('cancel')}>
                  {isAdmin ? 'Cancel loan' : 'Withdraw request'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {(loan.approvers.length > 0 || loan.decliners.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          {loan.approvers.length > 0 && (
            <span className="flex flex-wrap items-center gap-1">
              <span className="text-gray-400">Approved by</span>
              {loan.approvers.map(a => (
                <span key={a.approverId} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {a.approverName}
                </span>
              ))}
            </span>
          )}
          {loan.decliners.length > 0 && (
            <span className="flex flex-wrap items-center gap-1">
              <span className="text-gray-400">Declined by</span>
              {loan.decliners.map(a => (
                <span key={a.approverId} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">
                  {a.approverName}
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {loan.status === 'Pending' && (
        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(loan.approvalCount / approvalsNeeded, 1) * 50}%` }} />
          <div className="h-full bg-rose-400" style={{ width: `${Math.min(loan.declineCount / declinesNeeded, 1) * 50}%` }} />
        </div>
      )}
    </div>
  );
}
