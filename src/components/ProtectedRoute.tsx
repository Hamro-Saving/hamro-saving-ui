import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { MembershipType, UserRole } from '../api/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowedMembershipTypes?: MembershipType[];
}

function getDefaultRoute(role?: UserRole, membershipType?: MembershipType) {
  if (role === 'SuperAdmin') return '/overview';
  if (membershipType === 'NonMember') return '/my-loan';
  return '/dashboard';
}

export function ProtectedRoute({ children, allowedRoles, allowedMembershipTypes }: ProtectedRouteProps) {
  const { user, isAuthenticated, isRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !isRole(...allowedRoles)) {
    return <Navigate to={getDefaultRoute(user?.role, user?.membershipType)} replace />;
  }

  if (allowedMembershipTypes && user && !allowedMembershipTypes.includes(user.membershipType!)) {
    return <Navigate to={getDefaultRoute(user?.role, user?.membershipType)} replace />;
  }

  return <>{children}</>;
}
