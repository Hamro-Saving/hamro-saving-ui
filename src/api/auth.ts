import { apiClient } from './client';
import type { LoginRequest, SignupInfoResponse, SwitchGroupRequest } from './types';

export const authApi = {
  login: async (req: LoginRequest): Promise<string> => {
    const { data } = await apiClient.post<{ token: string }>('/auth/login', req);
    return data.token;
  },
  switchGroup: async (req: SwitchGroupRequest): Promise<string> => {
    const { data } = await apiClient.post<{ token: string }>('/auth/switch-group', req);
    return data.token;
  },
  getSignupInfo: async (token: string): Promise<SignupInfoResponse> => {
    const { data } = await apiClient.get<SignupInfoResponse>('/auth/signup-info', { params: { token } });
    return data;
  },
  signupWithToken: async (token: string, password: string): Promise<string> => {
    const { data } = await apiClient.post<{ token: string }>('/auth/signup', { token, password });
    return data.token;
  },
};
