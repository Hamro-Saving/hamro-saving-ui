import { bsPeriod } from '../../utils/format';
import type { Deposit } from '../../api/types';

/**
 * What this deposit was for. A monthly saving is identified by the BS period it covers;
 * anything else only has the remark, so that carries the row on its own rather than
 * sitting under an em dash.
 */
export default function DepositDescription({ deposit }: { deposit: Deposit }) {
  const period =
    deposit.depositMonth && deposit.depositYear
      ? bsPeriod(deposit.depositMonth, deposit.depositYear)
      : null;
  const remarks = deposit.notes?.trim();

  if (!period && !remarks) return <span className="text-gray-400">—</span>;

  return (
    <>
      <p className="text-gray-700">{period ?? remarks}</p>
      {period && remarks && (
        <p className="text-[11px] leading-tight text-gray-400 mt-1">{remarks}</p>
      )}
    </>
  );
}
