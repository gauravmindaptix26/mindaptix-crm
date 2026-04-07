import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { syncWorkflowNotifications, getNotificationsForUser } from "@/features/notifications/service";
import { AttendanceModel } from "@/database/mongodb/models/attendance";
import { DailyUpdateModel } from "@/database/mongodb/models/daily-update";
import { TaskModel } from "@/database/mongodb/models/task";
import { UserModel } from "@/database/mongodb/models/user";
import type {
  AttendanceTrendPoint,
  DashboardNotificationItem,
  DsrTrendPoint,
  EmployeeProjectSummaryRow,
  LeaveTrendPoint,
  PerformanceScoreRow,
  SummaryCard,
} from "@/features/dashboard/data";
import connectDb from "@/database/mongodb/connect";

export async function getDashboardOverviewContext(session: AuthenticatedSession) {
  await connectDb();
  await syncWorkflowNotifications(session);

  const today = getTodayDate();
  return {
    today,
    weekStart: addDaysToDate(today, -6),
    notifications: mapNotifications(await getNotificationsForUser(session.user.id, 8)),
  };
}

export async function buildOverviewPerformanceRows(userIds: string[]): Promise<PerformanceScoreRow[]> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return [];
  }

  const today = getTodayDate();
  const weekStart = addDaysToDate(today, -6);
  const scope = inScope(uniqueIds);
  const [users, attendance, tasks, updates] = await Promise.all([
    UserModel.find({ _id: scope }, { fullName: 1, email: 1 }).lean(),
    AttendanceModel.find({ userId: scope, dateKey: { $gte: weekStart, $lte: today } }, { userId: 1, status: 1 }).lean(),
    TaskModel.find({ assignedUserId: scope }, { assignedUserId: 1, status: 1 }).lean(),
    DailyUpdateModel.find({ userId: scope, workDate: { $gte: weekStart, $lte: today } }, { userId: 1 }).lean(),
  ]);

  return users
    .map((user) => {
      const userId = user._id.toString();
      const attendanceRows = attendance.filter((row) => row.userId === userId);
      const userTasks = tasks.filter((task) => task.assignedUserId === userId);
      const dsrCount = updates.filter((update) => update.userId === userId).length;
      const attendanceRate = getRate(attendanceRows.length, 7);
      const taskCompletionRate = getRate(userTasks.filter((task) => task.status === "COMPLETED").length, Math.max(userTasks.length, 1));
      const dsrConsistencyRate = getRate(dsrCount, 7);
      const score = Math.round(attendanceRate * 0.35 + taskCompletionRate * 0.4 + dsrConsistencyRate * 0.25);

      return {
        id: userId,
        employeeName: user.fullName,
        employeeEmail: user.email,
        score,
        attendanceRate,
        taskCompletionRate,
        dsrConsistencyRate,
      };
    })
    .sort((left, right) => right.score - left.score || left.employeeName.localeCompare(right.employeeName));
}

export function buildOverviewWeeklySummaryCards({
  attendanceRows,
  dsrRows,
  leaveRows,
  taskRows,
  activePeopleCount,
}: {
  attendanceRows: Array<{ status?: string }>;
  dsrRows: Array<{ userId?: string; workDate?: string }>;
  leaveRows: Array<{ status?: string }>;
  taskRows: Array<{ status?: string }>;
  activePeopleCount: number;
}): SummaryCard[] {
  const completedAttendance = attendanceRows.filter((row) => row.status === "COMPLETED").length;
  const completedTasks = taskRows.filter((task) => task.status === "COMPLETED").length;
  const pendingTasks = taskRows.filter((task) => task.status !== "COMPLETED").length;
  const approvedLeaves = leaveRows.filter((leave) => leave.status === "APPROVED").length;

  return [
    { label: "Attendance", value: `${completedAttendance}/${Math.max(activePeopleCount * 7, 1)}`, detail: "Completed attendance checkouts recorded this week." },
    { label: "DSR", value: String(dsrRows.length), detail: "DSR entries submitted in the last 7 days." },
    { label: "Completed Tasks", value: String(completedTasks), detail: "Tasks marked complete in the current summary scope." },
    { label: "Pending Work", value: String(pendingTasks), detail: "Open tasks still active in the current summary scope." },
    { label: "Approved Leaves", value: String(approvedLeaves), detail: "Leave requests approved in the current summary window." },
  ];
}

export function buildOverviewCalendarItems({
  leaves,
  tasks,
  userMap,
}: {
  leaves: Array<{ _id: { toString(): string }; userId: string; leaveType?: string; startDate: string; endDate: string; status?: string }>;
  tasks: Array<{ _id: { toString(): string }; title: string; dueDate: string; status?: string; assignedUserId: string }>;
  userMap: Map<string, { fullName: string; email?: string }>;
}) {
  const taskEvents = tasks
    .filter((task) => task.status !== "COMPLETED")
    .map((task) => ({
      id: `task-${task._id.toString()}`,
      title: task.title,
      date: task.dueDate,
      type: task.dueDate < getTodayDate() ? "Overdue Task" : "Task Deadline",
      detail: userMap.get(task.assignedUserId)?.fullName
        ? `${userMap.get(task.assignedUserId)?.fullName} | ${formatLabel(task.status ?? "PENDING")}`
        : formatLabel(task.status ?? "PENDING"),
    }));

  const leaveEvents = leaves.map((leave) => ({
    id: `leave-${leave._id.toString()}`,
    title: userMap.get(leave.userId)?.fullName ?? "Employee Leave",
    date: leave.startDate,
    type: `${formatLabel(leave.leaveType ?? "Leave")} Leave`,
    detail: `${leave.startDate} to ${leave.endDate} | ${formatLabel(leave.status ?? "PENDING")}`,
  }));

  return [...taskEvents, ...leaveEvents].sort((left, right) => left.date.localeCompare(right.date)).slice(0, 8);
}

export function buildOverviewAttendanceTrend({
  activeEmployeeIds,
  attendanceRows,
  leaveRows,
  today,
  weekStart,
}: {
  activeEmployeeIds: string[];
  attendanceRows: Array<{ userId: string; dateKey?: string }>;
  leaveRows: Array<{ userId: string; status?: string; startDate: string; endDate: string }>;
  today: string;
  weekStart: string;
}): AttendanceTrendPoint[] {
  const uniqueEmployeeIds = Array.from(new Set(activeEmployeeIds));

  return listDateRange(weekStart, today).map((dateKey) => {
    const presentIds = new Set(attendanceRows.filter((row) => row.dateKey === dateKey).map((row) => row.userId));
    const onLeaveIds = new Set(
      leaveRows
        .filter((leave) => leave.status === "APPROVED" && leave.startDate <= dateKey && leave.endDate >= dateKey)
        .map((leave) => leave.userId)
        .filter((userId) => !presentIds.has(userId)),
    );

    return {
      label: formatDayLabel(dateKey),
      present: presentIds.size,
      onLeave: onLeaveIds.size,
      absent: Math.max(uniqueEmployeeIds.length - presentIds.size - onLeaveIds.size, 0),
    };
  });
}

export function buildOverviewLeaveTrend(leaveRows: Array<{ startDate: string }>, today: string, months = 6): LeaveTrendPoint[] {
  const monthKeys = listMonthRange(today, months);
  const countMap = new Map(monthKeys.map((monthKey) => [monthKey, 0]));

  for (const row of leaveRows) {
    const monthKey = row.startDate.slice(0, 7);
    if (countMap.has(monthKey)) {
      countMap.set(monthKey, (countMap.get(monthKey) ?? 0) + 1);
    }
  }

  return monthKeys.map((monthKey) => ({
    label: formatMonthLabel(monthKey),
    count: countMap.get(monthKey) ?? 0,
  }));
}

export function buildOverviewDsrTrend({
  activeEmployeeIds,
  dsrRows,
  today,
  weekStart,
}: {
  activeEmployeeIds: string[];
  dsrRows: Array<{ userId: string; workDate?: string }>;
  today: string;
  weekStart: string;
}): DsrTrendPoint[] {
  const uniqueEmployeeIds = Array.from(new Set(activeEmployeeIds));

  return listDateRange(weekStart, today).map((dateKey) => {
    const submittedIds = new Set(dsrRows.filter((row) => row.workDate === dateKey).map((row) => row.userId));

    return {
      label: formatDayLabel(dateKey),
      submitted: submittedIds.size,
      missing: Math.max(uniqueEmployeeIds.length - submittedIds.size, 0),
    };
  });
}

export function buildOverviewEmployeeProjectSummaryRows({
  activeEmployees,
  projects,
}: {
  activeEmployees: Array<{ _id: { toString(): string }; fullName: string; email: string }>;
  projects: Array<{ assignedUserIds?: string[]; status?: string }>;
}): EmployeeProjectSummaryRow[] {
  return activeEmployees
    .map((employee) => {
      const employeeId = employee._id.toString();
      const assignedProjects = projects.filter((project) => project.assignedUserIds?.includes(employeeId));
      const completedProjects = assignedProjects.filter((project) => project.status === "COMPLETED").length;
      const pendingProjects = assignedProjects.length - completedProjects;

      return {
        id: employeeId,
        employeeName: employee.fullName,
        employeeEmail: employee.email,
        pendingProjects,
        completedProjects,
      };
    })
    .sort(
      (left, right) =>
        right.pendingProjects - left.pendingProjects ||
        right.completedProjects - left.completedProjects ||
        left.employeeName.localeCompare(right.employeeName),
    );
}

export function mapOverviewNotifications(
  notifications: Array<{ _id: { toString(): string }; title: string; message: string; createdAt?: Date | null; actionUrl?: string }>,
): DashboardNotificationItem[] {
  return notifications.map((notification) => ({
    id: notification._id.toString(),
    title: notification.title,
    detail: notification.message,
    meta: formatDateTime(notification.createdAt),
    actionUrl: notification.actionUrl ?? "",
  }));
}

export function mapNotifications(
  notifications: Array<{ _id: { toString(): string }; title: string; message: string; createdAt?: Date | null; actionUrl?: string }>,
): DashboardNotificationItem[] {
  return mapOverviewNotifications(notifications);
}

export function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysToDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Not marked";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not marked";
  }

  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)}`;
}

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function inScope(userIds: string[]) {
  return userIds.length ? { $in: userIds } : { $in: [] as string[] };
}

function getRate(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function listDateRange(startDateKey: string, endDateKey: string) {
  const dates: string[] = [];
  let current = startDateKey;

  while (current <= endDateKey) {
    dates.push(current);
    current = addDaysToDate(current, 1);
  }

  return dates;
}

function listMonthRange(today: string, months: number) {
  const date = new Date(`${today}T00:00:00.000Z`);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - (months - 1));

  const monthKeys: string[] = [];

  for (let index = 0; index < months; index += 1) {
    monthKeys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
    date.setUTCMonth(date.getUTCMonth() + 1);
  }

  return monthKeys;
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? dateKey : date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? monthKey : date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}




