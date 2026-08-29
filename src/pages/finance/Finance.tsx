import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { formatCurrency, formatDate, todayIso } from '../../utils/format';
import { otherIncomingFundsApi } from '../../api/finance';
import Select from '../../components/Select';
import { membersApi } from '../../api/groups';
import type { Expense, FixedDeposit, OtherIncomingFund } from '../../api/types';
import Amount from '../../components/Amount';
import IconButton from '../../components/IconButton';
import ConfirmDialog from '../../components/ConfirmDialog';

const emptyLj = () => ({ memberId: '', amount: '', paidDate: todayIso(), remarks: '' });
const emptyExpense = () => ({ amount: '', category: '', description: '', expenseDate: todayIso() });
const emptyFd = () => ({ institutionName: '', amount: '', interestRate: '', startDate: todayIso(), maturityDate: '', notes: '' });

type Errors = Record<string, string>;

/** A removal, held until the admin confirms it. `run` is the call that actually does it. */
type Confirmation = { title: string; body: string; confirmLabel: string; run: () => Promise<unknown> };

function expenseErrors(f: ReturnType<typeof emptyExpense>): Errors {
  const e: Errors = {};
  if (!f.amount || Number(f.amount) <= 0) e.amount = 'Amount must be greater than zero.';
  if (!f.category.trim()) e.category = 'Category is required.';
  if (!f.description.trim()) e.description = 'Description is required.';
  if (!f.expenseDate) e.expenseDate = 'Date is required.';
  return e;
}

function fdErrors(f: ReturnType<typeof emptyFd>): Errors {
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

/** Without this an unverified row looks exactly like money that has already moved. */
function PendingBadge({ label = 'Pending verification' }: { label?: string }) {
  return (
    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">
      {label}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[11px] text-red-600 mt-0.5">{message}</p> : null;
}

export default function Finance() {
  const { user, isGroupAdmin } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'expenses' | 'fixed-deposits' | 'other-income'>('expenses');

  // What a member who joined late paid to catch up. Income, so there is no cash limit
  // on it — the group is receiving rather than committing.
  const [ljForm, setLjForm] = useState(emptyLj);
  const [ljError, setLjError] = useState('');
  const [showAddLj, setShowAddLj] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // Set while the add form is being used to correct an existing record instead.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLjId, setEditingLjId] = useState<string | null>(null);
  // Removing a record is only possible until it is verified, so it is worth one question first.
  const [confirming, setConfirming] = useState<Confirmation | null>(null);
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
  const { data: otherIncome, isLoading: ljLoading } = useQuery({
    queryKey: ['other-incoming-funds', user?.activeGroupId],
    queryFn: () => otherIncomingFundsApi.getAll(),
  });
  const { data: members } = useQuery({
    queryKey: ['members', user?.activeGroupId],
    queryFn: () => membersApi.getAll({ roles: ['Member', 'Admin'] }),
  });

  const onSaved = (key: string) => {
    qc.invalidateQueries({ queryKey: [key] });
    qc.invalidateQueries({ queryKey: ['finance-summary'] });
    setShowAdd(false);
    setEditingId(null);
  };
  const onFailed = (e: { response?: { data?: { detail?: string; title?: string } } }) =>
    setSaveError(e.response?.data?.detail ?? e.response?.data?.title ?? 'Could not save. Please try again.');

  const ljMutation = useMutation({
    mutationFn: () => {
      const body = {
        amount: Number(ljForm.amount),
        paidDate: ljForm.paidDate,
        remarks: ljForm.remarks.trim(),
      };
      // The member is not part of a correction: money in from someone else is a different
      // receipt, not a restatement of this one.
      return editingLjId
        ? otherIncomingFundsApi.update(editingLjId, body)
        : otherIncomingFundsApi.record({ ...body, memberId: ljForm.memberId });
    },
    onSuccess: () => {
      // Income, so it moves the summary, the ledger and the trial balance together.
      for (const k of ['other-incoming-funds', 'finance-summary', 'transactions', 'trial-balance']) {
        qc.invalidateQueries({ queryKey: [k] });
      }
      setShowAddLj(false);
      setEditingLjId(null);
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setLjError(e.response?.data?.detail ?? 'Could not record the incoming funds'),
  });

  const expMutation = useMutation({
    mutationFn: () => {
      const body = { ...expForm, amount: Number(expForm.amount) };
      return editingId ? financeApi.updateExpense(editingId, body) : financeApi.createExpense(body);
    },
    onSuccess: () => onSaved('expenses'),
    onError: onFailed,
  });

  const fdMutation = useMutation({
    mutationFn: () => {
      const body = {
        ...fdForm,
        amount: Number(fdForm.amount),
        interestRate: Number(fdForm.interestRate),
        notes: fdForm.notes || undefined,
      };
      return editingId ? financeApi.updateFixedDeposit(editingId, body) : financeApi.createFixedDeposit(body);
    },
    onSuccess: () => onSaved('fixed-deposits'),
    onError: onFailed,
  });

  /**
   * Every removal on this page. The API refuses anything already verified, so the reason it
   * gives belongs in the dialog rather than being swallowed.
   */
  const removal = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => {
      for (const k of ['expenses', 'fixed-deposits', 'other-incoming-funds', 'finance-summary', 'transactions', 'trial-balance']) {
        qc.invalidateQueries({ queryKey: [k] });
      }
      setConfirming(null);
    },
  });

  const removalError = (removal.error as { response?: { data?: { detail?: string } } } | null)
    ?.response?.data?.detail;

  const closeConfirm = () => { removal.reset(); setConfirming(null); };

  // A withdrawal already recorded is being restated rather than made afresh.
  const correctingWithdrawal = withdrawing?.status === 'Withdrawn';

  const withdrawMutation = useMutation({
    mutationFn: () => {
      const body = {
        interestEarned: Number(withdrawForm.interestEarned || 0),
        withdrawnAt: `${withdrawForm.withdrawnAt}T00:00:00Z`,
      };
      return correctingWithdrawal
        ? financeApi.reviseWithdrawal(withdrawing!.id, body)
        : financeApi.withdrawFixedDeposit(withdrawing!.id, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixed-deposits'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      setWithdrawing(null);
    },
    onError: (e: { response?: { data?: { detail?: string; title?: string } } }) =>
      setWithdrawError(e.response?.data?.detail ?? e.response?.data?.title ?? 'Could not withdraw. Please try again.'),
  });

  /**
   * Opens the withdrawal dialog. A new withdrawal starts from the interest expected at
   * maturity; correcting one starts from what was actually recorded.
   */
  const openWithdraw = (fd: FixedDeposit) => {
    setWithdrawError('');
    setWithdrawForm(fd.status === 'Withdrawn'
      ? {
          interestEarned: String(fd.interestEarned ?? 0),
          withdrawnAt: (fd.withdrawnAt ?? todayIso()).slice(0, 10),
        }
      : {
          interestEarned: String(Math.round((fd.expectedMaturityAmount - fd.amount) * 100) / 100),
          withdrawnAt: todayIso(),
        });
    setWithdrawing(fd);
  };

  /** Reopens the add form on an existing expense or placement, to correct it. */
  const openEditExpense = (e: Expense) => {
    setExpForm({
      amount: String(e.amount),
      category: e.category,
      description: e.description,
      expenseDate: e.expenseDate.slice(0, 10),
    });
    setErrors({});
    setSaveError('');
    setEditingId(e.id);
    setShowAdd(true);
  };

  const openEditFd = (fd: FixedDeposit) => {
    setFdForm({
      institutionName: fd.institutionName,
      amount: String(fd.amount),
      interestRate: String(fd.interestRate),
      startDate: fd.startDate.slice(0, 10),
      maturityDate: fd.maturityDate.slice(0, 10),
      notes: fd.notes ?? '',
    });
    setErrors({});
    setSaveError('');
    setEditingId(fd.id);
    setShowAdd(true);
  };

  const openEditLj = (r: OtherIncomingFund) => {
    setLjForm({
      memberId: r.memberId,
      amount: String(r.amount),
      paidDate: r.paidDate.slice(0, 10),
      remarks: r.remarks,
    });
    setLjError('');
    setEditingLjId(r.id);
    setShowAddLj(true);
  };

  // Always from a blank form: whatever was typed last time — saved or abandoned — is gone.
  const openAdd = () => {
    if (tab === 'other-income') {
      setLjForm(emptyLj());
      setLjError('');
      setEditingLjId(null);
      setShowAddLj(true);
      return;
    }
    setExpForm(emptyExpense());
    setFdForm(emptyFd());
    setErrors({});
    setSaveError('');
    setEditingId(null);
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

  // These sit beside ledger-derived figures from the API, so unverified rows must not count.
  const totalExpenses = (expenses ?? []).filter(e => e.isVerified).reduce((s, e) => s + e.amount, 0);
  const totalFds = (fds ?? []).filter(f => f.isVerified && !f.isWithdrawalVerified).reduce((s, f) => s + f.amount, 0);
  const totalOtherIncome = (otherIncome ?? []).filter(r => r.isVerified).reduce((s, r) => s + r.amount, 0);
  // The tables gain an actions column for an admin, and their spanning rows follow it.
  const expenseCols = isGroupAdmin ? 5 : 4;
  const incomeCols = isGroupAdmin ? 5 : 4;
  const activeFds = (fds ?? []).filter(f => f.status === 'Active');
  const maturedFds = (fds ?? []).filter(f => f.status === 'Matured');
  const awaitingVerification =
    (expenses ?? []).filter(e => !e.isVerified).length +
    (fds ?? []).filter(f => !f.isVerified || (f.status === 'Withdrawn' && !f.isWithdrawalVerified)).length +
    (otherIncome ?? []).filter(r => !r.isVerified).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {formatCurrency(totalExpenses)} spent · {formatCurrency(totalFds)} in fixed deposits
            {awaitingVerification > 0 && (
              <span className="text-amber-700">
                {' · '}{awaitingVerification} awaiting verification
              </span>
            )}
          </p>
        </div>
        {isGroupAdmin && (
          <Button variant="primary" onClick={openAdd}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add {tab === 'expenses' ? 'Expense' : tab === 'fixed-deposits' ? 'Fixed Deposit' : 'Fund'}
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
        <button onClick={() => setTab('other-income')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'other-income' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Other Incoming Funds ({otherIncome?.length ?? 0})
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit' : 'Add'} {tab === 'expenses' ? 'Expense' : 'Fixed Deposit'}
            </h2>
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
              <Button className="flex-1" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</Button>
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
              <h2 className="text-lg font-semibold text-gray-800">
                {correctingWithdrawal ? 'Edit Withdrawal' : 'Withdraw Fixed Deposit'}
              </h2>
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
                  {withdrawMutation.isPending
                    ? (correctingWithdrawal ? 'Saving...' : 'Withdrawing...')
                    : (correctingWithdrawal ? 'Save Changes' : 'Withdraw')}
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
              <tr>{['Category', 'Description', 'Date', 'Amount', ...(isGroupAdmin ? ['Actions'] : [])].map(h => (
                <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(expenses ?? []).map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{e.category}</span>
                    {!e.isVerified && <PendingBadge />}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{e.description}</td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(e.expenseDate)}</td>
                  <td className="px-5 py-3.5 text-right"><Amount value={e.amount} side={e.isVerified ? 'debit' : 'inactive'} /></td>
                  {/* Correctable right up until it is verified; after that the spend is in
                      the books and only an opposite entry changes it. */}
                  {isGroupAdmin && (
                    <td className="px-5 py-3.5">
                      {!e.isVerified && (
                        <div className="flex items-center gap-2">
                          <IconButton icon="edit" label="Edit expense" onClick={() => openEditExpense(e)} />
                          <IconButton
                            icon="delete"
                            label="Delete expense"
                            onClick={() => setConfirming({
                              title: 'Delete this expense?',
                              body: `This removes the unverified ${formatCurrency(e.amount)} recorded for ${e.category}.`,
                              confirmLabel: 'Delete expense',
                              run: () => financeApi.deleteExpense(e.id),
                            })}
                          />
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {expensesLoading && <tr><td colSpan={expenseCols} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {!expensesLoading && !expenses?.length && <tr><td colSpan={expenseCols} className="text-center py-10 text-gray-400">No expenses recorded</td></tr>}
            </tbody>
            {!!expenses?.length && (
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={3} className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total verified</td>
                  <td className="px-5 py-3 text-right"><Amount value={totalExpenses} side="debit" /></td>
                  {isGroupAdmin && <td />}
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
                    {!fd.isVerified && <PendingBadge label="Placement not verified" />}
                    {fd.status === 'Withdrawn' && !fd.isWithdrawalVerified && <PendingBadge label="Withdrawal not verified" />}
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
                    <>
                      <Button size="sm" className="mt-2" disabled={!fd.isVerified} onClick={() => openWithdraw(fd)}>Withdraw</Button>
                      {!fd.isVerified && (
                        <p className="text-xs text-amber-700 mt-1 max-w-[12rem]">
                          Verify the placement before withdrawing it.
                        </p>
                      )}
                    </>
                  )}
                  {/* Each movement is correctable until it is verified, and they are checked
                      separately — so the placement and the withdrawal are answered for apart. */}
                  {isGroupAdmin && !fd.isVerified && (
                    <div className="flex items-center gap-2 justify-end mt-2">
                      <IconButton icon="edit" label="Edit placement" onClick={() => openEditFd(fd)} />
                      <IconButton
                        icon="delete"
                        label="Delete placement"
                        onClick={() => setConfirming({
                          title: 'Delete this fixed deposit?',
                          body: `This removes the unverified ${formatCurrency(fd.amount)} placement with ${fd.institutionName}.`,
                          confirmLabel: 'Delete placement',
                          run: () => financeApi.deleteFixedDeposit(fd.id),
                        })}
                      />
                    </div>
                  )}
                  {isGroupAdmin && fd.status === 'Withdrawn' && !fd.isWithdrawalVerified && (
                    <div className="flex items-center gap-2 justify-end mt-2">
                      <IconButton icon="edit" label="Edit withdrawal" onClick={() => openWithdraw(fd)} />
                      <IconButton
                        icon="delete"
                        label="Take back withdrawal"
                        onClick={() => setConfirming({
                          title: 'Take back this withdrawal?',
                          body: `The deposit with ${fd.institutionName} goes back to being placed, as though it had never been withdrawn. The placement itself is untouched.`,
                          confirmLabel: 'Take it back',
                          run: () => financeApi.cancelWithdrawal(fd.id),
                        })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {fdsLoading && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">Loading...</div>}
          {!fdsLoading && !fds?.length && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm border border-gray-100">No fixed deposits</div>}
        </div>
      )}

      {tab === 'other-income' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-500">
            Money in that is neither savings nor a loan repayment — late joiner interest, a
            fine, a refund. It is income to the group, not savings owed back, so the remark is
            what says which kind it was.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Member', 'Paid on', 'Remarks', 'Amount', ...(isGroupAdmin ? ['Actions'] : [])].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${i === 3 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ljLoading && (
                  <tr><td colSpan={incomeCols} className="text-center py-10 text-gray-400">Loading...</td></tr>
                )}
                {!ljLoading && (otherIncome ?? []).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {r.memberName}
                      {!r.isVerified && <PendingBadge />}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(r.paidDate)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.remarks}</td>
                    <td className="px-5 py-3.5 text-right"><Amount value={r.amount} side={r.isVerified ? 'credit' : 'inactive'} /></td>
                    {isGroupAdmin && (
                      <td className="px-5 py-3.5">
                        {!r.isVerified && (
                          <div className="flex items-center gap-2">
                            <IconButton icon="edit" label="Edit receipt" onClick={() => openEditLj(r)} />
                            <IconButton
                              icon="delete"
                              label="Delete receipt"
                              onClick={() => setConfirming({
                                title: 'Delete this receipt?',
                                body: `This removes the unverified ${formatCurrency(r.amount)} recorded from ${r.memberName}.`,
                                confirmLabel: 'Delete receipt',
                                run: () => otherIncomingFundsApi.remove(r.id),
                              })}
                            />
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {!ljLoading && !otherIncome?.length && (
                  <tr><td colSpan={incomeCols} className="text-center py-10 text-gray-400">No incoming funds recorded</td></tr>
                )}
                {!!otherIncome?.length && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-5 py-3" colSpan={3}>Total verified</td>
                    <td className="px-5 py-3 text-right">
                      <Amount value={totalOtherIncome} side="credit" />
                    </td>
                    {isGroupAdmin && <td />}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddLj && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingLjId ? 'Edit Incoming Funds' : 'Record Incoming Funds'}
            </h2>
            {ljError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{ljError}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Member</label>
                <Select
                  value={ljForm.memberId}
                  onChange={e => setLjForm(f => ({ ...f, memberId: e.target.value }))}
                  className="mt-1 w-full"
                  disabled={!!editingLjId}
                >
                  <option value="">Select a member</option>
                  {(members ?? []).map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                </Select>
                {editingLjId && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Money in from someone else is a separate receipt, so this stays as it was.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                <input
                  type="number"
                  value={ljForm.amount}
                  onChange={e => setLjForm(f => ({ ...f, amount: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Paid on</label>
                <input
                  type="date"
                  value={ljForm.paidDate}
                  onChange={e => setLjForm(f => ({ ...f, paidDate: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Remarks</label>
                <input
                  value={ljForm.remarks}
                  onChange={e => setLjForm(f => ({ ...f, remarks: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. late joiner interest, fine, refund"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => { setShowAddLj(false); setEditingLjId(null); }}>Cancel</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={ljMutation.isPending || !ljForm.memberId || !ljForm.amount || !ljForm.remarks.trim()}
                onClick={() => { setLjError(''); ljMutation.mutate(); }}
              >
                {ljMutation.isPending ? 'Saving...' : editingLjId ? 'Save Changes' : 'Record'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={confirming.title}
          body={confirming.body}
          confirmLabel={confirming.confirmLabel}
          busyLabel="Deleting..."
          busy={removal.isPending}
          error={removalError}
          onConfirm={() => removal.mutate(confirming.run)}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
