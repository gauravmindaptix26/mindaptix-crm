import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { AttendanceModel } from "@/database/mongodb/models/attendance";
import { DailyUpdateModel } from "@/database/mongodb/models/daily-update";
import { LeaveRequestModel } from "@/database/mongodb/models/leave-request";
import { ProjectModel } from "@/database/mongodb/models/project";
import { TaskModel } from "@/database/mongodb/models/task";
import { UserModel } from "@/database/mongodb/models/user";
import type { DashboardOverviewData } from "@/features/dashboard/types";
import {
  buildOverviewAttendanceTrend,
  buildOverviewCalendarItems,
  buildOverviewDsrTrend,
  buildOverviewEmployeeProjectSummaryRows,
  buildOverviewLeaveTrend,
  buildOverviewPerformanceRows,
  buildOverviewWeeklySummaryCards,
  formatDate,
  formatLabel,
  getDashboardOverviewContext,
  inScope,
} from "@/features/dashboard/shared/overview-support";

export async function buildLeadershipDashboardOverview(
  session: AuthenticatedSession,
  copy: Pick<DashboardOverviewData, "title" | "description">,
): Promise<DashboardOverviewData> {
  const { notifications, today, weekStart } = await getDashboardOverviewContext(session);
  const activeEmployees = await UserModel.find({ role: "EMPLOYEE", status: "ACTIVE" }, { fullName: 1, email: 1, phone: 1, joiningDate: 1 })
    .sort({ fullName: 1 })
    .lean();
  const employeeIds = activeEmployees.map((employee) => employee._id.toString());
  const employeeMap = new Map(
    activeEmployees.map((employee) => [employee._id.toString(), { fullName: employee.fullName, email: employee.email }]),
  );
  const scope = inScope(employeeIds);
  const [todaysAttendance, leaveRows, taskRows, weekAttendance, weekUpdates, projects] = await Promise.all([
    AttendanceModel.find({ userId: scope, dateKey: today }, { userId: 1 }).lean(),
    LeaveRequestModel.find({ userId: scope }, { userId: 1, leaveType: 1, startDate: 1, endDate: 1, status: 1, reason: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
    TaskModel.find({ assignedUserId: scope }, { title: 1, dueDate: 1, status: 1, assignedUserId: 1, priority: 1, completedAt: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
    AttendanceModel.find({ userId: scope, dateKey: { $gte: weekStart, $lte: today } }, { userId: 1, status: 1, dateKey: 1 }).lean(),
    DailyUpdateModel.find({ userId: scope, workDate: { $gte: weekStart, $lte: today } }, { userId: 1, workDate: 1 }).lean(),
    ProjectModel.find({}, { name: 1, status: 1, assignedUserIds: 1 }).sort({ createdAt: -1 }).lean(),
  ]);
  const presentTodayIds = new Set(todaysAttendance.map((row) => row.userId));
  const onLeaveTodayIds = new Set(
    leaveRows
      .filter((leave) => leave.status === "APPROVED" && leave.startDate <= today && leave.endDate >= today)
      .map((leave) => leave.userId),
  );
  const presentToday = presentTodayIds.size;
  const onLeaveToday = Array.from(onLeaveTodayIds).filter((userId) => !presentTodayIds.has(userId)).length;
  const absentToday = Math.max(activeEmployees.length - presentToday - onLeaveToday, 0);
  const todayLeaveRows = leaveRows.filter((leave) => leave.status === "APPROVED" && leave.startDate <= today && leave.endDate >= today);
  const currentWindowLeaveRows = leaveRows.filter((leave) => leave.endDate >= weekStart && leave.startDate <= today);
  const currentWindowTaskRows = taskRows.filter((task) => !task.createdAt || formatDate(task.createdAt) >= weekStart);
  const pendingProjects = projects.filter((project) => project.status === "PLANNING" || project.status === "ON_HOLD").length;
  const inProgressProjects = projects.filter((project) => project.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter((project) => project.status === "COMPLETED").length;
  const attendanceBreakdown = [
    { label: "Present", value: presentToday, color: "#2563eb" },
    { label: "On Leave", value: onLeaveToday, color: "#f59e0b" },
    { label: "Absent", value: absentToday, color: "#ef4444" },
  ];
  const taskStatusBreakdown = [
    { label: "Pending", value: taskRows.filter((task) => task.status === "PENDING").length, color: "#f59e0b" },
    { label: "In Progress", value: taskRows.filter((task) => task.status === "IN_PROGRESS").length, color: "#3b82f6" },
    { label: "Completed", value: taskRows.filter((task) => task.status === "COMPLETED").length, color: "#10b981" },
  ];
  const projectStatusBreakdown = [
    { label: "Pending", value: pendingProjects, color: "#f97316" },
    { label: "In Progress", value: inProgressProjects, color: "#2563eb" },
    { label: "Completed", value: completedProjects, color: "#10b981" },
  ];
  const attendanceTrend = buildOverviewAttendanceTrend({ activeEmployeeIds: employeeIds, attendanceRows: weekAttendance, leaveRows, today, weekStart });
  const leaveTrend = buildOverviewLeaveTrend(leaveRows, today, 6);
  const dsrTrend = buildOverviewDsrTrend({ activeEmployeeIds: employeeIds, dsrRows: weekUpdates, today, weekStart });
  const employeeProjectRows = buildOverviewEmployeeProjectSummaryRows({
    activeEmployees,
    projects: projects.map((project) => ({
      assignedUserIds: project.assignedUserIds ?? [],
      status: project.status,
    })),
  });

  return {
    ...copy,
    cards: [
      { label: "Present Today", value: String(presentToday), detail: "Employees who marked attendance today." },
      { label: "On Leave Today", value: String(onLeaveToday), detail: "Approved leave records active for today." },
      { label: "Projects Pending", value: String(pendingProjects), detail: "Projects in planning or hold state." },
      { label: "Projects In Progress", value: String(inProgressProjects), detail: "Projects currently under execution." },
      { label: "Projects Completed", value: String(completedProjects), detail: "Projects already closed successfully." },
      { label: "DSR Missing", value: String(dsrTrend.at(-1)?.missing ?? 0), detail: "Employees still missing today's DSR." },
    ],
    notificationTitle: "System Notifications",
    notifications,
    weeklySummaryTitle: "Weekly Summary",
    weeklySummaryCards: buildOverviewWeeklySummaryCards({
      attendanceRows: weekAttendance,
      dsrRows: weekUpdates,
      leaveRows: currentWindowLeaveRows,
      taskRows: currentWindowTaskRows,
      activePeopleCount: activeEmployees.length,
    }),
    calendarTitle: "Upcoming Calendar",
    calendarItems: buildOverviewCalendarItems({ leaves: leaveRows, tasks: taskRows, userMap: employeeMap }),
    performanceTitle: "Performance Score",
    performanceRows: (await buildOverviewPerformanceRows(employeeIds)).slice(0, 5),
    directoryTitle: "Employee Directory",
    directoryEmptyMessage: "No active employees available right now.",
    directoryItems: activeEmployees.map((employee) => ({
      id: employee._id.toString(),
      title: employee.fullName,
      meta: employee.joiningDate ? `Joined ${formatDate(employee.joiningDate)}` : "Joining date not added",
      description: [employee.email, employee.phone || "Phone not added"].join(" | "),
    })),
    primaryListTitle: "Today On Leave",
    primaryEmptyMessage: "No employees are on leave today.",
    primaryItems: todayLeaveRows.map((row) => ({
      id: row._id.toString(),
      title: employeeMap.get(row.userId)?.fullName ?? "Unknown employee",
      meta: `${formatLabel(row.leaveType)} | ${formatLabel(row.status)}`,
      description: row.reason?.trim() ? row.reason : `${row.startDate} to ${row.endDate}`,
    })),
    secondaryListTitle: "Employee Delivery Snapshot",
    secondaryEmptyMessage: "No employee project records are available yet.",
    secondaryItems: employeeProjectRows.slice(0, 5).map((row) => ({
      id: row.id,
      title: row.employeeName,
      meta: `Pending ${row.pendingProjects} | Completed ${row.completedProjects}`,
      description: row.employeeEmail,
    })),
    attendanceBreakdown,
    attendanceTrend,
    taskStatusBreakdown,
    projectStatusBreakdown,
    leaveTrend,
    dsrTrend,
    employeeProjectRows: employeeProjectRows.slice(0, 8),
  };
}



