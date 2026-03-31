"use client";

import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import { addTaskComment, createTask, updateTaskStatus } from "@/actions/task-management";
import { AuthFeedback } from "@/components/auth/auth-feedback";
import { Button } from "@/components/ui/button";
import type { TaskEntry, TaskPageData } from "@/lib/dashboard/mvp-data";
import type { TaskPriority } from "@/lib/models/task";

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
    priority: "MEDIUM" as TaskPriority,
    labels: [] as string[],
  },
};

export function TasksPanel({ canAssign, data }: TasksPanelProps) {
  const [state, formAction, pending] = useActionState(createTask, INITIAL_TASK_STATE);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [labelFilter, setLabelFilter] = useState("ALL");

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return data.tasks.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) {
        return false;
      }

      if (labelFilter !== "ALL" && !task.labels.includes(labelFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [task.title, task.description, task.assignedUserName, task.assignedByName, task.labels.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [data.tasks, labelFilter, priorityFilter, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className={`grid gap-6 ${canAssign ? "xl:grid-cols-[440px_minmax(0,1fr)]" : ""}`}>
        {canAssign ? (
          <PanelSection
            description="Create richer tasks with priority, labels, proof attachments, and a structured due date."
            eyebrow="Assign Task"
            title="Create Task"
          >
            <form action={formAction} className="mt-6 space-y-4" encType="multipart/form-data">
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
              <div className="grid gap-4 md:grid-cols-2">
                <Field defaultValue={state.values?.dueDate} label="Due Date" name="dueDate" placeholder="Due date" type="date" />
                <SelectField
                  defaultValue={state.values?.priority ?? "MEDIUM"}
                  label="Priority"
                  labels={{ LOW: "Low", MEDIUM: "Medium", HIGH: "High" }}
                  name="priority"
                  options={["LOW", "MEDIUM", "HIGH"]}
                />
              </div>
              <div className="space-y-3">
                <span className="block text-sm font-medium text-slate-700">Labels</span>
                <div className="flex flex-wrap gap-2">
                  {data.labelOptions.map((label) => (
                    <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={label}>
                      <input defaultChecked={state.values?.labels?.includes(label)} name="labels" type="checkbox" value={label} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <FileField label="Attachments" multiple name="attachments" />

              <Button className="sm:w-auto" disabled={pending} type="submit">
                {pending ? "Assigning..." : "Assign Task"}
              </Button>
            </form>
          </PanelSection>
        ) : null}

        <PanelSection
          description={canAssign ? "Track assigned work, overdue tasks, comments, and updates from one board." : "Track your assigned work, upload proof, and update status from one board."}
          eyebrow="Task Board"
          title="Tasks"
        >
          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))]">
            <SearchField onChange={setSearchTerm} value={searchTerm} />
            <SelectFilter label="Status" onChange={setStatusFilter} options={["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"]} value={statusFilter} />
            <SelectFilter label="Priority" onChange={setPriorityFilter} options={["ALL", "LOW", "MEDIUM", "HIGH"]} value={priorityFilter} />
            <SelectFilter label="Label" onChange={setLabelFilter} options={["ALL", ...data.labelOptions]} value={labelFilter} />
          </div>

          <div className="mt-6 space-y-4">
            {filteredTasks.length ? (
              filteredTasks.map((task) => <TaskCard canEditStatus data={task} key={task.id} />)
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                No tasks match the current filters.
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
    <article className={`rounded-[1.5rem] border p-5 ${data.isOverdue ? "border-red-200 bg-red-50/60" : "border-slate-100 bg-slate-50"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue">{data.assignedUserName}</Badge>
        <Badge tone={data.isOverdue ? "red" : "slate"}>{data.isOverdue ? `Overdue • ${data.dueDate}` : `Due ${data.dueDate}`}</Badge>
        <Badge tone={data.priority === "HIGH" ? "red" : data.priority === "MEDIUM" ? "amber" : "emerald"}>{data.priority}</Badge>
        {data.labels.map((label) => (
          <Badge key={label} tone="slate">
            {label}
          </Badge>
        ))}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{data.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{data.description}</p>
      <p className="mt-3 text-sm text-slate-500">Assigned by {data.assignedByName || "System"}</p>

      {data.attachments.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.attachments.map((attachment) => (
            <a
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              href={attachment.url}
              key={attachment.url}
              rel="noreferrer"
              target="_blank"
            >
              {attachment.name}
            </a>
          ))}
        </div>
      ) : null}

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

      <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Comments & Updates</p>
        <div className="mt-3 space-y-3">
          {data.comments.length ? (
            data.comments.map((comment) => (
              <div className="rounded-[1rem] border border-slate-100 bg-slate-50 px-4 py-3" key={comment.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{comment.userName}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{comment.role}</span>
                  <span className="text-xs text-slate-400">{comment.createdAt}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{comment.message}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
        </div>
        <form action={addTaskComment} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <input name="taskId" type="hidden" value={data.id} />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
            name="message"
            placeholder="Write an update or reply"
            required
          />
          <div className="flex items-end">
            <Button className="sm:w-auto" type="submit">
              Comment
            </Button>
          </div>
        </form>
      </div>
    </article>
  );
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
      <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none" defaultValue={defaultValue} name={name}>
        {includePlaceholder ? (
          <option disabled value="">
            Select option
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

function SearchField({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">Search</span>
      <input
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by task, employee, or label"
        value={value}
      />
    </label>
  );
}

function SelectFilter({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? `All ${label}` : option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
