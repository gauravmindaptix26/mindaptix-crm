"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createManagedProject, deleteManagedProject, updateManagedProject } from "@/features/dashboard/actions/projects";
import { emitDashboardSync } from "@/features/dashboard/lib/live-sync";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { FormActionButton } from "@/shared/ui/form-action-button";
import { DashboardTable, DashboardTableCell } from "@/shared/ui/dashboard-table";
import type { ProjectsPageData } from "@/features/dashboard/types";
import type { ProjectPriority, ProjectStatus } from "@/database/mongodb/models/project";

type ProjectsPanelProps = {
  data: ProjectsPageData;
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
    techStack?: string[];
  };
};

const INITIAL_PROJECT_STATE: ProjectFormState = {};

export function ProjectsPanel({ data }: ProjectsPanelProps) {
  const [createState, createProjectAction, createPending] = useActionState(createManagedProject, INITIAL_PROJECT_STATE);
  const [updateState, updateProjectAction, updatePending] = useActionState(updateManagedProject, INITIAL_PROJECT_STATE);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createNotice, setCreateNotice] = useState("");

  useEffect(() => {
    if (!createState.success) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCreateNotice("Project is created.");
      setIsCreateModalOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [createState.success]);

  useEffect(() => {
    if (createState.success) {
      emitDashboardSync("project-created");
    }
  }, [createState.success]);

  useEffect(() => {
    if (updateState.success) {
      emitDashboardSync("project-updated");
    }
  }, [updateState.success]);

  const employeeLabels = useMemo(
    () => Object.fromEntries(data.employeeOptions.map((employee) => [employee.id, employee.label])),
    [data.employeeOptions],
  );

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return data.projects;
    }

    return data.projects.filter((project) =>
      [project.name, project.summary, project.status, project.priority, project.dueDate, ...(project.techStack ?? []), ...(project.assignedUserNames ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [data.projects, searchTerm]);

  const selectedProject = selectedProjectId
    ? data.projects.find((project) => project.id === selectedProjectId) ?? null
    : null;

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.summaryCards.map((card) => (
          <OverviewCard detail={card.detail} key={card.label} label={card.label} value={card.value} />
        ))}
      </section>

      <section className="space-y-6">
        <PanelSection
          description="Table se project select karo, phir same page par uski full details aur assignments update kar sakte ho."
          eyebrow="Project Register"
          actions={
            <Button
              className="sm:w-auto"
              onClick={() => {
                setCreateNotice("");
                setIsCreateModalOpen(true);
              }}
              type="button"
            >
              + Create Project
            </Button>
          }
          title="Manage Projects"
        >
          {createNotice ? <Feedback tone="success">{createNotice}</Feedback> : null}
          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Find by project name, employee, tech, or status</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 outline-none shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search project records"
              value={searchTerm}
            />
          </label>

          <div className="mt-6">
            <DashboardTable
              columns={[
                { label: "Project", className: "min-w-[220px]" },
                { label: "Tech", className: "min-w-[180px]" },
                { label: "Employees", className: "min-w-[220px]" },
                { label: "Due", className: "min-w-[110px]" },
                { label: "Status", className: "min-w-[120px]" },
                { label: "Action", className: "min-w-[100px]" },
              ]}
              emptyMessage="Projects will appear here after the first project is created."
              hasRows={filteredProjects.length > 0}
              hideScrollbar
            >
              {filteredProjects.map((project) => (
                <tr className={selectedProject?.id === project.id ? "bg-blue-50/55" : ""} key={project.id}>
                  <DashboardTableCell>
                    <p className="font-semibold text-slate-900">{project.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{project.summary}</p>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.length ? (
                        project.techStack.map((tech) => (
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" key={`${project.id}-${tech}`}>
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">Not set</span>
                      )}
                    </div>
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
                  <DashboardTableCell>{project.dueDate || "Not set"}</DashboardTableCell>
                  <DashboardTableCell>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {formatLabel(project.status)}
                      </span>
                    </div>
                  </DashboardTableCell>
                  <DashboardTableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button className="sm:w-auto" onClick={() => setSelectedProjectId(project.id)} type="button">
                        {selectedProject?.id === project.id ? "Opened" : "View"}
                      </Button>
                    </div>
                  </DashboardTableCell>
                </tr>
              ))}
            </DashboardTable>
          </div>

          {!selectedProject ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50/75 px-5 py-6 text-sm text-slate-500">
              Table se `View` click karo. Selected project ki sari filled information niche open hogi, aur wahin se update kar sakte ho.
            </div>
          ) : null}

          {selectedProject ? (
            <section className="mt-6 space-y-5 rounded-[1.7rem] border border-slate-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.8),rgba(255,255,255,0.95))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-500">Project Editor</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{selectedProject.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {formatLabel(selectedProject.status)}
                  </span>
                  <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    {formatLabel(selectedProject.priority)}
                  </span>
                  <form action={deleteManagedProject}>
                    <input name="projectId" type="hidden" value={selectedProject.id} />
                    <FormActionButton className="sm:w-auto" pendingLabel="Deleting..." type="submit" variant="secondary">
                      Delete Project
                    </FormActionButton>
                  </form>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
                <div className="rounded-[1.5rem] border border-slate-100 bg-white/85 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-500">Project Details</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{selectedProject.summary}</p>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <DetailTile label="Due Date" value={selectedProject.dueDate || "Not set"} />
                    <DetailTile label="Employees" value={String(selectedProject.assignedUserNames.length)} />
                    <DetailTile label="Tech Tags" value={String(selectedProject.techStack.length)} />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-100 bg-white/85 p-5 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-blue-500">Assignments</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Assigned Employees</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedProject.assignedUserNames.length ? (
                          selectedProject.assignedUserNames.map((employeeName) => (
                            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" key={`${selectedProject.id}-assigned-${employeeName}`}>
                              {employeeName}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">No employee assigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tech Stack</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedProject.techStack.length ? (
                          selectedProject.techStack.map((tech) => (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700" key={`${selectedProject.id}-tech-${tech}`}>
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">No tech stack added</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form action={updateProjectAction} className="mt-6 space-y-4">
                {updateState.error ? <Feedback>{updateState.error}</Feedback> : null}
                {updateState.success ? <Feedback tone="success">{updateState.success}</Feedback> : null}

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

                <MultiSelectDropdown
                  defaultValue={selectedProject.techStack}
                  helperText="Project ke current tech stack ko yahan se change kar sakte ho."
                  label="Tech Stack"
                  name="techStack"
                  optionLabels={Object.fromEntries(data.technologyOptions.map((option) => [option, option]))}
                  options={data.technologyOptions}
                  placeholder="Select tech stack"
                  key={`edit-tech-${selectedProject.id}-${selectedProject.techStack.join(",")}`}
                />

                <MultiSelectDropdown
                  defaultValue={selectedProject.assignedUserIds}
                  helperText="Employee add/remove karte hi unke dashboard aur DSR flow me project reflect hoga."
                  label="Assigned Employees"
                  name="assignedUserIds"
                  optionLabels={employeeLabels}
                  options={data.employeeOptions.map((employee) => employee.id)}
                  placeholder="Select employees"
                  key={`edit-employees-${selectedProject.id}-${selectedProject.assignedUserIds.join(",")}`}
                />

                <Button className="min-w-44 sm:w-auto" disabled={updatePending} type="submit">
                  {updatePending ? "Saving..." : "Update Project"}
                </Button>
              </form>
            </section>
          ) : null}
        </PanelSection>
      </section>

      {isCreateModalOpen ? (
        <ModalShell onClose={() => setIsCreateModalOpen(false)} title="Create Project">
          <form action={createProjectAction} className="space-y-4">
            {createState.error ? <Feedback>{createState.error}</Feedback> : null}

            <Field defaultValue={createState.values?.name} label="Project Name" name="name" placeholder="Enter project name" />
            <TextAreaField defaultValue={createState.values?.summary} label="Project Summary" name="summary" placeholder="Write a short project summary" />

            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                defaultValue={createState.values?.status ?? "PLANNING"}
                label="Status"
                labels={{ PLANNING: "Planning", IN_PROGRESS: "In Progress", ON_HOLD: "On Hold", COMPLETED: "Completed" }}
                name="status"
                options={["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]}
              />
              <SelectField
                defaultValue={createState.values?.priority ?? "MEDIUM"}
                label="Priority"
                labels={{ LOW: "Low", MEDIUM: "Medium", HIGH: "High" }}
                name="priority"
                options={["LOW", "MEDIUM", "HIGH"]}
              />
              <Field
                defaultValue={createState.values?.dueDate}
                fallbackTodayForDate
                label="Due Date"
                name="dueDate"
                placeholder="Select due date"
                type="date"
              />
            </div>

            <MultiSelectDropdown
              defaultValue={createState.values?.techStack ?? []}
              helperText="Project me kaun sa tech stack use ho raha hai, wo select karo."
              label="Tech Stack"
              name="techStack"
              optionLabels={Object.fromEntries(data.technologyOptions.map((option) => [option, option]))}
              options={data.technologyOptions}
              placeholder="Select tech stack"
              key={`create-tech-${(createState.values?.techStack ?? []).join(",")}`}
            />

            <MultiSelectDropdown
              defaultValue={createState.values?.assignedUserIds ?? []}
              helperText="Selected employees ko notification milegi aur project unke dashboard/DSR me show hoga."
              label="Assign Employees"
              name="assignedUserIds"
              optionLabels={employeeLabels}
              options={data.employeeOptions.map((employee) => employee.id)}
              placeholder="Select employees"
              key={`create-employees-${(createState.values?.assignedUserIds ?? []).join(",")}`}
            />

            <div className="flex flex-wrap gap-3">
              <Button className="sm:w-auto" disabled={createPending} type="submit">
                {createPending ? "Creating..." : "Create Project"}
              </Button>
              <Button
                className="border-slate-200 bg-slate-100 text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-200 sm:w-auto"
                onClick={() => setIsCreateModalOpen(false)}
                type="button"
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.2rem] border border-slate-100 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_100%)] px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{value}</p>
    </article>
  );
}

function OverviewCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_100%)] px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}

function PanelSection({
  actions,
  children,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
        </div>
        {actions ? <div className="flex items-center">{actions}</div> : null}
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      {children}
    </section>
  );
}

function ModalShell({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  const canUseDom = typeof document !== "undefined";

  useEffect(() => {
    if (!canUseDom) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [canUseDom, onClose]);

  if (!canUseDom) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-slate-950/55" onClick={onClose}>
      <div className="hide-scrollbar flex min-h-full items-start justify-center overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
        <div
          className="hide-scrollbar mt-4 max-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:mt-6 sm:p-7"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-blue-500">Project Setup</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
            </div>
            <Button
              className="border-slate-200 bg-slate-100 text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-200 sm:w-auto"
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              Close
            </Button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type FieldProps = {
  defaultValue?: string;
  fallbackTodayForDate?: boolean;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

function Field({ defaultValue, fallbackTodayForDate = false, label, name, placeholder, type = "text" }: FieldProps) {
  const resolvedDefaultValue = type === "date" && fallbackTodayForDate ? (defaultValue || getTodayDate()) : defaultValue;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ${type === "date" ? "[color-scheme:light]" : ""}`}
        defaultValue={resolvedDefaultValue}
        name={name}
        placeholder={placeholder}
        required
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
      <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none" defaultValue={defaultValue} name={name}>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectDropdown({
  defaultValue,
  helperText,
  label,
  name,
  optionLabels,
  options,
  placeholder,
}: {
  defaultValue: string[];
  helperText?: string;
  label: string;
  name: string;
  optionLabels?: Record<string, string>;
  options: string[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValue);

  function toggleValue(option: string) {
    setSelectedValues(selectedValues.includes(option) ? selectedValues.filter((value) => value !== option) : [...selectedValues, option]);
  }

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input name={`${name}Csv`} type="hidden" value={selectedValues.join(",")} />
      <div className="relative">
        <button
          className="flex min-h-[3.35rem] w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition hover:border-blue-300"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <div className="flex flex-1 flex-wrap gap-2">
            {selectedValues.length ? (
              selectedValues.map((value) => (
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" key={`${name}-chip-${value}`}>
                  {optionLabels?.[value] ?? value}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">{placeholder}</span>
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{isOpen ? "Close" : "Open"}</span>
        </button>

        <div
          className={`hide-scrollbar absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)] transition ${
            isOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
          }`}
        >
          {options.map((option) => {
            const selected = selectedValues.includes(option);

            return (
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                }`}
                key={`${name}-option-${option}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={selected}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    name={name}
                    onChange={() => toggleValue(option)}
                    type="checkbox"
                    value={option}
                  />
                  <span>{optionLabels?.[option] ?? option}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${
                    selected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {selected ? "Selected" : "Add"}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <span className="mt-2 block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {selectedValues.length ? `${selectedValues.length} selected` : "No selection yet"}
      </span>
      {helperText ? <span className="mt-2 block text-xs text-slate-500">{helperText}</span> : null}
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
