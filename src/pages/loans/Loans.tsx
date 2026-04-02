import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import { membersApi, nonMembersApi } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import type { LoanStatus } from '../../api/types';

const STATUS_COLORS: Record<LoanStatus, string> = {
  Active: 'bg-blue-100 text-blue-700', PaidOff: 'bg-emerald-100 text-emerald-700',
  Overdue: 'bg-red-100 text-red-700', Cancelled: 'bg-gray-100 text-gray-600',
};

export default function Loans() {
  const { user, isRole } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Active');
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', principalAmount: '', interestAmount: '', notes: '' });
  const [form, setForm] = useState({ borrowerId: '', borrowerType: 'Member', amount: '', interestRate: '', startDate: new Date().toISOString().slice(0, 10), dueDate: '', notes: '' });

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans', user?.groupId, filterStatus],
    queryFn: () => loansApi.getAll({ groupId: user?.groupId, status: filterStatus || undefined }),
  });
  const { data: members } = useQuery({ queryKey: ['members', user?.groupId], queryFn: () => membersApi.getAll({ groupId: user?.groupId }) });
  const { data: nonMembers } = useQuery({ queryKey: ['non-members', user?.groupId], queryFn: () => nonMembersApi.getAll({ groupId: user?.groupId }) });

  const { data: payments } = useQuery({
    queryKey: ['loan-payments', selectedLoan],
    queryFn: () => loansApi.getPayments(selectedLoan!),
    enabled: !!selectedLoan,
  });

  const addMutation = useMutation({
    mutationFn: () => loansApi.create({ ...form, amount: Number(form.amount), interestRate: Number(form.interestRate), groupId: user?.groupId, borrowerType: form.borrowerType as import('../../api/types').BorrowerType }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); qc.invalidateQueries({ queryKey: ['finance-summary'] }); setShowAdd(false); },
  });

  const payMutation = useMutation({
    mutationFn: () => loansApi.recordPayment(selectedLoan!, { ...payForm, amount: Number(payForm.amount), principalAmount: Number(payForm.principalAmount), interestAmount: Number(payForm.interestAmount), paidDate: new Date().toISOString(), paymentType: 'Mixed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); qc.invalidateQueries({ queryKey: ['loan-payments', selectedLoan] }); qc.invalidateQueries({ queryKey: ['finance-summary'] }); setShowPayment(false); },
  });

  const verifyPayMutation = useMutation({
    mutationFn: ({ loanId, payId }: { loanId: string; payId: string }) => loansApi.verifyPayment(loanId, payId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loan-payments', selectedLoan] }),
  });

  const borrowers = form.borrowerType === 'Member' ? (members ?? []) : (nonMembers ?? []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-gray-500 text-sm mt-0.5">Member (10%) and non-member (18%) loans</p>
        </div>
        {isRole('Admin', 'SuperAdmin') && (
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Loan
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {['', 'Active', 'PaidOff', 'Overdue', 'Cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Loan</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 font-medium">Borrower Type</label>
                <select value={form.borrowerType} onChange={e => setForm(f => ({...f, borrowerType: e.target.value, borrowerId: ''}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="Member">Member</option><option value="NonMember">Non-Member</option>
                </select></div>
              <div><label className="text-xs text-gray-600 font-medium">Borrower</label>
                <select value={form.borrowerId} onChange={e => setForm(f => ({...f, borrowerId: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select borrower</option>
                  {borrowers.map((b: { id: string; firstName?: string; lastName?: string; fullName?: string }) => (
                    <option key={b.id} value={b.id}>{b.fullName ?? `${b.firstName} ${b.lastName}`}</option>
                  ))}
                </select></div>
              <div><label className="text-xs text-gray-600 font-medium">Loan Amount (NPR)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Interest Rate (%)</label>
                <input type="number" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({...f, interestRate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={form.borrowerType === 'Member' ? '10' : '18'} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 font-medium">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Due Date (optional)</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-gray-600 font-medium">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {addMutation.isPending ? 'Creating...' : 'Create Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && selectedLoan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Record Payment</h2>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 font-medium">Total Amount (NPR)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({...f, amount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 font-medium">Principal</label>
                  <input type="number" value={payForm.principalAmount} onChange={e => setPayForm(f => ({...f, principalAmount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Interest</label>
                  <input type="number" value={payForm.interestAmount} onChange={e => setPayForm(f => ({...f, interestAmount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-gray-600 font-medium">Notes</label>
                <input type="text" value={payForm.notes} onChange={e => setPayForm(f => ({...f, notes: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPayment(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={() => payMutation.mutate()} disabled={payMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-60">
                {payMutation.isPending ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">Loading...</div>}
        {(loans ?? []).map(loan => (
          <div key={loan.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{loan.borrowerName}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status]}`}>{loan.status}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{loan.borrowerType}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Started {formatDate(loan.startDate)}{loan.dueDate ? ` · Due ${formatDate(loan.dueDate)}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                <p className="text-xs text-gray-400">{loan.interestRate}% interest · Total due {formatCurrency(loan.totalDue)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setSelectedLoan(loan.id); setShowPayment(false); }} className="text-xs text-blue-600 hover:underline">View Payments</button>
              {loan.status === 'Active' && isRole('Admin', 'SuperAdmin') && (
                <button onClick={() => { setSelectedLoan(loan.id); setShowPayment(true); }} className="text-xs text-emerald-600 hover:underline">Record Payment</button>
              )}
            </div>
            {selectedLoan === loan.id && !showPayment && payments && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">PAYMENT HISTORY</p>
                {payments.length === 0 && <p className="text-xs text-gray-400">No payments recorded</p>}
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                    <div>
                      <span className="text-gray-700">{formatDate(p.paidDate)}</span>
                      <span className="text-xs text-gray-400 ml-2">P: {formatCurrency(p.principalAmount)} + I: {formatCurrency(p.interestAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      {p.isVerified
                        ? <span className="text-xs text-emerald-600">✓ Verified</span>
                        : isRole('Admin', 'SuperAdmin') && <button onClick={() => verifyPayMutation.mutate({ loanId: loan.id, payId: p.id })} className="text-xs text-blue-600 hover:underline">Verify</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {!isLoading && !loans?.length && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">No loans found</div>}
      </div>
    </div>
  );
}
