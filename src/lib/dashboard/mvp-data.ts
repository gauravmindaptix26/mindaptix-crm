import "server-only";
import type { AuthenticatedSession } from "@/lib/auth/auth-session";
import connectDb from "@/lib/connectDb";
import { getManagerTeamUserIds, getVisibleUserIdsForSession } from "@/lib/dashboard/team-scope";
import { AttendanceModel } from "@/lib/models/attendance";
import { DailyUpdateModel } from "@/lib/models/daily-update";
import { LeaveRequestModel } from "@/lib/models/leave-request";
import { ProjectModel } from "@/lib/models/project";
import { SettingModel } from "@/lib/models/setting";
import { TaskModel } from "@/lib/models/task";
import { UserModel } from "@/lib/models/user";

export type SummaryCard = {
  label: string;
  value: string;
  detail: string;
};

export type DashboardListItem = {
  id: string;
  title: string;
  meta: string;
  description: string;
};

export type DashboardOverviewData = {
  title: string;
  description: string;
  cards: SummaryCard[];
  primaryListTitle: string;
  primaryEmptyMessage: string;
  primaryItems: DashboardListItem[];
  secondaryListTitle: string;
  secondaryEmptyMessage: string;
  secondaryItems: DashboardListItem[];
};

export type EmployeeDirectoryEntry = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  joiningDate: string;
  managerId: string;
  managerName: string;
  role: "SUPER_ADMIN" | "MANAGER" | "EMPLOYEE" | "SALES";
  status: "ACTIVE" | "SUSPENDED";
  projectIds: string[];
  documentName: string;
  documentUrl: string;
};

export type EmployeeProjectEntry = {
  id: string;
  name: string;
  summary: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedUserIds: string[];
};

export type DsrFeedEntry = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  projectName: string;
  workDate: string;
  summary: string;
  accomplishments: string;
  blockers: string;
  nextPlan: string;
};

export type EmployeesPageData = {
  managerOptions: EmployeeOption[];
  summaryCards: SummaryCard[];
  users: EmployeeDirectoryEntry[];
  projects: EmployeeProjectEntry[];
  recentUpdates: DsrFeedEntry[];
};

export type AttendanceRecordView = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  dateKey: string;
  checkInAt: string;
  checkOutAt: string;
  status: string;
};

export type AttendanceMonthlyRow = {
  id: string;
  employeeName: string;
  daysMarked: number;
  completedDays: number;
};

export type AttendancePageData = {
  summaryCards: SummaryCard[];
  todayRecord: AttendanceRecordView | null;
  todayRecords: AttendanceRecordView[];
  monthlyRows: AttendanceMonthlyRow[];
};

export type LeaveEntry = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

export type LeavePageData = {
  summaryCards: SummaryCard[];
  leaves: LeaveEntry[];
};

export type TaskEntry = {
  id: string;
  title: string;
  description: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedByName: string;
  dueDate: string;
  status: string;
};

export type EmployeeOption = {
  id: string;
  label: string;
};

export type TaskPageData = {
  summaryCards: SummaryCard[];
  tasks: TaskEntry[];
  employeeOptions: EmployeeOption[];
};

export type EmployeeProjectView = {
  id: string;
  name: string;
  summary: string;
  status: string;
  priority: string;
  dueDate: string;
};

export type EmployeeUpdateView = {
  id: string;
  workDate: string;
  summary: string;
  accomplishments: string;
  blockers: string;
  nextPlan: string;
  projectId: string;
  projectName: string;
};

export type DsrMissingEntry = {
  id: string;
  employeeName: string;
  employeeEmail: string;
};

export type DsrPageData =
  | {
      mode: "employee";
      summaryCards: SummaryCard[];
      projects: EmployeeProjectView[];
      updates: EmployeeUpdateView[];
    }
  | {
      mode: "review";
      summaryCards: SummaryCard[];
      updates: DsrFeedEntry[];
      missingEmployees: DsrMissingEntry[];
    };

export type ReportsPageData = {
  summaryCards: SummaryCard[];
  attendanceRows: AttendanceMonthlyRow[];
  leaveRows: LeaveEntry[];
  taskRows: TaskEntry[];
};

export type SettingsPageData = {
  companyName: string;
  workStart: string;
  workEnd: string;
  leavePolicy: string;
};

export async function getDashboardOverviewData(session: AuthenticatedSession): Promise<DashboardOverviewData> {
  await connectDb();

  const today = getTodayDate();

  if (session.user.role === "SUPER_ADMIN") {
    const activeStaffFilter = { role: { $ne: "SUPER_ADMIN" as const }, status: "ACTIVE" as const };

    const [totalEmployees, todaysAttendance, pendingLeaves, pendingTasks, leaveRows, taskRows] = await Promise.all([
      UserModel.countDocuments(activeStaffFilter),
      AttendanceModel.countDocuments({ dateKey: today }),
      LeaveRequestModel.countDocuments({ status: "PENDING" }),
      TaskModel.countDocuments({ status: { $ne: "COMPLETED" } }),
      LeaveRequestModel.find({}, { userId: 1, leaveType: 1, startDate: 1, endDate: 1, status: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      TaskModel.find({}, { title: 1, dueDate: 1, status: 1, assignedUserId: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const absentToday = Math.max(totalEmployees - todaysAttendance, 0);
    const userIds = Array.from(
      new Set([...leaveRows.map((row) => row.userId), ...taskRows.map((row) => row.assignedUserId)].filter(Boolean)),
    );
    const users = await UserModel.find({ _id: { $in: userIds } }, { fullName: 1, email: 1 }).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    return {
      title: "Admin Dashboard",
      description: "Simple company overview for employees, attendance, leaves, and task movement.",
      cards: [
        { label: "Total Employees", value: String(totalEmployees), detail: "Active manager and employee accounts." },
        { label: "Present Today", value: String(todaysAttendance), detail: "Attendance marked today." },
        { label: "Absent Today", value: String(absentToday), detail: "Active staff without attendance today." },
        { label: "Pending Leaves", value: String(pendingLeaves), detail: "Leave requests waiting for admin review." },
        { label: "Pending Tasks", value: String(pendingTasks), detail: "Tasks that are not completed yet." },
      ],
      primaryListTitle: "Recent Leave Requests",
      primaryEmptyMessage: "No leave requests available right now.",
      primaryItems: leaveRows.map((row) => ({
        id: row._id.toString(),
        title: userMap.get(row.userId)?.fullName ?? "Unknown employee",
        meta: `${formatLabel(row.leaveType)} • ${formatLabel(row.status)}`,
        description: `${row.startDate} to ${row.endDate}`,
      })),
      secondaryListTitle: "Recent Tasks",
      secondaryEmptyMessage: "No tasks have been created yet.",
      secondaryItems: taskRows.map((row) => ({
        id: row._id.toString(),
        title: row.title,
        meta: userMap.get(row.assignedUserId)?.fullName ?? "Unassigned",
        description: `Due ${row.dueDate} • ${formatLabel(row.status)}`,
      })),
    };
  }

  if (session.user.role === "MANAGER") {
    const teamUserIds = await getManagerTeamUserIds(session.user.id);
    const teamScope = teamUserIds.length ? { $in: teamUserIds } : { $in: [] as string[] };

    const [teamCount, todaysAttendance, pendingLeaves, pendingTasks, taskRows, updateRows] = await Promise.all([
      UserModel.countDocuments({ _id: teamScope, role: "EMPLOYEE", status: "ACTIVE" }),
      AttendanceModel.countDocuments({ userId: teamScope, dateKey: today }),
      LeaveRequestModel.countDocuments({ userId: teamScope, status: "PENDING" }),
      TaskModel.countDocuments({ assignedByUserId: session.user.id, status: { $ne: "COMPLETED" } }),
      TaskModel.find({ assignedByUserId: session.user.id }, { title: 1, dueDate: 1, status: 1, assignedUserId: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      DailyUpdateModel.find({ userId: teamScope }, { userId: 1, summary: 1, workDate: 1 })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const absentToday = Math.max(teamCount - todaysAttendance, 0);
    const userIds = Array.from(
      new Set([...taskRows.map((row) => row.assignedUserId), ...updateRows.map((row) => row.userId)]),
    );
    const users = await UserModel.find({ _id: { $in: userIds } }, { fullName: 1 }).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user.fullName]));

    return {
      title: "Manager Dashboard",
      description: "Simple team view for attendance, pending leaves, assigned tasks, and DSR tracking.",
      cards: [
        { label: "Team Members", value: String(teamCount), detail: "Employees currently managed through task assignments." },
        { label: "Present Today", value: String(todaysAttendance), detail: "Team attendance marked for today." },
        { label: "Absent Today", value: String(absentToday), detail: "Team members missing attendance today." },
        { label: "Pending Leaves", value: String(pendingLeaves), detail: "Pending leave requests from your visible team." },
        { label: "Open Tasks", value: String(pendingTasks), detail: "Tasks assigned by you that are still active." },
      ],
      primaryListTitle: "Recent Team Tasks",
      primaryEmptyMessage: "No team tasks available yet.",
      primaryItems: taskRows.map((row) => ({
        id: row._id.toString(),
        title: row.title,
        meta: userMap.get(row.assignedUserId) ?? "Unknown employee",
        description: `Due ${row.dueDate} • ${formatLabel(row.status)}`,
      })),
      secondaryListTitle: "Recent Team DSR",
      secondaryEmptyMessage: "No DSR entries from your team yet.",
      secondaryItems: updateRows.map((row) => ({
        id: row._id.toString(),
        title: row.summary,
        meta: userMap.get(row.userId) ?? "Unknown employee",
        description: row.workDate,
      })),
    };
  }

  const [attendanceRow, pendingLeaves, openTasks, projectCount, dsrCount, taskRows] = await Promise.all([
    AttendanceModel.findOne({ userId: session.user.id, dateKey: today }).lean(),
    LeaveRequestModel.countDocuments({ userId: session.user.id, status: "PENDING" }),
    TaskModel.countDocuments({ assignedUserId: session.user.id, status: { $ne: "COMPLETED" } }),
    ProjectModel.countDocuments({ assignedUserIds: session.user.id }),
    DailyUpdateModel.countDocuments({ userId: session.user.id, workDate: today }),
    TaskModel.find({ assignedUserId: session.user.id }, { title: 1, dueDate: 1, status: 1 })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    title: "Employee Dashboard",
    description: "Personal work summary for attendance, assigned tasks, leave requests, and daily reporting.",
    cards: [
      {
        label: "Attendance",
        value: attendanceRow ? formatLabel(attendanceRow.status) : "Not Marked",
        detail: "Your current attendance status for today.",
      },
      { label: "Pending Leaves", value: String(pendingLeaves), detail: "Your leave requests waiting for review." },
      { label: "Open Tasks", value: String(openTasks), detail: "Assigned tasks still in progress." },
      { label: "Assigned Projects", value: String(projectCount), detail: "Projects currently linked to your account." },
      { label: "DSR Today", value: dsrCount ? "Submitted" : "Pending", detail: "Daily status report state for today." },
    ],
    primaryListTitle: "My Tasks",
    primaryEmptyMessage: "No tasks assigned right now.",
    primaryItems: taskRows.map((row) => ({
      id: row._id.toString(),
      title: row.title,
      meta: formatLabel(row.status),
      description: `Due ${row.dueDate}`,
    })),
    secondaryListTitle: "My Work Focus",
    secondaryEmptyMessage: "Your next work updates will appear here.",
    secondaryItems: [
      { id: "attendance", title: "Mark Attendance", meta: "Daily", description: "Use the Attendance page to check in and check out." },
      { id: "dsr", title: "Submit DSR", meta: "Daily", description: "Use the DSR page to report today’s work and tomorrow’s plan." },
      { id: "leave", title: "Apply Leave", meta: "As needed", description: "Use the Leaves page for sick or paid leave requests." },
    ],
  };
}

export async function getEmployeesPageData(session?: AuthenticatedSession): Promise<EmployeesPageData> {
  await connectDb();

  const isManagerView = session?.user.role === "MANAGER";
  const visibleEmployeeIds = session ? await getVisibleUserIdsForSession(session, { employeesOnly: true }) : [];
  const visibleEmployeeScope = visibleEmployeeIds.length ? { $in: visibleEmployeeIds } : { $in: [] as string[] };
  const userFilter = isManagerView ? { _id: visibleEmployeeScope, role: "EMPLOYEE" } : {};

  const users = await UserModel.find(
    userFilter,
    { fullName: 1, email: 1, phone: 1, joiningDate: 1, managerId: 1, role: 1, status: 1, projectIds: 1, documentName: 1, documentUrl: 1 },
  )
    .sort({ createdAt: -1 })
    .lean();

  const visibleProjectIds = Array.from(new Set(users.flatMap((user) => user.projectIds ?? [])));
  const updatesFilter = isManagerView ? { userId: visibleEmployeeScope } : {};

  const [projects, updates, managerUsers] = await Promise.all([
    ProjectModel.find(
      isManagerView ? { _id: { $in: visibleProjectIds } } : {},
      { name: 1, summary: 1, status: 1, priority: 1, dueDate: 1, assignedUserIds: 1 },
    )
      .sort({ createdAt: -1 })
      .lean(),
    DailyUpdateModel.find(updatesFilter, { userId: 1, projectId: 1, workDate: 1, summary: 1, accomplishments: 1, blockers: 1, nextPlan: 1 })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    UserModel.find({ role: "MANAGER", status: "ACTIVE" }, { fullName: 1, email: 1 }).sort({ fullName: 1 }).lean(),
  ]);

  const managerIds = Array.from(new Set(users.map((user) => user.managerId).filter(Boolean)));
  const [userMap, projectMap, managerMap] = await Promise.all([
    buildUserMap(users.map((user) => user._id.toString())),
    buildProjectMap(projects.map((project) => project._id.toString())),
    buildUserMap(managerIds),
  ]);

  const activeUsers = users.filter((user) => user.status === "ACTIVE");
  const managerCount = users.filter((user) => user.role === "MANAGER").length;
  const employees = users.filter((user) => user.role === "EMPLOYEE").length;

  return {
    managerOptions: managerUsers.map((manager) => ({
      id: manager._id.toString(),
      label: `${manager.fullName} (${manager.email})`,
    })),
    summaryCards: isManagerView
      ? [
          { label: "Team Members", value: String(users.length), detail: "Employees currently visible in your team scope." },
          { label: "Active Members", value: String(activeUsers.length), detail: "Team members with active accounts." },
          { label: "Projects", value: String(projects.length), detail: "Projects currently mapped to your visible team." },
          { label: "Recent DSR", value: String(updates.length), detail: "Latest status reports submitted by your team." },
        ]
      : [
          { label: "Total Team", value: String(activeUsers.length), detail: "Active accounts across admin, managers, and employees." },
          { label: "Managers", value: String(managerCount), detail: "Manager accounts currently active." },
          { label: "Employees", value: String(employees), detail: "Employee accounts available for task and project assignment." },
          { label: "Projects", value: String(projects.length), detail: "Projects available for employee assignment and DSR mapping." },
        ],
    users: users.map((user) => ({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      joiningDate: formatDate(user.joiningDate),
      managerId: user.managerId ?? "",
      managerName: user.managerId ? managerMap.get(user.managerId)?.fullName ?? "Unknown manager" : "",
      role: user.role,
      status: user.status ?? "ACTIVE",
      projectIds: user.projectIds ?? [],
      documentName: user.documentName ?? "",
      documentUrl: user.documentUrl ?? "",
    })),
    projects: projects.map((project) => ({
      id: project._id.toString(),
      name: project.name,
      summary: project.summary,
      status: project.status,
      priority: project.priority,
      dueDate: formatDate(project.dueDate),
      assignedUserIds: project.assignedUserIds ?? [],
    })),
    recentUpdates: updates.map((update) => ({
      id: update._id.toString(),
      employeeName: userMap.get(update.userId)?.fullName ?? "Unknown employee",
      employeeEmail: userMap.get(update.userId)?.email ?? "",
      projectName: update.projectId ? projectMap.get(update.projectId) ?? "General" : "General",
      workDate: update.workDate,
      summary: update.summary,
      accomplishments: update.accomplishments,
      blockers: update.blockers ?? "",
      nextPlan: update.nextPlan ?? "",
    })),
  };
}

export async function getAttendancePageData(session: AuthenticatedSession): Promise<AttendancePageData> {
  await connectDb();

  const today = getTodayDate();
  const monthPrefix = today.slice(0, 7);
  const scopeUserIds = await getVisibleUserIdsForSession(session, { employeesOnly: session.user.role !== "SUPER_ADMIN" });
  const attendanceScope = scopeUserIds.length ? { $in: scopeUserIds } : { $in: [session.user.id] };

  const [todayRecord, todayRecords, monthlyRecords, users] = await Promise.all([
    AttendanceModel.findOne({ userId: session.user.id, dateKey: today }).lean(),
    AttendanceModel.find({ userId: attendanceScope, dateKey: today }).sort({ checkInAt: 1 }).lean(),
    AttendanceModel.find({ userId: attendanceScope, dateKey: { $regex: `^${monthPrefix}` } }).lean(),
    UserModel.find({ _id: attendanceScope }, { fullName: 1, email: 1, role: 1, status: 1 }).lean(),
  ]);

  const activeUsers = users.filter((user) => user.status === "ACTIVE");
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const presentCount = todayRecords.length;
  const completedCount = todayRecords.filter((row) => row.status === "COMPLETED").length;
  const missingCount = Math.max(activeUsers.length - presentCount, 0);
  const monthlyMap = new Map<string, AttendanceMonthlyRow>();

  for (const record of monthlyRecords) {
    const entry =
      monthlyMap.get(record.userId) ??
      {
        id: record.userId,
        employeeName: userMap.get(record.userId)?.fullName ?? "Unknown employee",
        daysMarked: 0,
        completedDays: 0,
      };

    entry.daysMarked += 1;
    if (record.status === "COMPLETED") {
      entry.completedDays += 1;
    }
    monthlyMap.set(record.userId, entry);
  }

  return {
    summaryCards: [
      { label: "Present Today", value: String(presentCount), detail: "Attendance entries marked for today." },
      { label: "Checked Out", value: String(completedCount), detail: "People who have completed checkout." },
      { label: "Not Marked", value: String(missingCount), detail: "Visible team members with no attendance yet." },
      {
        label: "My Status",
        value: todayRecord ? formatLabel(todayRecord.status) : "Not Marked",
        detail: "Your current attendance state for today.",
      },
    ],
    todayRecord: todayRecord
      ? {
          id: todayRecord._id.toString(),
          employeeName: session.user.fullName,
          employeeEmail: session.user.email,
          dateKey: todayRecord.dateKey,
          checkInAt: formatDateTime(todayRecord.checkInAt),
          checkOutAt: formatDateTime(todayRecord.checkOutAt),
          status: todayRecord.status,
        }
      : null,
    todayRecords: todayRecords.map((record) => ({
      id: record._id.toString(),
      employeeName: userMap.get(record.userId)?.fullName ?? "Unknown employee",
      employeeEmail: userMap.get(record.userId)?.email ?? "",
      dateKey: record.dateKey,
      checkInAt: formatDateTime(record.checkInAt),
      checkOutAt: formatDateTime(record.checkOutAt),
      status: record.status,
    })),
    monthlyRows: Array.from(monthlyMap.values()).sort((left, right) => left.employeeName.localeCompare(right.employeeName)),
  };
}

export async function getLeavesPageData(session: AuthenticatedSession): Promise<LeavePageData> {
  await connectDb();

  const visibleUserIds = await getVisibleUserIdsForSession(session, { employeesOnly: true });
  const leaveFilter =
    session.user.role === "SUPER_ADMIN"
      ? {}
      : { userId: { $in: session.user.role === "EMPLOYEE" ? [session.user.id] : visibleUserIds } };

  const [leaves, users] = await Promise.all([
    LeaveRequestModel.find(leaveFilter).sort({ createdAt: -1 }).lean(),
    UserModel.find({}, { fullName: 1, email: 1 }).lean(),
  ]);

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  return {
    summaryCards: [
      { label: "Pending", value: String(leaves.filter((item) => item.status === "PENDING").length), detail: "Leave requests awaiting review." },
      { label: "Approved", value: String(leaves.filter((item) => item.status === "APPROVED").length), detail: "Approved leave requests." },
      { label: "Rejected", value: String(leaves.filter((item) => item.status === "REJECTED").length), detail: "Rejected leave requests." },
      { label: "History", value: String(leaves.length), detail: "Total leave requests in your current scope." },
    ],
    leaves: leaves.map((leave) => ({
      id: leave._id.toString(),
      employeeName: userMap.get(leave.userId)?.fullName ?? "Unknown employee",
      employeeEmail: userMap.get(leave.userId)?.email ?? "",
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
    })),
  };
}

export async function getTasksPageData(session: AuthenticatedSession): Promise<TaskPageData> {
  await connectDb();

  const managerTeamUserIds = session.user.role === "MANAGER" ? await getManagerTeamUserIds(session.user.id) : [];
  const taskFilter =
    session.user.role === "SUPER_ADMIN"
      ? {}
      : session.user.role === "MANAGER"
        ? { assignedByUserId: session.user.id }
        : { assignedUserId: session.user.id };
  const employeeFilter =
    session.user.role === "MANAGER" && managerTeamUserIds.length
      ? { _id: { $in: managerTeamUserIds }, role: "EMPLOYEE", status: "ACTIVE" }
      : { role: "EMPLOYEE", status: "ACTIVE" };

  const [tasks, employees, users] = await Promise.all([
    TaskModel.find(taskFilter).sort({ createdAt: -1 }).lean(),
    UserModel.find(employeeFilter, { fullName: 1, email: 1 }).sort({ fullName: 1 }).lean(),
    UserModel.find({}, { fullName: 1 }).lean(),
  ]);

  const userMap = new Map(users.map((user) => [user._id.toString(), user.fullName]));

  return {
    summaryCards: [
      { label: "Pending", value: String(tasks.filter((task) => task.status === "PENDING").length), detail: "Tasks waiting to start." },
      { label: "In Progress", value: String(tasks.filter((task) => task.status === "IN_PROGRESS").length), detail: "Tasks currently being worked on." },
      { label: "Completed", value: String(tasks.filter((task) => task.status === "COMPLETED").length), detail: "Finished tasks in this scope." },
      { label: "Total Tasks", value: String(tasks.length), detail: "All tasks visible for this role." },
    ],
    tasks: tasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      assignedUserId: task.assignedUserId,
      assignedUserName: userMap.get(task.assignedUserId) ?? "Unknown employee",
      assignedByName: userMap.get(task.assignedByUserId) ?? "Unknown manager",
      dueDate: task.dueDate,
      status: task.status,
    })),
    employeeOptions: employees.map((employee) => ({
      id: employee._id.toString(),
      label: `${employee.fullName} (${employee.email})`,
    })),
  };
}

export async function getDsrPageData(session: AuthenticatedSession): Promise<DsrPageData> {
  await connectDb();

  const today = getTodayDate();

  if (session.user.role === "EMPLOYEE") {
    const [projects, updates] = await Promise.all([
      ProjectModel.find({ _id: { $in: session.user.projectIds } }, { name: 1, summary: 1, status: 1, priority: 1, dueDate: 1 })
        .sort({ createdAt: -1 })
        .lean(),
      DailyUpdateModel.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const projectMap = new Map(projects.map((project) => [project._id.toString(), project.name]));

    return {
      mode: "employee",
      summaryCards: [
        { label: "Assigned Projects", value: String(projects.length), detail: "Projects currently assigned to you." },
        { label: "DSR Today", value: String(updates.filter((update) => update.workDate === today).length), detail: "Reports submitted today." },
        { label: "Total DSR", value: String(updates.length), detail: "Your recorded daily work reports." },
      ],
      projects: projects.map((project) => ({
        id: project._id.toString(),
        name: project.name,
        summary: project.summary,
        status: project.status,
        priority: project.priority,
        dueDate: formatDate(project.dueDate),
      })),
      updates: updates.map((update) => ({
        id: update._id.toString(),
        workDate: update.workDate,
        summary: update.summary,
        accomplishments: update.accomplishments,
        blockers: update.blockers ?? "",
        nextPlan: update.nextPlan ?? "",
        projectId: update.projectId ?? "",
        projectName: update.projectId ? projectMap.get(update.projectId) ?? "General" : "General",
      })),
    };
  }

  const visibleEmployeeIds = await getVisibleUserIdsForSession(session, { employeesOnly: true });
  const scope = visibleEmployeeIds.length ? { $in: visibleEmployeeIds } : { $in: [] as string[] };
  const [updates, users, projects] = await Promise.all([
    DailyUpdateModel.find({ userId: scope }).sort({ createdAt: -1 }).limit(15).lean(),
    UserModel.find({ _id: scope }, { fullName: 1, email: 1, status: 1 }).lean(),
    ProjectModel.find({}, { name: 1 }).lean(),
  ]);

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const projectMap = new Map(projects.map((project) => [project._id.toString(), project.name]));
  const submittedTodayIds = new Set(updates.filter((update) => update.workDate === today).map((update) => update.userId));
  const missingEmployees = users
    .filter((user) => user.status === "ACTIVE" && !submittedTodayIds.has(user._id.toString()))
    .map((user) => ({
      id: user._id.toString(),
      employeeName: user.fullName,
      employeeEmail: user.email,
    }));

  return {
    mode: "review",
    summaryCards: [
      { label: "Submitted Today", value: String(submittedTodayIds.size), detail: "Employees who submitted DSR today." },
      { label: "Missing Today", value: String(missingEmployees.length), detail: "Employees still missing a DSR entry today." },
      { label: "Recent Entries", value: String(updates.length), detail: "Latest DSR rows visible in this review scope." },
    ],
    updates: updates.map((update) => ({
      id: update._id.toString(),
      employeeName: userMap.get(update.userId)?.fullName ?? "Unknown employee",
      employeeEmail: userMap.get(update.userId)?.email ?? "",
      projectName: update.projectId ? projectMap.get(update.projectId) ?? "General" : "General",
      workDate: update.workDate,
      summary: update.summary,
      accomplishments: update.accomplishments,
      blockers: update.blockers ?? "",
      nextPlan: update.nextPlan ?? "",
    })),
    missingEmployees,
  };
}

export async function getReportsPageData(session: AuthenticatedSession): Promise<ReportsPageData> {
  await connectDb();

  const visibleEmployeeIds = await getVisibleUserIdsForSession(session, { employeesOnly: true });
  const userScope =
    session.user.role === "SUPER_ADMIN"
      ? { role: "EMPLOYEE" }
      : { _id: { $in: session.user.role === "EMPLOYEE" ? [session.user.id] : visibleEmployeeIds } };
  const [users, attendance, leaves, tasks] = await Promise.all([
    UserModel.find(userScope, { fullName: 1, email: 1 }).lean(),
    AttendanceModel.find().lean(),
    LeaveRequestModel.find().sort({ createdAt: -1 }).limit(10).lean(),
    TaskModel.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const allowedIds = new Set(users.map((user) => user._id.toString()));
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));
  const attendanceRows = new Map<string, AttendanceMonthlyRow>();

  for (const row of attendance) {
    if (!allowedIds.has(row.userId)) {
      continue;
    }

    const item =
      attendanceRows.get(row.userId) ??
      {
        id: row.userId,
        employeeName: userMap.get(row.userId)?.fullName ?? "Unknown employee",
        daysMarked: 0,
        completedDays: 0,
      };

    item.daysMarked += 1;
    if (row.status === "COMPLETED") {
      item.completedDays += 1;
    }
    attendanceRows.set(row.userId, item);
  }

  const leaveRows = leaves
    .filter((leave) => allowedIds.has(leave.userId))
    .map((leave) => ({
      id: leave._id.toString(),
      employeeName: userMap.get(leave.userId)?.fullName ?? "Unknown employee",
      employeeEmail: userMap.get(leave.userId)?.email ?? "",
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
    }));

  const taskUserIds = Array.from(new Set(tasks.map((task) => task.assignedUserId)));
  const taskUsers = await UserModel.find({ _id: { $in: taskUserIds } }, { fullName: 1 }).lean();
  const taskUserMap = new Map(taskUsers.map((user) => [user._id.toString(), user.fullName]));
  const taskRows = tasks
    .filter((task) => allowedIds.has(task.assignedUserId))
    .map((task) => ({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      assignedUserId: task.assignedUserId,
      assignedUserName: taskUserMap.get(task.assignedUserId) ?? "Unknown employee",
      assignedByName: "",
      dueDate: task.dueDate,
      status: task.status,
    }));

  return {
    summaryCards: [
      { label: "Attendance Report", value: String(attendanceRows.size), detail: "Employees with attendance records in the current scope." },
      { label: "Leave Report", value: String(leaveRows.length), detail: "Leave records included in this report view." },
      { label: "Task Report", value: String(taskRows.length), detail: "Task rows included in this report view." },
    ],
    attendanceRows: Array.from(attendanceRows.values()).sort((left, right) => left.employeeName.localeCompare(right.employeeName)),
    leaveRows,
    taskRows,
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  await connectDb();

  const settings = await SettingModel.findOne({ key: "company" }).lean();

  return {
    companyName: settings?.companyName ?? "Mindaptix CRM",
    workStart: settings?.workStart ?? "09:00",
    workEnd: settings?.workEnd ?? "18:00",
    leavePolicy: settings?.leavePolicy ?? "Paid Leave and Sick Leave are available for approved requests.",
  };
}

async function buildUserMap(userIds: string[]) {
  const users = await UserModel.find({ _id: { $in: userIds } }, { fullName: 1, email: 1 }).lean();
  return new Map(users.map((user) => [user._id.toString(), { fullName: user.fullName, email: user.email }]));
}

async function buildProjectMap(projectIds: string[]) {
  const projects = await ProjectModel.find({ _id: { $in: projectIds } }, { name: 1 }).lean();
  return new Map(projects.map((project) => [project._id.toString(), project.name]));
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Not marked";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not marked";
  }

  return date.toISOString().slice(11, 16);
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}
