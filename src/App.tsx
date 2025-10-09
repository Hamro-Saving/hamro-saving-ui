import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/dashboard/Dashboard";
import Members from "./pages/members/Members";
import PageHeader from "./components/PageHeader";
import ActiveLoans from "./pages/active-loans/ActiveLoans";
import LoanHistory from "./pages/loan-history/LoanHistory";
import Transactions from "./pages/transactions/Transactions";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/members": "Members",
  "/active-loans": "Active Loans",
  "/loan-history": "Loan History",
  "/transactions":" Transactions",
};

export default function App() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? "Page";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <PageHeader title={title} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/active-loans" element={<ActiveLoans />} />
            <Route path="/loan-history" element={<LoanHistory />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
