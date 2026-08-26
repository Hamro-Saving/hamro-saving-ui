import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { membersApi } from '../../api/groups';
import { depositsApi, loansApi } from '../../api/finance';
import { formatCurrency, formatDate, spaceCamelCase } from '../../utils/format';
import { STATUS_COLORS, isLive } from '../loans/loanMath';
import DepositDescription from '../savings/DepositDescription';
import Amount from '../../components/Amount';
import Button from '../../components/Button';
import KpiCard from '../../components/KpiCard';
import type { GroupRole } from '../../api/types';

const ROLE_STYLES: Record<GroupRole, string> = {
  Admin: 'bg-purple-100 text-purple-700',
  Member: 'bg-blue-100 text-blue-700',
  NonMember: 'bg-slate-100 text-slate-600',
};

const ROLE_LABELS: Record<GroupRole, string> = {
  Admin: 'Admin',
  Member: 'Member',
  NonMember: 'Non-Member',
};

/** How many rows of a history list are shown before the reader has to ask for the rest. */
const PREVIEW_ROWS = 8;

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <span className="text-xs text-gray-400">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="px-5 py-8 text-center text-sm text-gray-400">{label}</p>;
}

/** "Show all" for a list that is only previewed, hidden once everything is on screen. */
function MoreRow({ shown, total, onShowAll }: { shown: number; total: number; onShowAll: () => void }) {
  if (shown >= total) return null;
  return (
    <div className="border-t border-gray-100 px-5 py-3 text-center">
      <button onClick={onShowAll} className="text-xs font-medium text-blue-600 hover:text-blue-700">
        Show all {total}
      </button>
    </div>
  );
}

/**
 * Everything the group knows about one person's money: what they have put in, what they
 * have out on loan and what that has cost in interest. Read-only — the roster is edited
 * on the members list, and a loan is worked on its own page.
 */
export default function MemberDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [allDeposits, setAllDeposits] = useState(false);
  const [allLoans, setAllLoans] = useState(false);

  const { data: member, isLoading, isError } = useQuery({
    queryKey: ['member', id],
    queryFn: () => membersApi.getById(id),
    enabled: !!id,
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans', 'borrower', id],
    queryFn: () => loansApi.getAll({ borrowerId: id }),
    enabled: !!id,
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', 'member', id],
    queryFn: () => depositsApi.getDeposits({ memberId: id }),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6"><div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-400">Loading member...</div></div>;
  }

  if (isError || !member) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center">
          <p className="text-gray-500">This member could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/members')}>Back to members</Button>
        </div>
      </div>
    );
  }

  // Pending deposits are money in hand but not yet on the books, so they are shown apart
  // from the total rather than folded into it — the total must match the finance page.
  const pendingDeposits = deposits.filter(d => !d.isVerified).reduce((sum, d) => sum + d.amount, 0);
  const liveLoans = loans.filter(isLive);
  const principalRepaid = loans.reduce((sum, l) => sum + l.totalPrincipalPaid, 0);
  const interestPaid = loans.reduce((sum, l) => sum + l.totalInterestPaid, 0);
  const owed = member.outstandingPrincipal + member.outstandingInterest;

  const shownLoans = allLoans ? loans : loans.slice(0, PREVIEW_ROWS);
  const shownDeposits = allDeposits ? deposits : deposits.slice(0, PREVIEW_ROWS);

  const contact = [member.email, member.phoneNumber].filter(Boolean).join(' · ');

  return (
    <div className="p-6 space-y-6">
      <Button size="sm" onClick={() => navigate('/members')} className="!px-2.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to members
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{member.fullName}</h1>
            <Badge className={ROLE_STYLES[member.groupRole]}>{ROLE_LABELS[member.groupRole]}</Badge>
            <Badge className={member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}>
              {member.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {contact || 'No contact details'} · Joined {formatDate(member.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Deposits"
          value={formatCurrency(member.totalDeposits)}
          side="credit"
          sub={pendingDeposits > 0 ? `${formatCurrency(pendingDeposits)} awaiting verification` : 'Verified deposits'}
        />
        <KpiCard
          label="Outstanding Loan"
          value={formatCurrency(member.outstandingPrincipal)}
          side={member.outstandingPrincipal > 0 ? 'debit' : 'neutral'}
          sub={`${liveLoans.length} live loan${liveLoans.length === 1 ? '' : 's'}`}
        />
        <KpiCard
          label="Interest Owed"
          value={formatCurrency(member.outstandingInterest)}
          side={member.outstandingInterest > 0 ? 'debit' : 'neutral'}
          sub="Accrued to today"
        />
        <KpiCard
          label="Total Payable"
          value={formatCurrency(owed)}
          side={owed > 0 ? 'debit' : 'neutral'}
          sub="Principal plus interest owed"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        {[
          { label: 'Loans taken', value: String(loans.length) },
          { label: 'Principal repaid', value: formatCurrency(principalRepaid) },
          { label: 'Interest paid', value: formatCurrency(interestPaid) },
        ].map(s => (
          <div key={s.label} className="min-w-0">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className="mt-1 truncate text-lg font-bold tabular-nums text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <Section title="Loans" count={loans.length}>
        {loans.length === 0 ? (
          <Empty label="This member has never taken a loan." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Loan', 'Status', 'Outstanding', 'Interest owed'].map((h, i) => (
                      <th key={h} className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shownLoans.map(l => (
                    <tr
                      key={l.id}
                      onClick={() => navigate(`/loans/${l.id}`)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800">{formatCurrency(l.amount)}</p>
                        <p className="mt-0.5 text-[11px] leading-none text-gray-400">
                          {l.interestRate}% · {l.disbursedAt ? `Disbursed ${formatDate(l.disbursedAt)}` : `Requested ${formatDate(l.createdAt)}`}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge className={STATUS_COLORS[l.status]}>{l.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Amount value={l.outstandingPrincipal} side={isLive(l) ? 'debit' : 'inactive'} hideZero />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Amount value={isLive(l) ? l.accruedInterest : 0} side="debit" hideZero />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MoreRow shown={shownLoans.length} total={loans.length} onShowAll={() => setAllLoans(true)} />
          </>
        )}
      </Section>

      <Section title="Deposits" count={deposits.length}>
        {deposits.length === 0 ? (
          <Empty label="No deposits recorded for this member." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Description', 'Type', 'Amount'].map((h, i) => (
                      <th key={h} className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {shownDeposits.map(d => (
                    <tr key={d.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{formatDate(d.depositDate)}</td>
                      <td className="px-5 py-3.5"><DepositDescription deposit={d} /></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{spaceCamelCase(d.type)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Amount value={d.amount} side="credit" />
                        {!d.isVerified && <p className="mt-1 text-[11px] leading-none text-amber-600">Pending</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MoreRow shown={shownDeposits.length} total={deposits.length} onShowAll={() => setAllDeposits(true)} />
          </>
        )}
      </Section>
    </div>
  );
}
