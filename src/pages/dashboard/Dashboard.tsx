import KpiCard from "../../components/KpiCard";
import Panel from "../../components/Panel";
import {summary,activeLoans,recentTransactions} from "../../data/dashboardData";

export default function Dashboard() {
  

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Collection" value={summary.TotalCollection.toString()}/>
        <KpiCard label="Active Loans" value={summary.OnLoan.toString()}  sub="avg rate 18%"/>
        <KpiCard label="Interest Collected" value={summary.Interest.toString()} />
        <KpiCard label="Deposits" value={summary.Deposited.toString()}/>
        <KpiCard label="Total Expenses" value={summary.Expenses.toString()}/>
        <KpiCard label="In-Hand" value={summary.InHand.toString()}/>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Active Loans */}
        <Panel title="Active Loans">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Loan ID</th>
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Rate</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="py-2 pr-4 font-medium">{l.id}</td>
                    <td className="py-2 pr-4">{l.member}</td>
                    <td className="py-2 pr-4">${l.amount.toLocaleString()}</td>
                    <td className="py-2 pr-4">{l.rate}%</td>
                    <td className="py-2">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          l.status === "Payment due"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800",
                        ].join(" ")}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Right column: Recent Transactions */}
        <Panel title="Recent Transactions">
          <ul className="divide-y">
            {recentTransactions.map((t) => (
              <li key={t.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.member}</div>
                  <div className="text-xs text-gray-500">
                    {t.type} • {t.date}
                  </div>
                </div>
                <div
                  className={[
                    "font-semibold",
                    t.amount < 0 ? "text-emerald-600" : "text-blue-600",
                  ].join(" ")}
                >
                  {t.amount < 0 ? "-" : "+"}$
                  {Math.abs(t.amount).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </div>
  );
}
