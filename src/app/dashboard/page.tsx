import { AdminDashboardOverview } from "@/components/dashboard/admin-dashboard-overview";
import { getCurrentSession } from "@/lib/auth/auth-session";
import { getDisplayRoleLabel } from "@/lib/dashboard/config";
import { getDashboardOverviewData } from "@/lib/dashboard/dashboard-data";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const overview = await getDashboardOverviewData(session);

  return (
    <AdminDashboardOverview
      calendarItems={overview.calendarItems}
      calendarTitle={overview.calendarTitle}
      cards={overview.cards}
      description={overview.description}
      directoryEmptyMessage={overview.directoryEmptyMessage}
      directoryItems={overview.directoryItems}
      directoryTitle={overview.directoryTitle}
      notificationTitle={overview.notificationTitle}
      notifications={overview.notifications}
      performanceRows={overview.performanceRows}
      performanceTitle={overview.performanceTitle}
      primaryEmptyMessage={overview.primaryEmptyMessage}
      primaryItems={overview.primaryItems}
      primaryListTitle={overview.primaryListTitle}
      roleBadge={getDisplayRoleLabel(session.user.role)}
      secondaryEmptyMessage={overview.secondaryEmptyMessage}
      secondaryItems={overview.secondaryItems}
      secondaryListTitle={overview.secondaryListTitle}
      title={overview.title}
      weeklySummaryCards={overview.weeklySummaryCards}
      weeklySummaryTitle={overview.weeklySummaryTitle}
    />
  );
}
