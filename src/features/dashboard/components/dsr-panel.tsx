"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect } from "react";
import { submitDailyUpdate } from "@/features/dashboard/actions/dsr";
import { emitDashboardSync } from "@/features/dashboard/lib/live-sync";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import type { DsrPageData, EmployeeProjectView } from "@/features/dashboard/types";

type DsrPanelProps = {
  data: DsrPageData;
  simplifiedReview?: boolean;
};

const INITIAL_DSR_STATE = {
  values: {
    workDate: new Date().toISOString().slice(0, 10),
    projectId: "",
  },
};

export function DsrPanel({ data, simplifiedReview = false }: DsrPanelProps) {
  if (data.mode === "employee") {
    return <EmployeeDsrPanel data={data} />;
  }

  return <DsrReviewPanel data={data} simplifiedReview={simplifiedReview} />;
}

function EmployeeDsrPanel({ data }: { data: Extract<DsrPageData, { mode: "employee" }> }) {
  const [state, formAction, pending] = useActionState(submitDailyUpdate, INITIAL_DSR_STATE);

  useEffect(() => {
    if (state.success) {
      emitDashboardSync("dsr-submitted");
    }
  }, [state.success]);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-3">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <AlertStrip tone={data.reminderMessage.includes("pending") ? "amber" : "blue"}>{data.reminderMessage}</AlertStrip>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">Assigned Projects</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Project Details</h2>
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {data.projects.length ? (
            data.projects.map((project) => <ProjectCard key={project.id} project={project} />)
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500 xl:col-span-2">
              No project is assigned yet. Ask your admin to assign one from the Employees page.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <PanelSection
          description="Fill your daily status report with work done, blockers, tomorrow's plan, and proof files when needed."
          eyebrow="Daily Report"
          title="Submit DSR"
        >
          <form action={formAction} className="mt-6 max-w-[1120px] space-y-4">
            {state.error ? <Feedback>{state.error}</Feedback> : null}
            {state.success ? <Feedback tone="success">{state.success}</Feedback> : null}

            <div className="grid gap-4 xl:grid-cols-[220px_minmax(240px,320px)]">
              <Field defaultValue={state.values?.workDate} label="Work Date" name="workDate" placeholder="Select date" type="date" />
              <SelectField
                defaultValue={state.values?.projectId ?? ""}
                includePlaceholder
                label="Project"
                labels={Object.fromEntries(data.projects.map((project) => [project.id, project.name]))}
                name="projectId"
                options={data.projects.map((project) => project.id)}
                placeholder="General Update"
              />
            </div>

            <Field defaultValue={state.values?.summary} label="What did you do today?" name="summary" placeholder="Write a short heading" />

            <div className="grid gap-4 xl:grid-cols-2">
              <TextAreaField
                defaultValue={state.values?.accomplishments}
                label="Completed Work"
                name="accomplishments"
                placeholder="Explain today's completed work"
              />
              <TextAreaField defaultValue={state.values?.blockers} label="Blockers" name="blockers" placeholder="Mention blockers or dependencies" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <TextAreaField defaultValue={state.values?.nextPlan} label="Tomorrow Plan" name="nextPlan" placeholder="Write what you will do next" />
              <FileField label="Proof Files" multiple name="attachments" />
            </div>

            <Button className="sm:w-auto" disabled={pending} type="submit">
              {pending ? "Submitting..." : "Submit DSR"}
            </Button>
          </form>
        </PanelSection>

        <PanelSection
          description="Your recent DSR entries stay visible here so you can quickly check what you reported earlier."
          eyebrow="Recent DSR"
          title="History"
        >
          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Date", className: "w-[120px]" },
                { label: "Project", className: "w-[150px]" },
                { label: "Summary", className: "w-[190px]" },
                { label: "Completed Work" },
                { label: "Blockers" },
                { label: "Next Plan" },
                { label: "Files", className: "w-[150px]" },
              ]}
              emptyMessage="No DSR entries yet. Submit your first report from the form above."
              fixedLayout
              hasRows={data.updates.length > 0}
            >
              {data.updates.map((update) => (
                <tr className="bg-white/80 transition hover:bg-sky-50/45" key={update.id}>
                  <DashboardTableCell className="whitespace-nowrap font-medium text-slate-700">{update.workDate}</DashboardTableCell>
                  <DashboardTableCell className="font-medium text-slate-700">{update.projectName}</DashboardTableCell>
                  <DashboardTableCell className="font-semibold text-slate-900">{update.summary}</DashboardTableCell>
                  <DashboardTableCell>
                    <p className="line-clamp-4 whitespace-normal break-words text-sm leading-6 text-slate-700">{update.accomplishments}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <p className="line-clamp-4 whitespace-normal break-words text-sm leading-6 text-slate-700">{update.blockers || "No blockers"}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <p className="line-clamp-4 whitespace-normal break-words text-sm leading-6 text-slate-700">{update.nextPlan || "Not added"}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    {update.attachments.length ? <AttachmentList items={update.attachments} /> : <span className="text-sm text-slate-400">No files</span>}
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

function DsrReviewPanel({
  data,
  simplifiedReview,
}: {
  data: Extract<DsrPageData, { mode: "review" }>;
  simplifiedReview: boolean;
}) {
  const submittedEmployees = dedupeSubmittedEmployees(data.updates);

  if (simplifiedReview) {
    return (
      <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
        <section className="grid gap-4 md:grid-cols-2">
          <OverviewCard detail="Employees who already submitted DSR today." label="Submitted Today" value={String(submittedEmployees.length)} />
          <OverviewCard detail="Employees still missing their DSR for today." label="Missing Today" value={String(data.missingEmployees.length)} />
        </section>

        <section className="space-y-6">
          <PanelSection description="Employees who have already filled today's DSR." eyebrow="Submitted Today" title="Filled DSR">
            <div className="mt-5">
              <SubmittedEmployeesTable employees={submittedEmployees} />
            </div>
          </PanelSection>

          <PanelSection description="Employees who still need to fill today's DSR." eyebrow="Missing Today" title="Pending DSR">
            <div className="mt-5">
              <MissingDsrTable employees={data.missingEmployees} />
            </div>
          </PanelSection>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-3">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <AlertStrip tone={data.reminderMessage.includes("after 7 PM") ? "amber" : "blue"}>{data.reminderMessage}</AlertStrip>

      <section className="space-y-6">
        <PanelSection description="Employees who still need to fill their daily status report today." eyebrow="Missing Today" title="Pending DSR">
          <div className="mt-5">
            <MissingDsrTable employees={data.missingEmployees} />
          </div>
        </PanelSection>

        <PanelSection
          description="Today's submitted employee reports with completed work, blockers, next plan, and uploaded proof."
          eyebrow="Review Feed"
          title="Submitted Today"
        >
          <div className="mt-5">
            <SubmittedDsrTable updates={data.updates} />
          </div>
        </PanelSection>
      </section>
    </div>
  );
}

function dedupeSubmittedEmployees(updates: Extract<DsrPageData, { mode: "review" }>["updates"]) {
  const seen = new Set<string>();

  return updates.filter((update) => {
    if (seen.has(update.employeeEmail)) {
      return false;
    }

    seen.add(update.employeeEmail);
    return true;
  });
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

function ProjectCard({ project }: { project: EmployeeProjectView }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{formatLabel(project.status)}</Badge>
        <Badge tone={project.priority === "HIGH" ? "red" : project.priority === "MEDIUM" ? "amber" : "emerald"}>{formatLabel(project.priority)}</Badge>
        {project.techStack.slice(0, 2).map((tech) => (
          <Badge key={`${project.id}-${tech}`} tone="emerald">
            {tech}
          </Badge>
        ))}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{project.name}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{project.summary}</p>
      <p className="mt-3 text-sm text-slate-500">Due {project.dueDate || "Not set"}</p>
    </article>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "amber" | "blue" | "emerald" | "red" }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles[tone]}`}>{children}</span>;
}

function AttachmentList({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
          href={item.url}
          key={item.url}
          rel="noreferrer"
          target="_blank"
        >
          {item.name}
        </a>
      ))}
    </div>
  );
}

function MissingDsrTable({ employees }: { employees: Array<{ id: string; employeeName: string; employeeEmail: string }> }) {
  return (
    <div className="max-w-full overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fefefe_0%,#fbfdff_100%)] shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <DashboardTable
        columns={[
          { label: "Employee", className: "w-[220px]" },
          { label: "Email" },
          { label: "Status", className: "w-[120px]" },
        ]}
        emptyMessage="Everyone in this view has already submitted DSR today."
        fixedLayout
        hasRows={employees.length > 0}
        hideScrollbar
      >
        {employees.map((employee) => (
          <tr className="bg-white/80 transition hover:bg-amber-50/45" key={employee.id}>
            <DashboardTableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  {getInitials(employee.employeeName)}
                </div>
                <p className="truncate font-semibold text-slate-950">{employee.employeeName}</p>
              </div>
            </DashboardTableCell>
            <DashboardTableCell className="truncate text-sm text-slate-600">{employee.employeeEmail}</DashboardTableCell>
            <DashboardTableCell className="whitespace-nowrap">
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Pending
              </span>
            </DashboardTableCell>
          </tr>
        ))}
      </DashboardTable>
    </div>
  );
}

function SubmittedEmployeesTable({ employees }: { employees: Array<{ id: string; employeeName: string; employeeEmail: string }> }) {
  return (
    <div className="max-w-full overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fefefe_0%,#fbfdff_100%)] shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <DashboardTable
        columns={[
          { label: "Employee", className: "w-[220px]" },
          { label: "Email" },
          { label: "Status", className: "w-[120px]" },
        ]}
        emptyMessage="No employee has submitted DSR today yet."
        fixedLayout
        hasRows={employees.length > 0}
        hideScrollbar
      >
        {employees.map((employee) => (
          <tr className="bg-white/80 transition hover:bg-emerald-50/45" key={employee.id}>
            <DashboardTableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  {getInitials(employee.employeeName)}
                </div>
                <p className="truncate font-semibold text-slate-950">{employee.employeeName}</p>
              </div>
            </DashboardTableCell>
            <DashboardTableCell className="truncate text-sm text-slate-600">{employee.employeeEmail}</DashboardTableCell>
            <DashboardTableCell className="whitespace-nowrap">
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Submitted
              </span>
            </DashboardTableCell>
          </tr>
        ))}
      </DashboardTable>
    </div>
  );
}

function SubmittedDsrTable({ updates }: { updates: Extract<DsrPageData, { mode: "review" }>["updates"] }) {
  return (
    <div className="max-w-full overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fefefe_0%,#fbfdff_100%)] shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <DashboardTable
        columns={[
          { label: "Employee", className: "w-[210px]" },
          { label: "Project", className: "w-[120px]" },
          { label: "Date", className: "w-[126px]" },
          { label: "Summary", className: "w-[180px]" },
          { label: "Completed Work" },
          { label: "Blockers" },
          { label: "Next Plan" },
          { label: "Files", className: "w-[150px]" },
        ]}
        emptyMessage="No employee has submitted DSR today yet."
        fixedLayout
        hasRows={updates.length > 0}
        hideScrollbar
      >
        {updates.map((update) => (
          <tr className="bg-white/80 transition hover:bg-sky-50/45" key={update.id}>
            <DashboardTableCell>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{update.employeeName}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{update.employeeEmail}</p>
              </div>
            </DashboardTableCell>
            <DashboardTableCell className="whitespace-nowrap">
              <Badge tone="blue">{update.projectName}</Badge>
            </DashboardTableCell>
            <DashboardTableCell className="whitespace-nowrap text-sm font-medium text-slate-700">{update.workDate}</DashboardTableCell>
            <DashboardTableCell>
              <p className="line-clamp-3 whitespace-normal break-words text-sm font-semibold leading-6 text-slate-900">{update.summary}</p>
            </DashboardTableCell>
            <DashboardTableCell>
              <p className="line-clamp-4 whitespace-normal break-words text-sm leading-6 text-slate-700">{update.accomplishments}</p>
            </DashboardTableCell>
            <DashboardTableCell>
              <p className="line-clamp-4 whitespace-normal break-words text-sm leading-6 text-slate-700">{update.blockers || "No blockers"}</p>
            </DashboardTableCell>
            <DashboardTableCell>
              <p className="line-clamp-4 whitespace-normal break-words text-sm leading-6 text-slate-700">{update.nextPlan || "Not added"}</p>
            </DashboardTableCell>
            <DashboardTableCell>
              {update.attachments.length ? <AttachmentList items={update.attachments} /> : <span className="text-sm text-slate-400">No files</span>}
            </DashboardTableCell>
          </tr>
        ))}
      </DashboardTable>
    </div>
  );
}

function AlertStrip({ children, tone }: { children: ReactNode; tone: "amber" | "blue" }) {
  const styles = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800";

  return <div className={`rounded-[1.5rem] border px-5 py-4 text-sm leading-6 ${styles}`}>{children}</div>;
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
        className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
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
  placeholder,
}: {
  defaultValue: string;
  includePlaceholder?: boolean;
  label: string;
  labels?: Record<string, string>;
  name: string;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none" defaultValue={defaultValue} name={name}>
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

function FileField({ label, multiple = false, name }: { label: string; multiple?: boolean; name: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        multiple={multiple}
        name={name}
        type="file"
      />
    </label>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
