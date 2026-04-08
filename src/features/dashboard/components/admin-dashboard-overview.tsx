"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AttendanceTrendPoint,
  CalendarEventItem,
  DashboardBreakdownSlice,
  DashboardListItem,
  DashboardNotificationItem,
  DsrTrendPoint,
  EmployeeProjectSummaryRow,
  LeaveTrendPoint,
  PerformanceScoreRow,
  SummaryCard,
} from "@/features/dashboard/types";

type AdminDashboardOverviewProps = {
  attendanceBreakdown?: DashboardBreakdownSlice[];
  attendanceTrend?: AttendanceTrendPoint[];
  calendarItems?: CalendarEventItem[];
  calendarTitle?: string;
  cards: SummaryCard[];
  description: string;
  directoryEmptyMessage?: string;
  directoryItems?: DashboardListItem[];
  directoryTitle?: string;
  dsrTrend?: DsrTrendPoint[];
  employeeProjectRows?: EmployeeProjectSummaryRow[];
  financeNote?: string;
  leaveTrend?: LeaveTrendPoint[];
  notificationTitle?: string;
  notifications?: DashboardNotificationItem[];
  performanceRows?: PerformanceScoreRow[];
  performanceTitle?: string;
  primaryEmptyMessage: string;
  primaryItems: DashboardListItem[];
  primaryListTitle: string;
  projectStatusBreakdown?: DashboardBreakdownSlice[];
  roleBadge?: string;
  secondaryEmptyMessage: string;
  secondaryItems: DashboardListItem[];
  secondaryListTitle: string;
  taskStatusBreakdown?: DashboardBreakdownSlice[];
  title: string;
  weeklySummaryCards?: SummaryCard[];
  weeklySummaryTitle?: string;
};

export function AdminDashboardOverview({
  attendanceBreakdown,
  attendanceTrend,
  calendarItems,
  calendarTitle,
  cards,
  description,
  directoryEmptyMessage,
  directoryItems,
  directoryTitle,
  dsrTrend,
  employeeProjectRows,
  financeNote,
  leaveTrend,
  notificationTitle,
  notifications,
  performanceRows,
  performanceTitle,
  primaryEmptyMessage,
  primaryItems,
  primaryListTitle,
  projectStatusBreakdown,
  roleBadge,
  secondaryEmptyMessage,
  secondaryItems,
  secondaryListTitle,
  taskStatusBreakdown,
  title,
  weeklySummaryCards,
  weeklySummaryTitle,
}: AdminDashboardOverviewProps) {
  const showExecutiveCharts =
    Boolean(attendanceBreakdown?.length) ||
    Boolean(attendanceTrend?.length) ||
    Boolean(taskStatusBreakdown?.length) ||
    Boolean(projectStatusBreakdown?.length) ||
    Boolean(leaveTrend?.length) ||
    Boolean(dsrTrend?.length);

  return (
    <div className="space-y-5 px-5 pb-5 pt-1 sm:px-7 sm:pb-6 sm:pt-1">
      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Dashboard</p>
          {roleBadge ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-[0.35rem] text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {roleBadge}
            </span>
          ) : null}
        </div>
        <h2 className="mt-1 text-[1.95rem] font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        {financeNote ? (
          <div className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            {financeNote}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <article
            className="rounded-[1.6rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            key={card.label}
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      {showExecutiveCharts ? (
        <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Operational Snapshot</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Charts And Graphs</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Attendance, tasks, projects, leave, and DSR movement are grouped here for faster review.
              </p>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Live Overview
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <section className="grid gap-5 xl:items-start xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)_minmax(320px,0.8fr)]">
            <ChartPanel description="Daily employee movement for the last 7 days." title="Attendance Overview">
              {attendanceTrend?.length ? (
                <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
                  <ResponsiveContainer height={248} width="100%">
                    <BarChart data={attendanceTrend}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#2563eb" name="Present" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="onLeave" fill="#f59e0b" name="On Leave" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="Attendance chart data is not available yet." />
              )}
            </ChartPanel>

            <BreakdownPanel data={attendanceBreakdown ?? []} title="Present vs Absent" />
            <BreakdownPanel data={taskStatusBreakdown ?? []} title="Task Status" />
            </section>

            <section className="grid gap-5 xl:items-start xl:grid-cols-[minmax(320px,0.9fr)_minmax(320px,0.9fr)_minmax(320px,0.9fr)]">
            <BreakdownPanel data={projectStatusBreakdown ?? []} title="Project Status" />

            <ChartPanel description="Monthly leave request trend for planning capacity." title="Leave Trend">
              {leaveTrend?.length ? (
                <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
                  <ResponsiveContainer height={230} width="100%">
                    <LineChart data={leaveTrend}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} type="monotone" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="Leave trend data is not available yet." />
              )}
            </ChartPanel>

            <ChartPanel description="Daily DSR discipline for the last 7 days." title="DSR Submission Rate">
              {dsrTrend?.length ? (
                <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
                  <ResponsiveContainer height={230} width="100%">
                    <AreaChart data={dsrTrend}>
                      <defs>
                        <linearGradient id="submittedGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Area dataKey="submitted" fill="url(#submittedGradient)" name="Submitted" stroke="#2563eb" strokeWidth={3} type="monotone" />
                      <Line dataKey="missing" name="Missing" stroke="#ef4444" strokeWidth={3} type="monotone" dot={{ r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="DSR trend data is not available yet." />
              )}
            </ChartPanel>
            </section>
          </div>
        </section>
      ) : null}

      {employeeProjectRows?.length ? <EmployeeProjectPanel rows={employeeProjectRows} /> : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <ListPanel emptyMessage={primaryEmptyMessage} items={primaryItems} title={primaryListTitle} />
        <ListPanel emptyMessage={secondaryEmptyMessage} items={secondaryItems} title={secondaryListTitle} />
      </section>

      {weeklySummaryCards?.length ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{weeklySummaryTitle ?? "Weekly Summary"}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {weeklySummaryCards.map((card) => (
              <article className="rounded-[1.4rem] border border-slate-100 bg-slate-50 p-4" key={card.label}>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-600">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {(notifications?.length || calendarItems?.length) ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <NotificationPanel items={notifications ?? []} title={notificationTitle ?? "Notifications"} />
          <CalendarPanel items={calendarItems ?? []} title={calendarTitle ?? "Calendar"} />
        </section>
      ) : null}

      {performanceRows?.length ? <PerformancePanel rows={performanceRows} title={performanceTitle ?? "Performance"} /> : null}

      {directoryTitle && directoryItems ? (
        <ListPanel emptyMessage={directoryEmptyMessage ?? "No records available."} items={directoryItems} title={directoryTitle} />
      ) : null}
    </div>
  );
}

function ChartPanel({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200/80 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BreakdownPanel({ data, title }: { data: DashboardBreakdownSlice[]; title: string }) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ChartPanel description="Distribution snapshot for today’s workflow state." title={title}>
      {data.length ? (
        <>
          {total > 0 ? (
            <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
              <ResponsiveContainer height={208} width="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {data.map((entry) => (
                      <Cell fill={entry.color} key={entry.label} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No activity available for this breakdown right now.
            </div>
          )}
          <div className="mt-3 grid gap-2.5">
            {data.map((entry) => (
              <div className="flex items-center justify-between rounded-[1rem] border border-slate-100 bg-slate-50 px-4 py-2.5" key={entry.label}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium text-slate-700">{entry.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{entry.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState message="No breakdown data available." />
      )}
    </ChartPanel>
  );
}

function EmployeeProjectPanel({ rows }: { rows: EmployeeProjectSummaryRow[] }) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Project Completion</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">Employee-wise project completion summary so the admin can spot pending delivery quickly.</p>
      <div className="mt-6 overflow-x-auto rounded-[1.4rem] border border-slate-100">
        <table className="min-w-full border-collapse bg-white text-sm text-slate-700">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Employee</th>
              <th className="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Projects</th>
              <th className="px-4 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Completed Projects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-slate-900">{row.employeeName}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.employeeEmail}</p>
                </td>
                <td className="px-4 py-4 align-top text-amber-700">{row.pendingProjects}</td>
                <td className="px-4 py-4 align-top text-emerald-700">{row.completedProjects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ListPanel({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: DashboardListItem[];
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <div className="mt-6 space-y-4">
        {items.length ? (
          items.map((item) => (
            <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  {item.meta}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

function NotificationPanel({ items, title }: { items: DashboardNotificationItem[]; title: string }) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <div className="mt-6 space-y-4">
        {items.length ? (
          items.map((item) => (
            <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  {item.meta}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))
        ) : (
          <EmptyState message="No notifications right now." />
        )}
      </div>
    </section>
  );
}

function CalendarPanel({ items, title }: { items: CalendarEventItem[]; title: string }) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <div className="mt-6 space-y-4">
        {items.length ? (
          items.map((item) => (
            <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {item.date}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.type}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))
        ) : (
          <EmptyState message="No upcoming events in the current view." />
        )}
      </div>
    </section>
  );
}

function PerformancePanel({ rows, title }: { rows: PerformanceScoreRow[]; title: string }) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5" key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{row.employeeName}</h3>
                <p className="mt-1 text-sm text-slate-500">{row.employeeEmail}</p>
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                Score {row.score}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricChip label="Attendance" value={`${row.attendanceRate}%`} />
              <MetricChip label="Tasks" value={`${row.taskCompletionRate}%`} />
              <MetricChip label="DSR" value={`${row.dsrConsistencyRate}%`} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">{message}</div>;
}

