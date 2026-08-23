import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositsApi } from "../../api/finance";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import { formatCurrency, formatDate } from "../../utils/format";

export default function Verify() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: pendingDeposits } = useQuery({
    queryKey: ["deposits", user?.groupId, "pending"],
    queryFn: () =>
      depositsApi.getDeposits({ isVerified: false }),
  });

  const verifyDepositMutation = useMutation({
    mutationFn: (id: string) => depositsApi.verifyDeposit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposits"] });
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Review and verify pending deposits and payments
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Pending Deposits</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {pendingDeposits?.length ?? 0} pending
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {(pendingDeposits ?? []).map((d) => (
            <div
              key={d.id}
              className="px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">{d.memberName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {d.type} · Submitted {formatDate(d.createdAt)}
                </p>
                {d.notes && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">
                    "{d.notes}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(d.amount)}
                  </p>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => verifyDepositMutation.mutate(d.id)}
                  disabled={verifyDepositMutation.isPending}
                >
                  {verifyDepositMutation.isPending && verifyDepositMutation.variables === d.id ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          ))}
          {!pendingDeposits?.length && (
            <div className="px-5 py-10 text-center">
              <svg
                className="w-10 h-10 text-emerald-200 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-400">
                All caught up! No pending deposits.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
