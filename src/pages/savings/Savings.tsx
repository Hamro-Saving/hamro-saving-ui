import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsApi } from '../../api/finance';
import { membersApi } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, MONTHS } from '../../utils/format';
import type { DepositType } from '../../api/types';

const DEPOSIT_TYPES: DepositType[] = ['MonthlyDeposit', 'InterestPayment', 'LoanRepayment', 'Other'];

export default function Savings() {
  const { user, isRole } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const now = new Date();
  const [form, setForm] = useState({ memberId: '', amount: '', depositMonth: now.getMonth() + 1, depositYear: now.getFullYear(), type: 'MonthlyDeposit' as DepositType, notes: '' });

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['deposits', user?.groupId, filterMonth, filterVerified],
    queryFn: () => savingsApi.getDeposits({
      groupId: user?.groupId,
      month: filterMonth ? Number(filterMonth) : undefined,
      isVerified: filterVerified === '' ? undefined : filterVerified === 'true',
    }),
  });
  const { data: members } = useQuery({ queryKey: ['members', user?.groupId], queryFn: () => membersApi.getAll({ groupId: user?.groupId }) });

  const addMutation = useMutation({
    mutationFn: () => savingsApi.createDeposit({ ...form, amount: Number(form.amount), groupId: user?.groupId, memberId: form.memberId || user?.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deposits'] }); qc.invalidateQueries({ queryKey: ['finance-summary'] }); setShowAdd(false); },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => savingsApi.verifyDeposit(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deposits'] }); qc.invalidateQueries({ queryKey: ['finance-summary'] }); },
  });

  const typeColors: Record<string, string> = {
    MonthlyDeposit: 'bg-blue-100 text-blue-700',
    InterestPayment: 'bg-purple-100 text-purple-700',
    LoanRepayment: 'bg-amber-100 text-amber-700',
    Other: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings & Deposits</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track monthly contributions and interest payments</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Record Deposit
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterVerified} onChange={e => setFilterVerified(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Record Deposit</h2>
            <div className="space-y-3">
              {isRole('Admin', 'SuperAdmin') && (
                <div><label className="text-xs text-gray-600 font-medium">Member</label>
                  <select value={form.memberId} onChange={e => setForm(f => ({...f, memberId: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select member</option>
                    {(members ?? []).map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                  </select></div>
              )}
              <div><label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="5000" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 font-medium">Month</label>
                  <select value={form.depositMonth} onChange={e => setForm(f => ({...f, depositMonth: Number(e.target.value)}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select></div>
                <div><label className="text-xs text-gray-600 font-medium">Year</label>
                  <input type="number" value={form.depositYear} onChange={e => setForm(f => ({...f, depositYear: Number(e.target.value)}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-gray-600 font-medium">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as DepositType}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {DEPOSIT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div><label className="text-xs text-gray-600 font-medium">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {addMutation.isPending ? 'Saving...' : 'Save Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['Member', 'Month/Year', 'Type', 'Amount', 'Status', 'Actions'].map(h =>
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
            {(deposits ?? []).map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-gray-800">{d.memberName}</td>
                <td className="px-5 py-3.5 text-gray-600">{MONTHS[d.depositMonth - 1]} {d.depositYear}</td>
                <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[d.type]}`}>{d.type}</span></td>
                <td className="px-5 py-3.5 font-semibold text-gray-900">{formatCurrency(d.amount)}</td>
                <td className="px-5 py-3.5">
                  {d.isVerified
                    ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">Verified {d.verifiedAt ? formatDate(d.verifiedAt) : ''}</span>
                    : <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">Pending</span>}
                </td>
                <td className="px-5 py-3.5">
                  {!d.isVerified && isRole('Admin', 'SuperAdmin') && (
                    <button onClick={() => verifyMutation.mutate(d.id)} className="text-xs text-blue-600 hover:underline">Verify</button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !deposits?.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No deposits found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
