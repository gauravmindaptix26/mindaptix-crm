"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import type { ReportsPageData } from "@/features/dashboard/data";

type ReportsPanelProps = {
  data: ReportsPageData;
};

export function ReportsPanel({ data }: ReportsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredLeaves = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return data.leaveRows.filter((leave) => {
      const matchesDate = !dateFilter || leave.startDate <= dateFilter;
      const matchesQuery =
        !query ||
        [leave.employeeName, leave.employeeEmail, leave.leaveType, leave.status, leave.reason].join(" ").toLowerCase().includes(query);

      return matchesDate && matchesQuery;
    });
  }, [data.leaveRows, dateFilter, searchTerm]);

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return data.taskRows.filter((task) => {
      const matchesDate = !dateFilter || task.dueDate === dateFilter;
      const matchesQuery =
        !query ||
        [task.title, task.description, task.assignedUserName, task.priority, task.labels.join(" ")].join(" ").toLowerCase().includes(query);

      return matchesDate && matchesQuery;
    });
  }, [data.taskRows, dateFilter, searchTerm]);

  const filteredAttendance = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return data.attendanceRows.filter((row) => !query || row.employeeName.toLowerCase().includes(query));
  }, [data.attendanceRows, searchTerm]);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-3">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">Weekly Summary</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.weeklySummaryCards.map((card) => (
            <article className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={card.label}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-blue-600">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <ReportSection description="Simple calendar feed for deadlines and leaves." eyebrow="Calendar" title="Planning View">
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Date" },
                { label: "Type" },
                { label: "Title" },
                { label: "Details" },
              ]}
              emptyMessage="No calendar items available yet."
              hasRows={data.calendarItems.length > 0}
            >
              {data.calendarItems.map((item) => (
                <tr key={item.id}>
                  <DashboardTableCell>{item.date}</DashboardTableCell>
                  <DashboardTableCell>{item.type}</DashboardTableCell>
                  <DashboardTableCell className="font-semibold text-slate-900">{item.title}</DashboardTableCell>
                  <DashboardTableCell className="min-w-[220px]">{item.detail}</DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>
        </ReportSection>

        <ReportSection description="Simple 0-100 score based on attendance, task completion, and DSR consistency." eyebrow="Performance" title="Scoreboard">
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Employee" },
                { label: "Score" },
                { label: "Attendance" },
                { label: "Tasks" },
                { label: "DSR" },
              ]}
              emptyMessage="Performance scores will appear after activity data is available."
              hasRows={data.performanceRows.length > 0}
            >
              {data.performanceRows.map((row) => (
                <tr key={row.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{row.employeeName}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.employeeEmail}</p>
                  </DashboardTableCell>
                  <DashboardTableCell className="font-semibold text-slate-900">{row.score}</DashboardTableCell>
                  <DashboardTableCell>{row.attendanceRate}%</DashboardTableCell>
                  <DashboardTableCell>{row.taskCompletionRate}%</DashboardTableCell>
                  <DashboardTableCell>{row.dsrConsistencyRate}%</DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>
        </ReportSection>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <SearchField onChange={setSearchTerm} value={searchTerm} />
        <DateField onChange={setDateFilter} value={dateFilter} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ReportSection description="Monthly marked attendance and checkout completion totals." eyebrow="Attendance Report" title="Attendance">
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Employee" },
                { label: "Days Marked" },
                { label: "Completed Checkouts" },
              ]}
              emptyMessage="No attendance report data available for the current filter."
              hasRows={filteredAttendance.length > 0}
            >
              {filteredAttendance.map((row) => (
                <tr key={row.id}>
                  <DashboardTableCell className="font-semibold text-slate-900">{row.employeeName}</DashboardTableCell>
                  <DashboardTableCell>{row.daysMarked}</DashboardTableCell>
                  <DashboardTableCell>{row.completedDays}</DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>
        </ReportSection>

        <ReportSection description="Leave history in the current visible scope." eyebrow="Leave Report" title="Leaves">
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Employee" },
                { label: "Leave" },
                { label: "Dates" },
                { label: "Reason" },
                { label: "Status" },
              ]}
              emptyMessage="No leave report data available for the current filter."
              hasRows={filteredLeaves.length > 0}
            >
              {filteredLeaves.map((leave) => (
                <tr key={leave.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{leave.employeeName}</p>
                    <p className="mt-1 text-xs text-slate-500">{leave.employeeEmail}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>{leave.leaveType}</DashboardTableCell>
                  <DashboardTableCell>
                    {leave.startDate} to {leave.endDate}
                  </DashboardTableCell>
                  <DashboardTableCell className="min-w-[220px]">{leave.reason}</DashboardTableCell>
                  <DashboardTableCell>{leave.status}</DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>
        </ReportSection>

        <ReportSection description="Tasks, priority, overdue state, labels, and latest status." eyebrow="Task Report" title="Tasks">
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Task" },
                { label: "Assignee" },
                { label: "Priority" },
                { label: "Labels" },
                { label: "Due / Status" },
              ]}
              emptyMessage="No task report data available for the current filter."
              hasRows={filteredTasks.length > 0}
            >
              {filteredTasks.map((task) => (
                <tr className={task.isOverdue ? "bg-red-50/40" : ""} key={task.id}>
                  <DashboardTableCell className="min-w-[220px]">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>{task.assignedUserName}</DashboardTableCell>
                  <DashboardTableCell>{task.priority}</DashboardTableCell>
                  <DashboardTableCell>{task.labels.length ? task.labels.join(", ") : "No labels"}</DashboardTableCell>
                  <DashboardTableCell>
                    <p>{task.dueDate}</p>
                    <p className={`mt-1 text-sm ${task.isOverdue ? "text-red-600" : "text-slate-500"}`}>
                      {task.status.replaceAll("_", " ")}
                      {task.isOverdue ? " (Overdue)" : ""}
                    </p>
                  </DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
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

function SearchField({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">Search</span>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by employee, task, leave, or status"
        value={value}
      />
    </label>
  );
}

function DateField({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">Date Filter</span>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none [color-scheme:light]"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}


