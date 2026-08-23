import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import { membersApi } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { formatCurrency, formatDate } from '../../utils/format';
import { STATUS_COLORS, LOAN_STATUS_FILTERS, isLive } from './loanMath';
import LoanWorkflowPanel from './LoanWorkflowPanel';
import RecordPaymentModal from './RecordPaymentModal';
import type { BorrowerType, Loan } from '../../api/types';

export default function Loans() {
  const { user, isRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = isRole('Admin', 'SuperAdmin');

  const [showAdd, setShowAdd] = useState(false);
  const [applyForSelf, setApplyForSelf] = useState(false);
  const [editLoan, setEditLoan] = useState<{ id: string; amount: string; interestRate: string; dueDate: string; notes: string } | null>(null);
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ borrowerId: '', borrowerType: 'Member', amount: '', interestRate: '', startDate: new Date().toISOString().slice(0, 10), dueDate: '', notes: '' });

  const openApply = (forSelf: boolean) => {
    setApplyForSelf(forSelf);
    setForm(f => ({
      ...f,
      borrowerType: 'Member',
      borrowerId: forSelf && user?.memberId ? user.memberId : '',
    }));
    setShowAdd(true);
  };

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans', user?.groupId, filterStatus],
    queryFn: () => loansApi.getAll({ groupId: user?.groupId, status: filterStatus || undefined }),
  });
  const { data: members } = useQuery({ queryKey: ['members', user?.groupId], queryFn: () => membersApi.getAll({ groupId: user?.groupId }) });
  const { data: nonMembers } = useQuery({ queryKey: ['non-members', user?.groupId], queryFn: () => membersApi.getAll({ groupId: user?.groupId, membershipType: 'NonMember' }) });

  const invalidateLoans = () => {
    qc.invalidateQueries({ queryKey: ['loans'] });
    qc.invalidateQueries({ queryKey: ['finance-summary'] });
  };

  const addMutation = useMutation({
    mutationFn: () => {
      const { interestRate: _ir, dueDate: _dd, ...rest } = form;
      void _ir; void _dd;
      return loansApi.create({
        ...rest,
        amount: Number(form.amount),
        interestRate: (!applyForSelf && form.interestRate) ? Number(form.interestRate) : null,
        dueDate: form.dueDate || null,
        groupId: user?.groupId,
        borrowerType: form.borrowerType as BorrowerType,
      });
    },
    onSuccess: () => { invalidateLoans(); setShowAdd(false); setApplyForSelf(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, amount, interestRate, dueDate, notes }: { id: string; amount: number; interestRate: number | null; dueDate: string | null; notes?: string }) =>
      loansApi.update(id, { amount, interestRate, dueDate, notes }),
    onSuccess: () => { invalidateLoans(); setEditLoan(null); },
  });

  const borrowers = form.borrowerType === 'Member' ? (members ?? []) : (nonMembers ?? []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-gray-500 text-sm mt-0.5">Members vote on every loan; admins disburse and record payments</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => openApply(false)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Loan
          </Button>
        )}
        {isRole('Member') && (
          <Button variant="primary" onClick={() => openApply(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Apply for Loan
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {LOAN_STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {(loans ?? []).map(loan => {
          const isBorrower = loan.borrowerId === user?.memberId;
          const canEdit = loan.status === 'Pending' && loan.approvalCount === 0 && loan.declineCount === 0 &&
            (isAdmin || (loan.borrowerType === 'Member' && isBorrower));
          const live = isLive(loan);

          return (
            <div key={loan.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/loans/${loan.id}`)}
                      className="font-semibold text-gray-800 hover:text-blue-700 transition">
                      {loan.borrowerName}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status]}`}>{loan.status}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{loan.borrowerType}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {loan.disbursedAt ? `Disbursed ${formatDate(loan.disbursedAt)}` : `Starts ${formatDate(loan.startDate)}`}
                    {loan.dueDate ? ` · Due ${formatDate(loan.dueDate)}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                  <p className="text-xs text-gray-400">{loan.interestRate}% per year</p>
                </div>
              </div>

              {live && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Outstanding</p>
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(loan.outstandingPrincipal)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Interest accrued</p>
                    <p className="text-sm font-semibold text-amber-600">{formatCurrency(loan.accruedInterest)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Payoff today</p>
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(loan.payoffAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium">Per day</p>
                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(loan.dailyInterest)}</p>
                  </div>
                </div>
              )}

              {loan.status === 'PaidOff' && (
                <p className="text-xs text-emerald-600">
                  Settled · {formatCurrency(loan.totalPrincipalPaid)} principal and {formatCurrency(loan.totalInterestPaid)} interest paid
                </p>
              )}

              <LoanWorkflowPanel loan={loan} />

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => navigate(`/loans/${loan.id}`)}>View details</Button>
                {live && isAdmin && (
                  <Button size="sm" variant="success" onClick={() => setPayingLoan(loan)}>Record payment</Button>
                )}
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => setEditLoan({ id: loan.id, amount: String(loan.amount), interestRate: String(loan.interestRate), dueDate: loan.dueDate ? loan.dueDate.slice(0, 10) : '', notes: loan.notes ?? '' })}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">Loading loans...</div>}
        {!isLoading && !loans?.length && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">No loans found</div>}
      </div>

      {payingLoan && <RecordPaymentModal loan={payingLoan} onClose={() => setPayingLoan(null)} />}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{applyForSelf ? 'Apply for Loan' : 'Create Loan'}</h2>
            <div className="space-y-3">
              {!applyForSelf && (
                <div><label className="text-xs text-gray-600 font-medium">Borrower Type</label>
                  <select value={form.borrowerType} onChange={e => setForm(f => ({ ...f, borrowerType: e.target.value, borrowerId: '' }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="Member">Member</option><option value="NonMember">Non-Member</option>
                  </select></div>
              )}
              {!applyForSelf && (
                <div><label className="text-xs text-gray-600 font-medium">Borrower</label>
                  <select value={form.borrowerId} onChange={e => setForm(f => ({ ...f, borrowerId: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select borrower</option>
                    {borrowers.map(b => (
                      <option key={b.id} value={b.id}>{b.fullName}</option>
                    ))}
                  </select></div>
              )}
              <div><label className="text-xs text-gray-600 font-medium">Loan Amount (NPR)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              {!applyForSelf && (
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    Interest Rate (%) <span className="text-gray-400 font-normal">— leave blank to use group default</span>
                  </label>
                  <input type="number" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={form.borrowerType === 'Member' ? 'Default member rate' : 'Default non-member rate'} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 font-medium">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Due Date (optional)</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-gray-600 font-medium">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => { setShowAdd(false); setApplyForSelf(false); }}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Submitting...' : applyForSelf ? 'Submit Application' : 'Create Loan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editLoan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Loan</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 font-medium">Loan Amount (NPR)</label>
                <input type="number" value={editLoan.amount} onChange={e => setEditLoan(l => l && { ...l, amount: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              {isAdmin && (
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    Interest Rate (%) <span className="text-gray-400 font-normal">— leave blank to use group default</span>
                  </label>
                  <input type="number" step="0.1" value={editLoan.interestRate} onChange={e => setEditLoan(l => l && { ...l, interestRate: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Default rate" />
                </div>
              )}
              <div><label className="text-xs text-gray-600 font-medium">Due Date <span className="text-gray-400">(optional)</span></label>
                <input type="date" value={editLoan.dueDate} onChange={e => setEditLoan(l => l && { ...l, dueDate: e.target.value })} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Notes <span className="text-gray-400">(optional)</span></label>
                <textarea value={editLoan.notes} onChange={e => setEditLoan(l => l && { ...l, notes: e.target.value })} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setEditLoan(null)}>Cancel</Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => updateMutation.mutate({ id: editLoan.id, amount: Number(editLoan.amount), interestRate: editLoan.interestRate ? Number(editLoan.interestRate) : null, dueDate: editLoan.dueDate || null, notes: editLoan.notes || undefined })}
                disabled={updateMutation.isPending || !editLoan.amount || Number(editLoan.amount) <= 0}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
