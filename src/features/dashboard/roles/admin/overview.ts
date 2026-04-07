import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { getAdminDashboardOverviewData } from "@/features/dashboard/roles/admin/data";

export async function getAdminDashboardOverview(session: AuthenticatedSession) {
  return getAdminDashboardOverviewData(session);
}


