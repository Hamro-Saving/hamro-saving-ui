import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { useLoanActions } from './useLoanActions';
import type { Loan } from '../../api/types';

/**
 * The one thing a pending or approved loan is waiting on, and the buttons to move it along:
 * members approve or decline, admins disburse or cancel.
 */
export default function LoanWorkflowPanel({ loan }: { loan: Loan }) {
  const { user, isRole } = useAuth();
  const { approve, decline, completeDisbursement, cancel, busy } = useLoanActions(loan.id);
  const [confirmAction, setConfirmAction] = useState<'decline' | 'cancel' | null>(null);

  if (loan.status !== 'Pending' && loan.status !== 'Approved') return null;

  const isAdmin = isRole('Admin', 'SuperAdmin');
  const isBorrower = loan.borrowerId === user?.memberId;
  const hasVoted = loan.hasCurrentUserApproved || loan.hasCurrentUserDeclined;
  // Approval is the members' call: admins never vote, and non-members can't either.
  const isVoter = !isAdmin && user?.membershipType === 'Member';
  const canVote = loan.status === 'Pending' && isVoter && !isBorrower && !hasVoted;
  const canComplete = loan.status === 'Approved' && isAdmin;
  const canCancel = isAdmin;
  const needsYou = canVote || canComplete;
  const votesNeeded = Math.max(loan.requiredApprovals, 1);

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
    ? `${loan.approvalCount} approved · ${loan.declineCount} declined · ${votesNeeded} vote${votesNeeded === 1 ? '' : 's'} either way settles it`
    : isAdmin
      ? `Carried by ${loan.approvalCount} of ${votesNeeded} needed approvals · marking the disbursement complete activates the loan and starts interest`
      : `Carried by ${loan.approvalCount} of ${votesNeeded} needed approvals`;

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
              <span className="text-xs text-rose-700">
                {confirmAction === 'decline' ? 'Decline this loan?' : 'Cancel this loan for good?'}
              </span>
              <Button
                variant="dangerSolid"
                size="sm"
                disabled={busy}
                onClick={() => {
                  (confirmAction === 'decline' ? decline : cancel).mutate();
                  setConfirmAction(null);
                }}>
                {confirmAction === 'decline' ? 'Yes, decline' : 'Yes, cancel it'}
              </Button>
              <Button size="sm" onClick={() => setConfirmAction(null)}>Keep it</Button>
            </>
          ) : (
            <>
              {canVote && (
                <>
                  <Button variant="success" size="sm" disabled={busy} onClick={() => approve.mutate()}>
                    {approve.isPending ? 'Saving...' : 'Approve'}
                  </Button>
                  <Button variant="danger" size="sm" disabled={busy} onClick={() => setConfirmAction('decline')}>
                    Decline
                  </Button>
                </>
              )}
              {canComplete && (
                <Button variant="primary" size="sm" disabled={busy} onClick={() => completeDisbursement.mutate()}>
                  {completeDisbursement.isPending ? 'Saving...' : 'Disbursement complete'}
                </Button>
              )}
              {canCancel && (
                <Button size="sm" disabled={busy} onClick={() => setConfirmAction('cancel')}>Cancel loan</Button>
              )}
            </>
          )}
        </div>
      </div>
      {loan.status === 'Pending' && (
        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-emerald-500" style={{ width: `${Math.min(loan.approvalCount / votesNeeded, 1) * 100}%` }} />
          <div className="h-full bg-rose-400" style={{ width: `${Math.min(loan.declineCount / votesNeeded, 1) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
