import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { getManagerDashboardOverviewData } from "@/features/dashboard/roles/manager/data";

export async function getManagerDashboardOverview(session: AuthenticatedSession) {
  return getManagerDashboardOverviewData(session);
}


