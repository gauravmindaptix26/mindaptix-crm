import type { UserRole } from "@/lib/auth/rbac";

export type DashboardNavKey =
  | "dashboard"
  | "employees"
  | "attendance"
  | "leaves"
  | "tasks"
  | "dsr"
  | "reports"
  | "settings";

export type DashboardNavItem = {
  key: DashboardNavKey;
  label: string;
  href: string;
  allowedRoles?: readonly UserRole[];
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    allowedRoles: ["SUPER_ADMIN", "MANAGER", "EMPLOYEE", "SALES"],
  },
  { key: "employees", label: "Employees", href: "/dashboard/employees", allowedRoles: ["SUPER_ADMIN", "MANAGER"] },
  { key: "attendance", label: "Attendance", href: "/dashboard/attendance", allowedRoles: ["SUPER_ADMIN", "MANAGER", "EMPLOYEE"] },
  { key: "leaves", label: "Leaves", href: "/dashboard/leaves", allowedRoles: ["SUPER_ADMIN", "MANAGER", "EMPLOYEE"] },
  { key: "tasks", label: "Tasks", href: "/dashboard/tasks", allowedRoles: ["SUPER_ADMIN", "MANAGER", "EMPLOYEE"] },
  { key: "dsr", label: "DSR", href: "/dashboard/dsr", allowedRoles: ["SUPER_ADMIN", "MANAGER", "EMPLOYEE"] },
  { key: "reports", label: "Reports", href: "/dashboard/reports", allowedRoles: ["SUPER_ADMIN", "MANAGER"] },
  { key: "settings", label: "Settings", href: "/dashboard/settings", allowedRoles: ["SUPER_ADMIN"] },
];

export function getDashboardNavItemsForRole(role: UserRole) {
  return DASHBOARD_NAV_ITEMS.filter((item) => !item.allowedRoles || item.allowedRoles.includes(role));
}

export function canRoleAccessDashboardPath(role: UserRole, slug: string[]) {
  if (slug.length === 0) {
    return true;
  }

  const [firstSegment] = slug;

  if (firstSegment === "users") {
    return role === "SUPER_ADMIN";
  }

  return getDashboardNavItemsForRole(role).some((item) => trimDashboardPrefix(item.href) === firstSegment);
}

export function getDefaultDashboardHrefForRole(role: UserRole) {
  void role;
  return "/dashboard";
}

export function getDisplayRoleLabel(role: UserRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "EMPLOYEE":
      return "Employee";
    case "SALES":
      return "Sales";
  }
}

function trimDashboardPrefix(href: string) {
  return href.replace(/^\/dashboard\/?/, "");
}
