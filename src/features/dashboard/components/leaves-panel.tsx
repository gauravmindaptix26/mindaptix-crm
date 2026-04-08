"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { applyLeaveRequest, reviewLeaveRequest } from "@/features/dashboard/actions/leaves";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import type { LeavePageData } from "@/features/dashboard/data";
import type { LeaveType } from "@/database/mongodb/models/leave-request";

type LeavesPanelProps = {
  canApply: boolean;
  canReview: boolean;
  data: LeavePageData;
};

const INITIAL_LEAVE_STATE = {
  values: {
    leaveType: "PAID" as LeaveType,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
  },
};

export function LeavesPanel({ canApply, canReview, data }: LeavesPanelProps) {
  const [state, formAction, pending] = useActionState(applyLeaveRequest, INITIAL_LEAVE_STATE);
  const pendingReviewCount = data.leaves.filter((leave) => leave.status === "PENDING").length;
  const showApplyForm = canApply;

  return (
    <div className="space-y-6 overflow-x-hidden px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className={`grid gap-6 ${showApplyForm ? "xl:grid-cols-[420px_minmax(0,1fr)]" : ""}`}>
        {showApplyForm ? (
          <PanelSection
            description="Apply for paid or sick leave with a reason and date range. Admins can review company leave requests from the same page."
            eyebrow="Leave Form"
            title="Apply Leave"
          >
            <form action={formAction} className="mt-6 space-y-4">
              {state.error ? <Feedback>{state.error}</Feedback> : null}
              {state.success ? <Feedback tone="success">{state.success}</Feedback> : null}

              <SelectField
                defaultValue={state.values?.leaveType ?? "PAID"}
                label="Leave Type"
                labels={{ PAID: "Paid Leave", SICK: "Sick Leave" }}
                name="leaveType"
                options={["PAID", "SICK"]}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={state.values?.startDate} label="Start Date" name="startDate" placeholder="Start date" type="date" />
                <Field defaultValue={state.values?.endDate} label="End Date" name="endDate" placeholder="End date" type="date" />
              </div>

              <TextAreaField
                defaultValue={state.values?.reason}
                label="Reason"
                name="reason"
                placeholder="Write a short reason for the leave request"
              />

              <Button className="sm:w-auto" disabled={pending} type="submit">
                {pending ? "Submitting..." : "Apply Leave"}
              </Button>
            </form>
          </PanelSection>
        ) : null}

        <PanelSection
          description={
            canReview
              ? "Review employee leave requests, track used leave days, and approve or reject pending requests from one place."
              : !canApply
                ? "Read-only company leave history showing requested dates, current status, and employee leave usage."
              : "Complete leave history for your account, including pending, approved, and rejected requests."
          }
          eyebrow="Leave History"
          title={canReview ? "Review Requests" : canApply ? "Requests" : "Leave History"}
        >
          <div className="mt-6 max-w-full">
            {canReview ? (
              <div className="mb-6 max-w-full overflow-hidden rounded-[1.75rem] border border-amber-200/80 bg-[linear-gradient(135deg,#fff7db_0%,#fffdf3_58%,#ffffff_100%)] shadow-[0_20px_45px_rgba(245,158,11,0.14)]">
                <div className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:items-center">
                  <div>
                    <div className="inline-flex items-center rounded-full border border-amber-300/70 bg-white/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      Review Queue
                    </div>
                    <p className="mt-3 text-xl font-semibold text-slate-950">{pendingReviewCount} pending request(s) need review.</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                      Approve or reject requests below, and use the employee summary to track how many leave days each employee has used.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-2">
                    <MetricBadge tone="warning" label="Pending" value={String(pendingReviewCount)} />
                    <MetricBadge tone="success" label="Approved" value={data.summaryCards[1]?.value ?? "0"} />
                    <MetricBadge tone="danger" label="Rejected" value={data.summaryCards[2]?.value ?? "0"} />
                    <MetricBadge tone="neutral" label="History" value={data.summaryCards[3]?.value ?? "0"} />
                  </div>
                </div>
              </div>
            ) : null}

            {canReview && data.employeeSummaries.length ? (
              <div className="mb-6 max-w-full">
                <div className="mb-4 flex flex-col gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">Employee Leave Summary</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Quick view of requested and approved leave totals for each employee.</p>
                  </div>
                  <div className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Usage Snapshot
                  </div>
                </div>

                <div className="max-w-full overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
                  <DashboardTable
                    columns={[
                      { label: "Employee" },
                      { label: "Approved" },
                      { label: "Pending" },
                      { label: "Rejected" },
                      { label: "Days Used" },
                      { label: "Days Requested" },
                    ]}
                    emptyMessage="No employee leave summary available yet."
                    hasRows={data.employeeSummaries.length > 0}
                    hideScrollbar
                  >
                    {data.employeeSummaries.map((summary) => (
                      <tr className="bg-white/80 transition hover:bg-sky-50/55" key={summary.id}>
                        <DashboardTableCell className="min-w-[190px]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#0f172a_100%)] text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]">
                              {getInitials(summary.employeeName)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">{summary.employeeName}</p>
                              <p className="mt-1 text-xs text-slate-500">{summary.employeeEmail}</p>
                            </div>
                          </div>
                        </DashboardTableCell>
                        <DashboardTableCell>
                          <CountPill tone="success" value={summary.approvedRequests} />
                        </DashboardTableCell>
                        <DashboardTableCell>
                          <CountPill tone="warning" value={summary.pendingRequests} />
                        </DashboardTableCell>
                        <DashboardTableCell>
                          <CountPill tone="danger" value={summary.rejectedRequests} />
                        </DashboardTableCell>
                        <DashboardTableCell>
                          <ValueBlock label="approved days" tone="success" value={summary.approvedDays} />
                        </DashboardTableCell>
                        <DashboardTableCell>
                          <ValueBlock label="total asked" tone="primary" value={summary.requestedDays} />
                        </DashboardTableCell>
                      </tr>
                    ))}
                  </DashboardTable>
                </div>
              </div>
            ) : null}

            <div className={`grid gap-4 ${canReview ? "xl:grid-cols-2" : "grid-cols-1"}`}>
              {data.leaves.length ? (
                data.leaves.map((leave) => (
                  <LeaveRequestCard canReview={canReview} key={leave.id} leave={leave} />
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                  No leave requests available yet.
                </div>
              )}
            </div>
          </div>
        </PanelSection>
      </section>
    </div>
  );
}

function getStatusBadgeClassName(status: string) {
  switch (status) {
    case "APPROVED":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getLeaveTypeBadgeClassName(type: string) {
  switch (type) {
    case "SICK":
      return "border border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border border-sky-200 bg-sky-50 text-sky-700";
  }
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function CountPill({ tone, value }: { tone: "success" | "warning" | "danger"; value: number }) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return <span className={`inline-flex min-w-[56px] items-center justify-center rounded-2xl border px-3 py-2 text-sm font-semibold ${className}`}>{value}</span>;
}

function ValueBlock({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "primary" | "success";
  value: number;
}) {
  const className =
    tone === "success"
      ? "border-emerald-200/80 bg-[linear-gradient(180deg,#ecfdf5_0%,#f7fee7_100%)] text-emerald-700"
      : "border-sky-200/80 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] text-sky-700";

  return (
    <div className={`inline-flex min-w-[88px] flex-col rounded-2xl border px-3 py-2 ${className}`}>
      <span className="text-lg font-semibold leading-none">{value}</span>
      <span className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</span>
    </div>
  );
}

function MetricBadge({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "warning" | "success" | "danger" | "neutral";
  value: string;
}) {
  const className =
    tone === "warning"
      ? "border-amber-200/80 bg-white/80 text-amber-700"
      : tone === "success"
        ? "border-emerald-200/80 bg-white/80 text-emerald-700"
        : tone === "danger"
          ? "border-rose-200/80 bg-white/80 text-rose-700"
          : "border-slate-200/80 bg-white/80 text-slate-700";

  return (
    <div className={`rounded-2xl border px-3 py-3 shadow-[0_10px_22px_rgba(255,255,255,0.32)] ${className}`}>
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-xl font-semibold leading-none">{value}</p>
    </div>
  );
}

function LeaveRequestCard({
  canReview,
  leave,
}: {
  canReview: boolean;
  leave: LeavePageData["leaves"][number];
}) {
  return (
    <article className="rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]">
            {getInitials(leave.employeeName)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950">{leave.employeeName}</p>
            <p className="truncate text-sm text-slate-500">{leave.employeeEmail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${getLeaveTypeBadgeClassName(leave.leaveType)}`}>
            {formatLabel(leave.leaveType)}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusBadgeClassName(leave.status)}`}>
            {leave.status}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_160px]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Leave Dates</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            <span>{leave.startDate}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">to</span>
            <span>{leave.endDate}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200/80 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] px-4 py-3 text-sky-700">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] opacity-80">Duration</p>
          <p className="mt-2 text-3xl font-semibold leading-none">{leave.requestedDays}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
            {leave.requestedDays === 1 ? "day" : "days"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Action</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{leave.status === "PENDING" ? "Needs review" : "Processed"}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Reason</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{leave.reason}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canReview && leave.status === "PENDING" ? (
          <>
            <form action={reviewLeaveRequest}>
              <input name="leaveId" type="hidden" value={leave.id} />
              <input name="status" type="hidden" value="APPROVED" />
              <Button className="min-w-[120px] rounded-xl px-4 py-2.5 text-sm shadow-[0_16px_32px_rgba(22,163,74,0.28)] sm:w-auto" type="submit">
                Approve
              </Button>
            </form>
            <form action={reviewLeaveRequest}>
              <input name="leaveId" type="hidden" value={leave.id} />
              <input name="status" type="hidden" value="REJECTED" />
              <Button
                className="min-w-[120px] rounded-xl border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] px-4 py-2.5 text-sm text-rose-700 shadow-none hover:border-rose-300 hover:bg-[linear-gradient(135deg,#ffe4e6_0%,#fecdd3_100%)] sm:w-auto"
                type="submit"
              >
                Reject
              </Button>
            </form>
          </>
        ) : (
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {leave.status === "PENDING" ? "Waiting for review" : "Processed"}
          </div>
        )}
      </div>
    </article>
  );
}

function OverviewCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_58%,#fff7ed_100%)] px-5 py-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-600">{label}</p>
        <span className="h-11 w-11 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.32),rgba(14,116,144,0.12)_55%,transparent_70%)]" />
      </div>
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
    <section className="min-w-0 rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      {children}
    </section>
  );
}

type FieldProps = {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

function Field({ defaultValue, label, name, placeholder, type = "text" }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 ${
          type === "date" ? "[color-scheme:light]" : ""
        }`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

function TextAreaField({ defaultValue, label, name, placeholder }: Omit<FieldProps, "type">) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function SelectField({
  defaultValue,
  label,
  labels,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  labels?: Record<string, string>;
  name: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        className="w-full rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}




