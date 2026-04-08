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

export type DashboardNotificationItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  actionUrl: string;
};

export type CalendarEventItem = {
  id: string;
  title: string;
  date: string;
  type: string;
  detail: string;
};

export type PerformanceScoreRow = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  score: number;
  attendanceRate: number;
  taskCompletionRate: number;
  dsrConsistencyRate: number;
};

export type DashboardBreakdownSlice = {
  label: string;
  value: number;
  color: string;
};

export type AttendanceTrendPoint = {
  label: string;
  present: number;
  onLeave: number;
  absent: number;
};

export type LeaveTrendPoint = {
  label: string;
  count: number;
};

export type DsrTrendPoint = {
  label: string;
  submitted: number;
  missing: number;
};

export type EmployeeProjectSummaryRow = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  pendingProjects: number;
  completedProjects: number;
};

export type ExecutiveOverviewSection = {
  id: string;
  badge: string;
  title: string;
  description: string;
  note?: string;
  metrics: SummaryCard[];
  items: DashboardListItem[];
  emptyMessage: string;
};

export type DashboardOverviewData = {
  title: string;
  description: string;
  cards: SummaryCard[];
  priorityAlert?: {
    title: string;
    detail: string;
    actionLabel: string;
    actionUrl: string;
  };
  notificationTitle?: string;
  notifications?: DashboardNotificationItem[];
  weeklySummaryTitle?: string;
  weeklySummaryCards?: SummaryCard[];
  calendarTitle?: string;
  calendarItems?: CalendarEventItem[];
  performanceTitle?: string;
  performanceRows?: PerformanceScoreRow[];
  directoryEmptyMessage?: string;
  directoryItems?: DashboardListItem[];
  directoryTitle?: string;
  primaryListTitle: string;
  primaryEmptyMessage: string;
  primaryItems: DashboardListItem[];
  secondaryListTitle: string;
  secondaryEmptyMessage: string;
  secondaryItems: DashboardListItem[];
  attendanceBreakdown?: DashboardBreakdownSlice[];
  attendanceTrend?: AttendanceTrendPoint[];
  taskStatusBreakdown?: DashboardBreakdownSlice[];
  projectStatusBreakdown?: DashboardBreakdownSlice[];
  leaveTrend?: LeaveTrendPoint[];
  dsrTrend?: DsrTrendPoint[];
  employeeProjectRows?: EmployeeProjectSummaryRow[];
  executiveSections?: ExecutiveOverviewSection[];
  financeNote?: string;
};

export type EmployeeDirectoryEntry = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  joiningDate: string;
  managerId: string;
  managerName: string;
  techStack: string[];
  todayStatus: string;
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

export type SalesLeadEntry = {
  id: string;
  salesUserId: string;
  salesUserName: string;
  salesUserEmail: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  technologies: string[];
  meetingLink: string;
  meetingDate: string;
  meetingTime: string;
  budget: number;
  pitchedPrice: number;
  deliveryDate: string;
  createdAt: string;
};

export type FileAttachmentView = {
  name: string;
  url: string;
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
  attachments: FileAttachmentView[];
};

export type EmployeesPageData = {
  managerOptions: EmployeeOption[];
  salesOptions: EmployeeOption[];
  salesTechnologyOptions: string[];
  summaryCards: SummaryCard[];
  users: EmployeeDirectoryEntry[];
  projects: EmployeeProjectEntry[];
  salesLeadRows: SalesLeadEntry[];
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
  canMarkAttendance: boolean;
  summaryCards: SummaryCard[];
  todayRecord: AttendanceRecordView | null;
  todayRecords: AttendanceRecordView[];
  monthlyRows: AttendanceMonthlyRow[];
};

export type LeaveEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason: string;
  status: string;
};

export type LeaveEmployeeSummary = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  approvedDays: number;
  requestedDays: number;
};

export type LeavePageData = {
  summaryCards: SummaryCard[];
  leaves: LeaveEntry[];
  employeeSummaries: LeaveEmployeeSummary[];
};

export type TaskCommentView = {
  id: string;
  userName: string;
  role: string;
  message: string;
  createdAt: string;
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
  priority: string;
  labels: string[];
  isOverdue: boolean;
  attachments: FileAttachmentView[];
  comments: TaskCommentView[];
};

export type EmployeeOption = {
  id: string;
  label: string;
};

export type TaskPageData = {
  summaryCards: SummaryCard[];
  tasks: TaskEntry[];
  employeeOptions: EmployeeOption[];
  labelOptions: string[];
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
  attachments: FileAttachmentView[];
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
      reminderMessage: string;
    }
  | {
      mode: "review";
      summaryCards: SummaryCard[];
      updates: DsrFeedEntry[];
      missingEmployees: DsrMissingEntry[];
      reminderMessage: string;
    };

export type ReportsPageData = {
  summaryCards: SummaryCard[];
  weeklySummaryCards: SummaryCard[];
  calendarItems: CalendarEventItem[];
  performanceRows: PerformanceScoreRow[];
  attendanceRows: AttendanceMonthlyRow[];
  leaveRows: LeaveEntry[];
  taskRows: TaskEntry[];
  monthLabel: string;
  monthlyEmployeeRows: EmployeeMonthlyReportRow[];
  monthlyEmployeeReports: EmployeeMonthlyDetailReport[];
};

export type EmployeeMonthlyReportRow = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  attendanceDays: number;
  completedAttendanceDays: number;
  leaveDays: number;
  leaveRequests: number;
  taskCount: number;
  completedTaskCount: number;
  taskTitles: string[];
};

export type EmployeeMonthlyDailyStatus = {
  date: string;
  attendanceStatus: string;
  checkInAt: string;
  checkOutAt: string;
  projectNames: string[];
  dsrSummary: string;
};

export type EmployeeMonthlyDsrReportRow = {
  id: string;
  workDate: string;
  projectName: string;
  summary: string;
  accomplishments: string;
  blockers: string;
  nextPlan: string;
};

export type EmployeeMonthlyTaskReportRow = {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
};

export type EmployeeMonthlyDetailReport = {
  id: string;
  employeeName: string;
  employeeEmail: string;
  attendanceDays: number;
  completedAttendanceDays: number;
  leaveDays: number;
  leaveRequests: number;
  taskCount: number;
  completedTaskCount: number;
  dailyRows: EmployeeMonthlyDailyStatus[];
  dsrRows: EmployeeMonthlyDsrReportRow[];
  taskRows: EmployeeMonthlyTaskReportRow[];
};

export type SettingsPageData = {
  canManageCompany: boolean;
  companyName: string;
  currentUserEmail: string;
  currentUserName: string;
  currentUserRoleLabel: string;
  workStart: string;
  workEnd: string;
  leavePolicy: string;
};
