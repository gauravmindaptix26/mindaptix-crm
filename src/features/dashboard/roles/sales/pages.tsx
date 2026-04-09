import "server-only";
import { notFound } from "next/navigation";
import { EmployeesManagementPanel } from "@/features/dashboard/components/employees-management-panel";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { getEmployeesPageData } from "@/features/dashboard/server/page-data";
import type { DashboardPageKey } from "@/features/dashboard/shared/page-types";

export async function renderSalesDashboardPage(page: DashboardPageKey, session: AuthenticatedSession) {
  switch (page) {
    case "employees": {
      const data = await getEmployeesPageData(session);
      return (
        <EmployeesManagementPanel
          salesLeadRows={data.salesLeadRows}
          salesOnly
          salesOptions={data.salesOptions}
          salesTechnologyOptions={data.salesTechnologyOptions}
          summaryCards={data.summaryCards}
          users={data.users}
        />
      );
    }
    default:
      notFound();
  }
}
