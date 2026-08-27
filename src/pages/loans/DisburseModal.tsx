import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';
import Button from '../../components/Button';
import Amount from '../../components/Amount';
import { formatCurrency, todayIso } from '../../utils/format';
import type { Loan } from '../../api/types';

export type DisburseMode = 'disburse' | 'force';

/**
 * Pays a loan out. Both figures are deliberately a form rather than an inline confirm: the
 * date used to sit beside the button where it was easy to accept without reading, and the
 * amount now needs the same deliberate look, since handing over less rewrites the loan.
 */
export default function DisburseModal({ loan, mode, onClose }: { loan: Loan; mode: DisburseMode; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  // Defaults to the whole request on today's date — the ordinary case goes through untouched.
  // Backdating is for a loan the group made before it kept records here.
  const [disbursedOn, setDisbursedOn] = useState(todayIso());
  const [amount, setAmount] = useState(String(loan.amount));

  const disburse = useMutation({
    mutationFn: () => {
      const body = { disbursedOn, disbursedAmount: Number(amount) };
      return mode === 'force'
        ? loansApi.forceDisburse(loan.id, body)
        : loansApi.completeDisbursement(loan.id, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['loan'] });
      qc.invalidateQueries({ queryKey: ['loan-payments'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
      onClose();
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setError(e.response?.data?.detail ?? 'Could not disburse this loan.'),
  });

  const entered = Number(amount || 0);
  // The group may hand over less than was asked, but never more than the members carried.
  const overRequest = entered > loan.amount;
  const isShort = entered > 0 && entered < loan.amount;
  const valid = entered > 0 && !overRequest && !!disbursedOn;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800">
          {mode === 'force' ? 'Force Disburse Loan' : 'Disburse Loan'}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          {loan.borrowerName} · {formatCurrency(loan.amount)} approved at {loan.interestRate}%
        </p>

        {mode === 'force' && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            The members have not voted this loan through. Paying it out is on your authority as an admin.
          </p>
        )}

        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Disbursed Amount (NPR)</label>
            <input
              type="number"
              step="1"
              max={loan.amount}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm ${overRequest ? 'border-red-400' : 'border-gray-300'}`}
            />
            {overRequest && (
              <p className="text-[11px] text-red-600 mt-0.5">
                More than the {formatCurrency(loan.amount)} this loan was approved for.
              </p>
            )}
            {isShort && (
              <p className="text-[11px] text-amber-600 mt-0.5">
                {formatCurrency(loan.amount - entered)} less than requested — the loan becomes a{' '}
                {formatCurrency(entered)} loan, and interest runs on that.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-600 font-medium">Disbursed On</label>
            <input
              type="date"
              max={todayIso()}
              value={disbursedOn}
              onChange={e => setDisbursedOn(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-0.5">Interest starts running from this date.</p>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-500">Leaving the group</span>
            <Amount value={entered} side="debit" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Button className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant={mode === 'force' ? 'warning' : 'primary'}
            className="flex-1"
            disabled={disburse.isPending || !valid}
            onClick={() => { setError(''); disburse.mutate(); }}>
            {disburse.isPending ? 'Saving...' : mode === 'force' ? 'Force disburse' : 'Confirm disbursement'}
          </Button>
        </div>
      </div>
    </div>
  );
}
