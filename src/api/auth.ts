import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, AuthUser } from './types';

export const authApi = {
  login: async (req: LoginRequest): Promise<string> => {
    const { data } = await apiClient.post<{ token: string }>('/auth/login', req);
    return data.token;
  },
  register: async (req: RegisterRequest): Promise<AuthUser> => {
    const { data } = await apiClient.post<AuthUser>('/auth/register', req);
    return data;
  },
};
