import type { GroupRole, Member } from '../../api/types';
import Amount from '../../components/Amount';
import { formatCurrency, formatDate } from '../../utils/format';
import IconButton from '../../components/IconButton';

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

/** Up to two initials, from however many names the person has. */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
}

/**
 * Whether this person can sign in. Everyone with an email is invited, so a missing
 * account means the invite is outstanding; someone recorded without an email — only
 * ever a walk-in borrower — was never going to have one.
 */
function AccountNote({ member }: { member: Member }) {
  if (member.hasAccount) return null;
  return member.email
    ? <span className="text-[11px] leading-none text-amber-600">Invite pending</span>
    : <span className="text-[11px] leading-none text-gray-400">No login</span>;
}

interface MemberTableProps {
  rows: Member[];
  /** Non-members owe rather than deposit, so the money column changes with the list. */
  money?: 'deposited' | 'owed';
  loading: boolean;
  canEdit: boolean;
  emptyLabel: string;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onResend: (member: Member) => void;
  resendingId?: string | null;
}

/**
 * The group roster. Members and non-members are the same record differing only in role,
 * so they share one table rather than two that drift apart.
 */
export default function MemberTable({ rows, loading, canEdit, emptyLabel, onEdit, onDelete, onResend, resendingId, money = 'deposited' }: MemberTableProps) {
  const moneyHeader = money === 'owed' ? 'Owed' : 'Deposited';
  const headers = ['Name', 'Contact', moneyHeader, 'Status', ...(canEdit ? ['Actions'] : [])];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(h => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${h === moneyHeader ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={headers.length} className="text-center py-10 text-gray-400">Loading...</td></tr>
            )}

            {!loading && rows.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                      {initials(m.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 whitespace-nowrap">{m.fullName}</p>
                      <Badge className={`mt-0.5 inline-block ${ROLE_STYLES[m.groupRole]}`}>
                        {ROLE_LABELS[m.groupRole]}
                      </Badge>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {m.email || m.phoneNumber ? (
                    <>
                      <p className="text-gray-600">{m.email || m.phoneNumber}</p>
                      {m.email && m.phoneNumber && (
                        <p className="text-[11px] leading-none text-gray-400 mt-1">{m.phoneNumber}</p>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {money === 'owed' ? (
                    <>
                      <Amount value={m.outstandingPrincipal} side="debit" hideZero />
                      {m.outstandingInterest > 0 && (
                        <p className="text-[11px] leading-none text-gray-400 mt-1">
                          + {formatCurrency(m.outstandingInterest)} interest
                        </p>
                      )}
                    </>
                  ) : (
                    <Amount value={m.totalDeposits} side="credit" hideZero />
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col items-start gap-1">
                    <Badge className={m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <AccountNote member={m} />
                    <span className="text-[11px] leading-none text-gray-400 whitespace-nowrap">
                      Joined {formatDate(m.createdAt)}
                    </span>
                  </div>
                </td>
                {canEdit && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <IconButton icon="edit" label="Edit member" onClick={() => onEdit(m)} />
                      {!m.hasAccount && m.email && (
                        <IconButton
                          icon="resend"
                          label={resendingId === m.id ? 'Sending invite...' : 'Resend invite'}
                          variant="warning"
                          onClick={() => onResend(m)}
                          disabled={resendingId === m.id}
                        />
                      )}
                      {m.isActive && (
                        <IconButton icon="delete" label="Delete member" variant="danger" onClick={() => onDelete(m)} />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {!loading && !rows.length && (
              <tr><td colSpan={headers.length} className="text-center py-10 text-gray-400">{emptyLabel}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
