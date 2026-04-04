export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; firstName: string; lastName: string; role: UserRole; groupId?: string; }

export type UserRole = 'SuperAdmin' | 'Admin' | 'Member' | 'NonMember';

export interface AuthUser { id: string; email: string; firstName: string; lastName: string; role: UserRole; groupId?: string; }

export interface Group { id: string; name: string; code: string; description?: string; isActive: boolean; memberInterestRate: number; nonMemberInterestRate: number; memberCount: number; createdAt: string; updatedAt: string; }

export interface Member { id: string; email: string; firstName: string; lastName: string; fullName: string; role: UserRole; groupId: string; isActive: boolean; createdAt: string; }

export interface NonMember { id: string; fullName: string; email?: string; phone?: string; address?: string; groupId: string; isActive: boolean; createdAt: string; }

export type DepositType = 'MonthlyDeposit' | 'InterestPayment' | 'LoanRepayment' | 'Other';

export interface Deposit { id: string; memberId: string; memberName: string; groupId: string; amount: number; depositMonth: number; depositYear: number; depositDate: string; type: DepositType; notes?: string; isVerified: boolean; verifiedAt?: string; createdAt: string; }

export type LoanStatus = 'Pending' | 'Approved' | 'Active' | 'PaidOff' | 'Overdue' | 'Cancelled';
export type LoanPaymentType = 'Principal' | 'Interest' | 'Mixed';
export type BorrowerType = 'Member' | 'NonMember';

export interface ApproverInfo { approverId: string; approverName: string; approvedAt: string; }
export interface Loan { id: string; borrowerId: string; borrowerName: string; borrowerType: BorrowerType; groupId: string; amount: number; interestRate: number; totalInterest: number; totalDue: number; accruedInterest: number; startDate: string; dueDate?: string; status: LoanStatus; notes?: string; approvedById?: string; approvalCount: number; requiredApprovals: number; hasCurrentUserApproved: boolean; approvers: ApproverInfo[]; createdAt: string; }

export interface LoanPayment { id: string; loanId: string; amount: number; principalAmount: number; interestAmount: number; paidDate: string; paymentType: LoanPaymentType; notes?: string; isVerified: boolean; verifiedAt?: string; createdAt: string; }

export interface Expense { id: string; groupId: string; amount: number; category: string; description: string; expenseDate: string; approvedById?: string; createdAt: string; }

export type FixedDepositStatus = 'Active' | 'Matured' | 'Withdrawn';

export interface FixedDeposit { id: string; groupId: string; institutionName: string; amount: number; interestRate: number; startDate: string; maturityDate: string; status: FixedDepositStatus; notes?: string; expectedMaturityAmount: number; createdAt: string; }

export interface FinancialSummary { totalDeposited: number; totalOnLoan: number; totalInterestCollected: number; totalExpenses: number; totalInFixedDeposits: number; inHandCash: number; memberCount: number; activeLoanCount: number; }

export interface SavingsSummary { totalDeposited: number; pendingVerification: number; verifiedAmount: number; byType: Record<string, number>; }

export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

export interface ProblemDetails { title: string; status: number; detail?: string; errors?: Record<string, string[]>; }
