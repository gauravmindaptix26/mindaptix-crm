import type {
  CalendarEventItem,
  DashboardListItem,
  DashboardNotificationItem,
  PerformanceScoreRow,
  SummaryCard,
} from "@/lib/dashboard/dashboard-data";

type AdminDashboardOverviewProps = {
  calendarItems?: CalendarEventItem[];
  calendarTitle?: string;
  cards: SummaryCard[];
  description: string;
  directoryEmptyMessage?: string;
  directoryItems?: DashboardListItem[];
  directoryTitle?: string;
  notificationTitle?: string;
  notifications?: DashboardNotificationItem[];
  performanceRows?: PerformanceScoreRow[];
  performanceTitle?: string;
  primaryEmptyMessage: string;
  primaryItems: DashboardListItem[];
  primaryListTitle: string;
  roleBadge?: string;
  secondaryEmptyMessage: string;
  secondaryItems: DashboardListItem[];
  secondaryListTitle: string;
  title: string;
  weeklySummaryCards?: SummaryCard[];
  weeklySummaryTitle?: string;
};

export function AdminDashboardOverview({
  calendarItems,
  calendarTitle,
  cards,
  description,
  directoryEmptyMessage,
  directoryItems,
  directoryTitle,
  notificationTitle,
  notifications,
  performanceRows,
  performanceTitle,
  primaryEmptyMessage,
  primaryItems,
  primaryListTitle,
  roleBadge,
  secondaryEmptyMessage,
  secondaryItems,
  secondaryListTitle,
  title,
  weeklySummaryCards,
  weeklySummaryTitle,
}: AdminDashboardOverviewProps) {
  return (
    <div className="space-y-6 px-5 pb-5 pt-1 sm:px-7 sm:pb-6 sm:pt-1">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-5 py-2 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Dashboard</p>
          {roleBadge ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-[0.35rem] text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {roleBadge}
            </span>
          ) : null}
        </div>
        <h2 className="mt-0.5 text-[1.9rem] font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">{title}</h2>
        <p className="mt-0.5 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            className="rounded-[1.6rem] border border-slate-100 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
            key={card.label}
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ListPanel emptyMessage={primaryEmptyMessage} items={primaryItems} title={primaryListTitle} />
        <ListPanel emptyMessage={secondaryEmptyMessage} items={secondaryItems} title={secondaryListTitle} />
      </section>

      {weeklySummaryCards?.length ? (
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
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
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
            {emptyMessage}
          </div>
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
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
            No notifications right now.
          </div>
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
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
            No upcoming events in the current view.
          </div>
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
