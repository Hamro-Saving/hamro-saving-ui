import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeApi, loansApi, depositsApi } from "../../api/finance";
import { groupsApi, membersApi } from "../../api/groups";
import { useAuth } from "../../context/AuthContext";
import KpiCard from "../../components/KpiCard";
import { formatCurrency, formatDate } from "../../utils/format";
import type { Group } from "../../api/types";

export default function Dashboard() {
  const { user, isRole } = useAuth();
  const isAdmin = isRole("Admin");
  const groupId = user?.groupId;
  const qc = useQueryClient();

  const [showGroupEdit, setShowGroupEdit] = useState(false);
  const [groupForm, setGroupForm] = useState<Partial<Group>>({});
  const [groupEditError, setGroupEditError] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Member",
  });
  const [memberError, setMemberError] = useState("");

  const { data: summary } = useQuery({
    queryKey: ["finance-summary", groupId],
    queryFn: () => financeApi.getSummary({ groupId }),
  });
  const { data: activeLoans } = useQuery({
    queryKey: ["loans", groupId, "Active"],
    queryFn: () => loansApi.getAll({ groupId, status: "Active" }),
  });
  const { data: recentDeposits } = useQuery({
    queryKey: ["deposits", groupId],
    queryFn: () => depositsApi.getDeposits({ groupId }),
  });
  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.getById(groupId!),
    enabled: !!groupId,
  });
  const { data: members } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => membersApi.getAll({ groupId }),
    enabled: !!groupId,
  });

  const updateGroupMutation = useMutation({
    mutationFn: () => groupsApi.update(groupId!, groupForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      setShowGroupEdit(false);
      setGroupEditError("");
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setGroupEditError(e.response?.data?.detail ?? "Failed to update group"),
  });

  const addMemberMutation = useMutation({
    mutationFn: () =>
      membersApi.create({
        ...memberForm,
        groupId,
        role: memberForm.role as import("../../api/types").UserRole,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", groupId] });
      qc.invalidateQueries({ queryKey: ["finance-summary", groupId] });
      setShowAddMember(false);
      setMemberForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Member",
      });
      setMemberError("");
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      setMemberError(e.response?.data?.detail ?? "Failed to add member"),
  });

  const loanStatusColor: Record<string, string> = {
    Active: "bg-blue-100 text-blue-700",
    PaidOff: "bg-emerald-100 text-emerald-700",
    Overdue: "bg-red-100 text-red-700",
    Cancelled: "bg-gray-100 text-gray-600",
  };

  const openGroupEdit = () => {
    if (group) {
      setGroupForm({
        name: group.name,
        description: group.description,
        memberInterestRate: group.memberInterestRate,
        nonMemberInterestRate: group.nonMemberInterestRate,
      });
      setGroupEditError("");
      setShowGroupEdit(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Financial overview for your group
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMemberError("");
                setShowAddMember(true);
              }}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Add Member
            </button>
            <button
              onClick={openGroupEdit}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Group Settings
            </button>
          </div>
        )}
      </div>

      {/* Group info bar (Admin only) */}
      {isAdmin && group && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-gray-400 font-medium">Group</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-semibold text-gray-800">
                {group.name}
              </p>
              <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {group.code}
              </code>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${group.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
              >
                {group.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400 font-medium">
              Member Interest Rate
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {group.memberInterestRate}% p.a.
            </p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400 font-medium">
              Non-Member Interest Rate
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {group.nonMemberInterestRate}% p.a.
            </p>
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Members</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {summary?.memberCount ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Collection"
          value={formatCurrency(summary?.totalDeposited ?? 0)}
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
          value={formatCurrency(summary?.totalOnLoan ?? 0)}
          color="amber"
          sub={`${summary?.activeLoanCount ?? 0} active`}
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
          value={formatCurrency(summary?.totalInFixedDeposits ?? 0)}
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
          value={formatCurrency(summary?.inHandCash ?? 0)}
          color="indigo"
          sub={`${summary?.memberCount ?? 0} members`}
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

      {/* Members table (Admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Members</h2>
            <span className="text-xs text-gray-400">
              {members?.length ?? 0} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                  {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(members ?? []).slice(0, 8).map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                          {m.firstName[0]}
                          {m.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-800">
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{m.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === "Admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                      >
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(m.createdAt)}
                    </td>
                  </tr>
                ))}
                {!members?.length && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      No members yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Active Loans</h2>
            <span className="text-xs text-gray-400">
              {activeLoans?.length ?? 0} loans
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {(activeLoans ?? []).slice(0, 6).map((loan) => (
              <div
                key={loan.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {loan.borrowerName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {loan.borrowerType} · {loan.interestRate}% interest
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(loan.amount)}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${loanStatusColor[loan.status]}`}
                  >
                    {loan.status}
                  </span>
                </div>
              </div>
            ))}
            {!activeLoans?.length && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                No active loans
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Deposits</h2>
            <span className="text-xs text-gray-400">
              {recentDeposits?.length ?? 0} total
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentDeposits ?? []).slice(0, 6).map((dep) => (
              <div
                key={dep.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {dep.memberName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {dep.type} · {formatDate(dep.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(dep.amount)}
                  </p>
                  {dep.isVerified ? (
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!recentDeposits?.length && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                No deposits yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Add New Member
            </h2>
            {memberError && (
              <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
                {memberError}
              </p>
            )}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    First Name
                  </label>
                  <input
                    value={memberForm.firstName}
                    onChange={(e) =>
                      setMemberForm((f) => ({
                        ...f,
                        firstName: e.target.value,
                      }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    Last Name
                  </label>
                  <input
                    value={memberForm.lastName}
                    onChange={(e) =>
                      setMemberForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) =>
                    setMemberForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={memberForm.password}
                  onChange={(e) =>
                    setMemberForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Role
                </label>
                <select
                  value={memberForm.role}
                  onChange={(e) =>
                    setMemberForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Member">Member</option>
                  <option value="NonMember">Non-Member</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddMember(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => addMemberMutation.mutate()}
                disabled={addMemberMutation.isPending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {addMemberMutation.isPending ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showGroupEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Group Settings
            </h2>
            {groupEditError && (
              <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
                {groupEditError}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Group Name
                </label>
                <input
                  value={groupForm.name ?? ""}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Description
                </label>
                <textarea
                  value={groupForm.description ?? ""}
                  onChange={(e) =>
                    setGroupForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    Member Interest (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={groupForm.memberInterestRate ?? ""}
                    onChange={(e) =>
                      setGroupForm((f) => ({
                        ...f,
                        memberInterestRate: Number(e.target.value),
                      }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    Non-Member Interest (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={groupForm.nonMemberInterestRate ?? ""}
                    onChange={(e) =>
                      setGroupForm((f) => ({
                        ...f,
                        nonMemberInterestRate: Number(e.target.value),
                      }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowGroupEdit(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateGroupMutation.mutate()}
                disabled={updateGroupMutation.isPending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {updateGroupMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
