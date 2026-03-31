import { notFound, redirect } from "next/navigation";
import { AttendancePanel } from "@/components/dashboard/attendance-panel";
import { DsrPanel } from "@/components/dashboard/dsr-panel";
import { EmployeesManagementPanel } from "@/components/dashboard/employees-management-panel";
import { LeavesPanel } from "@/components/dashboard/leaves-panel";
import { ReportsPanel } from "@/components/dashboard/reports-panel";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { getCurrentSession } from "@/lib/auth/auth-session";
import { canRoleAccessDashboardPath, getDefaultDashboardHrefForRole } from "@/lib/dashboard/config";
import {
  getAttendancePageData,
  getDsrPageData,
  getEmployeesPageData,
  getLeavesPageData,
  getReportsPageData,
  getSettingsPageData,
  getTasksPageData,
} from "@/lib/dashboard/dashboard-data";

type DashboardDynamicPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function DashboardDynamicPage({ params }: DashboardDynamicPageProps) {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const { slug } = await params;
  const page = slug[0];

  if (page === "users") {
    redirect("/dashboard/employees");
  }

  if (!canRoleAccessDashboardPath(session.user.role, slug)) {
    redirect(getDefaultDashboardHrefForRole(session.user.role));
  }

  switch (page) {
    case "employees": {
      if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER") {
        notFound();
      }

      const data = await getEmployeesPageData(session);
      return (
        <EmployeesManagementPanel
          managerOptions={data.managerOptions}
          projects={data.projects}
          readOnly={session.user.role === "MANAGER"}
          recentUpdates={data.recentUpdates}
          summaryCards={data.summaryCards}
          users={data.users}
        />
      );
    }
    case "attendance": {
      const data = await getAttendancePageData(session);
      return <AttendancePanel data={data} />;
    }
    case "leaves": {
      const data = await getLeavesPageData(session);
      return <LeavesPanel canReview={session.user.role === "SUPER_ADMIN" || session.user.role === "MANAGER"} data={data} />;
    }
    case "tasks": {
      const data = await getTasksPageData(session);
      return <TasksPanel canAssign={session.user.role === "SUPER_ADMIN" || session.user.role === "MANAGER"} data={data} />;
    }
    case "dsr": {
      const data = await getDsrPageData(session);
      return <DsrPanel data={data} />;
    }
    case "reports": {
      if (session.user.role === "EMPLOYEE") {
        notFound();
      }

      const data = await getReportsPageData(session);
      return <ReportsPanel data={data} />;
    }
    case "settings": {
      if (session.user.role !== "SUPER_ADMIN") {
        notFound();
      }

      const data = await getSettingsPageData();
      return <SettingsPanel data={data} />;
    }
    default:
      notFound();
  }
}
