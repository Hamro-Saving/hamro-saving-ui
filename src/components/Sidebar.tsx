import { useMemo } from "react";

type Page = "Dashboard" | "Members" | "Active Loans" | "Loan History";

interface SidebarProps {
  active: Page;
  onChange: (p: Page) => void;
}

const items: { label: Page; icon: string }[] = [
  { label: "Dashboard", icon: "📊" },
  { label: "Members", icon: "👥" },
  { label: "Active Loans", icon: "💳" },
  { label: "Loan History", icon: "📜" },
];

export default function Sidebar({ active, onChange }: SidebarProps) {
  const menu = useMemo(() => items, []);

  return (
    <aside className="w-64 hidden md:flex md:flex-col border-r bg-white min-h-screen sticky top-0">
      <div className="px-5 py-4 border-b">
        <div className="font-bold text-xl">Hamro Saving</div>
        <div className="text-xs text-gray-500">A penny saved is a penny earned.</div>
      </div>

      <nav className="flex-1 p-2">
        {menu.map((m) => {
          const isActive = active === m.label;
          return (
            <button
              key={m.label}
              onClick={() => onChange(m.label)}
              className={[
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "hover:bg-gray-100 text-gray-700",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-lg">{m.icon}</span>
              <span className="font-medium">{m.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs text-gray-500">
        © {new Date().getFullYear()} Hamro Saving
      </div>
    </aside>
  );
}
