import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { getEmployeeDashboardOverviewData } from "@/features/dashboard/roles/employee/data";

export async function getEmployeeDashboardOverview(session: AuthenticatedSession) {
  return getEmployeeDashboardOverviewData(session);
}


