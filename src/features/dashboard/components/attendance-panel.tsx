import type { ReactNode } from "react";
import { checkInAttendance, checkOutAttendance } from "@/features/dashboard/actions/attendance";
import { Button } from "@/shared/ui/button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import type { AttendancePageData } from "@/features/dashboard/data";

type AttendancePanelProps = {
  data: AttendancePageData;
};

export function AttendancePanel({ data }: AttendancePanelProps) {
  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className={`grid gap-6 ${data.canMarkAttendance ? "xl:grid-cols-[420px_minmax(0,1fr)]" : ""}`}>
        {data.canMarkAttendance ? (
          <PanelSection
            description="Use these buttons for simple login-based attendance. Mark check-in once at the start of the day and check-out when you finish."
            eyebrow="Mark Attendance"
            title="Today"
          >
            <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">
                {data.todayRecord ? `${data.todayRecord.status} for ${data.todayRecord.dateKey}` : "Attendance not marked for today"}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Check In: {data.todayRecord?.checkInAt ?? "Not marked"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Check Out: {data.todayRecord?.checkOutAt ?? "Not marked"}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <form action={checkInAttendance}>
                  <Button className="sm:w-auto" type="submit">
                    Check In
                  </Button>
                </form>
                <form action={checkOutAttendance}>
                  <Button
                    className="border border-slate-200 bg-white text-slate-900 shadow-none hover:bg-slate-50 sm:w-auto"
                    type="submit"
                  >
                    Check Out
                  </Button>
                </form>
              </div>
            </div>
          </PanelSection>
        ) : null}

        <PanelSection
          description={
            data.canMarkAttendance
              ? "Simple daily attendance view for everyone visible in your role scope."
              : "Today attendance status for all employees. You can see who marked attendance and who is still pending."
          }
          eyebrow="Today Attendance"
          title={data.canMarkAttendance ? "Current Day View" : "Employee Attendance Status"}
        >
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-100">
            <div className="grid grid-cols-4 gap-4 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span>Name</span>
              <span>Check In</span>
              <span>Check Out</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-100">
              {data.todayRecords.length ? (
                data.todayRecords.map((record) => (
                  <div className="grid grid-cols-4 gap-4 px-5 py-4 text-sm text-slate-700" key={record.id}>
                    <div>
                      <span className="font-medium text-slate-900">{record.employeeName}</span>
                      <p className="mt-1 text-xs text-slate-500">{record.employeeEmail}</p>
                    </div>
                    <span>{record.checkInAt}</span>
                    <span>{record.checkOutAt}</span>
                    <span className={record.status === "NOT_MARKED" ? "font-semibold text-rose-600" : "font-medium text-emerald-700"}>
                      {formatLabel(record.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-5 text-sm text-slate-500">No attendance has been marked yet today.</div>
              )}
            </div>
          </div>
        </PanelSection>
      </section>

      <PanelSection
        description="Basic monthly report showing how many attendance rows were marked and how many completed checkouts exist."
        eyebrow="Monthly Report"
        title="Attendance Report"
      >
        <div className="mt-6">
          <DashboardTable
            columns={[
              { label: "Employee" },
              { label: "Days Marked" },
              { label: "Completed Checkouts" },
            ]}
            emptyMessage="Monthly attendance data will appear here after people start checking in."
            hasRows={data.monthlyRows.length > 0}
          >
            {data.monthlyRows.map((row) => (
              <tr key={row.id}>
                <DashboardTableCell className="font-semibold text-slate-900">{row.employeeName}</DashboardTableCell>
                <DashboardTableCell>{row.daysMarked}</DashboardTableCell>
                <DashboardTableCell>{row.completedDays}</DashboardTableCell>
              </tr>
            ))}
          </DashboardTable>
        </div>
      </PanelSection>
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

function PanelSection({
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
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}



