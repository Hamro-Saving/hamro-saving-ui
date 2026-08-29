import { apiClient } from './client';
import type { Group, GroupRole, Member } from './types';

export const groupsApi = {
  getAll: () => apiClient.get<Group[]>('/groups').then(r => r.data),
  getById: (id: string) => apiClient.get<Group>(`/groups/${id}`).then(r => r.data),
  create: (body: Partial<Group>) => apiClient.post<{ id: string }>('/groups', body).then(r => r.data),
  update: (id: string, body: Partial<Group>) => apiClient.put(`/groups/${id}`, body),
  delete: (id: string) => apiClient.delete(`/groups/${id}`),
  deactivate: (id: string) => apiClient.put(`/groups/${id}/validity`, { isActive: false, validFrom: null, validTo: null }),
  activate: (id: string) => apiClient.put(`/groups/${id}/validity`, { isActive: true, validFrom: null, validTo: null }),
  setValidity: (id: string, body: { isActive: boolean; validFrom?: string | null; validTo?: string | null }) =>
    apiClient.put(`/groups/${id}/validity`, body),
};

export const membersApi = {
  getAll: (params?: { groupId?: string; roles?: GroupRole[] }) =>
    apiClient.get<Member[]>('/members', { params }).then(r => r.data),
  getById: (id: string) => apiClient.get<Member>(`/members/${id}`).then(r => r.data),
  create: (body: {
    groupRole: GroupRole;
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    groupId?: string;
  }) => apiClient.post<{ id: string }>('/members', body).then(r => r.data),
  update: (id: string, body: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
  }) => apiClient.put<Member>(`/members/${id}`, body).then(r => r.data),
  // Leaving a group is a change of standing, not a deletion: the person's deposits, loans
  // and payments are the group's history and the books are built from them.
  deactivate: (id: string) => apiClient.put(`/members/${id}/deactivate`),
  activate: (id: string) => apiClient.put(`/members/${id}/activate`),
  assignAdmin: (id: string) => apiClient.put(`/members/${id}/assign-admin`),
  removeAdmin: (id: string) => apiClient.put(`/members/${id}/remove-admin`),
  resendInvite: (id: string) => apiClient.post(`/members/${id}/resend-invite`),
};
