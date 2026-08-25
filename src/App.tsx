import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROUTES, getDefaultRoute } from './routes';
import Sidebar from './components/Sidebar';
import Logo from './components/Logo';
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
  const [navOpen, setNavOpen] = useState(false);
  const { user } = useAuth();
  const groupName = user?.memberships.find(m => m.groupId === user.activeGroupId)?.groupName;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* min-w-0 so a wide table scrolls inside the column instead of stretching it. */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="-ml-1 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo size="sm" text={groupName} />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
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
