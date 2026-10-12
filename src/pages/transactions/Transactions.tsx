import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Download, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react';
import { transactionsApi } from '../../api/finance';
import { membersApi } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, todayIso } from '../../utils/format';
import type { TransactionType } from '../../api/types';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import { TYPE_LABELS, TRANSACTION_TYPES } from './transactionLabels';
import Amount, { SideChip } from '../../components/Amount';
import { SIDE_TEXT, type LedgerSide } from '../../utils/ledgerSide';
import { fetchAllTransactions, exportCsv, exportPdf } from './exportTransactions';

type Range = 'thisYear' | 'last30' | 'last90' | 'lastYear' | 'all' | 'custom';

const RANGE_LABELS: Record<Range, string> = {
  thisYear: 'This year',
  last30: 'Last 30 days',
  last90: 'Last 3 months',
  lastYear: 'Last year',
  all: 'All time',
  custom: 'Custom range',
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

/** Start and end dates for a preset, as YYYY-MM-DD. Empty means unbounded. */
function rangeBounds(range: Range): { from: string; to: string } {
  const year = new Date().getFullYear();
  switch (range) {
    case 'thisYear': return { from: `${year}-01-01`, to: '' };
    case 'last30': return { from: daysAgo(30), to: '' };
    case 'last90': return { from: daysAgo(90), to: '' };
    case 'lastYear': return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    default: return { from: '', to: '' };
  }
}

function Stat({ label, value, tone }: { label: string; value: number; tone: LedgerSide }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${SIDE_TEXT[tone]}`}>{formatCurrency(value)}</p>
    </div>
  );
}

const EXPORT_FORMATS = [
  { format: 'pdf', label: 'PDF document', hint: 'Laid out like this table', Icon: FileText, tile: 'bg-rose-50 text-rose-600' },
  { format: 'csv', label: 'CSV spreadsheet', hint: 'Opens in Excel or Sheets', Icon: FileSpreadsheet, tile: 'bg-emerald-50 text-emerald-600' },
] as const;

type ExportFormat = (typeof EXPORT_FORMATS)[number]['format'];

/** One Export button that asks which format to export in. */
function ExportMenu({ disabled, busy, onExport }: { disabled: boolean; busy: boolean; onExport: (f: ExportFormat) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative sm:ml-auto">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? 'Exporting...' : 'Export'}
        <ChevronDown className={`w-4 h-4 text-blue-200 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg ring-1 ring-black/5 p-1.5 z-20">
          <p className="px-2.5 pt-1 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Export as</p>
          {EXPORT_FORMATS.map(({ format, label, hint, Icon, tile }) => (
            <button
              key={format}
              role="menuitem"
              onClick={() => { setOpen(false); onExport(format); }}
              className="w-full flex items-center gap-3 text-left px-2.5 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${tile}`}>
                <Icon className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-sm font-medium text-gray-800">{label}</span>
                <span className="block text-xs text-gray-400">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Transactions() {
  const { user } = useAuth();
  const groupId = user?.activeGroupId;

  const [type, setType] = useState<TransactionType | ''>('');
  const [side, setSide] = useState<'' | 'Debit' | 'Credit'>('');
  const [memberId, setMemberId] = useState('');

  // Opens on the current year: a group's whole history is rarely what you want first.
  const [range, setRange] = useState<Range>('thisYear');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { from, to } = range === 'custom' ? custom : rangeBounds(range);

  const { data: members } = useQuery({
    queryKey: ['members', groupId],
    queryFn: () => membersApi.getAll({ roles: ['Member', 'Admin'] }),
  });
  const { data: nonMembers } = useQuery({
    queryKey: ['non-members', groupId],
    queryFn: () => membersApi.getAll({ roles: ['NonMember'] }),
  });

  const filters = {
    type: type || undefined,
    side: side || undefined,
    memberId: memberId || undefined,
    from: from || undefined,
    // The bound is a date, so stretch it to the end of that day or same-day
    // transactions would fall outside the range.
    to: to ? `${to}T23:59:59` : undefined,
  };

  const { data: paged, isLoading } = useQuery({
    queryKey: ['transactions', groupId, type, side, memberId, from, to, page, pageSize],
    queryFn: () => transactionsApi.getAll({ ...filters, page, pageSize }),
  });

  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState('');

  /** Exports everything the filters match, across all pages. */
  const runExport = async (format: ExportFormat) => {
    setExporting(format);
    setExportError('');
    try {
      const all = await fetchAllTransactions(filters);
      const fileName = `transactions-${todayIso()}`;
      // Open-ended ranges are stated as the dates they actually covered: from the first
      // transaction exported, up to today.
      const covered = {
        from: from || all.map(t => t.occurredAt.slice(0, 10)).sort()[0] || todayIso(),
        to: to || todayIso(),
      };
      if (format === 'csv') {
        exportCsv(all, fileName, covered);
      } else {
        const person = [...(members ?? []), ...(nonMembers ?? [])].find(m => m.id === memberId)?.fullName;
        // Parsed as local midnight, so the date shown is the one chosen in every time zone.
        const dates = `${formatDate(`${covered.from}T00:00:00`)} to ${formatDate(`${covered.to}T00:00:00`)}`;
        const subtitle = [
          dates,
          side && `${side} only`,
          type && TYPE_LABELS[type],
          person,
          `${all.length} transaction${all.length === 1 ? '' : 's'}`,
        ].filter(Boolean).join(' · ');
        await exportPdf(all, fileName, 'Transactions', subtitle);
      }
    } catch {
      setExportError('Could not export the transactions. Try again.');
    } finally {
      setExporting(null);
    }
  };

  const { data: totals } = useQuery({
    queryKey: ['trial-balance', groupId],
    queryFn: () => transactionsApi.getTrialBalance(),
  });

  const rows = paged?.items ?? [];

  /** Any change to what is being filtered starts again from the first page. */
  const refilter = <T,>(set: (v: T) => void) => (value: T) => { set(value); setPage(1); };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Every movement of money in and out of the group
        </p>
      </div>

      {totals && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Credit — money in" value={totals.moneyIn} tone="credit" />
            <Stat label="Debit — money out" value={totals.moneyOut} tone="debit" />
            <Stat label="Cash in hand" value={totals.ledgerCash} tone="cash" />
          </div>
          <p className="-mt-3 text-xs text-gray-400">
            Whole history, so cash in hand still reconciles. The date filter applies to the list below.
          </p>

          {/* Cash rebuilt from these transactions, checked against the figure the finance
              page works out separately. A gap means something was recorded in one place
              and not the other. */}
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
              totals.cashDifference === 0
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {totals.cashDifference === 0 ? (
              <>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>These transactions add up to the cash the finance page reports.</span>
              </>
            ) : (
              <span>
                Off by <strong>{formatCurrency(totals.cashDifference)}</strong> against the finance page — a transaction is missing or duplicated.
              </span>
            )}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={range} onChange={e => refilter(setRange)(e.target.value as Range)}>
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
            <option key={r} value={r}>{RANGE_LABELS[r]}</option>
          ))}
        </Select>

        <Select value={side} onChange={e => refilter(setSide)(e.target.value as '' | 'Debit' | 'Credit')}>
          <option value="">Debit and credit</option>
          <option value="Credit">Credit only</option>
          <option value="Debit">Debit only</option>
        </Select>

        <Select value={type} onChange={e => refilter(setType)(e.target.value as TransactionType | '')}>
          <option value="">All types</option>
          {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </Select>

        <Select value={memberId} onChange={e => refilter(setMemberId)(e.target.value)}>
          <option value="">Everyone</option>
          {!!members?.length && (
            <optgroup label="Members">
              {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </optgroup>
          )}
          {!!nonMembers?.length && (
            <optgroup label="Non-members">
              {nonMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </optgroup>
          )}
        </Select>

        <ExportMenu disabled={!paged?.total} busy={!!exporting} onExport={runExport} />
      </div>

      {range === 'custom' && (
        <div className="-mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            From
            <input
              type="date"
              value={custom.from}
              onChange={e => { setCustom(c => ({ ...c, from: e.target.value })); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            To
            <input
              type="date"
              value={custom.to}
              onChange={e => { setCustom(c => ({ ...c, to: e.target.value })); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
            />
          </label>
        </div>
      )}

      {exportError && <p className="-mt-3 text-sm text-red-600">{exportError}</p>}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Name', 'Description', 'Type', 'Amount'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${i === 4 ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
              )}

              {!isLoading && rows.map(t => {
                const tone = t.side === 'Credit' ? 'credit' : 'debit';
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(t.occurredAt)}</td>
                    <td className="px-5 py-3 text-gray-800 whitespace-nowrap">
                      {t.memberName ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{t.description}</p>
                      <p className="text-xs text-gray-400">{TYPE_LABELS[t.type]}</p>
                    </td>
                    <td className="px-5 py-3"><SideChip side={tone}>{t.side}</SideChip></td>
                    <td className="px-5 py-3 text-right">
                      <Amount value={t.amount} side={tone} />
                    </td>
                  </tr>
                );
              })}

              {!isLoading && !rows.length && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {!!paged?.total && (
          <div className="px-5 py-3 border-t border-gray-100">
            <Pagination
              page={paged.page}
              pageSize={paged.pageSize}
              total={paged.total}
              onPageChange={setPage}
              onPageSizeChange={size => { setPageSize(size); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
