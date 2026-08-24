import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getDefaultRoute } from './routes';
import Sidebar from './components/Sidebar';
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import Dashboard from './pages/dashboard/Dashboard';
import Members from './pages/members/Members';
import Savings from './pages/savings/Savings';
import Loans from './pages/loans/Loans';
import LoanDetail from './pages/loans/LoanDetail';
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
  return <Navigate to={getDefaultRoute(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/my-loan" element={
        <ProtectedRoute requires="nonMember">
          <MyLoan />
        </ProtectedRoute>
      } />

      <Route path="/overview" element={
        <ProtectedRoute requires="superAdmin">
          <AppLayout><SuperAdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute requires="groupMember">
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/members" element={
        <ProtectedRoute requires="groupMember">
          <AppLayout><Members /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/savings" element={
        <ProtectedRoute requires="groupMember">
          <AppLayout><Savings /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/loans" element={
        <ProtectedRoute requires="groupMember">
          <AppLayout><Loans /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/loans/:id" element={
        <ProtectedRoute requires="groupMember">
          <AppLayout><LoanDetail /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/finance" element={
        <ProtectedRoute requires="groupAdmin">
          <AppLayout><Finance /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/verify" element={
        <ProtectedRoute requires="groupAdmin">
          <AppLayout><Verify /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/groups" element={
        <ProtectedRoute requires="superAdmin">
          <AppLayout><Groups /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/groups/:id" element={
        <ProtectedRoute requires="superAdmin">
          <AppLayout><GroupDetail /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
