import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { buildLeadershipDashboardOverview } from "@/features/dashboard/shared/leadership-overview";

export async function getAdminDashboardOverviewData(session: AuthenticatedSession) {
  return buildLeadershipDashboardOverview(session, {
    title: "Admin Dashboard",
    description: "Operations overview for attendance, task movement, leave approvals, and daily reporting discipline.",
  });
}


