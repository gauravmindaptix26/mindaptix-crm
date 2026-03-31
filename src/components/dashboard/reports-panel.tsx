import type { ReactNode } from "react";
import type { ReportsPageData } from "@/lib/dashboard/mvp-data";

type ReportsPanelProps = {
  data: ReportsPageData;
};

export function ReportsPanel({ data }: ReportsPanelProps) {
  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-3">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ReportSection description="Monthly marked attendance and checkout completion totals." eyebrow="Attendance Report" title="Attendance">
          <div className="mt-6 space-y-3">
            {data.attendanceRows.length ? (
              data.attendanceRows.map((row) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={row.id}>
                  <p className="text-sm font-semibold text-slate-900">{row.employeeName}</p>
                  <p className="mt-2 text-sm text-slate-500">Days Marked: {row.daysMarked}</p>
                  <p className="mt-1 text-sm text-slate-500">Completed Checkouts: {row.completedDays}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No attendance report data available yet." />
            )}
          </div>
        </ReportSection>

        <ReportSection description="Recent leave records in the current visible scope." eyebrow="Leave Report" title="Leaves">
          <div className="mt-6 space-y-3">
            {data.leaveRows.length ? (
              data.leaveRows.map((leave) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={leave.id}>
                  <p className="text-sm font-semibold text-slate-900">{leave.employeeName}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {leave.leaveType} • {leave.startDate} to {leave.endDate}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{leave.status}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No leave report data available yet." />
            )}
          </div>
        </ReportSection>

        <ReportSection description="Recent tasks and their latest status." eyebrow="Task Report" title="Tasks">
          <div className="mt-6 space-y-3">
            {data.taskRows.length ? (
              data.taskRows.map((task) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={task.id}>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{task.assignedUserName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Due {task.dueDate} • {task.status}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No task report data available yet." />
            )}
          </div>
        </ReportSection>
      </section>
    </div>
  );
}

function OverviewCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-[1.6rem] border border-slate-100 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}

function ReportSection({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">{message}</div>;
}
