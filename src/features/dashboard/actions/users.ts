"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { hashPassword } from "@/features/auth/lib/password";
import { assertAdminOrManager } from "@/features/auth/lib/user-admin";
import { USER_ROLES, type UserRole } from "@/features/auth/lib/rbac";
import { USER_STATUSES, UserModel, type UserStatus } from "@/database/mongodb/models/user";
import { saveEmployeeDocument } from "@/shared/storage/uploads/employee-documents";
import type { UserManagementFormState } from "@/features/auth/lib/user-management-form-state";
import connectDb from "@/database/mongodb/connect";

export async function createManagedUser(
  _previousState: UserManagementFormState,
  formData: FormData,
): Promise<UserManagementFormState> {
  const session = await getCurrentSession();

  try {
    assertAdminOrManager(session);
  } catch {
    return { error: "Only admin can create users." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const joiningDate = String(formData.get("joiningDate") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const managerId = String(formData.get("managerId") ?? "").trim();
  const techStack = formData
    .getAll("techStack")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const role = String(formData.get("role") ?? "EMPLOYEE");
  const status = String(formData.get("status") ?? "ACTIVE");
  const documentFile = formData.get("document");

  if (fullName.length < 2 || fullName.length > 80) {
    return { error: "Full name must be between 2 and 80 characters.", values: { fullName, email, phone, joiningDate, managerId, techStack } };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address.", values: { fullName, email, phone, joiningDate, managerId, techStack } };
  }

  if (phone && !/^[0-9+\-()\s]{7,20}$/.test(phone)) {
    return { error: "Enter a valid phone number.", values: { fullName, email, phone, joiningDate, managerId, techStack } };
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
    return {
      error: "Password must be at least 8 characters and include upper, lower, number, and symbol.",
      values: { fullName, email, phone, joiningDate, managerId, techStack, role: safeRole(role), status: safeStatus(status) },
    };
  }

  if (!isMvpRole(role) || !USER_STATUSES.includes(status as UserStatus)) {
    return { error: "Selected role or status is invalid.", values: { fullName, email, phone, joiningDate, managerId, techStack } };
  }

  await connectDb();

  const existingUser = await UserModel.findOne({ email }).lean();

  if (existingUser) {
    return {
      error: "This email is already assigned to another account.",
      values: { fullName, email, phone, joiningDate, managerId, techStack, role: role as UserRole, status: status as UserStatus },
    };
  }

  const resolvedManagerId = await resolveManagerId(managerId, role as UserRole);

  if (resolvedManagerId.error) {
    return {
      error: resolvedManagerId.error,
      values: { fullName, email, phone, joiningDate, managerId, techStack, role: role as UserRole, status: status as UserStatus },
    };
  }

  const passwordHash = await hashPassword(password);
  const savedDocument = documentFile instanceof File ? await saveEmployeeDocument(documentFile) : null;

  await UserModel.create({
    fullName,
    email,
    phone,
    joiningDate: joiningDate ? new Date(joiningDate) : null,
    documentName: savedDocument?.documentName ?? "",
    documentUrl: savedDocument?.documentUrl ?? "",
    passwordHash,
    role,
    managerId: resolvedManagerId.value,
    status,
    techStack,
  });

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");

  return {
    success: "User created successfully.",
    values: { role: "EMPLOYEE", status: "ACTIVE" },
  };
}

export async function updateManagedUserAccess(formData: FormData) {
  const session = await getCurrentSession();
  assertAdminOrManager(session);

  const userId = String(formData.get("userId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const joiningDate = String(formData.get("joiningDate") ?? "").trim();
  const managerId = String(formData.get("managerId") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "");

  if (
    !userId ||
    fullName.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (phone && !/^[0-9+\-()\s]{7,20}$/.test(phone)) ||
    !isMvpRole(role) ||
    !USER_STATUSES.includes(status as UserStatus)
  ) {
    throw new Error("Invalid user update payload.");
  }

  await connectDb();

  const duplicateUser = await UserModel.findOne({ email, _id: { $ne: userId } }).lean();

  if (duplicateUser) {
    throw new Error("Another employee already uses this email.");
  }

  const resolvedManagerId = await resolveManagerId(managerId, role as UserRole, userId);

  if (resolvedManagerId.error) {
    throw new Error(resolvedManagerId.error);
  }

  await UserModel.findByIdAndUpdate(userId, {
    fullName,
    email,
    phone,
    joiningDate: joiningDate ? new Date(joiningDate) : null,
    role,
    managerId: resolvedManagerId.value,
    status,
  });

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
}

function safeRole(value: string): UserRole {
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : "EMPLOYEE";
}

function safeStatus(value: string): UserStatus {
  return USER_STATUSES.includes(value as UserStatus) ? (value as UserStatus) : "ACTIVE";
}

function isMvpRole(value: string): value is UserRole {
  return value === "MANAGER" || value === "EMPLOYEE" || value === "SALES";
}

async function resolveManagerId(managerId: string, role: UserRole, currentUserId?: string) {
  if (role !== "EMPLOYEE" && role !== "SALES") {
    return { value: "" };
  }

  if (!managerId) {
    return { value: "" };
  }

  if (currentUserId && currentUserId === managerId) {
    return { error: "Employee cannot report to the same account." };
  }

  const manager = await UserModel.findById(managerId, { role: 1, status: 1 }).lean();

  if (!manager || manager.role !== "MANAGER") {
    return { error: "Selected reporting manager is invalid." };
  }

  if (manager.status !== "ACTIVE") {
    return { error: "Reporting manager must be active." };
  }

  return { value: managerId };
}


