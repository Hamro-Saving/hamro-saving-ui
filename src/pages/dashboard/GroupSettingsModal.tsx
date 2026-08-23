import { useState } from "react";
import type { Group } from "../../api/types";

export type GroupFormValues = Pick<
  Group,
  "name" | "description" | "memberInterestRate" | "nonMemberInterestRate"
>;

interface GroupSettingsModalProps {
  group: Group;
  error: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => void;
}

export default function GroupSettingsModal({
  group,
  error,
  isPending,
  onClose,
  onSubmit,
}: GroupSettingsModalProps) {
  const [form, setForm] = useState<GroupFormValues>({
    name: group.name,
    description: group.description,
    memberInterestRate: group.memberInterestRate,
    nonMemberInterestRate: group.nonMemberInterestRate,
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Group Settings
        </h2>
        {error && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">
              Group Name
            </label>
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">
              Description
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
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
                value={form.memberInterestRate ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
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
                value={form.nonMemberInterestRate ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
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
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={isPending}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
