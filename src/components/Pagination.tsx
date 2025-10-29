type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
};

export default function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  const goTo = (p: number) =>
    onPageChange(Math.min(Math.max(1, p), totalPages));

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {/* Left: count + page size */}
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          {startIdx}–{endIdx} of {total}
        </span>

        {onPageSizeChange && (
          <label className="inline-flex items-center gap-2">
            <span className="text-gray-600">Rows</span>
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Right: pager */}
      <div className="flex items-center gap-1">
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => goTo(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          «
        </button>
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => goTo(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        <PageNumbers page={page} totalPages={totalPages} onChange={goTo} />

        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          ›
        </button>
        <button
          className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => goTo(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}

function PageNumbers({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const makeBtn = (p: number) => (
    <button
      key={p}
      onClick={() => onChange(p)}
      className={`min-w-[2rem] rounded-md border px-3 py-1 text-sm ${
        p === page ? "bg-gray-100 font-semibold" : ""
      }`}
      aria-current={p === page ? "page" : undefined}
    >
      {p}
    </button>
  );

  if (totalPages <= 7) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => makeBtn(i + 1))}
      </div>
    );
  }

  const parts: (number | "dots")[] = [1];
  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);

  if (windowStart > 2) parts.push("dots");
  for (let p = windowStart; p <= windowEnd; p++) parts.push(p);
  if (windowEnd < totalPages - 1) parts.push("dots");
  parts.push(totalPages);

  return (
    <div className="flex items-center gap-1">
      {parts.map((p, i) =>
        p === "dots" ? (
          <span key={`dots-${i}`} className="px-2 text-sm text-gray-500">
            …
          </span>
        ) : (
          makeBtn(p)
        )
      )}
    </div>
  );
}
