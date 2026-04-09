"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createSalesLead, type SalesLeadFormState } from "@/features/dashboard/actions/sales-leads";
import { createManagedUser, deleteManagedUser, updateManagedUserAccess } from "@/features/dashboard/actions/users";
import { emitDashboardSync } from "@/features/dashboard/lib/live-sync";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { FormActionButton } from "@/shared/ui/form-action-button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import { INITIAL_USER_MANAGEMENT_STATE } from "@/features/auth/lib/user-management-form-state";
import type {
  EmployeeDirectoryEntry,
  EmployeeOption,
  SalesLeadEntry,
  SummaryCard,
} from "@/features/dashboard/types";

type EmployeesManagementPanelProps = {
  readOnly?: boolean;
  salesLeadRows: SalesLeadEntry[];
  salesOnly?: boolean;
  salesOptions: EmployeeOption[];
  salesTechnologyOptions: string[];
  summaryCards: SummaryCard[];
  users: EmployeeDirectoryEntry[];
};
const INITIAL_SALES_LEAD_STATE: SalesLeadFormState = {};

export function EmployeesManagementPanel({
  readOnly = false,
  salesLeadRows,
  salesOnly = false,
  salesOptions,
  salesTechnologyOptions,
  summaryCards,
  users,
}: EmployeesManagementPanelProps) {
  const [userState, createUserAction, userPending] = useActionState(createManagedUser, INITIAL_USER_MANAGEMENT_STATE);
  const [updateUserState, updateUserAction, updateUserPending] = useActionState(updateManagedUserAccess, INITIAL_USER_MANAGEMENT_STATE);
  const [salesLeadState, createSalesLeadAction, salesLeadPending] = useActionState(createSalesLead, INITIAL_SALES_LEAD_STATE);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
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
  const canManageWorkspace = !readOnly && !salesOnly;
  const shouldShowDirectory = !salesOnly;
  const shouldShowSalesTracker = salesOnly;

  useEffect(() => {
    if (userState.success) {
      emitDashboardSync("user-created");
    }
  }, [userState.success]);

  useEffect(() => {
    if (updateUserState.success) {
      emitDashboardSync("user-updated");
    }
  }, [updateUserState.success]);

  useEffect(() => {
    if (salesLeadState.success) {
      emitDashboardSync("sales-lead-created");
    }
  }, [salesLeadState.success]);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      {canManageWorkspace ? (
        <section>
          <PanelSection
            description="Add employee, admin, or sales accounts with phone, joining date, tech focus, and a basic onboarding document."
            eyebrow="Employee Management"
            title="Create Team Account"
          >
            <form action={createUserAction} autoComplete="off" className="mt-6 space-y-5">
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

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.45fr)]">
                <Field autoComplete="new-password" label="Temporary Password" name="password" placeholder="Create a strong password" type="password" />
                <SelectField
                  defaultValue={userState.values?.techStack?.[0] ?? ""}
                  includePlaceholder
                  label="Tech Focus"
                  name="techStack"
                  options={salesTechnologyOptions}
                  placeholder="No tech focus"
                />
              </div>

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

              <FileField label="Document Upload" name="document" />

              <Button className="mt-2 min-w-44 sm:w-auto" disabled={userPending} type="submit">
                {userPending ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </PanelSection>
        </section>
      ) : null}

      {shouldShowDirectory ? (
      <PanelSection
        description={
          readOnly
            ? ""
            : "Select one employee from the list, then review name, email, role, status, tech focus, and account details from a single editor."
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
                { label: "Tech Focus" },
                { label: "Today" },
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
                  <DashboardTableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.techStack.length ? (
                        user.techStack.map((tech) => (
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" key={`${user.id}-tech-${tech}`}>
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">Not set</span>
                      )}
                    </div>
                  </DashboardTableCell>
                  <DashboardTableCell>{user.todayStatus}</DashboardTableCell>
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ReadOnlyField label="Employee Name" value={selectedUser.fullName} />
                  <ReadOnlyField label="Email" value={selectedUser.email} />
                  <ReadOnlyField label="Account Status" value={selectedUser.status} />
                  <ReadOnlyField label="Tech Focus" value={selectedUser.techStack.length ? selectedUser.techStack.join(", ") : "Not set"} />
                  <ReadOnlyField label="Today Status" value={selectedUser.todayStatus} />
                  <ReadOnlyField label="Phone" value={selectedUser.phone || "Phone not added"} />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-500">Account Controls</p>
                      <h4 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Edit Or Remove Account</h4>
                    </div>
                    <form action={deleteManagedUser}>
                      <input name="userId" type="hidden" value={selectedUser.id} />
                      <FormActionButton className="border border-rose-200 bg-rose-50 text-rose-700 shadow-none hover:bg-rose-100 sm:w-auto" pendingLabel="Deleting..." type="submit" variant="secondary">
                        Delete Account
                      </FormActionButton>
                    </form>
                  </div>

                  <form action={updateUserAction} className="mt-5 space-y-4">
                    {updateUserState.error ? <Feedback>{updateUserState.error}</Feedback> : null}
                    {updateUserState.success ? <Feedback tone="success">{updateUserState.success}</Feedback> : null}

                    <input name="userId" type="hidden" value={selectedUser.id} />

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field defaultValue={selectedUser.fullName} label="Full Name" name="fullName" placeholder="Enter full name" />
                      <Field defaultValue={selectedUser.email} label="Email Address" name="email" placeholder="Enter email" type="email" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field defaultValue={selectedUser.phone} label="Phone" name="phone" placeholder="Enter phone number" />
                      <Field
                        defaultValue={selectedUser.joiningDate}
                        fallbackTodayForDate
                        label="Joining Date"
                        name="joiningDate"
                        placeholder="Select joining date"
                        type="date"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <SelectField
                        defaultValue={selectedUser.role}
                        label="Role"
                        labels={{ EMPLOYEE: "Employee", MANAGER: "Admin", SALES: "Sales" }}
                        name="role"
                        options={["EMPLOYEE", "MANAGER", "SALES"]}
                      />
                      <SelectField defaultValue={selectedUser.status} label="Status" name="status" options={["ACTIVE", "SUSPENDED"]} />
                      <SelectField
                        defaultValue={selectedUser.techStack[0] ?? ""}
                        includePlaceholder
                        label="Tech Focus"
                        name="techStack"
                        options={salesTechnologyOptions}
                        placeholder="No tech focus"
                      />
                    </div>

                    <Button className="min-w-44 sm:w-auto" disabled={updateUserPending} type="submit">
                      {updateUserPending ? "Saving..." : "Update Account"}
                    </Button>
                  </form>
                </div>
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





