import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute, satisfies, type Requirement } from '../routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requires: Requirement;
}

export function ProtectedRoute({ children, requires }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!satisfies(user, requires)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return <>{children}</>;
}
