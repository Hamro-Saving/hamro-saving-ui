import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loansApi } from '../../api/finance';

/**
 * The admin/member actions on a single loan. Each caller gets its own mutations, so a
 * pending state belongs to the card or page that fired it.
 */
export function useLoanActions(loanId: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['loans'] });
    qc.invalidateQueries({ queryKey: ['loan'] });
    qc.invalidateQueries({ queryKey: ['loan-payments'] });
    qc.invalidateQueries({ queryKey: ['finance-summary'] });
  };

  const approve = useMutation({ mutationFn: () => loansApi.approveLoan(loanId), onSuccess: invalidate });
  const decline = useMutation({ mutationFn: () => loansApi.declineLoan(loanId), onSuccess: invalidate });
  const cancel = useMutation({ mutationFn: () => loansApi.cancelLoan(loanId), onSuccess: invalidate });
  const verifyPayment = useMutation({ mutationFn: (paymentId: string) => loansApi.verifyPayment(paymentId), onSuccess: invalidate });

  const busy = approve.isPending || decline.isPending || cancel.isPending;

  return { approve, decline, cancel, verifyPayment, busy };
}
