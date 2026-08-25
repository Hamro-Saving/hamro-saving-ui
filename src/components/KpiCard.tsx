import React from 'react';
import { SIDE_TEXT, type LedgerSide } from '../utils/ledgerSide';

interface KpiCardProps {
  label: string;
  value: string | number;
  /** Colours the figure by the side of the books it belongs to. */
  side?: LedgerSide;
  sub?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo';
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

export default function KpiCard({ label, value, side = 'neutral', sub, icon, color = 'blue' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium min-w-0 truncate">{label}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-xl font-bold tracking-tight tabular-nums leading-tight ${SIDE_TEXT[side]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
