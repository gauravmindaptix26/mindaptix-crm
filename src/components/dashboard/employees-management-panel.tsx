"use client";

import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import { assignProjectToUser, createManagedProject } from "@/actions/project-management";
import { createManagedUser } from "@/actions/user-management";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { DashboardTable, DashboardTableCell } from "@/components/ui/dashboard-table";
import { INITIAL_USER_MANAGEMENT_STATE } from "@/lib/auth/user-management-form-state";
import type {
  DsrFeedEntry,
  EmployeeDirectoryEntry,
  EmployeeOption,
  EmployeeProjectEntry,
  SummaryCard,
} from "@/lib/dashboard/dashboard-data";
import type { ProjectPriority, ProjectStatus } from "@/lib/models/project";

type EmployeesManagementPanelProps = {
  managerOptions: EmployeeOption[];
  projects: EmployeeProjectEntry[];
  readOnly?: boolean;
  recentUpdates: DsrFeedEntry[];
  summaryCards: SummaryCard[];
  users: EmployeeDirectoryEntry[];
};

type ProjectFormState = {
  error?: string;
  success?: string;
  values?: {
    name?: string;
    summary?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    dueDate?: string;
  };
};

const INITIAL_PROJECT_STATE: ProjectFormState = {};

export function EmployeesManagementPanel({
  managerOptions,
  projects,
  readOnly = false,
  recentUpdates,
  summaryCards,
  users,
}: EmployeesManagementPanelProps) {
  const [userState, createUserAction, userPending] = useActionState(createManagedUser, INITIAL_USER_MANAGEMENT_STATE);
  const [projectState, createProjectAction, projectPending] = useActionState(createManagedProject, INITIAL_PROJECT_STATE);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");

  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [user.fullName, user.email, user.phone, user.managerName, user.role, user.status].join(" ").toLowerCase().includes(query);
    });
  }, [roleFilter, searchTerm, users]);

  const selectedUser = filteredUsers.find((user) => user.id === selectedUserId) ?? filteredUsers[0] ?? null;

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      {!readOnly ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <PanelSection
            description="Add employee, manager, or admin accounts with phone, joining date, and a basic onboarding document."
            eyebrow="Employee Management"
            title="Create New Employee"
          >
            <form action={createUserAction} autoComplete="off" className="mt-6 space-y-4">
              <input autoComplete="username" className="hidden" name="fakeUsername" tabIndex={-1} type="text" />
              <input autoComplete="new-password" className="hidden" name="fakePassword" tabIndex={-1} type="password" />

              {userState.error ? <AuthFeedback>{userState.error}</AuthFeedback> : null}
              {userState.success ? <AuthFeedback tone="success">{userState.success}</AuthFeedback> : null}

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
                  labels={{ EMPLOYEE: "Employee", MANAGER: "Manager", SUPER_ADMIN: "Admin" }}
                  name="role"
                  options={["EMPLOYEE", "MANAGER", "SUPER_ADMIN"]}
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
                label="Reporting Manager"
                labels={Object.fromEntries(managerOptions.map((manager) => [manager.id, manager.label]))}
                name="managerId"
                options={managerOptions.map((manager) => manager.id)}
                placeholder="No manager"
              />

              <FileField label="Document Upload" name="document" />

              <Button className="mt-2 min-w-44 sm:w-auto" disabled={userPending} type="submit">
                {userPending ? "Creating..." : "Create Employee"}
              </Button>
            </form>
          </PanelSection>

          <PanelSection
            description="Create projects once and assign them to employee accounts so DSR and execution stay structured."
            eyebrow="Project Assignment"
            title="Create Project"
          >
            <form action={createProjectAction} className="mt-6 space-y-4">
              {projectState.error ? <AuthFeedback>{projectState.error}</AuthFeedback> : null}
              {projectState.success ? <AuthFeedback tone="success">{projectState.success}</AuthFeedback> : null}

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

              <Button className="mt-2 min-w-44 sm:w-auto" disabled={projectPending} type="submit">
                {projectPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </PanelSection>
        </section>
      ) : null}

      <PanelSection
        description={
          readOnly
            ? "View the employees currently visible in your team scope along with their assigned projects and status."
            : "Select one employee from the list, then update name, email, role, status, manager, and projects from a single editor."
        }
        eyebrow="Directory"
        title={readOnly ? "Team Employees" : "Employee Directory"}
      >
        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Search Employees</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, phone, or manager"
              value={searchTerm}
            />
          </label>
          <SelectField
            defaultValue="ALL"
            label="Role Filter"
            labels={{ ALL: "All Roles", EMPLOYEE: "Employee", MANAGER: "Manager" }}
            name="directoryRoleFilter"
            onChangeValue={setRoleFilter}
            options={["ALL", "EMPLOYEE", "MANAGER"]}
          />
        </div>

        {readOnly ? (
          <div className="mt-6 space-y-5">
            {filteredUsers.map((user) => (
              <article className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-5" key={user.id}>
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {roleLabel(user.role)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {user.status}
                    </span>
                    {user.documentUrl ? (
                      <a
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
                        href={user.documentUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {user.documentName || "Open Document"}
                      </a>
                    ) : null}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-4">
                    <ReadOnlyField label="Full Name" value={user.fullName} />
                    <ReadOnlyField label="Email" value={user.email} />
                    <ReadOnlyField label="Phone" value={user.phone || "Not added"} />
                    <ReadOnlyField label="Joining Date" value={user.joiningDate || "Not added"} />
                  </div>

                  {user.role === "EMPLOYEE" ? (
                    <ReadOnlyField label="Reporting Manager" value={user.managerName || "Not assigned"} />
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {user.projectIds.length ? (
                      user.projectIds.map((projectId) => (
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
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <DashboardTable
              columns={[
                { label: "Employee" },
                { label: "Role" },
                { label: "Status" },
                { label: "Manager" },
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
                  <DashboardTableCell>{user.managerName || "No manager"}</DashboardTableCell>
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

                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Assign Project to {selectedUser.fullName}</h3>
                <p className="mt-2 text-sm text-slate-500">Employee select ho chuka hai. Ab neeche se project choose karke assign karo.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ReadOnlyField label="Employee Name" value={selectedUser.fullName} />
                  <ReadOnlyField label="Email" value={selectedUser.email} />
                  <ReadOnlyField label="Reporting Manager" value={selectedUser.managerName || "Not assigned"} />
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

function PanelSection({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
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

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function roleLabel(role: EmployeeDirectoryEntry["role"]) {
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
