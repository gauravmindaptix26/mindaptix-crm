import type { DashboardNavKey } from "@/features/dashboard/config";

export type DashboardPageKey = Exclude<DashboardNavKey, "dashboard">;

const DASHBOARD_PAGE_KEYS: DashboardPageKey[] = ["employees", "attendance", "leaves", "tasks", "dsr", "reports", "settings"];

export function isDashboardPageKey(value: string): value is DashboardPageKey {
  return DASHBOARD_PAGE_KEYS.includes(value as DashboardPageKey);
}

