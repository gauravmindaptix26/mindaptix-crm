"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/auth-session";
import connectDb from "@/lib/connectDb";
import { DailyUpdateModel } from "@/lib/models/daily-update";

type DailyUpdateState = {
  error?: string;
  success?: string;
  values?: {
    summary?: string;
    accomplishments?: string;
    blockers?: string;
    nextPlan?: string;
    projectId?: string;
    workDate?: string;
  };
};

export async function submitDailyUpdate(
  _previousState: DailyUpdateState,
  formData: FormData,
): Promise<DailyUpdateState> {
  const session = await getCurrentSession();

  if (!session) {
    return { error: "Authentication required." };
  }

  if (session.user.role !== "EMPLOYEE") {
    return { error: "Only employees can submit daily updates." };
  }

  const summary = String(formData.get("summary") ?? "").trim();
  const accomplishments = String(formData.get("accomplishments") ?? "").trim();
  const blockers = String(formData.get("blockers") ?? "").trim();
  const nextPlan = String(formData.get("nextPlan") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const workDate = String(formData.get("workDate") ?? "").trim();

  if (summary.length < 6 || summary.length > 200) {
    return {
      error: "Update title must be between 6 and 200 characters.",
      values: { summary, accomplishments, blockers, nextPlan, projectId, workDate },
    };
  }

  if (accomplishments.length < 8 || accomplishments.length > 1200) {
    return {
      error: "Work details must be between 8 and 1200 characters.",
      values: { summary, accomplishments, blockers, nextPlan, projectId, workDate },
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
    return {
      error: "Choose a valid work date.",
      values: { summary, accomplishments, blockers, nextPlan, projectId, workDate },
    };
  }

  if (projectId && !session.user.projectIds.includes(projectId)) {
    return {
      error: "You can only submit updates for projects assigned to you.",
      values: { summary, accomplishments, blockers, nextPlan, projectId, workDate },
    };
  }

  await connectDb();

  await DailyUpdateModel.findOneAndUpdate(
    { userId: session.user.id, workDate },
    {
      userId: session.user.id,
      projectId,
      workDate,
      summary,
      accomplishments,
      blockers,
      nextPlan,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dsr");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/reports");

  return {
    success: "Daily update saved.",
    values: { workDate, projectId },
  };
}
