import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositsApi } from "../../api/finance";
import { membersApi } from "../../api/groups";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";
import {
  formatCurrency,
  formatDate,
  BS_MONTHS,
  bsMonthName,
  currentBsDate,
  todayIso,
} from "../../utils/format";
import type { DepositType } from "../../api/types";

const DEPOSIT_TYPES: DepositType[] = [
  "MonthlyDeposit",
  "InterestPayment",
  "LoanRepayment",
  "Other",
];
const MONTHLY_SAVING_AMOUNTS = [8000, 10000];

function getFormErrors(form: {
  type: DepositType;
  amount: string;
  notes: string;
}) {
  const errors: Record<string, string> = {};
  const amount = Number(form.amount);
  if (!form.amount || isNaN(amount) || amount <= 0) {
    errors.amount = "Amount is required.";
  } else if (
    form.type === "MonthlyDeposit" &&
    !MONTHLY_SAVING_AMOUNTS.includes(amount)
  ) {
    errors.amount = `Monthly saving must be NPR ${MONTHLY_SAVING_AMOUNTS.join(" or ")}.`;
  }
  if (form.type === "Other" && !form.notes.trim()) {
    errors.notes = "Remarks are required when type is Other.";
  }
  return errors;
}

export default function Savings() {
  const { user, isGroupAdmin } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editDeposit, setEditDeposit] = useState<{ id: string; amount: string; notes: string } | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const todayBs = currentBsDate();
  const [form, setForm] = useState({
    memberId: "",
    amount: "8000",
    depositDate: todayIso(),
    depositMonth: todayBs.month,
    depositYear: todayBs.year,
    type: "MonthlyDeposit" as DepositType,
    notes: "",
  });

  function handleTypeChange(type: DepositType) {
    setForm((f) => ({
      ...f,
      type,
      amount: type === "MonthlyDeposit" ? "8000" : f.amount,
    }));
    setFormErrors({});
  }

  const { data: deposits, isLoading } = useQuery({
    queryKey: ["deposits", user?.activeGroupId, filterMonth, filterVerified],
    queryFn: () =>
      depositsApi.getDeposits({
        month: filterMonth ? Number(filterMonth) : undefined,
        isVerified:
          filterVerified === "" ? undefined : filterVerified === "true",
      }),
  });
  const { data: members } = useQuery({
    queryKey: ["members", user?.activeGroupId],
    queryFn: () => membersApi.getAll({ roles: ['Member', 'Admin'] }),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      depositsApi.createDeposit({
        ...form,
        amount: Number(form.amount),
        memberId: form.memberId || user?.memberId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposits"] });
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
      setShowAdd(false);
    },
  });

  function handleSubmit() {
    const errors = getFormErrors(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    addMutation.mutate();
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, amount, notes }: { id: string; amount: number; notes?: string }) =>
      depositsApi.updateDeposit(id, { amount, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposits"] });
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
      setEditDeposit(null);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => depositsApi.verifyDeposit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposits"] });
      qc.invalidateQueries({ queryKey: ["finance-summary"] });
    },
  });

  const typeColors: Record<string, string> = {
    MonthlyDeposit: "bg-blue-100 text-blue-700",
    InterestPayment: "bg-purple-100 text-purple-700",
    LoanRepayment: "bg-amber-100 text-amber-700",
    Other: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Deposits
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track monthly contributions and interest payments
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Record Deposit
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Months</option>
          {BS_MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Record Deposit
            </h2>
            <div className="space-y-3">
              {isGroupAdmin && (
                <div>
                  <label className="text-xs text-gray-600 font-medium">
                    Member
                  </label>
                  <select
                    value={form.memberId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, memberId: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select member</option>
                    {(members ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Deposit Date (AD)
                </label>
                <input
                  type="date"
                  value={form.depositDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, depositDate: e.target.value }))
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Deposit Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as DepositType)
                  }
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {DEPOSIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/([A-Z])/g, " $1").trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Amount (NPR)
                </label>
                {form.type === "MonthlyDeposit" ? (
                  <div className="mt-1 flex gap-2">
                    {MONTHLY_SAVING_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, amount: String(a) }))
                        }
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${Number(form.amount) === a ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >
                        {formatCurrency(a)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Enter amount"
                  />
                )}
                {formErrors.amount && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Deposited For (BS)
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <select
                    value={form.depositMonth}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        depositMonth: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {BS_MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={form.depositYear}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        depositYear: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="2082"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">
                  Remarks{" "}
                  {form.type === "Other" ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="text-gray-400">(optional)</span>
                  )}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none ${formErrors.notes ? "border-red-400" : "border-gray-300"}`}
                />
                {formErrors.notes && (
                  <p className="mt-1 text-xs text-red-500">
                    {formErrors.notes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubmit}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Saving..." : "Save Deposit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editDeposit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Deposit</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">Amount (NPR)</label>
                <input
                  type="number"
                  value={editDeposit.amount}
                  onChange={(e) => setEditDeposit((d) => d && { ...d, amount: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Remarks <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={editDeposit.notes}
                  onChange={(e) => setEditDeposit((d) => d && { ...d, notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={() => setEditDeposit(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => updateMutation.mutate({ id: editDeposit.id, amount: Number(editDeposit.amount), notes: editDeposit.notes || undefined })}
                disabled={updateMutation.isPending || !editDeposit.amount || Number(editDeposit.amount) <= 0}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "Member",
                "Month/Year",
                "Type",
                "Amount",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {(deposits ?? []).map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-gray-800">
                  {d.memberName}
                </td>
                <td className="px-5 py-3.5 text-gray-600">
                  {bsMonthName(d.depositMonth)} {d.depositYear}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[d.type]}`}
                  >
                    {d.type.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-900">
                  {formatCurrency(d.amount)}
                </td>
                <td className="px-5 py-3.5">
                  {d.isVerified ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                      Verified {d.verifiedAt ? formatDate(d.verifiedAt) : ""}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {!d.isVerified && isGroupAdmin && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => verifyMutation.mutate(d.id)}
                      >
                        Verify
                      </Button>
                    )}
                    {!d.isVerified && (isGroupAdmin || d.memberId === user?.memberId) && (
                      <Button
                        size="sm"
                        onClick={() => setEditDeposit({ id: d.id, amount: String(d.amount), notes: d.notes ?? "" })}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !deposits?.length && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No deposits found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
