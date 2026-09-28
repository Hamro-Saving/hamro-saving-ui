import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute, satisfies, type Requirement } from '../routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requires: Requirement;
}

export function ProtectedRoute({ children, requires }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Remember where they were headed — a link from an email, say — so signing in lands
    // them there rather than on the dashboard.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!satisfies(user, requires)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return <>{children}</>;
}
