import React, { createContext, useContext, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser, MembershipType, UserRole } from '../api/types';
import { authApi } from '../api/auth';

interface JwtPayload {
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': UserRole;
  GroupId?: string;
  firstName?: string;
  lastName?: string;
  MemberId?: string;
  MembershipType?: string;
  exp: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getUserFromToken(token: string): AuthUser {
  const decoded = jwtDecode<JwtPayload>(token);
  return {
    id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
    email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    firstName: decoded.firstName ?? '',
    lastName: decoded.lastName ?? '',
    role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    groupId: decoded.GroupId || undefined,
    membershipType: (decoded.MembershipType as MembershipType) || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hs_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem('hs_token');
    if (!t) return null;
    try { return getUserFromToken(t); } catch { return null; }
  });

  const login = useCallback(async (email: string, password: string) => {
    const t = await authApi.login({ email, password });
    const u = getUserFromToken(t);
    localStorage.setItem('hs_token', t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hs_token');
    setToken(null);
    setUser(null);
  }, []);

  const isRole = useCallback((...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  return (
    <AuthContext value={{ user, token, isAuthenticated: !!user, login, logout, isRole }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
