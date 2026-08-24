export interface LoginRequest { email: string; password: string; }
export interface SignupInfoResponse { email: string; firstName: string; lastName: string; fullName: string; }

export interface SwitchGroupRequest { groupId: string; }

/**
 * What a person is inside one group — the single group-level axis, orthogonal to the
 * platform SuperAdmin flag. A NonMember borrows from the group without taking part in it.
 */
export type GroupRole = 'Admin' | 'Member' | 'NonMember';

/** Members and admins take part in the group; non-members only borrow from it. */
export const participates = (role?: GroupRole) => role === 'Admin' || role === 'Member';

/** One group a person belongs to, carried in the token so the switcher needs no round trip. */
export interface Membership {
  groupId: string;
  groupName: string;
  memberId: string;
  groupRole: GroupRole;
}

/**
 * Two independent axes: `isSuperAdmin` is about the platform and says nothing about any group;
 * the active* fields describe the one group being acted in right now.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  activeGroupId?: string;
  memberId?: string;
  groupRole?: GroupRole;
  memberships: Membership[];
}

export interface Group { id: string; name: string; code: string; description?: string; isActive: boolean; memberInterestRate: number; nonMemberInterestRate: number; validFrom?: string | null; validTo?: string | null; memberCount: number; createdAt: string; updatedAt: string; }

export interface Member { id: string; email?: string | null; firstName: string; lastName?: string | null; fullName: string; groupRole: GroupRole; groupId: string; isActive: boolean; hasAccount: boolean; phoneNumber?: string | null; address?: string | null; createdAt: string; }

export type DepositType = 'MonthlyDeposit' | 'InterestPayment' | 'LoanRepayment' | 'Other';

export interface Deposit { id: string; memberId: string; memberName: string; groupId: string; amount: number; depositMonth: number; depositYear: number; depositDate: string; type: DepositType; notes?: string; isVerified: boolean; verifiedAt?: string; createdAt: string; }

export type LoanStatus = 'Pending' | 'Approved' | 'Active' | 'PaidOff' | 'Overdue' | 'Cancelled' | 'Declined';
export type LoanPaymentType = 'Principal' | 'Interest' | 'Mixed';
export type BorrowerType = 'Member' | 'NonMember';

export interface ApproverInfo { approverId: string; approverName: string; approvedAt: string; }
export interface Loan { id: string; borrowerId: string; borrowerName: string; borrowerType: BorrowerType; groupId: string; amount: number; interestRate: number; outstandingPrincipal: number; accruedInterest: number; payoffAmount: number; dailyInterest: number; unpaidInterest: number; totalPrincipalPaid: number; totalInterestPaid: number; disbursedAt?: string; lastAccrualDate?: string; startDate: string; dueDate?: string; status: LoanStatus; notes?: string; disbursedById?: string; approvalCount: number; declineCount: number; requiredApprovals: number; hasCurrentUserApproved: boolean; hasCurrentUserDeclined: boolean; approvers: ApproverInfo[]; decliners: ApproverInfo[]; createdAt: string; }

export interface LoanPayment { id: string; loanId: string; amount: number; principalAmount: number; interestAmount: number; paidDate: string; paymentType: LoanPaymentType; notes?: string; interestOwedBefore: number; daysAccrued: number; outstandingPrincipalAfter: number; unpaidInterestAfter: number; isVerified: boolean; verifiedAt?: string; createdAt: string; }

export interface Expense { id: string; groupId: string; amount: number; category: string; description: string; expenseDate: string; approvedById?: string; createdAt: string; }

export type FixedDepositStatus = 'Active' | 'Matured' | 'Withdrawn';

export interface FixedDeposit { id: string; groupId: string; institutionName: string; amount: number; interestRate: number; startDate: string; maturityDate: string; status: FixedDepositStatus; notes?: string; expectedMaturityAmount: number; interestEarned?: number; withdrawnAt?: string; createdAt: string; }

// Mirrors FinancialSummaryResponse from GET /finance/summary — no member or loan counts.
export interface FinancialSummary { totalSavingsCollected: number; totalOnLoan: number; totalInterestCollected: number; totalExpenses: number; totalFixedDeposits: number; inHandCash: number; }

export interface MemberDepositSummary { memberId: string; memberName: string; totalAmount: number; depositCount: number; }

// Mirrors SavingsSummaryResponse from GET /deposits/summary. byType keys are the
// DepositType enum names as-is — dictionary keys are not camel-cased by the API.
export interface SavingsSummary { totalDeposits: number; totalVerifiedDeposits: number; totalPendingDeposits: number; byType: Partial<Record<DepositType, number>>; byMember: MemberDepositSummary[]; }

export interface PagedResult<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

export interface ProblemDetails { title: string; status: number; detail?: string; errors?: Record<string, string[]>; }
