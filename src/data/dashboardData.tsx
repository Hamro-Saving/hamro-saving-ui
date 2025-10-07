import type { FinancialSummary, Loan, Txn } from "../types";

export const summary : FinancialSummary = {
    TotalCollection : 2500000,
    Deposited: 500000,
    OnLoan: 1000000,
    Interest : 100000,
    InHand : 1500000,
    Expenses : 10000
}

export const activeLoans: Loan[] = [
  { id: "LN-10021", member: "John Carter", amount: 4500, rate: 6.9, status: "On track" },
  { id: "LN-10022", member: "Priya Sharma", amount: 12000, rate: 7.2, status: "Payment due" },
  { id: "LN-10023", member: "Amin El-Ansari", amount: 3200, rate: 5.5, status: "On track" },
];

export const recentTransactions: Txn[] = [
  { id: "TX-90011", member: "John Carter", type: "Repayment", amount: -250, date: "2025-10-05" },
  { id: "TX-90012", member: "Priya Sharma", type: "Disbursement", amount: 12000, date: "2025-10-03" },
  { id: "TX-90013", member: "Amin El-Ansari", type: "Repayment", amount: -180, date: "2025-10-02" },
];
