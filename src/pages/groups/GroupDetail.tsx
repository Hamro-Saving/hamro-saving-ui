import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi, membersApi } from '../../api/groups';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import type { Group } from '../../api/types';

function ActionMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!btnRef.current?.contains(target) && !menuRef.current?.contains(target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = items.length * 36 + 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= menuHeight
        ? rect.bottom + 4
        : rect.top - menuHeight - 4;
      setMenuStyle({ position: 'fixed', top, right: window.innerWidth - rect.right, width: 176, zIndex: 9999 });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        title="Actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
        </svg>
      </button>
      {open && createPortal(
        <div ref={menuRef} style={menuStyle} className="bg-white rounded-lg shadow-lg border border-gray-100 py-1">
          {items.map(item => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); setOpen(false); }}
              disabled={item.disabled}
              className={`w-full text-left px-4 py-2 text-xs font-medium disabled:opacity-40 ${
                item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isRole } = useAuth();
  const isSuperAdmin = isRole('SuperAdmin');

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Group>>({});
  const [editError, setEditError] = useState('');
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [adminError, setAdminError] = useState('');
  const [editAdmin, setEditAdmin] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [editAdminError, setEditAdminError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.getById(id!),
    enabled: !!id,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', id, 'withAdmins'],
    queryFn: () => membersApi.getAll({ groupId: id, includeAdmins: true }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await groupsApi.update(id!, editForm);
      if (isSuperAdmin) {
        await groupsApi.setValidity(id!, {
          isActive: group!.isActive,
          validFrom: editForm.validFrom ?? null,
          validTo: editForm.validTo ?? null,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      setShowEdit(false);
      setEditError('');
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setEditError(e.response?.data?.detail ?? 'Failed to update group'),
  });

  const setValidityMutation = useMutation({
    mutationFn: (body: { isActive: boolean; validFrom?: string | null; validTo?: string | null }) =>
      groupsApi.setValidity(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setActionError(e.response?.data?.detail ?? 'Failed to update group status'),
  });

  const assignAdminMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.assignAdmin(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', id, 'withAdmins'] }),
  });

  const removeAdminMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.removeAdmin(memberId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members', id, 'withAdmins'] }); setActionError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setActionError(e.response?.data?.detail ?? 'Failed to remove admin'),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (memberId: string) => membersApi.resendInvite(memberId),
    onSuccess: () => { setActionSuccess('Invite email sent successfully.'); setTimeout(() => setActionSuccess(''), 4000); },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setActionError(e.response?.data?.detail ?? 'Failed to resend invite'),
  });

  const addAdminMutation = useMutation({
    mutationFn: async () => {
      const { id: memberId } = await membersApi.create({ membershipType: 'Member', ...adminForm, phoneNumber: adminForm.phoneNumber || null, groupId: id });
      await membersApi.assignAdmin(memberId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', id, 'withAdmins'] });
      qc.invalidateQueries({ queryKey: ['group', id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      setShowAddAdmin(false);
      setAdminForm({ firstName: '', lastName: '', email: '', phoneNumber: '' });
      setAdminError('');
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setAdminError(e.response?.data?.detail ?? 'Failed to add group admin'),
  });

  const updateAdminMutation = useMutation({
    mutationFn: () => membersApi.update(editAdmin!.id, { firstName: editAdmin!.firstName, lastName: editAdmin!.lastName, email: editAdmin!.email, role: 'Admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', id, 'withAdmins'] });
      setEditAdmin(null);
      setEditAdminError('');
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setEditAdminError(e.response?.data?.detail ?? 'Failed to update admin'),
  });

  const openEdit = () => {
    if (group) {
      setEditForm({
        name: group.name,
        description: group.description,
        memberInterestRate: group.memberInterestRate,
        nonMemberInterestRate: group.nonMemberInterestRate,
        isActive: group.isActive,
        validFrom: group.validFrom ?? null,
        validTo: group.validTo ?? null,
      });
      setEditError('');
      setShowEdit(true);
    }
  };

  if (groupLoading) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">Loading...</div>
    );
  }

  if (!group) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">Group not found</div>
    );
  }

  const adminCount = members.filter(m => m.role === 'Admin').length;
  const memberCount = members.filter(m => m.role === 'Member').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/groups')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <code className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{group.code}</code>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${group.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {group.isActive ? 'Active' : 'Inactive'}
            </span>
            {isSuperAdmin && group.validFrom && (
              <span className="text-xs text-gray-400">
                {formatDate(group.validFrom)} — {group.validTo ? formatDate(group.validTo) : 'no end date'}
              </span>
            )}
          </div>
          {group.description && <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>}
        </div>
        <button
          onClick={openEdit}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          Edit Group
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setValidityMutation.mutate({ isActive: !group.isActive, validFrom: group.validFrom, validTo: group.validTo })}
            disabled={setValidityMutation.isPending}
            className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-60 ${
              group.isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {group.isActive ? 'Disable Group' : 'Enable Group'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Total Members</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{group.memberCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Admins</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{adminCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Member Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{group.memberInterestRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 font-medium">Non-Member Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{group.nonMemberInterestRate}%</p>
        </div>
      </div>


      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {actionError && (
          <div className="mx-5 mt-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex justify-between">
            {actionError}
            <button onClick={() => setActionError('')} className="ml-2 font-bold">×</button>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-5 mt-4 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 flex justify-between">
            {actionSuccess}
            <button onClick={() => setActionSuccess('')} className="ml-2 font-bold">×</button>
          </div>
        )}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">{memberCount} members · {adminCount} admin{adminCount !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setAdminForm({ firstName: '', lastName: '', email: '', phoneNumber: '' }); setAdminError(''); setShowAddAdmin(true); }}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Group Admin
          </button>
        </div>

        {membersLoading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No members in this group yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Joined</th>
                  <th className="px-5 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                          {m.firstName[0]}{m.lastName?.[0]}
                        </div>
                        <span className="font-medium text-gray-800">{m.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{m.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {m.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(m.createdAt)}</td>
                    <td className="px-5 py-3">
                      {m.role === 'Admin' && (
                        <ActionMenu items={[
                          { label: 'Edit', onClick: () => setEditAdmin({ id: m.id, firstName: m.firstName, lastName: m.lastName ?? '', email: m.email ?? '' }) },
                          ...(!m.hasAccount ? [{ label: 'Resend Invite', onClick: () => resendInviteMutation.mutate(m.id), disabled: resendInviteMutation.isPending }] : []),
                          { label: 'Remove Admin', onClick: () => removeAdminMutation.mutate(m.id), danger: true, disabled: removeAdminMutation.isPending },
                        ]} />
                      )}
                      {m.role === 'Member' && (
                        <ActionMenu items={[
                          { label: 'Edit', onClick: () => setEditAdmin({ id: m.id, firstName: m.firstName, lastName: m.lastName ?? '', email: m.email ?? '' }) },
                          ...(!m.hasAccount ? [{ label: 'Resend Invite', onClick: () => resendInviteMutation.mutate(m.id), disabled: resendInviteMutation.isPending }] : []),
                          { label: 'Make Admin', onClick: () => assignAdminMutation.mutate(m.id), disabled: assignAdminMutation.isPending },
                        ]} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Group Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Group Admin</h2>
            {adminError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{adminError}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">First Name</label>
                  <input value={adminForm.firstName} onChange={e => setAdminForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Last Name</label>
                  <input value={adminForm.lastName} onChange={e => setAdminForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Email</label>
                <input type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Phone (optional)</label>
                <input value={adminForm.phoneNumber} onChange={e => setAdminForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="+977..." />
              </div>
              <p className="text-xs text-gray-400">An invitation email will be sent so the admin can set their own password.</p>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddAdmin(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => addAdminMutation.mutate()} disabled={addAdminMutation.isPending} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-60">
                {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Member</h2>
            {editAdminError && <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">{editAdminError}</p>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">First Name</label>
                  <input value={editAdmin.firstName} onChange={e => setEditAdmin(f => f ? { ...f, firstName: e.target.value } : f)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Last Name</label>
                  <input value={editAdmin.lastName} onChange={e => setEditAdmin(f => f ? { ...f, lastName: e.target.value } : f)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Email</label>
                <input type="email" value={editAdmin.email} onChange={e => setEditAdmin(f => f ? { ...f, email: e.target.value } : f)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setEditAdmin(null); setEditAdminError(''); }} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => updateAdminMutation.mutate()} disabled={updateAdminMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {updateAdminMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Group</h2>
            {editError && <p className="text-red-600 text-sm mb-3">{editError}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Group Name <span className="text-red-500">*</span></label>
                <input
                  required
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Description</label>
                <textarea
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Member Interest (%) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editForm.memberInterestRate ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, memberInterestRate: Number(e.target.value) }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Non-Member Interest (%) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editForm.nonMemberInterestRate ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, nonMemberInterestRate: Number(e.target.value) }))}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {isSuperAdmin && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Valid From <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        required
                        value={editForm.validFrom ? editForm.validFrom.split('T')[0] : ''}
                        onChange={e => setEditForm(f => ({ ...f, validFrom: e.target.value || null }))}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Valid To</label>
                      <input
                        type="date"
                        value={editForm.validTo ? editForm.validTo.split('T')[0] : ''}
                        onChange={e => setEditForm(f => ({ ...f, validTo: e.target.value || null }))}
                        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={
                  updateMutation.isPending ||
                  !editForm.name?.trim() ||
                  editForm.memberInterestRate == null ||
                  editForm.nonMemberInterestRate == null ||
                  (isSuperAdmin && !editForm.validFrom)
                }
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
