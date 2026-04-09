"use client";

import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import { assignProjectToUser, createManagedProject, updateManagedProject } from "@/features/dashboard/actions/projects";
import { createSalesLead, type SalesLeadFormState } from "@/features/dashboard/actions/sales-leads";
import { createManagedUser } from "@/features/dashboard/actions/users";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import { INITIAL_USER_MANAGEMENT_STATE } from "@/features/auth/lib/user-management-form-state";
import type {
  DsrFeedEntry,
  EmployeeDirectoryEntry,
  EmployeeOption,
  EmployeeProjectEntry,
  SalesLeadEntry,
  SummaryCard,
} from "@/features/dashboard/types";
import type { ProjectPriority, ProjectStatus } from "@/database/mongodb/models/project";

type EmployeesManagementPanelProps = {
  managerOptions: EmployeeOption[];
  projects: EmployeeProjectEntry[];
  readOnly?: boolean;
  recentUpdates: DsrFeedEntry[];
  salesLeadRows: SalesLeadEntry[];
  salesOnly?: boolean;
  salesOptions: EmployeeOption[];
  salesTechnologyOptions: string[];
  summaryCards: SummaryCard[];
  users: EmployeeDirectoryEntry[];
};

type ProjectFormState = {
  error?: string;
  success?: string;
  values?: {
    assignedUserIds?: string[];
    id?: string;
    name?: string;
    summary?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    dueDate?: string;
  };
};

const INITIAL_PROJECT_STATE: ProjectFormState = {};
const INITIAL_SALES_LEAD_STATE: SalesLeadFormState = {};

export function EmployeesManagementPanel({
  managerOptions,
  projects,
  readOnly = false,
  recentUpdates,
  salesLeadRows,
  salesOnly = false,
  salesOptions,
  salesTechnologyOptions,
  summaryCards,
  users,
}: EmployeesManagementPanelProps) {
  const [userState, createUserAction, userPending] = useActionState(createManagedUser, INITIAL_USER_MANAGEMENT_STATE);
  const [projectState, createProjectAction, projectPending] = useActionState(createManagedProject, INITIAL_PROJECT_STATE);
  const [updateProjectState, updateProjectAction, updateProjectPending] = useActionState(updateManagedProject, INITIAL_PROJECT_STATE);
  const [salesLeadState, createSalesLeadAction, salesLeadPending] = useActionState(createSalesLead, INITIAL_SALES_LEAD_STATE);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "");

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const projectEmployeeOptions = users.filter((user) => user.role === "EMPLOYEE" && user.status === "ACTIVE");
  const salesLabelById = Object.fromEntries(salesOptions.map((salesUser) => [salesUser.id, salesUser.label]));
  const totalTrackedBudget = salesLeadRows.reduce((sum, row) => sum + row.budget, 0);
  const totalPitchedValue = salesLeadRows.reduce((sum, row) => sum + row.pitchedPrice, 0);
  const todayMeetingCount = salesLeadRows.filter((row) => row.meetingDate === getTodayDate()).length;
  const techSummary = buildTechSummary(users);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [user.fullName, user.email, user.phone, user.managerName, user.role, user.status, user.todayStatus, ...(user.techStack ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [roleFilter, searchTerm, users]);

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null;
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;
  const canManageWorkspace = !readOnly && !salesOnly;
  const shouldShowDirectory = !salesOnly;
  const shouldShowSalesTracker = canManageWorkspace || salesOnly;
  const shouldShowRecentDsr = canManageWorkspace;

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      {canManageWorkspace ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <PanelSection
            description="Add employee, admin, or sales accounts with phone, joining date, reporting admin, and a basic onboarding document."
            eyebrow="Employee Management"
            title="Create Team Account"
          >
            <form action={createUserAction} autoComplete="off" className="mt-6 space-y-4">
              <input autoComplete="username" className="hidden" name="fakeUsername" tabIndex={-1} type="text" />
              <input autoComplete="new-password" className="hidden" name="fakePassword" tabIndex={-1} type="password" />

              {userState.error ? <Feedback>{userState.error}</Feedback> : null}
              {userState.success ? <Feedback tone="success">{userState.success}</Feedback> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={userState.values?.fullName} label="Full Name" name="fullName" placeholder="Enter full name" />
                <Field
                  autoComplete="off"
                  defaultValue={userState.values?.email}
                  label="Email Address"
                  name="email"
                  placeholder="Enter email"
                  type="email"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={userState.values?.phone} label="Phone" name="phone" placeholder="Enter phone number" />
                <Field
                  defaultValue={userState.values?.joiningDate}
                  fallbackTodayForDate
                  label="Joining Date"
                  name="joiningDate"
                  placeholder="Select joining date"
                  type="date"
                />
              </div>

              <Field autoComplete="new-password" label="Temporary Password" name="password" placeholder="Create a strong password" type="password" />

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  defaultValue={userState.values?.role ?? "EMPLOYEE"}
                  label="Role"
                  labels={{ EMPLOYEE: "Employee", MANAGER: "Admin", SALES: "Sales" }}
                  name="role"
                  options={["EMPLOYEE", "MANAGER", "SALES"]}
                />
                <SelectField
                  defaultValue={userState.values?.status ?? "ACTIVE"}
                  label="Status"
                  name="status"
                  options={["ACTIVE", "SUSPENDED"]}
                />
              </div>

              <SelectField
                defaultValue={userState.values?.managerId ?? ""}
                includePlaceholder
                label="Reporting Admin"
                labels={Object.fromEntries(managerOptions.map((manager) => [manager.id, manager.label]))}
                name="managerId"
                options={managerOptions.map((manager) => manager.id)}
                placeholder="No admin"
              />

              <MultiSelectField
                defaultValue={userState.values?.techStack ?? []}
                helperText="Optional: employee ya sales account ka primary tech focus select karo."
                label="Tech Focus"
                name="techStack"
                options={salesTechnologyOptions}
                required={false}
              />

              <FileField label="Document Upload" name="document" />

              <Button className="mt-2 min-w-44 sm:w-auto" disabled={userPending} type="submit">
                {userPending ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </PanelSection>

          <PanelSection
            description="Create project, fill delivery information, and assign one or more employees from the same form."
            eyebrow="Project Assignment"
            title="Create Project"
          >
            <form action={createProjectAction} className="mt-6 space-y-4">
              {projectState.error ? <Feedback>{projectState.error}</Feedback> : null}
              {projectState.success ? <Feedback tone="success">{projectState.success}</Feedback> : null}

              <Field defaultValue={projectState.values?.name} label="Project Name" name="name" placeholder="Enter project name" />
              <TextAreaField
                defaultValue={projectState.values?.summary}
                label="Project Summary"
                name="summary"
                placeholder="Write a short project summary"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  defaultValue={projectState.values?.status ?? "PLANNING"}
                  label="Status"
                  labels={{
                    PLANNING: "Planning",
                    IN_PROGRESS: "In Progress",
                    ON_HOLD: "On Hold",
                    COMPLETED: "Completed",
                  }}
                  name="status"
                  options={["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]}
                />
                <SelectField
                  defaultValue={projectState.values?.priority ?? "MEDIUM"}
                  label="Priority"
                  labels={{ LOW: "Low", MEDIUM: "Medium", HIGH: "High" }}
                  name="priority"
                  options={["LOW", "MEDIUM", "HIGH"]}
                />
                <Field
                  defaultValue={projectState.values?.dueDate}
                  fallbackTodayForDate
                  label="Due Date"
                  name="dueDate"
                  placeholder="Select due date"
                  type="date"
                />
              </div>

              <MultiSelectField
                defaultValue={projectState.values?.assignedUserIds ?? []}
                helperText="Ek ya multiple employees select karo. Create hote hi unke dashboard aur DSR view me project visible ho jayega."
                label="Assign Employees"
                name="assignedUserIds"
                options={projectEmployeeOptions.map((user) => user.id)}
                optionLabels={Object.fromEntries(projectEmployeeOptions.map((user) => [user.id, `${user.fullName} (${user.email})`]))}
                required={false}
              />

              <Button className="mt-2 min-w-44 sm:w-auto" disabled={projectPending} type="submit">
                {projectPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </PanelSection>
        </section>
      ) : null}

      {canManageWorkspace ? (
        <PanelSection
          description="Every created project stays here with assigned employees, delivery date, and quick edit access."
          eyebrow="Project Register"
          title="Manage Projects"
        >
          <div className="mt-6 space-y-6">
            <DashboardTable
              columns={[
                { label: "Project", className: "min-w-[220px]" },
                { label: "Employees", className: "min-w-[220px]" },
                { label: "Status", className: "min-w-[120px]" },
                { label: "Priority", className: "min-w-[110px]" },
                { label: "Due Date", className: "min-w-[120px]" },
                { label: "Action", className: "min-w-[110px]" },
              ]}
              emptyMessage="Projects will appear here after the first project is created."
              hasRows={projects.length > 0}
              hideScrollbar
            >
              {projects.map((project) => (
                <tr className={selectedProject?.id === project.id ? "bg-blue-50/50" : ""} key={project.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{project.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{project.summary}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <div className="flex flex-wrap gap-2">
                      {project.assignedUserNames.length ? (
                        project.assignedUserNames.map((employeeName) => (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" key={`${project.id}-${employeeName}`}>
                            {employeeName}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">No employee</span>
                      )}
                    </div>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {formatLabel(project.status)}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {formatLabel(project.priority)}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell>{project.dueDate || "Not set"}</DashboardTableCell>
                  <DashboardTableCell>
                    <Button className="sm:w-auto" onClick={() => setSelectedProjectId(project.id)} type="button">
                      Edit
                    </Button>
                  </DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>

            {selectedProject ? (
              <section className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-500">Project Editor</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{selectedProject.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">Project ko update karo, employee add/remove karo, aur delivery information edit karo.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {formatLabel(selectedProject.status)}
                    </span>
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                      {formatLabel(selectedProject.priority)}
                    </span>
                  </div>
                </div>

                <form action={updateProjectAction} className="mt-6 space-y-4">
                  {updateProjectState.error ? <Feedback>{updateProjectState.error}</Feedback> : null}
                  {updateProjectState.success ? <Feedback tone="success">{updateProjectState.success}</Feedback> : null}

                  <input name="projectId" type="hidden" value={selectedProject.id} />

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px]">
                    <Field defaultValue={selectedProject.name} label="Project Name" name="name" placeholder="Enter project name" />
                    <Field
                      defaultValue={selectedProject.dueDate}
                      fallbackTodayForDate
                      label="Due Date"
                      name="dueDate"
                      placeholder="Select due date"
                      type="date"
                    />
                  </div>

                  <TextAreaField defaultValue={selectedProject.summary} label="Project Summary" name="summary" placeholder="Write a short project summary" />

                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      defaultValue={selectedProject.status}
                      label="Status"
                      labels={{ PLANNING: "Planning", IN_PROGRESS: "In Progress", ON_HOLD: "On Hold", COMPLETED: "Completed" }}
                      name="status"
                      options={["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]}
                    />
                    <SelectField
                      defaultValue={selectedProject.priority}
                      label="Priority"
                      labels={{ LOW: "Low", MEDIUM: "Medium", HIGH: "High" }}
                      name="priority"
                      options={["LOW", "MEDIUM", "HIGH"]}
                    />
                  </div>

                  <MultiSelectField
                    defaultValue={selectedProject.assignedUserIds}
                    helperText="Selected employees ko project notification milegi aur project unke dashboard/DSR me visible rahega."
                    label="Assigned Employees"
                    name="assignedUserIds"
                    options={projectEmployeeOptions.map((user) => user.id)}
                    optionLabels={Object.fromEntries(projectEmployeeOptions.map((user) => [user.id, `${user.fullName} (${user.email})`]))}
                    required={false}
                  />

                  <Button className="min-w-44 sm:w-auto" disabled={updateProjectPending} type="submit">
                    {updateProjectPending ? "Saving..." : "Update Project"}
                  </Button>
                </form>
              </section>
            ) : null}
          </div>
        </PanelSection>
      ) : null}

      {shouldShowDirectory ? (
      <PanelSection
        description={
          readOnly
            ? ""
            : "Select one employee from the list, then review name, email, role, status, reporting admin, and projects from a single editor."
        }
        eyebrow={readOnly ? "Workforce Overview" : "Directory"}
        hideHeader={readOnly}
        title={readOnly ? "Company Workforce" : "Employee Directory"}
      >
        {readOnly ? (
          <div className="space-y-5">
            <section className="rounded-[1.7rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(255,255,255,0.96))] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">Tech Coverage</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Employee Tech Mapping</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {techSummary.length} tech tag(s)
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {techSummary.length ? (
                  techSummary.map((item) => (
                    <div className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)]" key={item.label}>
                      <span className="text-blue-700">{item.label}</span> <span className="text-slate-400">({item.count})</span>
                    </div>
                  ))
                ) : (
                  null
                )}
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-500">Search And Filter</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                      {filteredUsers.length} result(s)
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {roleFilter === "ALL" ? "All Roles" : roleLabel(roleFilter as EmployeeDirectoryEntry["role"])}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.55fr)] xl:items-end">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Find by name, email, phone, admin, tech, or status</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]"
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search workforce records"
                      value={searchTerm}
                    />
                  </label>

                  <div>
                    <SelectField
                      defaultValue="ALL"
                      label="Choose role scope"
                      labels={{ ALL: "All Roles", EMPLOYEE: "Employee", MANAGER: "Admin", SALES: "Sales" }}
                      name="directoryRoleFilter"
                      onChangeValue={setRoleFilter}
                      options={["ALL", "EMPLOYEE", "MANAGER", "SALES"]}
                    />
                  </div>
                </div>
              </div>
            </section>

            <DashboardTable
              columns={[
                { label: "Employee", className: "min-w-[180px]" },
                { label: "Role", className: "min-w-[110px]" },
                { label: "Tech Focus", className: "min-w-[220px]" },
                { label: "Manager", className: "min-w-[160px]" },
                { label: "Today", className: "min-w-[120px]" },
                { label: "Contact", className: "min-w-[220px]" },
              ]}
              emptyMessage="No employees match the current search or filter."
              hasRows={filteredUsers.length > 0}
              hideScrollbar
            >
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.joiningDate ? `Joined ${user.joiningDate}` : "Joining date not added"}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                      {roleLabel(user.role)}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.techStack.length ? (
                        user.techStack.map((tech) => (
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" key={`${user.id}-${tech}`}>
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">Not set</span>
                      )}
                    </div>
                  </DashboardTableCell>
                  <DashboardTableCell>{user.managerName || "No admin"}</DashboardTableCell>
                  <DashboardTableCell>
                    <span className={getTodayStatusClassName(user.todayStatus)}>{user.todayStatus}</span>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <p className="text-sm text-slate-900">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.phone || "Phone not added"}</p>
                  </DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.55fr)]">
              <div className="rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.96))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-500">Search</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Search Employees</h3>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    {filteredUsers.length} result(s)
                  </span>
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Find by name, email, phone, admin, tech, or status</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search workforce records"
                    value={searchTerm}
                  />
                </label>
              </div>

              <div className="rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-500">Filter</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Role Filter</h3>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {roleFilter === "ALL" ? "All Roles" : roleLabel(roleFilter as EmployeeDirectoryEntry["role"])}
                  </span>
                </div>
                <div className="mt-4">
                  <SelectField
                    defaultValue="ALL"
                    label="Choose role scope"
                    labels={{ ALL: "All Roles", EMPLOYEE: "Employee", MANAGER: "Admin", SALES: "Sales" }}
                    name="directoryRoleFilter"
                    onChangeValue={setRoleFilter}
                    options={["ALL", "EMPLOYEE", "MANAGER", "SALES"]}
                  />
                </div>
              </div>
            </div>

            <DashboardTable
              columns={[
                { label: "Employee" },
                { label: "Role" },
                { label: "Status" },
                { label: "Admin" },
                { label: "Projects" },
                { label: "Action" },
              ]}
              emptyMessage="No employees match the current search or filter."
              hasRows={filteredUsers.length > 0}
            >
              {filteredUsers.map((user) => (
                <tr className={selectedUser?.id === user.id ? "bg-blue-50/50" : ""} key={user.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{user.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>{roleLabel(user.role)}</DashboardTableCell>
                  <DashboardTableCell>{user.status}</DashboardTableCell>
                  <DashboardTableCell>{user.managerName || "No admin"}</DashboardTableCell>
                  <DashboardTableCell>
                    {user.projectIds.length ? user.projectIds.map((projectId) => projectNameById.get(projectId) ?? "Assigned Project").join(", ") : "No project assigned"}
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <Button className="sm:w-auto" onClick={() => setSelectedUserId(user.id)} type="button">
                      Edit
                    </Button>
                  </DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>

            {selectedUser ? (
              <section className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-5" key={selectedUser.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {roleLabel(selectedUser.role)}
                  </span>
                  {selectedUser.documentUrl ? (
                    <a
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
                      href={selectedUser.documentUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {selectedUser.documentName || "Open Document"}
                    </a>
                  ) : null}
                </div>

                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Review Account for {selectedUser.fullName}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedUser.role === "EMPLOYEE"
                    ? "Employee selected hai. Neeche se project assign kar sakte ho."
                    : selectedUser.role === "SALES"
                      ? "Sales account selected hai. Is user ke client records neeche sales table me visible rahenge."
                      : "Admin account details yahan quick review ke liye dikh rahe hain."}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ReadOnlyField label="Employee Name" value={selectedUser.fullName} />
                  <ReadOnlyField label="Email" value={selectedUser.email} />
                  <ReadOnlyField
                    label={selectedUser.role === "MANAGER" ? "Access Scope" : "Reporting Admin"}
                    value={selectedUser.role === "MANAGER" ? "Company Operations" : selectedUser.managerName || "Not assigned"}
                  />
                  <ReadOnlyField label="Tech Focus" value={selectedUser.techStack.length ? selectedUser.techStack.join(", ") : "Not set"} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedUser.projectIds.length ? (
                    selectedUser.projectIds.map((projectId) => (
                      <span
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        key={projectId}
                      >
                        {projectNameById.get(projectId) ?? "Assigned Project"}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      No project assigned
                    </span>
                  )}
                </div>

                {selectedUser.role === "EMPLOYEE" && projects.length ? (
                  <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white p-4">
                    <form action={assignProjectToUser} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_120px]">
                      <input name="userId" type="hidden" value={selectedUser.id} />
                      <SelectField
                        defaultValue=""
                        includePlaceholder
                        label="Assign Project"
                        labels={Object.fromEntries(projects.map((project) => [project.id, project.name]))}
                        name="projectId"
                        options={projects.map((project) => project.id)}
                        required
                      />
                      <div className="flex items-end">
                        <Button className="sm:w-auto" type="submit">
                          Assign
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : null}

              </section>
            ) : null}
          </div>
        )}
      </PanelSection>
      ) : null}

      {shouldShowSalesTracker ? (
        <PanelSection
        description={
          salesOnly
            ? "Your sales login ke client records yahan visible hain. Sirf aapke assigned leads aur meeting commitments dikh rahe hain."
            : "Desktop-friendly sales CRM register for client contact details, technology scope, meeting planning, commercial discussion, and expected delivery date."
        }
        eyebrow={salesOnly ? "My Leads" : "Sales Pipeline"}
        title={salesOnly ? "My Client Pitch Tracker" : "Client Pitch Tracker"}
      >
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard detail="Client records currently tracked for the sales team." label="Tracked Clients" value={String(salesLeadRows.length)} />
          <OverviewCard detail="Sales meetings scheduled for today." label="Meetings Today" value={String(todayMeetingCount)} />
          <OverviewCard detail="Total client budget captured across all records." label="Client Budget" value={formatCurrency(totalTrackedBudget)} />
          <OverviewCard detail="Total value already pitched by the team." label="Quoted Value" value={formatCurrency(totalPitchedValue)} />
        </div>

        {canManageWorkspace ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <section className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">New Client Entry</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Add Sales Record</h3>
                </div>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Desktop Ready
                </span>
              </div>

              <form action={createSalesLeadAction} className="mt-6 space-y-4">
                {salesLeadState.error ? <Feedback>{salesLeadState.error}</Feedback> : null}
                {salesLeadState.success ? <Feedback tone="success">{salesLeadState.success}</Feedback> : null}

                <SelectField
                  defaultValue={salesLeadState.values?.salesUserId ?? ""}
                  includePlaceholder
                  label="Sales Employee"
                  labels={salesLabelById}
                  name="salesUserId"
                  options={salesOptions.map((salesUser) => salesUser.id)}
                  placeholder={salesOptions.length ? "Select sales employee" : "No sales employee available"}
                  required
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field defaultValue={salesLeadState.values?.clientName} label="Client Name" name="clientName" placeholder="Enter client name" />
                  <Field defaultValue={salesLeadState.values?.clientPhone} label="Client Mobile" name="clientPhone" placeholder="Enter client mobile number" />
                </div>

                <Field
                  autoComplete="off"
                  defaultValue={salesLeadState.values?.clientEmail}
                  label="Client Email"
                  name="clientEmail"
                  placeholder="Enter client email"
                  type="email"
                />

                <MultiSelectField
                  defaultValue={salesLeadState.values?.technologies ?? []}
                  helperText="Ctrl/Cmd daba ke multiple technologies select karo."
                  label="Tech Stack"
                  name="technologies"
                  options={salesTechnologyOptions}
                />

                <Field defaultValue={salesLeadState.values?.meetingLink} label="Meeting Link" name="meetingLink" placeholder="https://meet.google.com/..." />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field
                    defaultValue={salesLeadState.values?.meetingDate}
                    fallbackTodayForDate
                    label="Meeting Date"
                    name="meetingDate"
                    placeholder="Select meeting date"
                    type="date"
                  />
                  <Field defaultValue={salesLeadState.values?.meetingTime} label="Meeting Time" name="meetingTime" placeholder="10:30 AM" type="time" />
                  <Field
                    defaultValue={salesLeadState.values?.deliveryDate}
                    fallbackTodayForDate
                    label="Delivery Date"
                    name="deliveryDate"
                    placeholder="Select delivery date"
                    type="date"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field defaultValue={salesLeadState.values?.budget} label="Client Budget" name="budget" placeholder="Enter client budget" type="number" />
                  <Field
                    defaultValue={salesLeadState.values?.pitchedPrice}
                    label="Pitched Price"
                    name="pitchedPrice"
                    placeholder="Enter quoted price"
                    type="number"
                  />
                </div>

                <Button className="mt-2 min-w-44 sm:w-auto" disabled={salesLeadPending || salesOptions.length === 0} type="submit">
                  {salesLeadPending ? "Saving..." : "Save Sales Record"}
                </Button>
              </form>
            </section>

            <section className="rounded-[1.7rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.96))] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Sales Team"
                  value={String(salesOptions.length)}
                  tone="blue"
                  detail="Active sales employees available for new client conversations."
                />
                <MetricCard
                  label="Meeting Pipeline"
                  value={String(salesLeadRows.filter((row) => row.meetingDate).length)}
                  tone="amber"
                  detail="Rows where meeting date has already been planned."
                />
                <MetricCard
                  label="Budget Gap"
                  value={formatCurrency(Math.max(totalPitchedValue - totalTrackedBudget, 0))}
                  tone="emerald"
                  detail="Value currently pitched above the captured client budgets."
                />
                <MetricCard
                  label="Upcoming Deliveries"
                  value={String(salesLeadRows.filter((row) => row.deliveryDate >= getTodayDate()).length)}
                  tone="violet"
                  detail="Client records with planned delivery dates still ahead."
                />
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Pipeline Note</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">Commercial and delivery commitments in one place.</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {salesLeadRows.length ? `${salesLeadRows.length} row(s)` : "No rows yet"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Client name, meeting plan, quoted price, and delivery promise ek hi desktop table me rahega, taaki sales aur admin dono fast review kar saken.
                </p>
              </div>
            </section>
          </div>
        ) : null}

        <div className="mt-6">
          <DashboardTable
            columns={[
              { label: "Sales Rep", className: "min-w-[180px]" },
              { label: "Client", className: "min-w-[210px]" },
              { label: "Tech Scope", className: "min-w-[220px]" },
              { label: "Meeting", className: "min-w-[230px]" },
              { label: "Budget", className: "min-w-[110px]" },
              { label: "Pitch", className: "min-w-[110px]" },
              { label: "Delivery", className: "min-w-[120px]" },
            ]}
            emptyMessage="Sales client records will appear here after the first pitch entry is created."
            hasRows={salesLeadRows.length > 0}
            hideScrollbar
          >
            {salesLeadRows.map((row) => (
              <tr key={row.id}>
                <DashboardTableCell>
                  <p className="font-semibold text-slate-950">{row.salesUserName}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.salesUserEmail || "Sales email not added"}</p>
                </DashboardTableCell>
                <DashboardTableCell>
                  <p className="font-semibold text-slate-950">{row.clientName}</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <p>{row.clientPhone || "Phone not added"}</p>
                    <p>{row.clientEmail || "Email not added"}</p>
                  </div>
                </DashboardTableCell>
                <DashboardTableCell>
                  <div className="flex flex-wrap gap-2">
                    {row.technologies.map((technology) => (
                      <span
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-blue-700"
                        key={`${row.id}-${technology}`}
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                </DashboardTableCell>
                <DashboardTableCell>
                  <div className="space-y-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {row.meetingDate || "Date pending"} {row.meetingTime ? `• ${row.meetingTime}` : ""}
                      </p>
                      {row.meetingLink ? (
                        <a className="mt-2 inline-flex text-sm font-semibold text-blue-700 underline-offset-4 hover:underline" href={row.meetingLink} rel="noreferrer" target="_blank">
                          Open meeting link
                        </a>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">Meeting link not added</p>
                      )}
                    </div>
                  </div>
                </DashboardTableCell>
                <DashboardTableCell>
                  <p className="font-semibold text-slate-950">{formatCurrency(row.budget)}</p>
                  <p className="mt-1 text-xs text-slate-500">Client budget</p>
                </DashboardTableCell>
                <DashboardTableCell>
                  <p className="font-semibold text-slate-950">{formatCurrency(row.pitchedPrice)}</p>
                  <p className="mt-1 text-xs text-slate-500">Quoted by team</p>
                </DashboardTableCell>
                <DashboardTableCell>
                  <p className="font-semibold text-slate-950">{row.deliveryDate || "Not fixed"}</p>
                  <p className="mt-1 text-xs text-slate-500">Planned handover</p>
                </DashboardTableCell>
              </tr>
            ))}
          </DashboardTable>
        </div>
      </PanelSection>
        ) : null}

      {shouldShowRecentDsr ? (
      <PanelSection
        description={
          readOnly
            ? "Latest DSR feed from employees visible in your team scope."
            : "Latest employee DSR feed for quick admin review without leaving employee management."
        }
        eyebrow="Recent DSR"
        title="Daily Status Reports"
      >
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {recentUpdates.length ? (
            recentUpdates.map((update) => (
              <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5" key={update.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {update.employeeName}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {update.projectName}
                  </span>
                </div>
                <p className="mt-3 text-base font-semibold text-slate-950">{update.summary}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {update.workDate} - {update.employeeEmail}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{update.accomplishments}</p>
                {update.blockers ? <p className="mt-3 text-sm text-amber-700">Blockers: {update.blockers}</p> : null}
                {update.nextPlan ? <p className="mt-2 text-sm text-slate-500">Next: {update.nextPlan}</p> : null}
              </article>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500 xl:col-span-2">
              DSR entries will appear here after employees start submitting daily work reports.
            </div>
          )}
        </div>
      </PanelSection>
      ) : null}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function OverviewCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-[1.6rem] border border-slate-100 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}

function MetricCard({
  detail,
  label,
  tone,
  value,
}: {
  detail: string;
  label: string;
  tone: "amber" | "blue" | "emerald" | "violet";
  value: string;
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-100 bg-amber-50/80 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50/80 text-emerald-700"
        : tone === "violet"
          ? "border-violet-100 bg-violet-50/80 text-violet-700"
          : "border-blue-100 bg-blue-50/80 text-blue-700";

  return (
    <article className={`rounded-[1.5rem] border px-4 py-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)] ${toneClassName}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function PanelSection({
  children,
  description,
  eyebrow,
  hideHeader = false,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  hideHeader?: boolean;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      {!hideHeader ? (
        <>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
        </>
      ) : null}
      {children}
    </section>
  );
}

type FieldProps = {
  autoComplete?: string;
  defaultValue?: string;
  fallbackTodayForDate?: boolean;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

function Field({ autoComplete, defaultValue, fallbackTodayForDate = false, label, name, placeholder, type = "text" }: FieldProps) {
  const resolvedDefaultValue = type === "date" && fallbackTodayForDate ? (defaultValue || getTodayDate()) : defaultValue;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ${
          type === "date" ? "[color-scheme:light]" : ""
        }`}
        autoComplete={autoComplete}
        defaultValue={resolvedDefaultValue}
        name={name}
        placeholder={placeholder}
        required={type !== "date" || name !== "joiningDate"}
        type={type}
      />
    </label>
  );
}

function TextAreaField({ defaultValue, label, name, placeholder }: Omit<FieldProps, "type" | "fallbackTodayForDate">) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function FileField({ label, name }: { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700"
        name={name}
        type="file"
      />
    </label>
  );
}

function SelectField({
  defaultValue,
  includePlaceholder = false,
  label,
  labels,
  name,
  onChangeValue,
  options,
  placeholder = "Select option",
  required = false,
}: {
  defaultValue: string;
  includePlaceholder?: boolean;
  label: string;
  labels?: Record<string, string>;
  name: string;
  onChangeValue?: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        defaultValue={defaultValue}
        name={name}
        onChange={(event) => onChangeValue?.(event.target.value)}
        required={required}
      >
        {includePlaceholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectField({
  defaultValue,
  helperText,
  label,
  name,
  optionLabels,
  options,
  required = true,
}: {
  defaultValue: string[];
  helperText?: string;
  label: string;
  name: string;
  optionLabels?: Record<string, string>;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        defaultValue={defaultValue}
        multiple
        name={name}
        required={required}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
      {helperText ? <span className="mt-2 block text-xs text-slate-500">{helperText}</span> : null}
    </label>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildTechSummary(users: EmployeeDirectoryEntry[]) {
  const countMap = new Map<string, number>();

  for (const user of users) {
    for (const tech of user.techStack) {
      countMap.set(tech, (countMap.get(tech) ?? 0) + 1);
    }
  }

  return Array.from(countMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function getTodayStatusClassName(status: string) {
  if (status === "Present") {
    return "rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700";
  }

  if (status === "On Leave") {
    return "rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700";
  }

  if (status === "Not Marked") {
    return "rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700";
  }

  return "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleLabel(role: EmployeeDirectoryEntry["role"]) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "MANAGER":
      return "Admin";
    case "EMPLOYEE":
      return "Employee";
    case "SALES":
      return "Sales";
  }
}





