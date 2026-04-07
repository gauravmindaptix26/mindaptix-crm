import "server-only";
import { notFound, redirect } from "next/navigation";
import type { DashboardPageKey } from "@/features/dashboard/shared/page-types";
import { renderAdminDashboardPage } from "@/features/dashboard/roles/admin/pages";
import { renderEmployeeDashboardPage } from "@/features/dashboard/roles/employee/pages";
import { renderManagerDashboardPage } from "@/features/dashboard/roles/manager/pages";
import { getDashboardNavItemsForRole, getDefaultDashboardHrefForRole } from "@/features/dashboard/config";
import { getCurrentSession } from "@/features/auth/lib/auth-session";

export async function renderDashboardRoute(page: DashboardPageKey) {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const canAccessPage = getDashboardNavItemsForRole(session.user.role).some((item) => item.key === page);

  if (!canAccessPage) {
    redirect(getDefaultDashboardHrefForRole(session.user.role));
  }

  switch (session.user.role) {
    case "SUPER_ADMIN":
      return renderAdminDashboardPage(page, session);
    case "MANAGER":
      return renderManagerDashboardPage(page, session);
    case "EMPLOYEE":
      return renderEmployeeDashboardPage(page, session);
    default:
      notFound();
  }
}

