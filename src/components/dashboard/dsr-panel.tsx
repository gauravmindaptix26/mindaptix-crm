"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { submitDailyUpdate } from "@/actions/daily-updates";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import type { DsrPageData, EmployeeProjectView, EmployeeUpdateView } from "@/lib/dashboard/mvp-data";

type DsrPanelProps = {
  data: DsrPageData;
};

const INITIAL_DSR_STATE = {
  values: {
    workDate: new Date().toISOString().slice(0, 10),
    projectId: "",
  },
};

export function DsrPanel({ data }: DsrPanelProps) {
  if (data.mode === "employee") {
    return <EmployeeDsrPanel data={data} />;
  }

  return <DsrReviewPanel data={data} />;
}

function EmployeeDsrPanel({ data }: { data: Extract<DsrPageData, { mode: "employee" }> }) {
  const [state, formAction, pending] = useActionState(submitDailyUpdate, INITIAL_DSR_STATE);

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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <PanelSection
          description="Fill your daily status report with work done, blockers, tomorrow’s plan, and proof files when needed."
          eyebrow="Daily Report"
          title="Submit DSR"
        >
          <form action={formAction} className="mt-6 space-y-4" encType="multipart/form-data">
            {state.error ? <AuthFeedback>{state.error}</AuthFeedback> : null}
            {state.success ? <AuthFeedback tone="success">{state.success}</AuthFeedback> : null}

            <div className="grid gap-4 md:grid-cols-2">
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
            <TextAreaField
              defaultValue={state.values?.accomplishments}
              label="Completed Work"
              name="accomplishments"
              placeholder="Explain today’s completed work"
            />
            <TextAreaField defaultValue={state.values?.blockers} label="Blockers" name="blockers" placeholder="Mention blockers or dependencies" />
            <TextAreaField defaultValue={state.values?.nextPlan} label="Tomorrow Plan" name="nextPlan" placeholder="Write what you will do next" />
            <FileField label="Proof Files" multiple name="attachments" />

            <Button className="sm:w-auto" disabled={pending} type="submit">
              {pending ? "Submitting..." : "Submit DSR"}
            </Button>
          </form>
        </PanelSection>

        <PanelSection
          description="Your recent DSR entries stay visible here so you can check what you reported earlier."
          eyebrow="Recent DSR"
          title="History"
        >
          <div className="mt-6 space-y-4">
            {data.updates.length ? (
              data.updates.map((update) => <UpdateCard key={update.id} update={update} />)
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                No DSR entries yet. Submit your first report from the form on the left.
              </div>
            )}
          </div>
        </PanelSection>
      </section>
    </div>
  );
}

function DsrReviewPanel({ data }: { data: Extract<DsrPageData, { mode: "review" }> }) {
  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-3">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <AlertStrip tone={data.reminderMessage.includes("after 7 PM") ? "amber" : "blue"}>{data.reminderMessage}</AlertStrip>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <PanelSection
          description="Employees who still need to fill their daily status report today."
          eyebrow="Missing Today"
          title="Pending DSR"
        >
          <div className="mt-6 space-y-3">
            {data.missingEmployees.length ? (
              data.missingEmployees.map((employee) => (
                <div className="rounded-[1.3rem] border border-slate-100 bg-slate-50 px-4 py-3" key={employee.id}>
                  <p className="text-sm font-semibold text-slate-900">{employee.employeeName}</p>
                  <p className="mt-1 text-xs text-slate-500">{employee.employeeEmail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                Everyone in this view has already submitted DSR today.
              </div>
            )}
          </div>
        </PanelSection>

        <PanelSection
          description="Latest employee reports with completed work, blockers, next plan, and uploaded proof."
          eyebrow="Review Feed"
          title="Submitted DSR"
        >
          <div className="mt-6 space-y-4">
            {data.updates.length ? (
              data.updates.map((update) => (
                <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5" key={update.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{update.employeeName}</Badge>
                    <Badge tone="slate">{update.projectName}</Badge>
                    <Badge tone="emerald">{update.workDate}</Badge>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">{update.summary}</h3>
                  <p className="mt-2 text-sm text-slate-500">{update.employeeEmail}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{update.accomplishments}</p>
                  {update.blockers ? <p className="mt-3 text-sm text-amber-700">Blockers: {update.blockers}</p> : null}
                  {update.nextPlan ? <p className="mt-2 text-sm text-slate-500">Next: {update.nextPlan}</p> : null}
                  {update.attachments.length ? <AttachmentList items={update.attachments} /> : null}
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                No DSR entries available yet.
              </div>
            )}
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

function ProjectCard({ project }: { project: EmployeeProjectView }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{formatLabel(project.status)}</Badge>
        <Badge tone={project.priority === "HIGH" ? "red" : project.priority === "MEDIUM" ? "amber" : "emerald"}>{formatLabel(project.priority)}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{project.name}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{project.summary}</p>
      <p className="mt-3 text-sm text-slate-500">Due {project.dueDate || "Not set"}</p>
    </article>
  );
}

function UpdateCard({ update }: { update: EmployeeUpdateView }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{update.projectName}</Badge>
        <Badge tone="slate">{update.workDate}</Badge>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{update.summary}</h3>
      <p className="mt-4 text-sm leading-6 text-slate-600">{update.accomplishments}</p>
      {update.blockers ? <p className="mt-3 text-sm text-amber-700">Blockers: {update.blockers}</p> : null}
      {update.nextPlan ? <p className="mt-2 text-sm text-slate-500">Next: {update.nextPlan}</p> : null}
      {update.attachments.length ? <AttachmentList items={update.attachments} /> : null}
    </article>
  );
}

function AttachmentList({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
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

function AlertStrip({ children, tone }: { children: ReactNode; tone: "amber" | "blue" }) {
  const styles = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800";

  return <div className={`rounded-[1.5rem] border px-5 py-4 text-sm leading-6 ${styles}`}>{children}</div>;
}

function Badge({ children, tone }: { children: ReactNode; tone: "amber" | "blue" | "emerald" | "red" | "slate" }) {
  const styles = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-white text-slate-500",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles[tone]}`}>{children}</span>;
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
