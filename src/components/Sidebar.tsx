import { useNavigate } from "react-router-dom";

const items = [
	{ label: "Dashboard", icon: "📊", path: "/" },
	{ label: "Members", icon: "👥", path: "/members" },
	{ label: "Transactions", icon: "💸", path: "/transactions" },
	{ label: "Active Loans", icon: "💳", path: "/active-loans" },
	{ label: "Loan History", icon: "📜", path: "/loan-history" },
];

export default function Sidebar() {
	const navigate = useNavigate();
	const current = window.location.pathname;

	return (
		<aside className="w-64 hidden md:flex md:flex-col border-r bg-white min-h-screen sticky top-0">
			<div className="px-5 py-4 border-b flex items-center justify-between">
				<div>
					<div className="font-bold text-xl">Hamro Saving</div>
					<div className="text-xs text-gray-500">
						A penny saved is a penny earned.
					</div>
				</div>
			</div>
			<nav className="flex-1 p-2">
				{items.map((m) => {
					const isActive = current === m.path;
					return (
						<button
							key={m.label}
							onClick={() => navigate(m.path)}
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
