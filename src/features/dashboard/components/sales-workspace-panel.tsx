"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect } from "react";
import { createSalesLead, type SalesLeadFormState } from "@/features/dashboard/actions/sales-leads";
import { emitDashboardSync } from "@/features/dashboard/lib/live-sync";
import type { EmployeeOption, SalesLeadEntry, SalesWorkspaceData, SummaryCard } from "@/features/dashboard/types";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";

type SalesWorkspacePanelProps = {
  canManageWorkspace: boolean;
  salesLeadPriorityOptions: string[];
  salesLeadRows: SalesLeadEntry[];
  salesLeadSourceOptions: string[];
  salesLeadStatusOptions: string[];
  salesOnly?: boolean;
  salesOptions: EmployeeOption[];
  salesTechnologyOptions: string[];
  salesWorkspace: SalesWorkspaceData;
};

const INITIAL_SALES_LEAD_STATE: SalesLeadFormState = {};

export function SalesWorkspacePanel({
  canManageWorkspace,
  salesLeadPriorityOptions,
  salesLeadRows,
  salesLeadSourceOptions,
  salesLeadStatusOptions,
  salesOnly = false,
  salesOptions,
  salesTechnologyOptions,
  salesWorkspace,
}: SalesWorkspacePanelProps) {
  const [salesLeadState, createSalesLeadAction, salesLeadPending] = useActionState(createSalesLead, INITIAL_SALES_LEAD_STATE);
  const salesLabelById = Object.fromEntries(salesOptions.map((salesUser) => [salesUser.id, salesUser.label]));
  const salesSummaryCards = salesWorkspace.summaryCards.slice(0, 4);
  const totalTrackedBudget = salesLeadRows.reduce((sum, row) => sum + row.budget, 0);
  const totalPitchedValue = salesLeadRows.reduce((sum, row) => sum + row.pitchedPrice, 0);
  const todayMeetingCount = salesLeadRows.filter((row) => row.meetingDate === getTodayDate()).length;
  const overdueFollowUps = salesWorkspace.followUps.filter(
    (row) => row.status === "PENDING" && row.followUpDate && row.followUpDate < getTodayDate(),
  ).length;
  const openDealCount = salesWorkspace.deals.filter((row) => row.status === "OPEN").length;
  const pendingCollectionValue = salesWorkspace.payments
    .filter((row) => row.status === "PENDING" || row.status === "PARTIAL" || row.status === "OVERDUE")
    .reduce((sum, row) => sum + Math.max(row.amount - row.receivedAmount, 0), 0);

  useEffect(() => {
    if (salesLeadState.success) {
      emitDashboardSync("sales-lead-created");
    }
  }, [salesLeadState.success]);

  const summaryCards: SummaryCard[] = salesSummaryCards.length
    ? salesSummaryCards
    : [
        { label: "Tracked Clients", value: String(salesLeadRows.length), detail: "Sales lead register me current rows." },
        { label: "Meetings Today", value: String(todayMeetingCount), detail: "Today scheduled sales meetings." },
        { label: "Client Budget", value: formatCurrency(totalTrackedBudget), detail: "Captured client budget across records." },
        { label: "Quoted Value", value: formatCurrency(totalPitchedValue), detail: "Total value already pitched." },
      ];

  return (
    <PanelSection
      description={
        salesOnly
          ? "Aapke sales login ke leads, follow-ups, deals, payments aur target progress yahan visible hain."
          : "Sales workspace me lead intake, follow-up planning, deal conversion, payment collection aur target tracking ko ek jagah organize kiya gaya hai."
      }
      eyebrow={salesOnly ? "My Pipeline" : "Sales Pipeline"}
      title={salesOnly ? "My Sales Workspace" : "Sales Workspace"}
    >
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {canManageWorkspace ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <section className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">Lead Intake</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Add Sales Record</h3>
              </div>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-blue-700">
                Pipeline Ready
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
                <Field defaultValue={salesLeadState.values?.companyName} label="Company Name" name="companyName" placeholder="Enter company name" required={false} />
                <Field defaultValue={salesLeadState.values?.clientName} label="Client Name" name="clientName" placeholder="Enter client name" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={salesLeadState.values?.clientPhone} label="Client Mobile" name="clientPhone" placeholder="Enter client mobile number" required={false} />
                <Field
                  autoComplete="off"
                  defaultValue={salesLeadState.values?.clientEmail}
                  label="Client Email"
                  name="clientEmail"
                  placeholder="Enter client email"
                  required={false}
                  type="email"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  defaultValue={salesLeadState.values?.source ?? salesLeadSourceOptions[0] ?? ""}
                  label="Lead Source"
                  name="source"
                  options={salesLeadSourceOptions}
                  required
                />
                <SelectField defaultValue={salesLeadState.values?.status ?? "NEW"} label="Lead Status" name="status" options={salesLeadStatusOptions} required />
                <SelectField defaultValue={salesLeadState.values?.priority ?? "WARM"} label="Priority" name="priority" options={salesLeadPriorityOptions} required />
              </div>

              <MultiSelectField
                defaultValue={salesLeadState.values?.technologies ?? []}
                helperText="Ctrl/Cmd daba ke multiple technologies select karo."
                label="Tech Stack"
                name="technologies"
                options={salesTechnologyOptions}
              />

              <Field defaultValue={salesLeadState.values?.meetingLink} label="Meeting Link" name="meetingLink" placeholder="https://meet.google.com/..." required={false} />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field defaultValue={salesLeadState.values?.meetingDate} fallbackTodayForDate label="Meeting Date" name="meetingDate" placeholder="Select meeting date" required={false} type="date" />
                <Field defaultValue={salesLeadState.values?.meetingTime} label="Meeting Time" name="meetingTime" placeholder="10:30 AM" required={false} type="time" />
                <Field defaultValue={salesLeadState.values?.nextFollowUpDate} fallbackTodayForDate label="Next Follow-up" name="nextFollowUpDate" placeholder="Select follow-up date" required={false} type="date" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={salesLeadState.values?.expectedCloseDate} label="Expected Close" name="expectedCloseDate" placeholder="Select expected close date" required={false} type="date" />
                <Field defaultValue={salesLeadState.values?.deliveryDate} label="Delivery Date" name="deliveryDate" placeholder="Select delivery date" required={false} type="date" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={salesLeadState.values?.budget} label="Client Budget" name="budget" placeholder="Enter client budget" required={false} type="number" />
                <Field defaultValue={salesLeadState.values?.pitchedPrice} label="Pitched Price" name="pitchedPrice" placeholder="Enter quoted price" required={false} type="number" />
              </div>

              <TextAreaField defaultValue={salesLeadState.values?.notes} label="Sales Notes" name="notes" placeholder="Call notes, objections, proposal details, next action..." />

              <Button className="mt-2 min-w-44 sm:w-auto" disabled={salesLeadPending || salesOptions.length === 0} type="submit">
                {salesLeadPending ? "Saving..." : "Save Sales Record"}
              </Button>
            </form>
          </section>

          <section className="rounded-[1.7rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.88),rgba(255,255,255,0.96))] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label="Sales Team" value={String(salesOptions.length)} tone="blue" detail="Active sales employees available for client handling." />
              <MetricCard label="Meetings Today" value={String(todayMeetingCount)} tone="amber" detail="Sales meetings scheduled for the current day." />
              <MetricCard label="Pending Collection" value={formatCurrency(pendingCollectionValue)} tone="emerald" detail="Outstanding amount still waiting to be collected." />
              <MetricCard label="Overdue Follow-ups" value={String(overdueFollowUps)} tone="violet" detail="Pending follow-ups already due before today." />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Pipeline Note</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">Lead, follow-up, deal aur collection ko ek hi workflow me rakho.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {salesLeadRows.length ? `${salesLeadRows.length} lead(s)` : "No leads yet"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open Deals</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{openDealCount}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Proposal aur negotiation phase me chal rahe commercial opportunities.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Quoted Value</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalPitchedValue)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Sales team ne ab tak leads par kitni commercial value quote ki hai.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      <LeadRegisterTable rows={salesLeadRows} />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PipelineTableSection
          columns={[
            { label: "Client", className: "min-w-[180px]" },
            { label: "Follow-up", className: "min-w-[160px]" },
            { label: "Status", className: "min-w-[140px]" },
          ]}
          description="Today and upcoming contact commitments."
          emptyMessage="No follow-up queue is available yet."
          eyebrow="Follow-up Queue"
          hasRows={salesWorkspace.followUps.length > 0}
          title="Follow-ups"
        >
          {salesWorkspace.followUps.map((row) => (
            <tr key={row.id}>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{row.clientName}</p>
                <p className="mt-1 text-xs text-slate-500">{row.salesUserName}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <p className="font-medium text-slate-900">{row.followUpDate}</p>
                <p className="mt-1 text-xs text-slate-500">{row.followUpTime || "Time not fixed"} | {row.channel}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <Pill label={row.status} tone={row.status === "COMPLETED" ? "emerald" : row.status === "MISSED" ? "rose" : "amber"} />
                <p className="mt-2 text-xs leading-5 text-slate-500">{row.outcome || "Outcome note pending"}</p>
              </DashboardTableCell>
            </tr>
          ))}
        </PipelineTableSection>
        <PipelineTableSection
          columns={[
            { label: "Deal", className: "min-w-[200px]" },
            { label: "Stage", className: "min-w-[140px]" },
            { label: "Value", className: "min-w-[160px]" },
          ]}
          description="Proposal se closure tak active commercial opportunities."
          emptyMessage="No deal records are available yet."
          eyebrow="Deal Tracker"
          hasRows={salesWorkspace.deals.length > 0}
          title="Deals"
        >
          {salesWorkspace.deals.map((row) => (
            <tr key={row.id}>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{row.title}</p>
                <p className="mt-1 text-xs text-slate-500">{row.salesUserName}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <Pill label={row.stage.replaceAll("_", " ")} tone={row.status === "WON" ? "emerald" : row.status === "LOST" ? "rose" : "blue"} />
                <p className="mt-2 text-xs text-slate-500">Status {row.status.replaceAll("_", " ")}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{formatCurrency(row.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">{row.probability}% probability</p>
                <p className="mt-2 text-xs text-slate-500">Close {row.expectedCloseDate || "not fixed"}</p>
              </DashboardTableCell>
            </tr>
          ))}
        </PipelineTableSection>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <PipelineTableSection
          columns={[
            { label: "Invoice", className: "min-w-[160px]" },
            { label: "Due", className: "min-w-[150px]" },
            { label: "Collection", className: "min-w-[180px]" },
          ]}
          description="Pending, partial aur overdue payment visibility."
          emptyMessage="No payment tracker records are available yet."
          eyebrow="Collections"
          hasRows={salesWorkspace.payments.length > 0}
          title="Payments"
        >
          {salesWorkspace.payments.map((row) => (
            <tr key={row.id}>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{row.invoiceNumber || "Invoice pending"}</p>
                <p className="mt-1 text-xs text-slate-500">{row.salesUserName}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <p className="font-medium text-slate-900">{row.dueDate || "No due date"}</p>
                <p className="mt-1 text-xs text-slate-500">Received {row.receivedDate || "not yet"}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{formatCurrency(row.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">Received {formatCurrency(row.receivedAmount)}</p>
                <div className="mt-2">
                  <Pill label={row.status} tone={row.status === "PAID" ? "emerald" : row.status === "OVERDUE" ? "rose" : "amber"} />
                </div>
              </DashboardTableCell>
            </tr>
          ))}
        </PipelineTableSection>

        <PipelineTableSection
          columns={[
            { label: "Sales Rep", className: "min-w-[180px]" },
            { label: "Month", className: "min-w-[140px]" },
            { label: "Progress", className: "min-w-[200px]" },
          ]}
          description="Monthly target, achieved amount aur incentive snapshot."
          emptyMessage="No sales targets have been created yet."
          eyebrow="Targets"
          hasRows={salesWorkspace.targets.length > 0}
          title="Target Tracker"
        >
          {salesWorkspace.targets.map((row) => (
            <tr key={row.id}>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{row.salesUserName}</p>
                <p className="mt-1 text-xs text-slate-500">Incentive {formatCurrency(row.incentiveAmount)}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <p className="font-medium text-slate-900">{row.monthKey}</p>
                <div className="mt-2">
                  <Pill label={row.status} tone={row.status === "ACHIEVED" ? "emerald" : row.status === "MISSED" ? "rose" : "blue"} />
                </div>
              </DashboardTableCell>
              <DashboardTableCell>
                <p className="font-semibold text-slate-950">{row.achievementRate}%</p>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(row.achievedAmount)} / {formatCurrency(row.targetAmount)}</p>
              </DashboardTableCell>
            </tr>
          ))}
        </PipelineTableSection>
      </div>
    </PanelSection>
  );
}

function LeadRegisterTable({ rows }: { rows: SalesLeadEntry[] }) {
  return (
    <div className="mt-6">
      <DashboardTable
        columns={[
          { label: "Sales Rep", className: "min-w-[180px]" },
          { label: "Client", className: "min-w-[220px]" },
          { label: "Source / Status", className: "min-w-[220px]" },
          { label: "Follow-up", className: "min-w-[230px]" },
          { label: "Commercial", className: "min-w-[220px]" },
        ]}
        emptyMessage="Sales lead records will appear here after the first pipeline entry is created."
        hasRows={rows.length > 0}
        hideScrollbar
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <DashboardTableCell>
              <p className="font-semibold text-slate-950">{row.salesUserName}</p>
              <p className="mt-1 text-xs text-slate-500">{row.salesUserEmail || "Sales email not added"}</p>
            </DashboardTableCell>
            <DashboardTableCell>
              <p className="font-semibold text-slate-950">{row.companyName || row.clientName}</p>
              <p className="mt-1 text-sm text-slate-600">{row.companyName ? row.clientName : row.clientEmail || "Client email not added"}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>{row.clientPhone || "Phone not added"}</p>
                {row.technologies.length ? <p>{row.technologies.join(", ")}</p> : <p>Technology scope not selected</p>}
              </div>
            </DashboardTableCell>
            <DashboardTableCell>
              <div className="flex flex-wrap gap-2">
                <Pill label={row.source} tone="blue" />
                <Pill label={row.status.replaceAll("_", " ")} tone={row.status === "WON" ? "emerald" : row.status === "LOST" ? "rose" : "amber"} />
                <Pill label={row.priority} tone={row.priority === "HOT" ? "rose" : row.priority === "COLD" ? "slate" : "violet"} />
              </div>
              <p className="mt-3 text-xs text-slate-500">Created {row.createdAt}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{row.notes || "No sales note added yet."}</p>
            </DashboardTableCell>
            <DashboardTableCell>
              <div className="space-y-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Meeting {row.meetingDate || "pending"} {row.meetingTime ? `| ${row.meetingTime}` : ""}
                  </p>
                  {row.meetingLink ? (
                    <a className="mt-2 inline-flex text-sm font-semibold text-blue-700 underline-offset-4 hover:underline" href={row.meetingLink} rel="noreferrer" target="_blank">
                      Open meeting link
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Meeting link not added</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next Follow-up</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{row.nextFollowUpDate || "Not scheduled"}</p>
                  <p className="mt-1 text-xs text-slate-500">Expected close {row.expectedCloseDate || "not fixed"}</p>
                </div>
              </div>
            </DashboardTableCell>
            <DashboardTableCell>
              <p className="font-semibold text-slate-950">{formatCurrency(row.budget)}</p>
              <p className="mt-1 text-xs text-slate-500">Client budget</p>
              <p className="mt-4 font-semibold text-slate-950">{formatCurrency(row.pitchedPrice)}</p>
              <p className="mt-1 text-xs text-slate-500">Quoted by team</p>
              <p className="mt-4 text-sm font-medium text-slate-900">{row.deliveryDate || "Delivery not fixed"}</p>
              <p className="mt-1 text-xs text-slate-500">Planned handover</p>
            </DashboardTableCell>
          </tr>
        ))}
      </DashboardTable>
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
  required?: boolean;
  type?: string;
};

function Field({
  autoComplete,
  defaultValue,
  fallbackTodayForDate = false,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: FieldProps) {
  const resolvedDefaultValue = type === "date" && fallbackTodayForDate ? defaultValue || getTodayDate() : defaultValue;
  const resolvedRequired = required ?? true;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        autoComplete={autoComplete}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ${
          type === "date" ? "[color-scheme:light]" : ""
        }`}
        defaultValue={resolvedDefaultValue}
        name={name}
        placeholder={placeholder}
        required={resolvedRequired}
        type={type}
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
  options,
  placeholder = "Select option",
  required = false,
}: {
  defaultValue: string;
  includePlaceholder?: boolean;
  label: string;
  labels?: Record<string, string>;
  name: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none" defaultValue={defaultValue} name={name} required={required}>
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
  options,
}: {
  defaultValue: string[];
  helperText?: string;
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select className="min-h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none" defaultValue={defaultValue} multiple name={name} required>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {helperText ? <span className="mt-2 block text-xs text-slate-500">{helperText}</span> : null}
    </label>
  );
}

function TextAreaField({
  defaultValue,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none" defaultValue={defaultValue} name={name} placeholder={placeholder} />
    </label>
  );
}

function PipelineTableSection({
  children,
  columns,
  description,
  emptyMessage,
  eyebrow,
  hasRows,
  title,
}: {
  children: ReactNode;
  columns: Array<{ label: string; className?: string }>;
  description: string;
  emptyMessage: string;
  eyebrow: string;
  hasRows: boolean;
  title: string;
}) {
  return (
    <section className="rounded-[1.7rem] border border-slate-100 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-500">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5">
        <DashboardTable columns={columns} emptyMessage={emptyMessage} hasRows={hasRows} hideScrollbar>
          {children}
        </DashboardTable>
      </div>
    </section>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "amber" | "blue" | "emerald" | "rose" | "slate" | "violet";
}) {
  const className =
    tone === "amber"
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
        : tone === "rose"
          ? "border-rose-100 bg-rose-50 text-rose-700"
          : tone === "slate"
            ? "border-slate-200 bg-slate-100 text-slate-700"
            : tone === "violet"
              ? "border-violet-100 bg-violet-50 text-violet-700"
              : "border-blue-100 bg-blue-50 text-blue-700";

  return <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.15em] ${className}`}>{label}</span>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}
