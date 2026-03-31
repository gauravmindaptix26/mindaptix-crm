"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { createTask, updateTaskStatus } from "@/actions/task-management";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import type { TaskEntry, TaskPageData } from "@/lib/dashboard/mvp-data";

type TasksPanelProps = {
  canAssign: boolean;
  data: TaskPageData;
};

const INITIAL_TASK_STATE = {
  values: {
    title: "",
    description: "",
    assignedUserId: "",
    dueDate: new Date().toISOString().slice(0, 10),
  },
};

export function TasksPanel({ canAssign, data }: TasksPanelProps) {
  const [state, formAction, pending] = useActionState(createTask, INITIAL_TASK_STATE);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className={`grid gap-6 ${canAssign ? "xl:grid-cols-[420px_minmax(0,1fr)]" : ""}`}>
        {canAssign ? (
          <PanelSection
            description="Assign work to employees with a title, deadline, and simple status flow."
            eyebrow="Assign Task"
            title="Create Task"
          >
            <form action={formAction} className="mt-6 space-y-4">
              {state.error ? <AuthFeedback>{state.error}</AuthFeedback> : null}
              {state.success ? <AuthFeedback tone="success">{state.success}</AuthFeedback> : null}

              <Field defaultValue={state.values?.title} label="Task Title" name="title" placeholder="Enter task title" />
              <TextAreaField
                defaultValue={state.values?.description}
                label="Description"
                name="description"
                placeholder="Describe the work clearly"
              />
              <SelectField
                defaultValue={state.values?.assignedUserId ?? ""}
                includePlaceholder
                label="Assign To"
                labels={Object.fromEntries(data.employeeOptions.map((employee) => [employee.id, employee.label]))}
                name="assignedUserId"
                options={data.employeeOptions.map((employee) => employee.id)}
              />
              <Field defaultValue={state.values?.dueDate} label="Due Date" name="dueDate" placeholder="Due date" type="date" />

              <Button className="sm:w-auto" disabled={pending} type="submit">
                {pending ? "Assigning..." : "Assign Task"}
              </Button>
            </form>
          </PanelSection>
        ) : null}

        <PanelSection
          description={canAssign ? "Track assigned work and update status from the same screen." : "Track your assigned work and update status when progress changes."}
          eyebrow="Task Board"
          title="Tasks"
        >
          <div className="mt-6 space-y-4">
            {data.tasks.length ? (
              data.tasks.map((task) => <TaskCard canEditStatus data={task} key={task.id} />)
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                No tasks available in this view yet.
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

function TaskCard({ canEditStatus, data }: { canEditStatus: boolean; data: TaskEntry }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          {data.assignedUserName}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Due {data.dueDate}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{data.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{data.description}</p>
      <p className="mt-3 text-sm text-slate-500">Assigned by {data.assignedByName || "System"}</p>

      {canEditStatus ? (
        <form action={updateTaskStatus} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <input name="taskId" type="hidden" value={data.id} />
          <SelectField
            defaultValue={data.status}
            label="Status"
            labels={{ PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed" }}
            name="status"
            options={["PENDING", "IN_PROGRESS", "COMPLETED"]}
          />
          <div className="flex items-end">
            <Button className="sm:w-auto" type="submit">
              Save
            </Button>
          </div>
        </form>
      ) : null}
    </article>
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
  includePlaceholder = false,
  label,
  labels,
  name,
  options,
}: {
  defaultValue: string;
  includePlaceholder?: boolean;
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
        {includePlaceholder ? (
          <option disabled value="">
            Select employee
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}
