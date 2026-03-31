import type { UserRole } from "@/lib/auth/rbac";
import type { UserStatus } from "@/lib/models/user";

export type UserManagementFormState = {
  error?: string;
  success?: string;
  values?: {
    fullName?: string;
    email?: string;
    phone?: string;
    joiningDate?: string;
    managerId?: string;
    role?: UserRole;
    status?: UserStatus;
  };
};

export const INITIAL_USER_MANAGEMENT_STATE: UserManagementFormState = {};
