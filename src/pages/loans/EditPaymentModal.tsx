import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import Button from '../../components/Button';
import { formatCurrency, formatDate, todayIso } from '../../utils/format';
import type { Loan, LoanPayment } from '../../api/types';
import Amount from '../../components/Amount';

/**
 * Corrects a payment entered wrongly, while it is still unverified.
 *
 * Unlike recording one, nothing here is pre-filled from the loan's live position: that
 * position already includes this payment, so what is shown is what the payment itself
 * settled. The API applies the loan's payments again over the correction, so any interest
 * that ran after this one is re-settled from where the change leaves it.
 */
export default function EditPaymentModal({
  loan,
  payment,
  onClose,
}: {
  loan: Loan;
  payment: LoanPayment;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    paidDate: payment.paidDate.slice(0, 10),
    interestAmount: String(payment.interestAmount),
    principalAmount: String(payment.principalAmount),
    notes: payment.notes ?? '',
  });

  const save = useMutation({
    mutationFn: () => loansApi.updatePayment(payment.id, {
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
      setError(e.response?.data?.detail ?? 'Failed to save the payment'),
  });

  const interest = Number(form.interestAmount || 0);
  const principal = Number(form.principalAmount || 0);
  const total = interest + principal;
  // What the loan still owed before this payment: the principal it left, plus what it settled.
  const principalBefore = payment.outstandingPrincipalAfter + payment.principalAmount;
  const overPrincipal = principal > principalBefore + 0.01;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800">Edit Payment</h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          {loan.borrowerName} · recorded {formatDate(payment.createdAt)} · not yet verified
        </p>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Payment Date</label>
            <input
              type="date"
              max={todayIso()}
              value={form.paidDate}
              onChange={e => setForm(f => ({ ...f, paidDate: e.target.value }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-900">This payment settled</span>
              <span className="text-sm font-semibold text-blue-900">{formatCurrency(payment.interestOwedBefore)} interest</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-0.5">
              over {payment.daysAccrued} day{payment.daysAccrued === 1 ? '' : 's'}, against {formatCurrency(principalBefore)} of principal.
              Moving the date re-prices it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 font-medium">Interest</label>
              <input
                type="number"
                step="1"
                value={form.interestAmount}
                onChange={e => setForm(f => ({ ...f, interestAmount: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
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
              {overPrincipal && <p className="text-[11px] text-red-600 mt-0.5">More than was outstanding</p>}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-500">Total payment</span>
            <Amount value={total} side="credit" />
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
            disabled={save.isPending || total <= 0 || overPrincipal}
            onClick={() => { setError(''); save.mutate(); }}>
            {save.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
