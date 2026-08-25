import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import MemberTable from './MemberTable';
import type { GroupRole, Member } from '../../api/types';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';

type Tab = 'members' | 'non-members';

export default function Members() {
  const { user, isGroupAdmin } = useAuth();
  // Editing the roster is group business, so it is the group role that decides.
  const canEdit = isGroupAdmin;
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('members');

  // Add member state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', address: '' });
  const [addError, setAddError] = useState('');

  // Edit member state
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', address: '', groupRole: 'Member' as GroupRole });
  const [editError, setEditError] = useState('');

  // Delete member state
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  // Add non-member state
  const [showAddNm, setShowAddNm] = useState(false);
  const [addNmForm, setAddNmForm] = useState({ fullName: '', email: '', phoneNumber: '', address: '' });
  const [addNmError, setAddNmError] = useState('');

  // Edit non-member state
  const [editNm, setEditNm] = useState<Member | null>(null);
  const [editNmForm, setEditNmForm] = useState({ fullName: '', email: '', phoneNumber: '', address: '' });
  const [editNmError, setEditNmError] = useState('');

  // Delete non-member state
  const [deleteNmId, setDeleteNmId] = useState<string | null>(null);

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', user?.activeGroupId],
    queryFn: () => membersApi.getAll({ roles: ['Member', 'Admin'] }),
  });

  const { data: nonMembers = [], isLoading: nmLoading } = useQuery({
    queryKey: ['non-members', user?.activeGroupId],
    queryFn: () => membersApi.getAll({ roles: ['NonMember'] }),
    enabled: tab === 'non-members' || canEdit,
  });

  // Member mutations
  const addMutation = useMutation({
    mutationFn: () => membersApi.create({
      groupRole: 'Member',
      firstName: addForm.firstName,
      lastName: addForm.lastName,
      email: addForm.email,
      phoneNumber: addForm.phoneNumber || null,
      address: addForm.address || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setShowAdd(false); setAddForm({ firstName: '', lastName: '', email: '', phoneNumber: '', address: '' }); setAddError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setAddError(e.response?.data?.detail ?? 'Failed to add member'),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      await membersApi.update(editMember!.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName || null,
        email: editForm.email || null,
        phoneNumber: editForm.phoneNumber || null,
        address: editForm.address || null,
      });
      // The group role has its own endpoints; a profile update never carries it.
      if (editForm.groupRole !== editMember!.groupRole) {
        await (editForm.groupRole === 'Admin'
          ? membersApi.assignAdmin(editMember!.id)
          : membersApi.removeAdmin(editMember!.id));
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setEditMember(null); setEditError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setEditError(e.response?.data?.detail ?? 'Failed to update member'),
  });

  // Shared by both tabs: anyone with an email but no account yet can be re-invited.
  // A row action has no modal to report into, so the outcome goes to a page banner —
  // otherwise a failed send looks identical to nothing happening.
  const [resendNotice, setResendNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const resendMutation = useMutation({
    mutationFn: (id: string) => membersApi.resendInvite(id),
    onSuccess: (_data, id) => {
      const name = [...members, ...nonMembers].find(m => m.id === id)?.fullName ?? 'the member';
      setResendNotice({ ok: true, text: `Invite email sent to ${name}.` });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['non-members'] });
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setResendNotice({ ok: false, text: e.response?.data?.detail ?? 'Could not resend the invite.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setDeleteMemberId(null); },
  });

  // Non-member mutations
  const addNmMutation = useMutation({
    mutationFn: () => membersApi.create({
      groupRole: 'NonMember',
      firstName: addNmForm.fullName,
      email: addNmForm.email || null,
      phoneNumber: addNmForm.phoneNumber || null,
      address: addNmForm.address || null,
      groupId: user?.activeGroupId,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['non-members'] }); setShowAddNm(false); setAddNmForm({ fullName: '', email: '', phoneNumber: '', address: '' }); setAddNmError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setAddNmError(e.response?.data?.detail ?? 'Failed to add non-member'),
  });

  const editNmMutation = useMutation({
    mutationFn: () => membersApi.update(editNm!.id, {
      firstName: editNmForm.fullName,
      email: editNmForm.email || null,
      phoneNumber: editNmForm.phoneNumber || null,
      address: editNmForm.address || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['non-members'] }); setEditNm(null); setEditNmError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setEditNmError(e.response?.data?.detail ?? 'Failed to update non-member'),
  });

  const deleteNmMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['non-members'] }); setDeleteNmId(null); },
  });

  const openEditMember = (m: Member) => { setEditMember(m); setEditForm({ firstName: m.firstName, lastName: m.lastName ?? '', email: m.email ?? '', phoneNumber: m.phoneNumber ?? '', address: m.address ?? '', groupRole: m.groupRole }); setEditError(''); };
  const openEditNm = (n: Member) => { setEditNm(n); setEditNmForm({ fullName: n.firstName, email: n.email ?? '', phoneNumber: n.phoneNumber ?? '', address: n.address ?? '' }); setEditNmError(''); };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm mt-0.5">{members.length} members · {nonMembers.length} non-members</p>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            onClick={() => tab === 'members' ? setShowAdd(true) : setShowAddNm(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add {tab === 'members' ? 'Member' : 'Non-Member'}
          </Button>
        )}
      </div>

      {resendNotice && (
        <div className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm ${resendNotice.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span>{resendNotice.text}</span>
          <button onClick={() => setResendNotice(null)} className="text-current opacity-60 hover:opacity-100 leading-none" aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('members')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'members' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Members ({members.length})
        </button>
        <button onClick={() => setTab('non-members')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'non-members' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Non-Members ({nonMembers.length})
        </button>
      </div>

      {tab === 'members' && (
        <MemberTable
          rows={members}
          loading={membersLoading}
          canEdit={canEdit}
          emptyLabel="No members found"
          onEdit={openEditMember}
          onDelete={m => setDeleteMemberId(m.id)}
          onResend={r => resendMutation.mutate(r.id)}
          resendingId={resendMutation.isPending ? resendMutation.variables : null}
        />
      )}

      {tab === 'non-members' && (
        <MemberTable
          rows={nonMembers}
          loading={nmLoading}
          canEdit={canEdit}
          emptyLabel="No non-members found"
          money="owed"
          onEdit={openEditNm}
          onDelete={n => setDeleteNmId(n.id)}
          onResend={r => resendMutation.mutate(r.id)}
          resendingId={resendMutation.isPending ? resendMutation.variables : null}
        />
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Member</h2>
            {addError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{addError}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 font-medium">First Name</label>
                  <input value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Last Name</label>
                  <input value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-gray-600 font-medium">Email</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Phone (optional)</label>
                <input value={addForm.phoneNumber} onChange={e => setAddForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="+977..." /></div>
              <div><label className="text-xs text-gray-600 font-medium">Address (optional)</label>
                <input value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <p className="text-xs text-gray-400">An invitation email will be sent so the member can set their own password.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Member</h2>
            {editError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{editError}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 font-medium">First Name</label>
                  <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="text-xs text-gray-600 font-medium">Last Name</label>
                  <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="text-xs text-gray-600 font-medium">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Phone (optional)</label>
                <input value={editForm.phoneNumber} onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="+977..." /></div>
              <div><label className="text-xs text-gray-600 font-medium">Address (optional)</label>
                <input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Role</label>
                <Select value={editForm.groupRole} onChange={e => setEditForm(f => ({ ...f, groupRole: e.target.value as GroupRole }))} className="mt-1 w-full">
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                </Select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setEditMember(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirm */}
      {deleteMemberId && (
        <ConfirmDialog
          title="Delete this member?"
          body="This permanently removes the member and their access. It cannot be undone."
          confirmLabel="Delete"
          busyLabel="Deleting..."
          busy={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteMemberId)}
          onCancel={() => setDeleteMemberId(null)}
        />
      )}

      {/* Add Non-Member Modal */}
      {showAddNm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Non-Member</h2>
            {addNmError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{addNmError}</p>}
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 font-medium">Full Name</label>
                <input value={addNmForm.fullName} onChange={e => setAddNmForm(f => ({ ...f, fullName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Email (optional)</label>
                <input type="email" value={addNmForm.email} onChange={e => setAddNmForm(f => ({ ...f, email: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Phone (optional)</label>
                <input value={addNmForm.phoneNumber} onChange={e => setAddNmForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Address (optional)</label>
                <input value={addNmForm.address} onChange={e => setAddNmForm(f => ({ ...f, address: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <p className="text-xs text-gray-400">Give an email and they'll be invited to sign in and follow their own loan. Without one, they're recorded as a borrower with no account.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setShowAddNm(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => addNmMutation.mutate()} disabled={addNmMutation.isPending}>
                {addNmMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Non-Member Modal */}
      {editNm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Non-Member</h2>
            {editNmError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{editNmError}</p>}
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 font-medium">Full Name</label>
                <input value={editNmForm.fullName} onChange={e => setEditNmForm(f => ({ ...f, fullName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Email (optional)</label>
                <input type="email" value={editNmForm.email} onChange={e => setEditNmForm(f => ({ ...f, email: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Phone (optional)</label>
                <input value={editNmForm.phoneNumber} onChange={e => setEditNmForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-600 font-medium">Address (optional)</label>
                <input value={editNmForm.address} onChange={e => setEditNmForm(f => ({ ...f, address: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setEditNm(null)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => editNmMutation.mutate()} disabled={editNmMutation.isPending}>
                {editNmMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Non-Member Confirm */}
      {deleteNmId && (
        <ConfirmDialog
          title="Delete this non-member?"
          body="This permanently removes the borrower. It cannot be undone."
          confirmLabel="Delete"
          busyLabel="Deleting..."
          busy={deleteNmMutation.isPending}
          onConfirm={() => deleteNmMutation.mutate(deleteNmId)}
          onCancel={() => setDeleteNmId(null)}
        />
      )}
    </div>
  );
}
