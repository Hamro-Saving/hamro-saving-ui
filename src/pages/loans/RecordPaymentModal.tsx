import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { formatCurrency, formatDate, todayIso } from '../../utils/format';
import { daysSinceLastAccrual, interestAccruedOn } from './loanMath';
import type { Loan } from '../../api/types';

/**
 * Records a payment against a loan. Interest is pre-filled with exactly what the loan has
 * accrued to the chosen date; the admin can override it, and the API checks it again.
 */
export default function RecordPaymentModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    paidDate: todayIso(),
    interestAmount: String(interestAccruedOn(loan, todayIso())),
    principalAmount: '',
    notes: '',
    interestEdited: false,
  });

  const record = useMutation({
    mutationFn: () => loansApi.recordPayment(loan.id, {
      groupId: user?.groupId,
      principalAmount: Number(form.principalAmount || 0),
      interestAmount: Number(form.interestAmount || 0),
      // Midnight UTC so the API counts the same day the admin picked
      paidDate: `${form.paidDate}T00:00:00Z`,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['loan'] });
      qc.invalidateQueries({ queryKey: ['loan-payments'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      onClose();
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setError(e.response?.data?.detail ?? 'Failed to record payment'),
  });

  /** Re-prices the interest when the date moves, unless the admin has typed their own figure. */
  const changePaidDate = (paidDate: string) =>
    setForm(f => ({
      ...f,
      paidDate,
      interestAmount: f.interestEdited ? f.interestAmount : String(interestAccruedOn(loan, paidDate)),
    }));

  const accrued = interestAccruedOn(loan, form.paidDate);
  const days = loan.lastAccrualDate ? daysSinceLastAccrual(loan.lastAccrualDate, form.paidDate) : 0;
  const interest = Number(form.interestAmount || 0);
  const principal = Number(form.principalAmount || 0);
  const total = interest + principal;
  const overInterest = interest > accrued + 0.01;
  const overPrincipal = principal > loan.outstandingPrincipal + 0.01;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800">Record Payment</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          {loan.borrowerName} · {formatCurrency(loan.outstandingPrincipal)} principal outstanding at {loan.interestRate}%
        </p>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Payment Date</label>
            <input
              type="date"
              max={todayIso()}
              value={form.paidDate}
              onChange={e => changePaidDate(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-900">Interest accrued to this date</span>
              <span className="text-sm font-semibold text-blue-900">{formatCurrency(accrued)}</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-0.5">
              {days} day{days === 1 ? '' : 's'} × {formatCurrency(loan.dailyInterest)}/day
              {loan.unpaidInterest > 0 && ` + ${formatCurrency(loan.unpaidInterest)} carried forward`}
              {loan.lastAccrualDate && ` · since ${formatDate(loan.lastAccrualDate)}`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 font-medium">Interest</label>
              <input
                type="number"
                step="0.01"
                value={form.interestAmount}
                onChange={e => setForm(f => ({ ...f, interestAmount: e.target.value, interestEdited: true }))}
                className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${overInterest ? 'border-red-400' : 'border-gray-300'}`}
              />
              {overInterest && <p className="text-[11px] text-red-600 mt-0.5">More than has accrued</p>}
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Principal</label>
              <input
                type="number"
                step="0.01"
                value={form.principalAmount}
                onChange={e => setForm(f => ({ ...f, principalAmount: e.target.value }))}
                className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${overPrincipal ? 'border-red-400' : 'border-gray-300'}`}
              />
              {overPrincipal && <p className="text-[11px] text-red-600 mt-0.5">More than is outstanding</p>}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-500">Total payment</span>
            <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={record.isPending || total <= 0 || overInterest || overPrincipal}
            onClick={() => { setError(''); record.mutate(); }}>
            {record.isPending ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
