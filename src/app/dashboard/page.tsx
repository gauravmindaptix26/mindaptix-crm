import { AdminDashboardOverview } from "@/features/dashboard/components/admin-dashboard-overview";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { getAdminDashboardOverview } from "@/features/dashboard/roles/admin/overview";
import { getEmployeeDashboardOverview } from "@/features/dashboard/roles/employee/overview";
import { getManagerDashboardOverview } from "@/features/dashboard/roles/manager/overview";
import { getDisplayRoleLabel } from "@/features/dashboard/config";

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const overview =
    session.user.role === "SUPER_ADMIN"
      ? await getAdminDashboardOverview(session)
      : session.user.role === "MANAGER"
        ? await getManagerDashboardOverview(session)
        : await getEmployeeDashboardOverview(session);

  return (
    <AdminDashboardOverview
      attendanceBreakdown={overview.attendanceBreakdown}
      attendanceTrend={overview.attendanceTrend}
      calendarItems={overview.calendarItems}
      calendarTitle={overview.calendarTitle}
      cards={overview.cards}
      description={overview.description}
      directoryEmptyMessage={overview.directoryEmptyMessage}
      directoryItems={overview.directoryItems}
      directoryTitle={overview.directoryTitle}
      dsrTrend={overview.dsrTrend}
      employeeProjectRows={overview.employeeProjectRows}
      financeNote={overview.financeNote}
      leaveTrend={overview.leaveTrend}
      notificationTitle={overview.notificationTitle}
      notifications={overview.notifications}
      performanceRows={overview.performanceRows}
      performanceTitle={overview.performanceTitle}
      primaryEmptyMessage={overview.primaryEmptyMessage}
      primaryItems={overview.primaryItems}
      primaryListTitle={overview.primaryListTitle}
      projectStatusBreakdown={overview.projectStatusBreakdown}
      roleBadge={getDisplayRoleLabel(session.user.role)}
      secondaryEmptyMessage={overview.secondaryEmptyMessage}
      secondaryItems={overview.secondaryItems}
      secondaryListTitle={overview.secondaryListTitle}
      taskStatusBreakdown={overview.taskStatusBreakdown}
      title={overview.title}
      weeklySummaryCards={overview.weeklySummaryCards}
      weeklySummaryTitle={overview.weeklySummaryTitle}
    />
  );
}


