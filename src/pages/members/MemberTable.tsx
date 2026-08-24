import type { GroupRole, Member } from '../../api/types';
import Button from '../../components/Button';
import { formatDate } from '../../utils/format';

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
function AccountBadge({ member }: { member: Member }) {
  if (member.hasAccount) return null;
  return member.email
    ? <Badge className="bg-amber-100 text-amber-700">Invite pending</Badge>
    : <Badge className="bg-gray-100 text-gray-500">No login</Badge>;
}

interface MemberTableProps {
  rows: Member[];
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
export default function MemberTable({ rows, loading, canEdit, emptyLabel, onEdit, onDelete, onResend, resendingId }: MemberTableProps) {
  const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', ...(canEdit ? ['Actions'] : [])];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
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
                    <span className="font-medium text-gray-800 whitespace-nowrap">{m.fullName}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{m.email || '—'}</td>
                <td className="px-5 py-3.5 text-gray-600">{m.phoneNumber || '—'}</td>
                <td className="px-5 py-3.5">
                  <Badge className={ROLE_STYLES[m.groupRole]}>{ROLE_LABELS[m.groupRole]}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Badge className={m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <AccountBadge member={m} />
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                {canEdit && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => onEdit(m)}>Edit</Button>
                      {!m.hasAccount && m.email && (
                        <Button size="sm" variant="warning" onClick={() => onResend(m)} disabled={resendingId === m.id}>
                          {resendingId === m.id ? 'Sending...' : 'Resend'}
                        </Button>
                      )}
                      {m.isActive && (
                        <Button size="sm" variant="danger" onClick={() => onDelete(m)}>Delete</Button>
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
