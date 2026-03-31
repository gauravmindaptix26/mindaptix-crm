"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { applyLeaveRequest, reviewLeaveRequest } from "@/actions/leave-management";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import { DashboardTable, DashboardTableCell } from "@/components/ui/dashboard-table";
import type { LeavePageData } from "@/lib/dashboard/dashboard-data";
import type { LeaveType } from "@/lib/models/leave-request";

type LeavesPanelProps = {
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

export function LeavesPanel({ canReview, data }: LeavesPanelProps) {
  const [state, formAction, pending] = useActionState(applyLeaveRequest, INITIAL_LEAVE_STATE);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <PanelSection
          description="Apply for paid or sick leave with a reason and date range. Managers and admins can review visible team requests from the same page."
          eyebrow="Leave Form"
          title="Apply Leave"
        >
          <form action={formAction} className="mt-6 space-y-4">
            {state.error ? <AuthFeedback>{state.error}</AuthFeedback> : null}
            {state.success ? <AuthFeedback tone="success">{state.success}</AuthFeedback> : null}

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

        <PanelSection
          description="Complete leave history for the current role scope. Managers and admins can approve or reject pending requests from here."
          eyebrow="Leave History"
          title="Requests"
        >
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Employee" },
                { label: "Leave" },
                { label: "Dates" },
                { label: "Reason" },
                { label: "Status" },
                { label: "Action" },
              ]}
              emptyMessage="No leave requests available yet."
              hasRows={data.leaves.length > 0}
            >
              {data.leaves.map((leave) => (
                <tr key={leave.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{leave.employeeName}</p>
                    <p className="mt-1 text-xs text-slate-500">{leave.employeeEmail}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>{leave.leaveType}</DashboardTableCell>
                  <DashboardTableCell>
                    {leave.startDate} to {leave.endDate}
                  </DashboardTableCell>
                  <DashboardTableCell className="min-w-[220px]">{leave.reason}</DashboardTableCell>
                  <DashboardTableCell>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      {leave.status}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    {canReview && leave.status === "PENDING" ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={reviewLeaveRequest}>
                          <input name="leaveId" type="hidden" value={leave.id} />
                          <input name="status" type="hidden" value="APPROVED" />
                          <Button className="sm:w-auto" type="submit">
                            Approve
                          </Button>
                        </form>
                        <form action={reviewLeaveRequest}>
                          <input name="leaveId" type="hidden" value={leave.id} />
                          <input name="status" type="hidden" value="REJECTED" />
                          <Button className="border border-slate-200 bg-white text-slate-900 shadow-none hover:bg-slate-50 sm:w-auto" type="submit">
                            Reject
                          </Button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">No action</span>
                    )}
                  </DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>
        </PanelSection>
      </section>
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
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ${
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
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
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
