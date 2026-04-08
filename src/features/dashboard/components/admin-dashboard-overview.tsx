"use client";

import type { ReactNode } from "react";
import { useState } from "react";
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
  ExecutiveOverviewSection,
  LeaveTrendPoint,
  PerformanceScoreRow,
  SummaryCard,
} from "@/features/dashboard/types";

type AdminDashboardOverviewProps = {
  attendanceBreakdown?: DashboardBreakdownSlice[];
  attendanceTrend?: AttendanceTrendPoint[];
  calendarItems?: CalendarEventItem[];
  calendarTitle?: string;
  description: string;
  directoryEmptyMessage?: string;
  directoryItems?: DashboardListItem[];
  directoryTitle?: string;
  dsrTrend?: DsrTrendPoint[];
  employeeProjectRows?: EmployeeProjectSummaryRow[];
  executiveSections?: ExecutiveOverviewSection[];
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
  directoryEmptyMessage,
  directoryItems,
  directoryTitle,
  dsrTrend,
  employeeProjectRows,
  executiveSections,
  leaveTrend,
  notificationTitle,
  notifications,
  performanceRows,
  performanceTitle,
  primaryEmptyMessage,
  primaryItems,
  primaryListTitle,
  projectStatusBreakdown,
  secondaryEmptyMessage,
  secondaryItems,
  secondaryListTitle,
  taskStatusBreakdown,
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
  const [activeExecutiveSectionId, setActiveExecutiveSectionId] = useState(executiveSections?.[0]?.id ?? "");
  const activeExecutiveSection = executiveSections?.find((section) => section.id === activeExecutiveSectionId) ?? executiveSections?.[0];

  return (
    <div className="space-y-4 px-5 pb-5 pt-1 sm:px-7 sm:pb-6 sm:pt-1">
      {executiveSections?.length ? (
        <section className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,#eff6ff_0%,#ffffff_42%,#f8fafc_100%)] p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
          <div className="rounded-[1.8rem] border border-white/70 bg-white/75 p-4 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Executive Summary</p>
                <h3 className="mt-2 text-[1.45rem] font-semibold tracking-tight text-slate-950">Leadership Control Boxes</h3>
              </div>
              <div className="rounded-full border border-blue-200 bg-white px-5 py-2.5 text-[0.78rem] font-bold uppercase tracking-[0.24em] text-blue-700 shadow-[0_10px_26px_rgba(37,99,235,0.08)]">
                Super Admin View
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {executiveSections.map((section) => {
              const isActive = section.id === activeExecutiveSection?.id;
              const leadMetric = section.metrics[0];
              const supportMetric = section.metrics[1];
              const accent = getExecutiveSectionAccent(section.id, isActive);

              return (
                <button
                  className={`group relative overflow-hidden rounded-[1.7rem] border p-4 text-left transition duration-200 ${accent.card}`}
                  key={section.id}
                  onClick={() => setActiveExecutiveSectionId(section.id)}
                  type="button"
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${accent.bar}`} />
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.24em] ${accent.eyebrow}`}>{section.badge}</p>
                    <span className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${accent.pill}`}>
                      {isActive ? "Selected" : "Open"}
                    </span>
                  </div>
                  <h4 className={`mt-4 text-[1.15rem] font-semibold tracking-tight ${accent.title}`}>{section.title}</h4>
                  <div className="mt-3 grid gap-2">
                    <div className={`rounded-[1.2rem] border px-4 py-3 ${accent.metricShell}`}>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className={`text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${accent.metricLabel}`}>{leadMetric?.label ?? "Overview"}</p>
                          <p className={`mt-2 text-[1.8rem] font-semibold leading-none ${accent.metricValue}`}>{leadMetric?.value ?? "-"}</p>
                        </div>
                        <span className={`text-xs font-semibold ${accent.metricHint}`}>{supportMetric?.label ?? "Details"}</span>
                      </div>
                      {supportMetric ? (
                        <div className={`mt-3 flex items-center justify-between border-t pt-3 ${accent.metricDivider}`}>
                          <span className={`text-xs uppercase tracking-[0.16em] ${accent.metricHint}`}>{supportMetric.label}</span>
                          <span className={`text-sm font-semibold ${accent.metricValue}`}>{supportMetric.value}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                </button>
              );
            })}
          </div>

          {activeExecutiveSection ? <ExecutiveSectionPanel section={activeExecutiveSection} /> : null}
        </section>
      ) : null}

      {executiveSections?.length && activeExecutiveSection ? (
        <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Operational Snapshot</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{activeExecutiveSection.title} Insights</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The chart area below now follows the selected leadership box so the super admin can review only the relevant numbers.
              </p>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Linked To Selection
            </div>
          </div>

          <div className="mt-5">
            {activeExecutiveSection.id === "workforce" ? (
              <div className="grid gap-5 xl:items-start xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)_minmax(320px,0.85fr)]">
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
                <MetricBarPanel metrics={activeExecutiveSection.metrics} sectionId={activeExecutiveSection.id} title="Workforce Summary" />
              </div>
            ) : activeExecutiveSection.id === "projects" ? (
              <div className="grid gap-5 xl:items-start xl:grid-cols-[minmax(320px,0.9fr)_minmax(320px,0.9fr)_minmax(320px,0.9fr)]">
                <BreakdownPanel data={projectStatusBreakdown ?? []} title="Project Status" />
                <BreakdownPanel data={taskStatusBreakdown ?? []} title="Task Status" />
                <MetricBarPanel metrics={activeExecutiveSection.metrics} sectionId={activeExecutiveSection.id} title="Portfolio Snapshot" />
              </div>
            ) : (
              <div className="grid gap-5 xl:items-start xl:grid-cols-[minmax(320px,1fr)_minmax(320px,0.9fr)_minmax(320px,0.85fr)]">
                <MetricBarPanel metrics={activeExecutiveSection.metrics} sectionId={activeExecutiveSection.id} title={`${activeExecutiveSection.title} Metrics`} />
                <MetricBreakdownPanel metrics={activeExecutiveSection.metrics} sectionId={activeExecutiveSection.id} title="Breakdown Mix" />
                <ExecutiveQuickPanel section={activeExecutiveSection} />
              </div>
            )}
          </div>
        </section>
      ) : showExecutiveCharts ? (
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

      {!executiveSections?.length && employeeProjectRows?.length ? <EmployeeProjectPanel rows={employeeProjectRows} /> : null}

      {!executiveSections?.length ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <ListPanel emptyMessage={primaryEmptyMessage} items={primaryItems} title={primaryListTitle} />
          <ListPanel emptyMessage={secondaryEmptyMessage} items={secondaryItems} title={secondaryListTitle} />
        </section>
      ) : null}

      {!executiveSections?.length && weeklySummaryCards?.length ? (
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

      {!executiveSections?.length && (notifications?.length || calendarItems?.length) ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <NotificationPanel items={notifications ?? []} title={notificationTitle ?? "Notifications"} />
          <CalendarPanel items={calendarItems ?? []} title={calendarTitle ?? "Calendar"} />
        </section>
      ) : null}

      {!executiveSections?.length && performanceRows?.length ? <PerformancePanel rows={performanceRows} title={performanceTitle ?? "Performance"} /> : null}

      {!executiveSections?.length && directoryTitle && directoryItems ? (
        <ListPanel emptyMessage={directoryEmptyMessage ?? "No records available."} items={directoryItems} title={directoryTitle} />
      ) : null}
    </div>
  );
}

function ExecutiveSectionPanel({ section }: { section: ExecutiveOverviewSection }) {
  const accent = getExecutiveSectionAccent(section.id, true);

  return (
    <section className="mt-5 overflow-hidden rounded-[1.9rem] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className={`h-1.5 ${accent.bar}`} />
      <div className="p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">{section.badge}</p>
            <h4 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950">{section.title}</h4>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{section.description}</p>
          </div>

          <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">Section Status</p>
            <div className="mt-3 space-y-3">
              {section.metrics.slice(0, 2).map((metric) => (
                <div className="flex items-center justify-between rounded-[1rem] border border-white bg-white px-4 py-3" key={metric.label}>
                  <span className="text-sm font-medium text-slate-600">{metric.label}</span>
                  <span className="text-lg font-semibold text-slate-950">{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {section.note ? (
          <div className="mt-4 rounded-[1.2rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">{section.note}</div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {section.metrics.map((metric) => (
            <article className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_10px_20px_rgba(15,23,42,0.04)]" key={metric.label}>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-600">{metric.label}</p>
              <p className="mt-3 text-[2rem] font-semibold leading-none text-slate-950">{metric.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[1.7rem] border border-slate-100 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">Detailed Information</p>
              <h5 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{section.title} Details</h5>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {section.items.length} item(s)
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {section.items.length ? (
              section.items.map((item) => (
                <article className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {item.meta}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{section.badge}</span>
                  </div>
                  <h6 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h6>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              ))
            ) : (
              <div className="lg:col-span-2">
                <EmptyState message={section.emptyMessage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricBarPanel({
  metrics,
  sectionId,
  title,
}: {
  metrics: SummaryCard[];
  sectionId: string;
  title: string;
}) {
  const chartData = buildExecutiveMetricData(metrics, sectionId);

  return (
    <ChartPanel description="Metric chart for the currently selected leadership box." title={title}>
      {chartData.length ? (
        <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-3">
          <ResponsiveContainer height={248} width="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell fill={entry.color} key={entry.label} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState message="No metric chart data is available for this section." />
      )}
    </ChartPanel>
  );
}

function MetricBreakdownPanel({
  metrics,
  sectionId,
  title,
}: {
  metrics: SummaryCard[];
  sectionId: string;
  title: string;
}) {
  return <BreakdownPanel data={buildExecutiveMetricData(metrics, sectionId)} title={title} />;
}

function ExecutiveQuickPanel({ section }: { section: ExecutiveOverviewSection }) {
  return (
    <ChartPanel description="Quick summary of the selected leadership box." title="Quick Highlights">
      <div className="space-y-3">
        {section.metrics.slice(0, 4).map((metric) => (
          <div className="flex items-center justify-between rounded-[1rem] border border-slate-100 bg-slate-50 px-4 py-3" key={metric.label}>
            <div className="pr-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{metric.detail}</p>
            </div>
            <span className="text-2xl font-semibold text-slate-950">{metric.value}</span>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

function getExecutiveSectionAccent(sectionId: string, isActive: boolean) {
  const palette =
    sectionId === "projects"
      ? {
          bar: "bg-gradient-to-r from-blue-600 via-cyan-400 to-sky-300",
          activeBg: "bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_62%,#dbeafe_100%)]",
          activeBorder: "border-blue-300",
          activeTitle: "text-white",
          activeDescription: "text-blue-50/90",
          activeEyebrow: "text-blue-100",
          activePill: "border-white/20 bg-white/10 text-white",
          activeMetricShell: "border-white/10 bg-white/10",
          activeMetricLabel: "text-blue-100/80",
          activeMetricValue: "text-white",
          activeMetricHint: "text-blue-100/75",
          activeMetricDivider: "border-white/10",
          activeFooter: "text-white",
        }
      : sectionId === "payments"
        ? {
            bar: "bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300",
            activeBg: "bg-[linear-gradient(135deg,#78350f_0%,#f59e0b_68%,#fef3c7_100%)]",
            activeBorder: "border-amber-300",
            activeTitle: "text-white",
            activeDescription: "text-amber-50/90",
            activeEyebrow: "text-amber-100",
            activePill: "border-white/20 bg-white/10 text-white",
            activeMetricShell: "border-white/10 bg-white/10",
            activeMetricLabel: "text-amber-100/80",
            activeMetricValue: "text-white",
            activeMetricHint: "text-amber-100/75",
            activeMetricDivider: "border-white/10",
            activeFooter: "text-white",
          }
        : sectionId === "workforce"
          ? {
              bar: "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300",
              activeBg: "bg-[linear-gradient(135deg,#064e3b_0%,#059669_64%,#d1fae5_100%)]",
              activeBorder: "border-emerald-300",
              activeTitle: "text-white",
              activeDescription: "text-emerald-50/90",
              activeEyebrow: "text-emerald-100",
              activePill: "border-white/20 bg-white/10 text-white",
              activeMetricShell: "border-white/10 bg-white/10",
              activeMetricLabel: "text-emerald-100/80",
              activeMetricValue: "text-white",
              activeMetricHint: "text-emerald-100/75",
              activeMetricDivider: "border-white/10",
              activeFooter: "text-white",
            }
          : sectionId === "leads"
            ? {
                bar: "bg-gradient-to-r from-fuchsia-500 via-violet-400 to-purple-300",
                activeBg: "bg-[linear-gradient(135deg,#581c87_0%,#7c3aed_62%,#ede9fe_100%)]",
                activeBorder: "border-violet-300",
                activeTitle: "text-white",
                activeDescription: "text-violet-50/90",
                activeEyebrow: "text-violet-100",
                activePill: "border-white/20 bg-white/10 text-white",
                activeMetricShell: "border-white/10 bg-white/10",
                activeMetricLabel: "text-violet-100/80",
                activeMetricValue: "text-white",
                activeMetricHint: "text-violet-100/75",
                activeMetricDivider: "border-white/10",
                activeFooter: "text-white",
              }
            : {
                bar: "bg-gradient-to-r from-rose-500 via-pink-400 to-orange-300",
                activeBg: "bg-[linear-gradient(135deg,#7f1d1d_0%,#e11d48_62%,#ffe4e6_100%)]",
                activeBorder: "border-rose-300",
                activeTitle: "text-white",
                activeDescription: "text-rose-50/90",
                activeEyebrow: "text-rose-100",
                activePill: "border-white/20 bg-white/10 text-white",
                activeMetricShell: "border-white/10 bg-white/10",
                activeMetricLabel: "text-rose-100/80",
                activeMetricValue: "text-white",
                activeMetricHint: "text-rose-100/75",
                activeMetricDivider: "border-white/10",
                activeFooter: "text-white",
              };

  if (isActive) {
    return {
      bar: palette.bar,
      card: `${palette.activeBorder} ${palette.activeBg} shadow-[0_24px_44px_rgba(15,23,42,0.14)]`,
      eyebrow: palette.activeEyebrow,
      pill: palette.activePill,
      title: palette.activeTitle,
      description: palette.activeDescription,
      metricShell: palette.activeMetricShell,
      metricLabel: palette.activeMetricLabel,
      metricValue: palette.activeMetricValue,
      metricHint: palette.activeMetricHint,
      metricDivider: palette.activeMetricDivider,
      footer: palette.activeFooter,
    };
  }

  return {
    bar: palette.bar,
    card: "border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]",
    eyebrow: "text-blue-600",
    pill: "border-slate-200 bg-slate-50 text-slate-600",
    title: "text-slate-950",
    description: "text-slate-600",
    metricShell: "border-slate-100 bg-slate-50",
    metricLabel: "text-slate-500",
    metricValue: "text-slate-950",
    metricHint: "text-slate-400",
    metricDivider: "border-slate-200",
    footer: "text-blue-700",
  };
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

function buildExecutiveMetricData(metrics: SummaryCard[], sectionId: string): DashboardBreakdownSlice[] {
  const palette =
    sectionId === "projects"
      ? ["#2563eb", "#10b981", "#f59e0b", "#64748b"]
      : sectionId === "payments"
        ? ["#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"]
        : sectionId === "workforce"
          ? ["#0f766e", "#2563eb", "#f59e0b", "#ef4444"]
          : sectionId === "leads"
            ? ["#7c3aed", "#10b981", "#f97316", "#64748b"]
            : ["#e11d48", "#0ea5e9", "#10b981", "#64748b"];

  return metrics.map((metric, index) => ({
    label: metric.label,
    value: Number(metric.value.replace(/[^\d.-]/g, "")) || 0,
    color: palette[index % palette.length],
  }));
}

