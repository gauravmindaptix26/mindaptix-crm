import "server-only";
import { notFound } from "next/navigation";
import { AttendancePanel } from "@/features/dashboard/components/attendance-panel";
import { DsrPanel } from "@/features/dashboard/components/dsr-panel";
import { LeavesPanel } from "@/features/dashboard/components/leaves-panel";
import { TasksPanel } from "@/features/dashboard/components/tasks-panel";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { getAttendancePageData, getDsrPageData, getLeavesPageData, getTasksPageData } from "@/features/dashboard/data";
import type { DashboardPageKey } from "@/features/dashboard/shared/page-types";

export async function renderEmployeeDashboardPage(page: DashboardPageKey, session: AuthenticatedSession) {
  switch (page) {
    case "attendance": {
      const data = await getAttendancePageData(session);
      return <AttendancePanel data={data} />;
    }
    case "leaves": {
      const data = await getLeavesPageData(session);
      return <LeavesPanel canReview={false} data={data} />;
    }
    case "tasks": {
      const data = await getTasksPageData(session);
      return <TasksPanel canAssign={false} data={data} />;
    }
    case "dsr": {
      const data = await getDsrPageData(session);
      return <DsrPanel data={data} />;
    }
    default:
      notFound();
  }
}


