import "server-only";

import type { AuthenticatedSession } from "@/lib/auth/auth-session";
import { TaskModel } from "@/lib/models/task";
import { UserModel } from "@/lib/models/user";

export async function getVisibleUserIdsForSession(
  session: AuthenticatedSession,
  options?: {
    employeesOnly?: boolean;
  },
) {
  if (session.user.role === "SUPER_ADMIN") {
    const filter = options?.employeesOnly ? { role: "EMPLOYEE" } : { role: { $ne: "SUPER_ADMIN" as const } };
    const users = await UserModel.find(filter, { _id: 1 }).lean();
    return users.map((user) => user._id.toString());
  }

  if (session.user.role === "MANAGER") {
    return getManagerTeamUserIds(session.user.id);
  }

  return [session.user.id];
}

export async function getManagerTeamUserIds(managerId: string) {
  const [directReports, legacyTasks] = await Promise.all([
    UserModel.find({ managerId, role: "EMPLOYEE" }, { _id: 1 }).lean(),
    TaskModel.find({ assignedByUserId: managerId }, { assignedUserId: 1 }).lean(),
  ]);

  const userIds = Array.from(
    new Set([
      ...directReports.map((user) => user._id.toString()),
      ...legacyTasks.map((task) => task.assignedUserId).filter(Boolean),
    ]),
  );

  if (!userIds.length) {
    return [];
  }

  const users = await UserModel.find({ _id: { $in: userIds }, role: "EMPLOYEE" }, { _id: 1 }).lean();
  return users.map((user) => user._id.toString());
}
