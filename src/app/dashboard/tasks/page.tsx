import { renderDashboardRoute } from "@/features/dashboard/router/render-page";

export default async function DashboardTasksPage() {
  return renderDashboardRoute("tasks");
}
