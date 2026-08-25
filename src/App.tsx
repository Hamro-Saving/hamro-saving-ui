import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROUTES, getDefaultRoute } from './routes';
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
import Transactions from './pages/transactions/Transactions';
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

/**
 * Which component serves each path. Access rules live in routes.tsx and are read from
 * there — this file only says what to render, never who may see it.
 */
const PAGES: Record<string, React.ReactNode> = {
  '/overview': <SuperAdminDashboard />,
  '/groups': <Groups />,
  '/groups/:id': <GroupDetail />,
  '/dashboard': <Dashboard />,
  '/members': <Members />,
  '/savings': <Savings />,
  '/loans': <Loans />,
  '/loans/:id': <LoanDetail />,
  '/transactions': <Transactions />,
  '/finance': <Finance />,
  '/verify': <Verify />,
  '/my-loan': <MyLoan />,
};

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

      {ROUTES.map(({ path, requires, standalone }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute requires={requires}>
              {standalone ? PAGES[path] : <AppLayout>{PAGES[path]}</AppLayout>}
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
