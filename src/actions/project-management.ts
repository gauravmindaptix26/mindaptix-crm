"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/auth-session";
import { assertSuperAdmin } from "@/lib/auth/user-admin";
import connectDb from "@/lib/connectDb";
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  ProjectModel,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/models/project";
import { UserModel } from "@/lib/models/user";

type ProjectManagementState = {
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

export async function createManagedProject(
  _previousState: ProjectManagementState,
  formData: FormData,
): Promise<ProjectManagementState> {
  const session = await getCurrentSession();

  try {
    assertSuperAdmin(session);
  } catch {
    return { error: "Only SUPER_ADMIN can create projects." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const status = String(formData.get("status") ?? "PLANNING");
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (name.length < 2 || name.length > 120) {
    return { error: "Project name must be between 2 and 120 characters.", values: { name, summary } };
  }

  if (summary.length < 8 || summary.length > 600) {
    return {
      error: "Project summary must be between 8 and 600 characters.",
      values: { name, summary, status: safeStatus(status), priority: safePriority(priority), dueDate },
    };
  }

  if (!PROJECT_STATUSES.includes(status as ProjectStatus) || !PROJECT_PRIORITIES.includes(priority as ProjectPriority)) {
    return { error: "Project status or priority is invalid.", values: { name, summary, dueDate } };
  }

  await connectDb();

  await ProjectModel.create({
    name,
    summary,
    status,
    priority,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdByUserId: session.user.id,
  });

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/dsr");

  return {
    success: "Project created successfully.",
    values: { status: "PLANNING", priority: "MEDIUM" },
  };
}

export async function assignProjectToUser(formData: FormData) {
  const session = await getCurrentSession();
  assertSuperAdmin(session);

  const userId = String(formData.get("userId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");

  if (!userId || !projectId) {
    throw new Error("User and project are required.");
  }

  await connectDb();

  const targetUser = await UserModel.findById(userId, { role: 1 }).lean();

  if (!targetUser || targetUser.role !== "EMPLOYEE") {
    throw new Error("Projects can only be assigned to employee accounts.");
  }

  await Promise.all([
    UserModel.findByIdAndUpdate(userId, { $addToSet: { projectIds: projectId } }),
    ProjectModel.findByIdAndUpdate(projectId, { $addToSet: { assignedUserIds: userId } }),
  ]);

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dsr");
}

function safeStatus(value: string): ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus) ? (value as ProjectStatus) : "PLANNING";
}

function safePriority(value: string): ProjectPriority {
  return PROJECT_PRIORITIES.includes(value as ProjectPriority) ? (value as ProjectPriority) : "MEDIUM";
}
