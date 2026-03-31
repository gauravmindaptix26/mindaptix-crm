"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { ReportsPageData } from "@/lib/dashboard/mvp-data";

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
          <div className="mt-6 space-y-3">
            {data.calendarItems.length ? (
              data.calendarItems.map((item) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      {item.date}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No calendar items available yet." />
            )}
          </div>
        </ReportSection>

        <ReportSection description="Simple 0-100 score based on attendance, task completion, and DSR consistency." eyebrow="Performance" title="Scoreboard">
          <div className="mt-6 space-y-3">
            {data.performanceRows.length ? (
              data.performanceRows.map((row) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={row.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.employeeName}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.employeeEmail}</p>
                    </div>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Score {row.score}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <MetricBox label="Attendance" value={`${row.attendanceRate}%`} />
                    <MetricBox label="Tasks" value={`${row.taskCompletionRate}%`} />
                    <MetricBox label="DSR" value={`${row.dsrConsistencyRate}%`} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="Performance scores will appear after activity data is available." />
            )}
          </div>
        </ReportSection>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <SearchField onChange={setSearchTerm} value={searchTerm} />
        <DateField onChange={setDateFilter} value={dateFilter} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ReportSection description="Monthly marked attendance and checkout completion totals." eyebrow="Attendance Report" title="Attendance">
          <div className="mt-6 space-y-3">
            {filteredAttendance.length ? (
              filteredAttendance.map((row) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={row.id}>
                  <p className="text-sm font-semibold text-slate-900">{row.employeeName}</p>
                  <p className="mt-2 text-sm text-slate-500">Days Marked: {row.daysMarked}</p>
                  <p className="mt-1 text-sm text-slate-500">Completed Checkouts: {row.completedDays}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No attendance report data available for the current filter." />
            )}
          </div>
        </ReportSection>

        <ReportSection description="Leave history in the current visible scope." eyebrow="Leave Report" title="Leaves">
          <div className="mt-6 space-y-3">
            {filteredLeaves.length ? (
              filteredLeaves.map((leave) => (
                <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={leave.id}>
                  <p className="text-sm font-semibold text-slate-900">{leave.employeeName}</p>
                  <p className="mt-2 text-sm text-slate-500">{leave.leaveType} • {leave.startDate} to {leave.endDate}</p>
                  <p className="mt-1 text-sm text-slate-500">{leave.status}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No leave report data available for the current filter." />
            )}
          </div>
        </ReportSection>

        <ReportSection description="Tasks, priority, overdue state, labels, and latest status." eyebrow="Task Report" title="Tasks">
          <div className="mt-6 space-y-3">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <div className={`rounded-[1.4rem] border p-4 ${task.isOverdue ? "border-red-200 bg-red-50/60" : "border-slate-100 bg-slate-50"}`} key={task.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {task.assignedUserName}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {task.priority}
                    </span>
                    {task.labels.map((label) => (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" key={label}>
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-2 text-sm text-slate-500">Due {task.dueDate} • {task.status}</p>
                </div>
              ))
            ) : (
              <EmptyState message="No task report data available for the current filter." />
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

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-white px-3 py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
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
