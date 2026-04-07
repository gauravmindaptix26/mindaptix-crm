"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import connectDb from "@/database/mongodb/connect";
import { SettingModel } from "@/database/mongodb/models/setting";

type SettingsState = {
  error?: string;
  success?: string;
  values?: {
    companyName?: string;
    workStart?: string;
    workEnd?: string;
    leavePolicy?: string;
  };
};

export async function updateCompanySettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getCurrentSession();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "MANAGER")) {
    return { error: "Only admin or manager can update settings." };
  }

  const companyName = String(formData.get("companyName") ?? "").trim();
  const workStart = String(formData.get("workStart") ?? "").trim();
  const workEnd = String(formData.get("workEnd") ?? "").trim();
  const leavePolicy = String(formData.get("leavePolicy") ?? "").trim();

  if (companyName.length < 2 || !/^\d{2}:\d{2}$/.test(workStart) || !/^\d{2}:\d{2}$/.test(workEnd)) {
    return {
      error: "Enter company name and valid working hours.",
      values: { companyName, workStart, workEnd, leavePolicy },
    };
  }

  await connectDb();

  await SettingModel.findOneAndUpdate(
    { key: "company" },
    {
      companyName,
      workStart,
      workEnd,
      leavePolicy: leavePolicy || "Paid Leave and Sick Leave are available for approved requests.",
    },
    { upsert: true, new: true },
  );

  revalidatePath("/dashboard/settings");

  return {
    success: "Settings updated successfully.",
    values: { companyName, workStart, workEnd, leavePolicy },
  };
}


