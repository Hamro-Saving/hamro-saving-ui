export interface FinancialSummary{
    TotalCollection : number,
    Deposited: number,
    OnLoan: number,
    Interest : number,
    InHand : number,
    Expenses : number
}

export interface Loan {
  id: string;
  member: string;
  amount: number;
  rate: number;   // percent
  status: "On track" | "Interest due" | "Overdue";
}

export interface Txn {
  id: string;
  member: string;
  type: "Monthly Saving" | "Interest Paid" | "Loan Return" | "Loan";
  amount: number; // negative for repayment, positive for disbursement
  date: string;   // ISO date
}
