import { AdminDashboardOverview } from "@/components/dashboard/admin-dashboard-overview";
import { getCurrentSession } from "@/lib/auth/auth-session";
import { getDashboardOverviewData } from "@/lib/dashboard/mvp-data";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const overview = await getDashboardOverviewData(session);

  return (
    <AdminDashboardOverview
      cards={overview.cards}
      description={overview.description}
      directoryEmptyMessage={overview.directoryEmptyMessage}
      directoryItems={overview.directoryItems}
      directoryTitle={overview.directoryTitle}
      primaryEmptyMessage={overview.primaryEmptyMessage}
      primaryItems={overview.primaryItems}
      primaryListTitle={overview.primaryListTitle}
      secondaryEmptyMessage={overview.secondaryEmptyMessage}
      secondaryItems={overview.secondaryItems}
      secondaryListTitle={overview.secondaryListTitle}
      title={overview.title}
    />
  );
}
