"use client";

import Link from "next/link";
import type {
  CalendarEventItem,
  DashboardListItem,
  DashboardNotificationItem,
  DashboardOverviewData,
  PerformanceScoreRow,
  SummaryCard,
} from "@/features/dashboard/data";

type EmployeeDashboardOverviewProps = {
  overview: DashboardOverviewData;
  roleBadge?: string;
};

export function EmployeeDashboardOverview({ overview, roleBadge }: EmployeeDashboardOverviewProps) {
  return (
    <div className="space-y-6 px-5 pb-5 pt-1 sm:px-7 sm:pb-6">
      <section className="overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#f8fafc_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Dashboard</p>
            {roleBadge ? (
              <span className="rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                {roleBadge}
              </span>
            ) : null}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{overview.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{overview.description}</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {overview.cards.slice(0, 3).map((card, index) => (
            <HeroMetricCard accent={index} card={card} key={card.label} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {overview.cards.map((card, index) => (
          <SummaryMetricCard accent={index} card={card} key={card.label} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <TaskFeedPanel emptyMessage={overview.primaryEmptyMessage} items={overview.primaryItems} title={overview.primaryListTitle} />
        <FocusPanel emptyMessage={overview.secondaryEmptyMessage} items={overview.secondaryItems} title={overview.secondaryListTitle} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
        <WeeklySummaryPanel cards={overview.weeklySummaryCards ?? []} title={overview.weeklySummaryTitle ?? "Weekly Summary"} />
        <NotificationPanel items={overview.notifications ?? []} title={overview.notificationTitle ?? "Notifications"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <CalendarPanel items={overview.calendarItems ?? []} title={overview.calendarTitle ?? "Upcoming Calendar"} />
        <PerformancePanel rows={overview.performanceRows ?? []} title={overview.performanceTitle ?? "Performance"} />
      </section>
    </div>
  );
}

function HeroMetricCard({ accent, card }: { accent: number; card: SummaryCard }) {
  const accentClassName =
    accent % 3 === 0
      ? "border-blue-200/80 bg-[linear-gradient(135deg,#dbeafe_0%,#ffffff_100%)] text-blue-700"
      : accent % 3 === 1
        ? "border-emerald-200/80 bg-[linear-gradient(135deg,#dcfce7_0%,#ffffff_100%)] text-emerald-700"
        : "border-amber-200/80 bg-[linear-gradient(135deg,#fef3c7_0%,#ffffff_100%)] text-amber-700";

  return (
    <article className={`rounded-[1.5rem] border p-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)] ${accentClassName}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] opacity-80">{card.label}</p>
      <p className="mt-3 text-2xl font-semibold leading-none">{card.value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
    </article>
  );
}

function SummaryMetricCard({ accent, card }: { accent: number; card: SummaryCard }) {
  const accentBarClassName =
    accent % 5 === 0
      ? "from-blue-500 to-cyan-400"
      : accent % 5 === 1
        ? "from-violet-500 to-fuchsia-400"
        : accent % 5 === 2
          ? "from-emerald-500 to-teal-400"
          : accent % 5 === 3
            ? "from-amber-500 to-orange-400"
            : "from-rose-500 to-pink-400";

  return (
    <article className="relative overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_16px_35px_rgba(15,23,42,0.05)]">
      <div className={`absolute inset-x-5 top-0 h-1 rounded-full bg-gradient-to-r ${accentBarClassName}`} />
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-600">{card.label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{card.value}</p>
      <p className="mt-3 text-sm leading-7 text-slate-500">{card.detail}</p>
    </article>
  );
}

function TaskFeedPanel({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: DashboardListItem[];
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Task Queue</h2>
        </div>
        <Link
          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 transition hover:bg-blue-100"
          href="/dashboard/tasks"
        >
          Open Tasks
        </Link>
      </div>

      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <article className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.meta}
                </span>
                <span className="text-sm font-medium text-slate-400">Task</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

function FocusPanel({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: DashboardListItem[];
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Today Focus</h2>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <Link
              className="block rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_32px_rgba(37,99,235,0.08)]"
              href={getFocusHref(item.id)}
              key={item.id}
            >
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-700">
                {item.meta}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </Link>
          ))
        ) : (
          <EmptyState message={emptyMessage} />
        )}
      </div>
    </section>
  );
}

function WeeklySummaryPanel({ cards, title }: { cards: SummaryCard[]; title: string }) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Weekly Pulse</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.length ? (
          cards.map((card) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4" key={card.label}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
            </article>
          ))
        ) : (
          <EmptyState message="Weekly summary will appear here after activity is recorded." />
        )}
      </div>
    </section>
  );
}

function NotificationPanel({ items, title }: { items: DashboardNotificationItem[]; title: string }) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Updates</h2>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <Link
              className="block rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4 transition hover:border-blue-200"
              href={item.actionUrl || "/dashboard"}
              key={item.id}
            >
              <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-700">
                {item.meta}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </Link>
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
    <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Upcoming Items</h2>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4" key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {item.date}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.type}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))
        ) : (
          <EmptyState message="No upcoming events in your current view." />
        )}
      </div>
    </section>
  );
}

function PerformancePanel({ rows, title }: { rows: PerformanceScoreRow[]; title: string }) {
  const row = rows[0];

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">My Score</h2>
      {row ? (
        <div className="mt-5 rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_58%,#f8fafc_100%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{row.employeeEmail}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Score {row.score}</p>
            </div>
            <div className="rounded-[1.4rem] border border-blue-200 bg-white px-5 py-4 text-center shadow-[0_12px_28px_rgba(37,99,235,0.08)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-blue-600">Performance</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{row.score}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Attendance" value={`${row.attendanceRate}%`} />
            <MiniMetric label="Tasks" value={`${row.taskCompletionRate}%`} />
            <MiniMetric label="DSR" value={`${row.dsrConsistencyRate}%`} />
          </div>
        </div>
      ) : (
        <EmptyState message="Performance score will appear once enough activity is available." />
      )}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">{message}</div>;
}

function getFocusHref(id: string) {
  switch (id) {
    case "attendance":
      return "/dashboard/attendance";
    case "dsr":
      return "/dashboard/dsr";
    case "leave":
      return "/dashboard/leaves";
    default:
      return "/dashboard";
  }
}
