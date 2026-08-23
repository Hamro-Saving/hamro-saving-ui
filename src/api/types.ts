export interface LoginRequest { email: string; password: string; }
export interface SignupInfoResponse { email: string; firstName: string; lastName: string; fullName: string; }

export interface RegisterRequest { email: string; password: string; firstName: string; lastName: string; role: UserRole; groupId?: string; }

export type UserRole = 'SuperAdmin' | 'Admin' | 'Member';

export interface AuthUser { id: string; email: string; firstName: string; lastName: string; role: UserRole; groupId?: string; memberId?: string; membershipType?: MembershipType; }

export interface Group { id: string; name: string; code: string; description?: string; isActive: boolean; memberInterestRate: number; nonMemberInterestRate: number; validFrom?: string | null; validTo?: string | null; memberCount: number; createdAt: string; updatedAt: string; }

export type MembershipType = 'Member' | 'NonMember';

export interface Member { id: string; email?: string | null; firstName: string; lastName?: string | null; fullName: string; role: UserRole; membershipType: MembershipType; groupId: string; isActive: boolean; hasAccount: boolean; phoneNumber?: string | null; address?: string | null; createdAt: string; }

export type DepositType = 'MonthlyDeposit' | 'InterestPayment' | 'LoanRepayment' | 'Other';

export interface Deposit { id: string; memberId: string; memberName: string; groupId: string; amount: number; depositMonth: number; depositYear: number; depositDate: string; type: DepositType; notes?: string; isVerified: boolean; verifiedAt?: string; createdAt: string; }

export type LoanStatus = 'Pending' | 'Approved' | 'Active' | 'PaidOff' | 'Overdue' | 'Cancelled' | 'Declined';
export type LoanPaymentType = 'Principal' | 'Interest' | 'Mixed';
export type BorrowerType = 'Member' | 'NonMember';

export interface ApproverInfo { approverId: string; approverName: string; approvedAt: string; }
export interface Loan { id: string; borrowerId: string; borrowerName: string; borrowerType: BorrowerType; groupId: string; amount: number; interestRate: number; totalInterest: number; totalDue: number; accruedInterest: number; startDate: string; dueDate?: string; status: LoanStatus; notes?: string; disbursedById?: string; approvalCount: number; declineCount: number; requiredApprovals: number; hasCurrentUserApproved: boolean; hasCurrentUserDeclined: boolean; approvers: ApproverInfo[]; decliners: ApproverInfo[]; createdAt: string; }

export interface LoanPayment { id: string; loanId: string; amount: number; principalAmount: number; interestAmount: number; paidDate: string; paymentType: LoanPaymentType; notes?: string; isVerified: boolean; verifiedAt?: string; createdAt: string; }

export interface Expense { id: string; groupId: string; amount: number; category: string; description: string; expenseDate: string; approvedById?: string; createdAt: string; }

export type FixedDepositStatus = 'Active' | 'Matured' | 'Withdrawn';

export interface FixedDeposit { id: string; groupId: string; institutionName: string; amount: number; interestRate: number; startDate: string; maturityDate: string; status: FixedDepositStatus; notes?: string; expectedMaturityAmount: number; createdAt: string; }

// Mirrors FinancialSummaryResponse from GET /finance/summary — no member or loan counts.
export interface FinancialSummary { totalSavingsCollected: number; totalOnLoan: number; totalInterestCollected: number; totalExpenses: number; totalFixedDeposits: number; inHandCash: number; }

export interface MemberDepositSummary { memberId: string; memberName: string; totalAmount: number; depositCount: number; }

// Mirrors SavingsSummaryResponse from GET /deposits/summary. byType keys are the
// DepositType enum names as-is — dictionary keys are not camel-cased by the API.
export interface SavingsSummary { totalDeposits: number; totalVerifiedDeposits: number; totalPendingDeposits: number; byType: Partial<Record<DepositType, number>>; byMember: MemberDepositSummary[]; }

export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

export interface ProblemDetails { title: string; status: number; detail?: string; errors?: Record<string, string[]>; }
