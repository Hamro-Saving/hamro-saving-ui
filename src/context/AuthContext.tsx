import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser, GroupRole, Membership } from '../api/types';
import { authApi } from '../api/auth';

const NAME_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

interface JwtPayload {
  [NAME_ID]: string;
  [EMAIL]: string;
  is_super_admin?: string;
  GroupId?: string;
  group_role?: GroupRole;
  MemberId?: string;
  memberships?: Membership[] | string;
  firstName?: string;
  lastName?: string;
  exp: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Platform administrator. Grants nothing inside any group. */
  isSuperAdmin: boolean;
  /** Admin of the group currently being acted in. */
  isGroupAdmin: boolean;
  /** Belongs to the group currently being acted in, in any role. */
  isGroupMember: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  switchGroup: (groupId: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getUserFromToken(token: string): AuthUser {
  const decoded = jwtDecode<JwtPayload>(token);

  // Expiry is checked here rather than waiting for the first 401, so a stale token
  // never renders an authenticated-looking UI.
  if (decoded.exp * 1000 <= Date.now()) {
    throw new Error('Token expired');
  }

  // The claim arrives as a JSON array, but a token minted before the array claim type
  // was set can still deliver it as a string.
  const raw = decoded.memberships;
  const memberships: Membership[] =
    typeof raw === 'string' ? (JSON.parse(raw) as Membership[]) : (raw ?? []);

  return {
    id: decoded[NAME_ID],
    email: decoded[EMAIL],
    firstName: decoded.firstName ?? '',
    lastName: decoded.lastName ?? '',
    isSuperAdmin: decoded.is_super_admin === 'true',
    activeGroupId: decoded.GroupId || undefined,
    memberId: decoded.MemberId || undefined,
    groupRole: decoded.group_role || undefined,
    memberships,
  };
}

function readStoredUser(): AuthUser | null {
  const t = localStorage.getItem('hs_token');
  if (!t) return null;
  try {
    return getUserFromToken(t);
  } catch {
    localStorage.removeItem('hs_token');
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [token, setToken] = useState<string | null>(() =>
    // Kept in step with `user`, so an expired token leaves both null.
    readStoredUser() ? localStorage.getItem('hs_token') : null
  );

  const adopt = useCallback((t: string): AuthUser => {
    const u = getUserFromToken(t);
    localStorage.setItem('hs_token', t);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => adopt(await authApi.login({ email, password })),
    [adopt]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('hs_token');
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const switchGroup = useCallback(
    async (groupId: string): Promise<AuthUser> => {
      const t = await authApi.switchGroup({ groupId });
      // Every cached query was scoped to the group we are leaving.
      queryClient.clear();
      return adopt(t);
    },
    [adopt, queryClient]
  );

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user,
    isSuperAdmin: !!user?.isSuperAdmin,
    isGroupAdmin: user?.groupRole === 'Admin',
    isGroupMember: !!user?.activeGroupId,
    login,
    logout,
    switchGroup,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
