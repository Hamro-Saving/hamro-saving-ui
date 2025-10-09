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
  { id: "LN-10021", member: "Bikram Tamang", amount: 45000, rate: 18, status: "On track" },
  { id: "LN-10022", member: "Susan Duwal", amount: 120000, rate: 18, status: "Interest due" },
  { id: "LN-10023", member: "Rajesh Sonepa", amount: 32000, rate: 18, status: "Overdue" },
  { id: "LN-10024", member: "Amit Gwachha", amount: 200000, rate: 10, status: "On track" },
  { id: "LN-10025", member: "Binod Manandhar", amount: 500000, rate: 10, status: "On track" },
];

export const recentTransactions: Txn[] = [
  { id: "TX-90011", member: "Bhusan Bhele", type: "Monthly Saving", amount: 8000, date: "2025-10-05" },
  { id: "TX-90012", member: "Bikram Tamang", type: "Monthly Saving", amount: 8000, date: "2025-10-03" },
  { id: "TX-90013", member: "Amit Gwachha", type: "Monthly Saving", amount: 8000, date: "2025-10-02" },
  { id: "TX-90014", member: "Rajesh Sonepa", type: "Interest Paid", amount: 15000, date: "2025-10-02" },
  { id: "TX-90015", member: "Bikram Tamang", type: "Loan", amount: -500000, date: "2025-10-02" },
];
