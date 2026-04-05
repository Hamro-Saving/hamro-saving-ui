import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { MembershipType, UserRole } from '../api/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowedMembershipTypes?: MembershipType[];
}

export function ProtectedRoute({ children, allowedRoles, allowedMembershipTypes }: ProtectedRouteProps) {
  const { user, isAuthenticated, isRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !isRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedMembershipTypes && user && !allowedMembershipTypes.includes(user.membershipType!)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
