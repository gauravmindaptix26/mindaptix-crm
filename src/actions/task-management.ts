"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/auth-session";
import connectDb from "@/lib/connectDb";
import { getManagerTeamUserIds } from "@/lib/dashboard/team-scope";
import { TASK_STATUSES, TaskModel, type TaskStatus } from "@/lib/models/task";
import { UserModel } from "@/lib/models/user";

type TaskState = {
  error?: string;
  success?: string;
  values?: {
    title?: string;
    description?: string;
    assignedUserId?: string;
    dueDate?: string;
  };
};

export async function createTask(_previousState: TaskState, formData: FormData): Promise<TaskState> {
  const session = await getCurrentSession();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER")) {
    return { error: "Only admin or manager can assign tasks." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedUserId = String(formData.get("assignedUserId") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (title.length < 3 || description.length < 6 || !assignedUserId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return { error: "Fill title, description, employee, and due date.", values: { title, description, assignedUserId, dueDate } };
  }

  await connectDb();

  const employee = await UserModel.findById(assignedUserId, { role: 1 }).lean();

  if (!employee || employee.role !== "EMPLOYEE") {
    return { error: "Tasks can only be assigned to employee accounts.", values: { title, description, assignedUserId, dueDate } };
  }

  if (session.user.role === "MANAGER") {
    const teamUserIds = await getManagerTeamUserIds(session.user.id);

    if (teamUserIds.length > 0 && !teamUserIds.includes(assignedUserId)) {
      return { error: "Managers can assign tasks only to their current team members.", values: { title, description, assignedUserId, dueDate } };
    }
  }

  await TaskModel.create({
    title,
    description,
    assignedUserId,
    assignedByUserId: session.user.id,
    dueDate,
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");

  return { success: "Task assigned successfully." };
}

export async function updateTaskStatus(formData: FormData) {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Authentication required.");
  }

  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!taskId || !TASK_STATUSES.includes(status as TaskStatus)) {
    throw new Error("Invalid task update.");
  }

  await connectDb();

  const task = await TaskModel.findById(taskId).lean();

  if (!task) {
    throw new Error("Task not found.");
  }

  if (
    session.user.role === "MANAGER" &&
    task.assignedByUserId !== session.user.id
  ) {
    throw new Error("You cannot update tasks outside your team.");
  }

  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "MANAGER" &&
    task.assignedUserId !== session.user.id
  ) {
    throw new Error("You cannot update this task.");
  }

  await TaskModel.findByIdAndUpdate(taskId, { status });

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}
