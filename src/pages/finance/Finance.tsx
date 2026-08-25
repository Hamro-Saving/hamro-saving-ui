import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { formatCurrency, formatDate, todayIso } from '../../utils/format';
import type { FixedDeposit } from '../../api/types';
import Amount from '../../components/Amount';

const emptyExpense = { amount: '', category: '', description: '', expenseDate: todayIso() };
const emptyFd = { institutionName: '', amount: '', interestRate: '', startDate: todayIso(), maturityDate: '', notes: '' };

type Errors = Record<string, string>;

function expenseErrors(f: typeof emptyExpense): Errors {
  const e: Errors = {};
  if (!f.amount || Number(f.amount) <= 0) e.amount = 'Amount must be greater than zero.';
  if (!f.category.trim()) e.category = 'Category is required.';
  if (!f.description.trim()) e.description = 'Description is required.';
  if (!f.expenseDate) e.expenseDate = 'Date is required.';
  return e;
}

function fdErrors(f: typeof emptyFd): Errors {
  const e: Errors = {};
  if (!f.institutionName.trim()) e.institutionName = 'Institution name is required.';
  if (!f.amount || Number(f.amount) <= 0) e.amount = 'Amount must be greater than zero.';
  const rate = Number(f.interestRate);
  if (f.interestRate === '' || isNaN(rate) || rate < 0 || rate > 100) e.interestRate = 'Rate must be between 0 and 100.';
  if (!f.startDate) e.startDate = 'Start date is required.';
  if (!f.maturityDate) e.maturityDate = 'Maturity date is required.';
  else if (f.startDate && f.maturityDate <= f.startDate) e.maturityDate = 'Maturity must be after the start date.';
  return e;
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-blue-100 text-blue-700',
  Matured: 'bg-emerald-100 text-emerald-700',
  Withdrawn: 'bg-gray-100 text-gray-600',
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[11px] text-red-600 mt-0.5">{message}</p> : null;
}

export default function Finance() {
  const { user, isGroupAdmin } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'expenses' | 'fixed-deposits'>('expenses');
  const [showAdd, setShowAdd] = useState(false);
  const [expForm, setExpForm] = useState(emptyExpense);
  const [fdForm, setFdForm] = useState(emptyFd);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [withdrawing, setWithdrawing] = useState<FixedDeposit | null>(null);
  const [withdrawForm, setWithdrawForm] = useState({ interestEarned: '', withdrawnAt: todayIso() });
  const [withdrawError, setWithdrawError] = useState('');

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', user?.activeGroupId],
    queryFn: () => financeApi.getExpenses(),
  });
  const { data: fds, isLoading: fdsLoading } = useQuery({
    queryKey: ['fixed-deposits', user?.activeGroupId],
    queryFn: () => financeApi.getFixedDeposits(),
  });

  const onSaved = (key: string) => {
    qc.invalidateQueries({ queryKey: [key] });
    qc.invalidateQueries({ queryKey: ['finance-summary'] });
    setShowAdd(false);
  };
  const onFailed = (e: { response?: { data?: { detail?: string; title?: string } } }) =>
    setSaveError(e.response?.data?.detail ?? e.response?.data?.title ?? 'Could not save. Please try again.');

  const expMutation = useMutation({
    mutationFn: () => financeApi.createExpense({
      ...expForm,
      amount: Number(expForm.amount),
    }),
    onSuccess: () => { onSaved('expenses'); setExpForm(emptyExpense); },
    onError: onFailed,
  });

  const fdMutation = useMutation({
    mutationFn: () => financeApi.createFixedDeposit({
      ...fdForm,
      amount: Number(fdForm.amount),
      interestRate: Number(fdForm.interestRate),
      notes: fdForm.notes || undefined,
    }),
    onSuccess: () => { onSaved('fixed-deposits'); setFdForm(emptyFd); },
    onError: onFailed,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => financeApi.withdrawFixedDeposit(withdrawing!.id, {
      interestEarned: Number(withdrawForm.interestEarned || 0),
      withdrawnAt: `${withdrawForm.withdrawnAt}T00:00:00Z`,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixed-deposits'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      setWithdrawing(null);
    },
    onError: (e: { response?: { data?: { detail?: string; title?: string } } }) =>
      setWithdrawError(e.response?.data?.detail ?? e.response?.data?.title ?? 'Could not withdraw. Please try again.'),
  });

  /** Opens the withdrawal dialog with the expected interest as the starting figure. */
  const openWithdraw = (fd: FixedDeposit) => {
    setWithdrawError('');
    setWithdrawForm({
      interestEarned: String(Math.round((fd.expectedMaturityAmount - fd.amount) * 100) / 100),
      withdrawnAt: todayIso(),
    });
    setWithdrawing(fd);
  };

  const openAdd = () => {
    setErrors({});
    setSaveError('');
    setShowAdd(true);
  };

  const save = () => {
    const found = tab === 'expenses' ? expenseErrors(expForm) : fdErrors(fdForm);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaveError('');
    (tab === 'expenses' ? expMutation : fdMutation).mutate();
  };

  const saving = expMutation.isPending || fdMutation.isPending;
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const totalFds = (fds ?? []).reduce((s, f) => s + f.amount, 0);
  const activeFds = (fds ?? []).filter(f => f.status === 'Active');
  const maturedFds = (fds ?? []).filter(f => f.status === 'Matured');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {formatCurrency(totalExpenses)} spent · {formatCurrency(totalFds)} in fixed deposits
          </p>
        </div>
        {isGroupAdmin && (
          <Button variant="primary" onClick={openAdd}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add {tab === 'expenses' ? 'Expense' : 'Fixed Deposit'}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('expenses')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'expenses' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Expenses ({expenses?.length ?? 0})
        </button>
        <button onClick={() => setTab('fixed-deposits')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'fixed-deposits' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Fixed Deposits ({fds?.length ?? 0})
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{tab === 'expenses' ? 'Add Expense' : 'Add Fixed Deposit'}</h2>
            {saveError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{saveError}</p>}
            {tab === 'expenses' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                  <input type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.amount ? 'border-red-400' : 'border-gray-300'}`} />
                  <FieldError message={errors.amount} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Category</label>
                  <input value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.category ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="e.g. Administrative, Event" />
                  <FieldError message={errors.category} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Description</label>
                  <textarea value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} rows={2}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none ${errors.description ? 'border-red-400' : 'border-gray-300'}`} />
                  <FieldError message={errors.description} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Date</label>
                  <input type="date" value={expForm.expenseDate} onChange={e => setExpForm(f => ({ ...f, expenseDate: e.target.value }))}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.expenseDate ? 'border-red-400' : 'border-gray-300'}`} />
                  <FieldError message={errors.expenseDate} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Institution Name</label>
                  <input value={fdForm.institutionName} onChange={e => setFdForm(f => ({ ...f, institutionName: e.target.value }))}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.institutionName ? 'border-red-400' : 'border-gray-300'}`} />
                  <FieldError message={errors.institutionName} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                    <input type="number" value={fdForm.amount} onChange={e => setFdForm(f => ({ ...f, amount: e.target.value }))}
                      className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.amount ? 'border-red-400' : 'border-gray-300'}`} />
                    <FieldError message={errors.amount} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Interest Rate (%)</label>
                    <input type="number" step="0.1" value={fdForm.interestRate} onChange={e => setFdForm(f => ({ ...f, interestRate: e.target.value }))}
                      className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.interestRate ? 'border-red-400' : 'border-gray-300'}`} />
                    <FieldError message={errors.interestRate} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Start Date</label>
                    <input type="date" value={fdForm.startDate} onChange={e => setFdForm(f => ({ ...f, startDate: e.target.value }))}
                      className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.startDate ? 'border-red-400' : 'border-gray-300'}`} />
                    <FieldError message={errors.startDate} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 font-medium">Maturity Date</label>
                    <input type="date" value={fdForm.maturityDate} onChange={e => setFdForm(f => ({ ...f, maturityDate: e.target.value }))}
                      className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${errors.maturityDate ? 'border-red-400' : 'border-gray-300'}`} />
                    <FieldError message={errors.maturityDate} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Notes <span className="text-gray-400">(optional)</span></label>
                  <input value={fdForm.notes} onChange={e => setFdForm(f => ({ ...f, notes: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {withdrawing && (() => {
        const expected = Math.round((withdrawing.expectedMaturityAmount - withdrawing.amount) * 100) / 100;
        const entered = Number(withdrawForm.interestEarned || 0);
        const early = withdrawForm.withdrawnAt < withdrawing.maturityDate.slice(0, 10);

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold text-gray-800">Withdraw Fixed Deposit</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                {withdrawing.institutionName} · {formatCurrency(withdrawing.amount)} at {withdrawing.interestRate}% · matures {formatDate(withdrawing.maturityDate)}
              </p>
              {withdrawError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{withdrawError}</p>}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Total interest returned (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={withdrawForm.interestEarned}
                    onChange={e => setWithdrawForm(f => ({ ...f, interestEarned: e.target.value }))}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${entered < 0 ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Expected at maturity was {formatCurrency(expected)}. Enter what the institution actually paid.
                  </p>
                  {entered < 0 && <p className="text-[11px] text-red-600 mt-0.5">Interest cannot be negative.</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Withdrawal date</label>
                  <input
                    type="date"
                    max={todayIso()}
                    value={withdrawForm.withdrawnAt}
                    onChange={e => setWithdrawForm(f => ({ ...f, withdrawnAt: e.target.value }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {early && <p className="text-[11px] text-amber-600 mt-0.5">This is before the maturity date — an early withdrawal.</p>}
                </div>
                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Returning to the group</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(withdrawing.amount + entered)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <Button className="flex-1" onClick={() => setWithdrawing(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={withdrawMutation.isPending || entered < 0 || !withdrawForm.withdrawnAt}
                  onClick={() => { setWithdrawError(''); withdrawMutation.mutate(); }}>
                  {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {tab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Category', 'Description', 'Date', 'Amount'].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(expenses ?? []).map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{e.category}</span></td>
                  <td className="px-5 py-3.5 text-gray-600">{e.description}</td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(e.expenseDate)}</td>
                  <td className="px-5 py-3.5 text-right"><Amount value={e.amount} side="debit" /></td>
                </tr>
              ))}
              {expensesLoading && <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!expensesLoading && !expenses?.length && <tr><td colSpan={4} className="text-center py-10 text-gray-400">No expenses recorded</td></tr>}
            </tbody>
            {!!expenses?.length && (
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={3} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</td>
                  <td className="px-5 py-3 text-right"><Amount value={totalExpenses} side="debit" /></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {tab === 'fixed-deposits' && (
        <div className="grid gap-4">
          {!!(activeFds.length || maturedFds.length) && (
            <p className="text-xs text-gray-500">
              {activeFds.length} active · {formatCurrency(activeFds.reduce((s, f) => s + f.amount, 0))} deposited
              {!!maturedFds.length && (
                <span className="text-emerald-700"> · {maturedFds.length} matured awaiting withdrawal ({formatCurrency(maturedFds.reduce((s, f) => s + f.amount, 0))})</span>
              )}
            </p>
          )}
          {(fds ?? []).map(fd => (
            <div key={fd.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{fd.institutionName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[fd.status]}`}>{fd.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(fd.startDate)} → {formatDate(fd.maturityDate)} · {fd.interestRate}% p.a.</p>
                  {fd.status === 'Matured' && (
                    <p className="text-xs text-emerald-700 mt-1">Matured on {formatDate(fd.maturityDate)} · still to be withdrawn</p>
                  )}
                  {fd.status === 'Withdrawn' && fd.withdrawnAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Withdrawn on {formatDate(fd.withdrawnAt)}
                      {fd.interestEarned != null && ` · ${formatCurrency(fd.interestEarned)} interest returned`}
                    </p>
                  )}
                  {fd.notes && <p className="text-xs text-gray-500 mt-1">{fd.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg">
                    <Amount
                      value={fd.amount}
                      side={fd.status === 'Withdrawn' ? 'inactive' : 'debit'}
                      className="text-lg"
                    />
                  </p>
                  {fd.status === 'Withdrawn' && fd.interestEarned != null ? (
                    <p className="text-xs text-gray-400">Returned <Amount value={fd.amount + fd.interestEarned} side="credit" className="text-xs" /></p>
                  ) : (
                    <p className="text-xs text-gray-400">Matures at {formatCurrency(fd.expectedMaturityAmount)}</p>
                  )}
                  {fd.status !== 'Withdrawn' && isGroupAdmin && (
                    <Button size="sm" className="mt-2" onClick={() => openWithdraw(fd)}>Withdraw</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {fdsLoading && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">Loading...</div>}
          {!fdsLoading && !fds?.length && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">No fixed deposits</div>}
        </div>
      )}
    </div>
  );
}
