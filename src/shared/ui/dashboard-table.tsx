import type { ReactNode } from "react";

type DashboardTableColumn = {
  className?: string;
  label: string;
};

type DashboardTableProps = {
  columns: DashboardTableColumn[];
  emptyMessage: string;
  hasRows: boolean;
  children: ReactNode;
};

export function DashboardTable({ children, columns, emptyMessage, hasRows }: DashboardTableProps) {
  if (!hasRows) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100">
      <table className="min-w-full border-collapse bg-white text-sm text-slate-700">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                className={`px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 ${column.className ?? ""}`}
                key={column.label}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function DashboardTableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-4 align-top ${className}`}>{children}</td>;
}
