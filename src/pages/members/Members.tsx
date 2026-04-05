import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, groupsApi } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';
import type { Member, UserRole } from '../../api/types';

type Tab = 'members' | 'non-members';

export default function Members() {
  const { user, isRole } = useAuth();
  const isSuperAdmin = isRole('SuperAdmin');
  const isAdmin = isRole('Admin');
  const canEdit = isAdmin || isSuperAdmin;
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('members');

  // Add member state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', groupId: '' });
  const [addError, setAddError] = useState('');

  // Edit member state
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', role: 'Member' });
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

  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: groupsApi.getAll, enabled: isSuperAdmin });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', user?.groupId],
    queryFn: () => membersApi.getAll({ groupId: user?.groupId, membershipType: 'Member' }),
  });

  const { data: nonMembers = [], isLoading: nmLoading } = useQuery({
    queryKey: ['non-members', user?.groupId],
    queryFn: () => membersApi.getAll({ groupId: user?.groupId, membershipType: 'NonMember' }),
    enabled: tab === 'non-members' || canEdit,
  });

  // Member mutations
  const addMutation = useMutation({
    mutationFn: () => membersApi.create({
      membershipType: 'Member',
      firstName: addForm.firstName,
      lastName: addForm.lastName,
      email: addForm.email,
      phoneNumber: addForm.phoneNumber || null,
      groupId: isSuperAdmin ? addForm.groupId : user?.groupId,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setShowAdd(false); setAddForm({ firstName: '', lastName: '', email: '', phoneNumber: '', groupId: '' }); setAddError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setAddError(e.response?.data?.detail ?? 'Failed to add member'),
  });

  const editMutation = useMutation({
    mutationFn: () => membersApi.update(editMember!.id, {
      firstName: editForm.firstName,
      lastName: editForm.lastName || null,
      email: editForm.email || null,
      phoneNumber: editForm.phoneNumber || null,
      role: editForm.role as UserRole,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setEditMember(null); setEditError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setEditError(e.response?.data?.detail ?? 'Failed to update member'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); setDeleteMemberId(null); },
  });

  // Non-member mutations
  const addNmMutation = useMutation({
    mutationFn: () => membersApi.create({
      membershipType: 'NonMember',
      firstName: addNmForm.fullName,
      email: addNmForm.email || null,
      phoneNumber: addNmForm.phoneNumber || null,
      address: addNmForm.address || null,
      groupId: user?.groupId,
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
      role: 'Member',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['non-members'] }); setEditNm(null); setEditNmError(''); },
    onError: (e: { response?: { data?: { detail?: string } } }) => setEditNmError(e.response?.data?.detail ?? 'Failed to update non-member'),
  });

  const deleteNmMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['non-members'] }); setDeleteNmId(null); },
  });

  const openEditMember = (m: Member) => { setEditMember(m); setEditForm({ firstName: m.firstName, lastName: m.lastName ?? '', email: m.email ?? '', phoneNumber: m.phoneNumber ?? '', role: m.role }); setEditError(''); };
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
          <button
            onClick={() => tab === 'members' ? setShowAdd(true) : setShowAddNm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add {tab === 'members' ? (isSuperAdmin ? 'Group Admin' : 'Member') : 'Non-Member'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('members')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'members' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Members ({members.length})
        </button>
        <button onClick={() => setTab('non-members')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'non-members' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Non-Members ({nonMembers.length})
        </button>
      </div>

      {/* Members Table */}
      {tab === 'members' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined', ...(canEdit ? ['Actions'] : [])].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {membersLoading && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">{m.firstName?.[0]}{m.lastName?.[0]}</div>
                      <span className="font-medium text-gray-800">{m.firstName} {m.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{m.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{m.role}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                      {!m.hasAccount && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Invite Pending</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatDate(m.createdAt)}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEditMember(m)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                        {m.isActive && (
                          <button onClick={() => setDeleteMemberId(m.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!membersLoading && !members.length && <tr><td colSpan={6} className="text-center py-10 text-gray-400">No members found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Non-Members Table */}
      {tab === 'non-members' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Full Name', 'Email', 'Phone', 'Status', ...(canEdit ? ['Actions'] : [])].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {nmLoading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>}
              {nonMembers.map(n => (
                <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{n.fullName}</td>
                  <td className="px-5 py-3.5 text-gray-600">{n.email ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{n.phoneNumber ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${n.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{n.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEditNm(n)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                        {n.isActive && (
                          <button onClick={() => setDeleteNmId(n.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!nmLoading && !nonMembers.length && <tr><td colSpan={5} className="text-center py-10 text-gray-400">No non-members found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{isSuperAdmin ? 'Add Group Admin' : 'Add New Member'}</h2>
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
              <p className="text-xs text-gray-400">An invitation email will be sent so the member can set their own password.</p>
              {isSuperAdmin && (
                <div><label className="text-xs text-gray-600 font-medium">Group</label>
                  <select value={addForm.groupId} onChange={e => setAddForm(f => ({ ...f, groupId: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select a group</option>
                    {(groups ?? []).map(g => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}
                  </select></div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
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
              <div><label className="text-xs text-gray-600 font-medium">Role</label>
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                </select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditMember(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {editMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirm */}
      {deleteMemberId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-gray-800 font-semibold mb-1">Delete Member?</p>
            <p className="text-sm text-gray-500 mb-5">This will permanently delete the member. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteMemberId(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteMemberId)} disabled={deleteMutation.isPending} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
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
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddNm(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => addNmMutation.mutate()} disabled={addNmMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {addNmMutation.isPending ? 'Adding...' : 'Add'}
              </button>
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
              <button onClick={() => setEditNm(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => editNmMutation.mutate()} disabled={editNmMutation.isPending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {editNmMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Non-Member Confirm */}
      {deleteNmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-gray-800 font-semibold mb-1">Delete Non-Member?</p>
            <p className="text-sm text-gray-500 mb-5">This will permanently delete the non-member. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteNmId(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteNmMutation.mutate(deleteNmId)} disabled={deleteNmMutation.isPending} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60">
                {deleteNmMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
