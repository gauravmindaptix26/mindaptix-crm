import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { renderLeadershipDashboardPage } from "@/features/dashboard/shared/leadership-pages";
import type { DashboardPageKey } from "@/features/dashboard/shared/page-types";

export async function renderAdminDashboardPage(page: DashboardPageKey, session: AuthenticatedSession) {
  return renderLeadershipDashboardPage(page, session);
}


