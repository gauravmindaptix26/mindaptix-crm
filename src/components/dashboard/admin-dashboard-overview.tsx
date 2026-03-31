import type { DashboardListItem, SummaryCard } from "@/lib/dashboard/mvp-data";

type AdminDashboardOverviewProps = {
  cards: SummaryCard[];
  description: string;
  directoryEmptyMessage?: string;
  directoryItems?: DashboardListItem[];
  directoryTitle?: string;
  primaryEmptyMessage: string;
  primaryItems: DashboardListItem[];
  primaryListTitle: string;
  secondaryEmptyMessage: string;
  secondaryItems: DashboardListItem[];
  secondaryListTitle: string;
  title: string;
};

export function AdminDashboardOverview({
  cards,
  description,
  directoryEmptyMessage,
  directoryItems,
  directoryTitle,
  primaryEmptyMessage,
  primaryItems,
  primaryListTitle,
  secondaryEmptyMessage,
  secondaryItems,
  secondaryListTitle,
  title,
}: AdminDashboardOverviewProps) {
  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_45px_rgba(59,130,246,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-500">Dashboard</p>
        <h2 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.5rem]">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
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
