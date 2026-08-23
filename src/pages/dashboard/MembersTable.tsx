import { formatDate } from "../../utils/format";
import type { Member } from "../../api/types";

interface MembersTableProps {
  members?: Member[];
}

export default function MembersTable({ members }: MembersTableProps) {
  return (
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
                      {m.lastName?.[0]}
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
  );
}
