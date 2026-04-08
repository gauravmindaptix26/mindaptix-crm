import "server-only";
import type { AuthenticatedSession } from "@/features/auth/lib/auth-session";
import { AttendanceModel } from "@/database/mongodb/models/attendance";
import { DailyUpdateModel } from "@/database/mongodb/models/daily-update";
import { LeaveRequestModel } from "@/database/mongodb/models/leave-request";
import { ProjectModel } from "@/database/mongodb/models/project";
import { SalesLeadModel } from "@/database/mongodb/models/sales-lead";
import { TaskModel } from "@/database/mongodb/models/task";
import { UserModel } from "@/database/mongodb/models/user";
import type { DashboardListItem, DashboardOverviewData, ExecutiveOverviewSection } from "@/features/dashboard/types";
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
  const activeSalesUsers =
    session.user.role === "SUPER_ADMIN" || session.user.role === "MANAGER"
      ? await UserModel.find({ role: "SALES", status: "ACTIVE" }, { fullName: 1, email: 1 }).sort({ fullName: 1 }).lean()
      : [];
  const employeeIds = activeEmployees.map((employee) => employee._id.toString());
  const salesUserIds = activeSalesUsers.map((user) => user._id.toString());
  const employeeMap = new Map(
    activeEmployees.map((employee) => [employee._id.toString(), { fullName: employee.fullName, email: employee.email }]),
  );
  const scope = inScope(employeeIds);
  const [todaysAttendance, leaveRows, taskRows, weekAttendance, weekUpdates, projects, salesLeads, operationalTasks] = await Promise.all([
    AttendanceModel.find({ userId: scope, dateKey: today }, { userId: 1 }).lean(),
    LeaveRequestModel.find({ userId: scope }, { userId: 1, leaveType: 1, startDate: 1, endDate: 1, status: 1, reason: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
    TaskModel.find({ assignedUserId: scope }, { title: 1, dueDate: 1, status: 1, assignedUserId: 1, priority: 1, completedAt: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
    AttendanceModel.find({ userId: scope, dateKey: { $gte: weekStart, $lte: today } }, { userId: 1, status: 1, dateKey: 1 }).lean(),
    DailyUpdateModel.find({ userId: scope, workDate: { $gte: weekStart, $lte: today } }, { userId: 1, workDate: 1 }).lean(),
    ProjectModel.find({}, { name: 1, summary: 1, status: 1, assignedUserIds: 1, dueDate: 1 }).sort({ createdAt: -1 }).lean(),
    SalesLeadModel.find({ salesUserId: inScope(salesUserIds) }, { salesUserId: 1, clientName: 1, clientPhone: 1, clientEmail: 1, technologies: 1, meetingDate: 1, meetingTime: 1, budget: 1, pitchedPrice: 1, deliveryDate: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean(),
    TaskModel.find(
      { assignedUserId: inScope([...employeeIds, ...salesUserIds]) },
      { title: 1, description: 1, dueDate: 1, status: 1, assignedUserId: 1, labels: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .lean(),
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
  const executiveSections =
    session.user.role === "SUPER_ADMIN" || session.user.role === "MANAGER"
      ? buildExecutiveOverviewSections({
          activeEmployees,
          activeSalesUsers,
          presentToday,
          onLeaveToday,
          absentToday,
          today,
          projects,
          leaveRows,
          salesLeads,
          salesUserMap: new Map(activeSalesUsers.map((user) => [user._id.toString(), user])),
          operationalTasks,
        })
      : undefined;

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
    executiveSections,
  };
}

function buildExecutiveOverviewSections({
  activeEmployees,
  activeSalesUsers,
  absentToday,
  leaveRows,
  onLeaveToday,
  operationalTasks,
  presentToday,
  projects,
  salesLeads,
  salesUserMap,
  today,
}: {
  activeEmployees: Array<{ _id: { toString(): string }; fullName: string; email: string; phone?: string; joiningDate?: Date | null }>;
  activeSalesUsers: Array<{ _id: { toString(): string }; fullName: string; email: string }>;
  absentToday: number;
  leaveRows: Array<{ _id: { toString(): string }; userId: string; leaveType?: string; startDate: string; endDate: string; status?: string; reason?: string }>;
  onLeaveToday: number;
  operationalTasks: Array<{ _id: { toString(): string }; title: string; description?: string; dueDate: string; status?: string; assignedUserId: string; labels?: string[] }>;
  presentToday: number;
  projects: Array<{ _id: { toString(): string }; name: string; summary: string; status?: string; assignedUserIds?: string[]; dueDate?: Date | null }>;
  salesLeads: Array<{
    _id: { toString(): string };
    salesUserId: string;
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    technologies?: string[];
    meetingDate?: string;
    meetingTime?: string;
    budget?: number;
    pitchedPrice?: number;
    deliveryDate?: string;
  }>;
  salesUserMap: Map<string, { _id: { toString(): string }; fullName: string; email: string }>;
  today: string;
}): ExecutiveOverviewSection[] {
  const totalProjects = projects.length;
  const closedProjects = projects.filter((project) => project.status === "COMPLETED").length;
  const ongoingProjects = projects.filter((project) => project.status === "IN_PROGRESS").length;
  const planningProjects = projects.filter((project) => project.status === "PLANNING" || project.status === "ON_HOLD").length;

  const projectItems: DashboardListItem[] = projects.slice(0, 6).map((project) => ({
    id: project._id.toString(),
    title: project.name,
    meta: `${formatLabel(project.status ?? "PLANNING")} | ${project.assignedUserIds?.length ?? 0} assignee(s)`,
    description: project.summary?.trim()
      ? `${project.summary} ${project.dueDate ? `| Due ${formatDate(project.dueDate)}` : ""}`.trim()
      : project.dueDate
        ? `Due ${formatDate(project.dueDate)}`
        : "Project timeline is not set yet.",
  }));

  const paymentItems: DashboardListItem[] = [];

  const employeeItems: DashboardListItem[] = [
    ...activeEmployees.slice(0, 6).map((employee) => {
      const isOnLeave = leaveRows.some((leave) => leave.userId === employee._id.toString() && leave.status === "APPROVED" && leave.startDate <= today && leave.endDate >= today);

      return {
        id: employee._id.toString(),
        title: employee.fullName,
        meta: employee.joiningDate ? `Joined ${formatDate(employee.joiningDate)}` : isOnLeave ? "On Leave Today" : "Active Employee",
        description: [employee.email, employee.phone || "Phone not added", isOnLeave ? "On leave today" : "Active today"].join(" | "),
      };
    }),
  ];

  const todaySalesMeetings = salesLeads.filter((lead) => lead.meetingDate === today).length;
  const totalQuotedValue = salesLeads.reduce((sum, lead) => sum + Number(lead.pitchedPrice ?? 0), 0);
  const totalBudgetValue = salesLeads.reduce((sum, lead) => sum + Number(lead.budget ?? 0), 0);
  const leadItems: DashboardListItem[] = salesLeads.slice(0, 6).map((lead) => {
    const salesOwner = salesUserMap.get(lead.salesUserId);
    const techLabel = (lead.technologies ?? []).slice(0, 3).join(", ");

    return {
      id: lead._id.toString(),
      title: lead.clientName,
      meta: `${salesOwner?.fullName ?? "Sales"} | ${lead.meetingDate || "Meeting pending"}`,
      description: [
        lead.clientEmail || lead.clientPhone || "Client contact not added",
        techLabel ? `Tech: ${techLabel}` : "Tech pending",
        `Budget ${formatCurrency(Number(lead.budget ?? 0))} | Pitch ${formatCurrency(Number(lead.pitchedPrice ?? 0))}`,
        lead.deliveryDate ? `Delivery ${lead.deliveryDate}` : "Delivery not fixed",
      ].join(" | "),
    };
  });

  const meetingTasks = operationalTasks.filter((task) => task.dueDate === today && /\bmeeting\b/i.test(`${task.title} ${task.description ?? ""}`));
  const todayMeetingUsers = new Set(meetingTasks.map((task) => task.assignedUserId)).size;
  const completedMeetings = meetingTasks.filter((task) => task.status === "COMPLETED").length;
  const pendingMeetings = meetingTasks.filter((task) => task.status !== "COMPLETED").length;
  const meetingItems: DashboardListItem[] = meetingTasks.slice(0, 6).map((task) => ({
    id: task._id.toString(),
    title: task.title,
    meta: `${formatLabel(task.status ?? "PENDING")} | ${task.dueDate}`,
    description: task.description?.trim() ? task.description : "Meeting task without extra description.",
  }));

  return [
    {
      id: "projects",
      badge: "Portfolio",
      title: "Project Portfolio",
      description: "Total projects, closed work, and current execution pipeline for the company.",
      metrics: [
        { label: "Total Projects", value: String(totalProjects), detail: "All projects currently tracked in the company workspace." },
        { label: "Closed", value: String(closedProjects), detail: "Projects already marked as completed." },
        { label: "Ongoing", value: String(ongoingProjects), detail: "Projects actively moving in execution." },
        { label: "Planned / Hold", value: String(planningProjects), detail: "Projects waiting, planning, or on hold." },
      ],
      items: projectItems,
      emptyMessage: "No projects are available yet.",
    },
    {
      id: "payments",
      badge: "Finance",
      title: "Payment Pipeline",
      description: "Collected, pending, and partially received payment visibility for leadership review.",
      note: "Payment records are not connected in the current database schema yet, so these values stay at zero until a payment module is added.",
      metrics: [
        { label: "Received", value: "0", detail: "Fully collected payments recorded in the system." },
        { label: "Pending", value: "0", detail: "Payments still not received." },
        { label: "Partial", value: "0", detail: "Projects where partial payment has come in." },
        { label: "Balance Due", value: "0", detail: "Outstanding amount still remaining." },
      ],
      items: paymentItems,
      emptyMessage: "No payment records are connected yet.",
    },
    {
      id: "workforce",
      badge: "People",
      title: "Employee Pulse",
      description: "Headcount, today's presence, and leave visibility across the active employee base.",
      metrics: [
        { label: "Total Employees", value: String(activeEmployees.length), detail: "Active employee accounts in the company." },
        { label: "Present Today", value: String(presentToday), detail: "Employees who marked attendance today." },
        { label: "On Leave", value: String(onLeaveToday), detail: "Employees currently on approved leave." },
        { label: "Not Marked", value: String(absentToday), detail: "Employees who have not marked attendance yet." },
      ],
      items: employeeItems,
      emptyMessage: "No active employee records are available yet.",
    },
    {
      id: "leads",
      badge: "Sales",
      title: "Client Pitch Tracker",
      description: "Sales pipeline with client records, budget discussion, quoted value, meeting plan, and expected delivery commitments.",
      note:
        salesLeads.length > 0
          ? `Client pitch tracker entries are synced from the sales CRM register. Active sales team: ${activeSalesUsers.length}.`
          : activeSalesUsers.length > 0
            ? "No client pitch entries yet. Add records from the Employees page sales pipeline section."
            : "No active sales users are available. Add a sales account first, then create client pitch records.",
      metrics: [
        { label: "Tracked Clients", value: String(salesLeads.length), detail: "Client records currently saved in the sales pipeline." },
        { label: "Meetings Today", value: String(todaySalesMeetings), detail: "Client meetings scheduled for today." },
        { label: "Client Budget", value: formatCurrency(totalBudgetValue), detail: "Total client budget captured across the tracker." },
        { label: "Quoted Value", value: formatCurrency(totalQuotedValue), detail: "Total pitched value already shared by the sales team." },
      ],
      items: leadItems,
      emptyMessage: "No client pitch records are available right now.",
    },
    {
      id: "meetings",
      badge: "Schedule",
      title: "Today's Meetings",
      description: "Meeting schedule visibility based on tasks that include 'meeting' and are due today.",
      note: "Meeting stats are inferred from today's tasks with 'meeting' in the title or description.",
      metrics: [
        { label: "Meetings Today", value: String(meetingTasks.length), detail: "Tasks tagged as meetings and scheduled for today." },
        { label: "People In Meetings", value: String(todayMeetingUsers), detail: "Unique assigned users linked to today's meetings." },
        { label: "Completed", value: String(completedMeetings), detail: "Meeting tasks marked complete." },
        { label: "Pending", value: String(pendingMeetings), detail: "Meeting tasks still not closed." },
      ],
      items: meetingItems,
      emptyMessage: "No meeting tasks are scheduled for today.",
    },
  ];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}



