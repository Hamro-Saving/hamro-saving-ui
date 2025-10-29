import { useMemo, useState } from "react";
import Table from "../../components/Table";
import Panel from "../../components/Panel";
import Pagination from "../../components/Pagination";
import { transactions } from "../../data/transactionsData";

const columns = [
  { label: "Name", render: (t: any) => t.member },
  { label: "Date", render: (t: any) => t.date },
  { label: "Type", render: (t: any) => t.type },
  {
    label: "Amount",
    className: "text-center",
    render: (t: any) => {
      const isNegative = t.amount < 0;
      const sign = isNegative ? "-" : "+";
      const color = isNegative ? "text-red-600" : "text-emerald-600";
      return (
        <span className={["font-semibold", color].join(" ")}>
          {sign} ${Math.abs(t.amount).toLocaleString()}
        </span>
      );
    },
  },
];

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const total = transactions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) {
    setPage(totalPages); // clamp if data/size changes
  }

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [page, pageSize]);

  return (
    // Prevent entire page scrolling
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
        {/* Wrapper controls flex + scroll layout */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Panel>
            {/* Table scrolls inside the panel */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <Table
                columns={columns}
                data={pagedData}
                rowKey={(t: any) => t.id}
              />
            </div>
          </Panel>
        </div>
      </div>

      {/* Sticky footer with pagination */}
      <div className="sticky bottom-0 z-10 border-t bg-white px-4 py-3">
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            const firstIndex = (page - 1) * pageSize;
            const nextPage = Math.floor(firstIndex / n) + 1;
            setPageSize(n);
            setPage(nextPage);
          }}
        />
      </div>
    </div>
  );
}
