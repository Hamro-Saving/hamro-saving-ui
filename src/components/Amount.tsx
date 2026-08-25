import { formatCurrency } from '../utils/format';
import { SIDE_CHIP, SIDE_TEXT, type LedgerSide } from '../utils/ledgerSide';

interface AmountProps {
  value: number;
  side?: LedgerSide;
  /** Renders a dash rather than a zero, for ledger columns where one side is empty. */
  hideZero?: boolean;
  className?: string;
}

/** A money figure coloured by the side of the ledger it belongs to. */
export default function Amount({ value, side = 'neutral', hideZero = false, className = '' }: AmountProps) {
  if (hideZero && value === 0) return <span className="text-gray-300">—</span>;

  return (
    <span className={`font-semibold tabular-nums whitespace-nowrap ${SIDE_TEXT[side]} ${className}`}>
      {formatCurrency(value)}
    </span>
  );
}

/** The small account tag beside a figure, using the same two colours. */
export function SideChip({ side, children }: { side: LedgerSide; children: React.ReactNode }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${SIDE_CHIP[side]}`}>
      {children}
    </span>
  );
}
