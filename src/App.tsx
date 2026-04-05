import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import Dashboard from './pages/dashboard/Dashboard';
import Members from './pages/members/Members';
import Savings from './pages/savings/Savings';
import Loans from './pages/loans/Loans';
import Finance from './pages/finance/Finance';
import Verify from './pages/verify/Verify';
import Groups from './pages/groups/Groups';
import GroupDetail from './pages/groups/GroupDetail';
import MyLoan from './pages/my-loan/MyLoan';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.membershipType === 'NonMember') return <Navigate to="/my-loan" replace />;
  if (user.role === 'SuperAdmin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/my-loan" element={
        <ProtectedRoute allowedMembershipTypes={['NonMember']}>
          <MyLoan />
        </ProtectedRoute>
      } />

      <Route path="/superadmin" element={
        <ProtectedRoute allowedRoles={['SuperAdmin']}>
          <AppLayout><SuperAdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Member']}>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/members" element={
        <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin', 'Member']}>
          <AppLayout><Members /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/savings" element={
        <ProtectedRoute allowedRoles={['Admin', 'Member']}>
          <AppLayout><Savings /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/loans" element={
        <ProtectedRoute allowedRoles={['Admin', 'Member']}>
          <AppLayout><Loans /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finance" element={
        <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
          <AppLayout><Finance /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/verify" element={
        <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin']}>
          <AppLayout><Verify /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/groups" element={
        <ProtectedRoute allowedRoles={['SuperAdmin']}>
          <AppLayout><Groups /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/groups/:id" element={
        <ProtectedRoute allowedRoles={['SuperAdmin']}>
          <AppLayout><GroupDetail /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">403</p>
            <p className="text-gray-500 mt-1">You don't have permission to view this page.</p>
          </div>
        </div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
