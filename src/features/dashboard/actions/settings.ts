"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { hashPassword, verifyPassword } from "@/features/auth/lib/password";
import connectDb from "@/database/mongodb/connect";
import { SettingModel } from "@/database/mongodb/models/setting";
import { UserModel } from "@/database/mongodb/models/user";

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

  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "Only leadership accounts can update company settings." };
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

type PasswordSettingsState = {
  error?: string;
  success?: string;
  values?: {
    confirmPassword?: string;
    currentPassword?: string;
    newPassword?: string;
  };
};

export async function updateAccountPassword(
  _previousState: PasswordSettingsState,
  formData: FormData,
): Promise<PasswordSettingsState> {
  const session = await getCurrentSession();

  if (!session) {
    return { error: "Please sign in again to update your password." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword || !confirmPassword) {
    return {
      error: "Enter new password and confirm password.",
      values: { confirmPassword, currentPassword, newPassword },
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "New password and confirm password do not match.",
      values: { confirmPassword, currentPassword, newPassword },
    };
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(newPassword)) {
    return {
      error: "Use 8+ characters with uppercase, lowercase, number, and special character.",
      values: { confirmPassword, currentPassword, newPassword },
    };
  }

  await connectDb();

  if (currentPassword) {
    const user = await UserModel.findById(session.user.id, { passwordHash: 1 }).lean();

    if (!user?.passwordHash) {
      return {
        error: "Unable to verify the current password right now.",
        values: { confirmPassword, currentPassword, newPassword },
      };
    }

    const isValidCurrentPassword = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValidCurrentPassword) {
      return {
        error: "Current password is not correct.",
        values: { confirmPassword, currentPassword, newPassword },
      };
    }
  }

  const passwordHash = await hashPassword(newPassword);
  await UserModel.findByIdAndUpdate(session.user.id, { passwordHash });

  revalidatePath("/dashboard/settings");

  return {
    success: "Password updated successfully.",
    values: { confirmPassword: "", currentPassword: "", newPassword: "" },
  };
}


