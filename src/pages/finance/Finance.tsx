import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';

export default function Finance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'expenses' | 'fixed-deposits'>('expenses');
  const [showAdd, setShowAdd] = useState(false);
  const [expForm, setExpForm] = useState({ amount: '', category: '', description: '', expenseDate: new Date().toISOString().slice(0, 10) });
  const [fdForm, setFdForm] = useState({ institutionName: '', amount: '', interestRate: '', startDate: new Date().toISOString().slice(0, 10), maturityDate: '', notes: '' });

  const { data: expenses } = useQuery({ queryKey: ['expenses', user?.groupId], queryFn: () => financeApi.getExpenses({ groupId: user?.groupId }) });
  const { data: fds } = useQuery({ queryKey: ['fixed-deposits', user?.groupId], queryFn: () => financeApi.getFixedDeposits({ groupId: user?.groupId }) });

  const expMutation = useMutation({
    mutationFn: () => financeApi.createExpense({ ...expForm, amount: Number(expForm.amount), groupId: user?.groupId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['finance-summary'] }); setShowAdd(false); },
  });
  const fdMutation = useMutation({
    mutationFn: () => financeApi.createFixedDeposit({ ...fdForm, amount: Number(fdForm.amount), interestRate: Number(fdForm.interestRate), groupId: user?.groupId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fixed-deposits'] }); qc.invalidateQueries({ queryKey: ['finance-summary'] }); setShowAdd(false); },
  });

  const statusColors: Record<string, string> = { Active: 'bg-blue-100 text-blue-700', Matured: 'bg-emerald-100 text-emerald-700', Withdrawn: 'bg-gray-100 text-gray-600' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-0.5">Expenses and fixed deposits</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add {tab === 'expenses' ? 'Expense' : 'Fixed Deposit'}
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('expenses')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'expenses' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>Expenses</button>
        <button onClick={() => setTab('fixed-deposits')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'fixed-deposits' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>Fixed Deposits</button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{tab === 'expenses' ? 'Add Expense' : 'Add Fixed Deposit'}</h2>
            {tab === 'expenses' ? (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                  <input type="number" value={expForm.amount} onChange={e => setExpForm(f => ({...f, amount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Category</label>
                  <input value={expForm.category} onChange={e => setExpForm(f => ({...f, category: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Administrative, Event" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Description</label>
                  <textarea value={expForm.description} onChange={e => setExpForm(f => ({...f, description: e.target.value}))} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Date</label>
                  <input type="date" value={expForm.expenseDate} onChange={e => setExpForm(f => ({...f, expenseDate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div><label className="text-xs text-gray-600 font-medium">Institution Name</label>
                  <input value={fdForm.institutionName} onChange={e => setFdForm(f => ({...f, institutionName: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                  <input type="number" value={fdForm.amount} onChange={e => setFdForm(f => ({...f, amount: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Interest Rate (%)</label>
                  <input type="number" step="0.1" value={fdForm.interestRate} onChange={e => setFdForm(f => ({...f, interestRate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-600 font-medium">Start Date</label>
                    <input type="date" value={fdForm.startDate} onChange={e => setFdForm(f => ({...f, startDate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-gray-600 font-medium">Maturity Date</label>
                    <input type="date" value={fdForm.maturityDate} onChange={e => setFdForm(f => ({...f, maturityDate: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                <div><label className="text-xs text-gray-600 font-medium">Notes</label>
                  <input value={fdForm.notes} onChange={e => setFdForm(f => ({...f, notes: e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={() => tab === 'expenses' ? expMutation.mutate() : fdMutation.mutate()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Category', 'Description', 'Date', 'Amount'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(expenses ?? []).map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{e.category}</span></td>
                  <td className="px-5 py-3.5 text-gray-600">{e.description}</td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(e.expenseDate)}</td>
                  <td className="px-5 py-3.5 font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
              {!expenses?.length && <tr><td colSpan={4} className="text-center py-10 text-gray-400">No expenses recorded</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'fixed-deposits' && (
        <div className="grid gap-4">
          {(fds ?? []).map(fd => (
            <div key={fd.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{fd.institutionName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[fd.status]}`}>{fd.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(fd.startDate)} → {formatDate(fd.maturityDate)} · {fd.interestRate}% p.a.</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(fd.amount)}</p>
                  <p className="text-xs text-gray-400">Matures at {formatCurrency(fd.expectedMaturityAmount)}</p>
                </div>
              </div>
            </div>
          ))}
          {!fds?.length && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">No fixed deposits</div>}
        </div>
      )}
    </div>
  );
}
