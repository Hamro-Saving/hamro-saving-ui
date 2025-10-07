import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/dashboard/Dashboard";

type Page = "Dashboard" | "Members" | "Active Loans" | "Loan History";

export default function App() {
  const [active, setActive] = useState<Page>("Dashboard");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <Sidebar active={active} onChange={setActive} />
        <main className="flex-1 p-6 lg:p-8">
          {active === "Dashboard" && <Dashboard />}
          {active === "Members" && (
            <div className="text-sm text-gray-600">Members page (placeholder)</div>
          )}
          {active === "Active Loans" && (
            <div className="text-sm text-gray-600">Active Loans page (placeholder)</div>
          )}
          {active === "Loan History" && (
            <div className="text-sm text-gray-600">Loan History page (placeholder)</div>
          )}
        </main>
      </div>
    </div>
  );
}
