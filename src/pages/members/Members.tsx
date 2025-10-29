import { members } from "../../data/membersData";
import Table from "../../components/Table";
import Panel from "../../components/Panel";

const columns = [
	{ label: "Name", render: (m: any) => m.name },
	{ label: "Email", render: (m: any) => m.email },
	{ label: "Phone", render: (m: any) => m.phone },
	{ label: "Member Since", render: (m: any) => m.memberSince },
	{
		label: "Monthly Saving",
		className: "text-center",
		render: (m: any) =>
			m.monthlySavingPaid ? (
				<span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
					Paid
				</span>
			) : (
				<span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">
					Not Paid
				</span>
			),
	},
	{
		label: "Has Loan",
		className: "text-center",
		render: (m: any) =>
			m.hasLoan ? (
				<span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
					Yes
				</span>
			) : (
				<span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-slate-200 text-slate-700">
					No
				</span>
			),
	},
];

export default function Members() {
	return (
		<div className="flex-1 flex flex-col min-h-0 w-full">
			<Panel>
				<div className="max-h-[calc(100vh-12rem)] overflow-auto">
					<Table
						columns={columns}
						data={members}
						rowKey={(m, i) => m.email + i}
					/>
				</div>
			</Panel>
		</div>
	);
}
