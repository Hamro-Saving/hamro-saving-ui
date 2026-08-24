import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../../api/groups';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import type { Group } from '../../api/types';

export default function Groups() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', code: '', description: '', memberInterestRate: '10', nonMemberInterestRate: '18', validFrom: '', validTo: '' });
  const [addError, setAddError] = useState('');

  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [editForm, setEditForm] = useState<Partial<Group>>({});
  const [editError, setEditError] = useState('');

  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: groupsApi.getAll });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { id } = await groupsApi.create({
        ...addForm,
        memberInterestRate: Number(addForm.memberInterestRate),
        nonMemberInterestRate: Number(addForm.nonMemberInterestRate),
      });
      if (isSuperAdmin && addForm.validFrom) {
        await groupsApi.setValidity(id, { isActive: true, validFrom: addForm.validFrom, validTo: addForm.validTo || null });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setShowAdd(false);
      setAddForm({ name: '', code: '', description: '', memberInterestRate: '10', nonMemberInterestRate: '18', validFrom: '', validTo: '' });
      setAddError('');
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => setAddError(e.response?.data?.detail ?? 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await groupsApi.update(editGroup!.id, editForm);
      if (isSuperAdmin) {
        await groupsApi.setValidity(editGroup!.id, {
          isActive: editGroup!.isActive,
          validFrom: editForm.validFrom ?? null,
          validTo: editForm.validTo ?? null,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setEditGroup(null);
      setEditError('');
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => setEditError(e.response?.data?.detail ?? 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.delete(deleteGroupId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      setDeleteGroupId(null);
      setDeleteError('');
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => {
      setDeleteError(e.response?.data?.detail ?? 'Failed to delete group');
    },
  });

  const openEdit = (g: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({
      name: g.name,
      description: g.description,
      memberInterestRate: g.memberInterestRate,
      nonMemberInterestRate: g.nonMemberInterestRate,
      validFrom: g.validFrom ?? null,
      validTo: g.validTo ?? null,
    });
    setEditError('');
    setEditGroup(g);
  };

  const openDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteError('');
    setDeleteGroupId(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all savings groups</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Group
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading && <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">Loading...</div>}
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => navigate(`/groups/${g.id}`)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:border-blue-200 hover:shadow-md transition-all w-full"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{g.name}</p>
                  <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{g.code}</code>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {g.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {isSuperAdmin && g.validFrom && (
                    <span className="text-xs text-gray-400">
                      {formatDate(g.validFrom)} — {g.validTo ? formatDate(g.validTo) : 'no end date'}
                    </span>
                  )}
                </div>
                {g.description && <p className="text-xs text-gray-400 mt-0.5">{g.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {g.memberCount} member{g.memberCount !== 1 ? 's' : ''} · Created {formatDate(g.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right text-xs text-gray-500 hidden sm:block">
                  <p>Member rate: <strong>{g.memberInterestRate}%</strong></p>
                  <p>Non-member rate: <strong>{g.nonMemberInterestRate}%</strong></p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => openEdit(g, e)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    onClick={e => openDelete(g.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <svg className="w-4 h-4 text-gray-300 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        ))}
        {!isLoading && groups.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 text-sm">No groups yet</div>
        )}
      </div>

      {/* Create Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Create Group</h2>
            {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Group Name <span className="text-red-500">*</span></label>
                <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Code <span className="text-red-500">*</span></label>
                <input value={addForm.code} onChange={e => setAddForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" placeholder="e.g. GRPKTM" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Description</label>
                <textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Member Interest (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" value={addForm.memberInterestRate} onChange={e => setAddForm(f => ({ ...f, memberInterestRate: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Non-Member Interest (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" value={addForm.nonMemberInterestRate} onChange={e => setAddForm(f => ({ ...f, nonMemberInterestRate: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {isSuperAdmin && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Valid From <span className="text-red-500">*</span></label>
                      <input type="date" value={addForm.validFrom} onChange={e => setAddForm(f => ({ ...f, validFrom: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Valid To</label>
                      <input type="date" value={addForm.validTo} onChange={e => setAddForm(f => ({ ...f, validTo: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button
                onClick={() => addMutation.mutate()}
                disabled={
                  addMutation.isPending ||
                  !addForm.name.trim() ||
                  !addForm.code.trim() ||
                  !addForm.memberInterestRate ||
                  !addForm.nonMemberInterestRate ||
                  (isSuperAdmin && !addForm.validFrom)
                }
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {addMutation.isPending ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editGroup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Group</h2>
            {editError && <p className="text-red-600 text-sm mb-3">{editError}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Group Name <span className="text-red-500">*</span></label>
                <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Description</label>
                <textarea value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Member Interest (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" value={editForm.memberInterestRate ?? ''} onChange={e => setEditForm(f => ({ ...f, memberInterestRate: Number(e.target.value) }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Non-Member Interest (%) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.1" value={editForm.nonMemberInterestRate ?? ''} onChange={e => setEditForm(f => ({ ...f, nonMemberInterestRate: Number(e.target.value) }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {isSuperAdmin && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Valid From <span className="text-red-500">*</span></label>
                      <input type="date" value={editForm.validFrom ? editForm.validFrom.split('T')[0] : ''} onChange={e => setEditForm(f => ({ ...f, validFrom: e.target.value || null }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Valid To</label>
                      <input type="date" value={editForm.validTo ? editForm.validTo.split('T')[0] : ''} onChange={e => setEditForm(f => ({ ...f, validTo: e.target.value || null }))} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditGroup(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
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

      {/* Delete Confirmation Modal */}
      {deleteGroupId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-center text-gray-900 mb-1">Delete Group</h2>
            <p className="text-sm text-center text-gray-500 mb-2">This action cannot be undone. Groups with existing members or financial data cannot be deleted.</p>
            {deleteError && <p className="text-red-600 text-sm text-center mb-3">{deleteError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setDeleteGroupId(null); setDeleteError(''); }} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

