import { AdminDashboardOverview, EmployeeDashboardOverview } from "@/features/dashboard/components";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { getAdminDashboardOverview, getEmployeeDashboardOverview, getManagerDashboardOverview } from "@/features/dashboard/roles";
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

  if (session.user.role === "EMPLOYEE") {
    return <EmployeeDashboardOverview overview={overview} roleBadge={getDisplayRoleLabel(session.user.role)} />;
  }

  return (
    <AdminDashboardOverview
      attendanceBreakdown={overview.attendanceBreakdown}
      attendanceTrend={overview.attendanceTrend}
      calendarItems={overview.calendarItems}
      calendarTitle={overview.calendarTitle}
      description={overview.description}
      directoryEmptyMessage={overview.directoryEmptyMessage}
      directoryItems={overview.directoryItems}
      directoryTitle={overview.directoryTitle}
      dsrTrend={overview.dsrTrend}
      employeeProjectRows={overview.employeeProjectRows}
      executiveSections={overview.executiveSections}
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


