import { renderDashboardRoute } from "@/features/dashboard/router/render-page";

export default async function DashboardAttendancePage() {
  return renderDashboardRoute("attendance");
}
