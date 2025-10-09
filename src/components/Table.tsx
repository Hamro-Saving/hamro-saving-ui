import React from "react";

interface TableColumn<T> {
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, idx: number) => React.Key;
}

export default function Table<T>({ columns, data, rowKey }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 uppercase tracking-wide text-xs border-b">
            {columns.map((col, i) => (
              <th
                key={i}
                className={
                  "px-4 py-3 font-medium " + (col.className || "")
                }
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              {columns.map((col, j) => (
                <td
                  key={j}
                  className={
                    "px-4 py-3 whitespace-nowrap text-gray-900 " +
                    (col.className || "")
                  }
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
