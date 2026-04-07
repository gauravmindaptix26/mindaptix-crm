import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { buildLeadershipDashboardOverview } from "@/features/dashboard/shared/leadership-overview";

export async function getManagerDashboardOverviewData(session: AuthenticatedSession) {
  return buildLeadershipDashboardOverview(session, {
    title: "Manager Dashboard",
    description: "Manager control center for company-wide attendance, task movement, leave approvals, and daily reporting discipline.",
  });
}


