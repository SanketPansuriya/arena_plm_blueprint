import type { ReactNode } from "react";

type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  emptyState = "No records available.",
}: Readonly<{
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyState?: string;
}>) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-900/10 bg-[#faf8f2]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-8 text-sm text-slate-500"
                  colSpan={columns.length}
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-900/8 last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-5 py-4 text-sm text-slate-700 ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
