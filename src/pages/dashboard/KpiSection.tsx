import KpiCard from "../../components/KpiCard";
import { formatCurrency } from "../../utils/format";
import type { FinancialSummary } from "../../api/types";

interface KpiSectionProps {
  summary?: FinancialSummary;
  memberCount: number;
  activeLoanCount: number;
}

export default function KpiSection({
  summary,
  memberCount,
  activeLoanCount,
}: KpiSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <KpiCard
        label="Total Collection"
        side="credit"
        value={formatCurrency(summary?.totalSavingsCollected ?? 0)}
        color="blue"
        sub="All deposits"
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <KpiCard
        label="On Loan"
        side="debit"
        value={formatCurrency(summary?.totalOnLoan ?? 0)}
        color="amber"
        sub={`${activeLoanCount} active`}
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
        }
      />
      <KpiCard
        label="Interest Earned"
        side="credit"
        value={formatCurrency(summary?.totalInterestCollected ?? 0)}
        color="green"
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        }
      />
      <KpiCard
        label="Fixed Deposits"
        side="debit"
        value={formatCurrency(summary?.totalFixedDeposits ?? 0)}
        color="purple"
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
            />
          </svg>
        }
      />
      <KpiCard
        label="Expenses"
        side="debit"
        value={formatCurrency(summary?.totalExpenses ?? 0)}
        color="red"
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        }
      />
      <KpiCard
        label="In Hand"
        side="cash"
        value={formatCurrency(summary?.inHandCash ?? 0)}
        color="indigo"
        sub={`${memberCount} members`}
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        }
      />
    </div>
  );
}
