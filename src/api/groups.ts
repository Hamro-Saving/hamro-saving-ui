import { apiClient } from './client';
import type { Group, Member, MembershipType } from './types';

export const groupsApi = {
  getAll: () => apiClient.get<Group[]>('/groups').then(r => r.data),
  getById: (id: string) => apiClient.get<Group>(`/groups/${id}`).then(r => r.data),
  create: (body: Partial<Group>) => apiClient.post<{ id: string }>('/groups', body).then(r => r.data),
  update: (id: string, body: Partial<Group>) => apiClient.put(`/groups/${id}`, body),
  delete: (id: string) => apiClient.delete(`/groups/${id}`),
  deactivate: (id: string) => apiClient.put(`/groups/${id}/deactivate`),
  activate: (id: string) => apiClient.put(`/groups/${id}/activate`),
};

export const membersApi = {
  getAll: (params?: { groupId?: string; includeAdmins?: boolean; membershipType?: MembershipType }) =>
    apiClient.get<Member[]>('/members', { params }).then(r => r.data),
  getById: (id: string) => apiClient.get<Member>(`/members/${id}`).then(r => r.data),
  create: (body: {
    membershipType: MembershipType;
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
    role: string;
  }) => apiClient.put<Member>(`/members/${id}`, body).then(r => r.data),
  deactivate: (id: string) => apiClient.put(`/members/${id}/deactivate`),
  delete: (id: string) => apiClient.delete(`/members/${id}`),
  assignAdmin: (id: string) => apiClient.put(`/members/${id}/assign-admin`),
};
