import type { Group } from "../../api/types";

interface GroupInfoBarProps {
  group: Group;
}

export default function GroupInfoBar({ group }: GroupInfoBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap items-center gap-6">
      <div>
        <p className="text-xs text-gray-400 font-medium">Group</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-semibold text-gray-800">{group.name}</p>
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
          {group.memberCount}
        </p>
      </div>
    </div>
  );
}
