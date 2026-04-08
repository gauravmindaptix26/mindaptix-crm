"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import connectDb from "@/database/mongodb/connect";
import { createNotificationsForUsers, getAdminUserIds } from "@/features/notifications/service";
import { LEAVE_STATUSES, LEAVE_TYPES, LeaveRequestModel, type LeaveStatus, type LeaveType } from "@/database/mongodb/models/leave-request";
import { getVisibleUserIdsForSession } from "@/features/dashboard/team-scope";
import { UserModel } from "@/database/mongodb/models/user";

type LeaveState = {
  error?: string;
  success?: string;
  values?: {
    leaveType?: LeaveType;
    startDate?: string;
    endDate?: string;
    reason?: string;
  };
};

export async function applyLeaveRequest(_previousState: LeaveState, formData: FormData): Promise<LeaveState> {
  const session = await getCurrentSession();

  if (!session) {
    return { error: "Authentication required." };
  }

  const leaveType = String(formData.get("leaveType") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!LEAVE_TYPES.includes(leaveType as LeaveType) || !isValidDateKey(startDate) || !isValidDateKey(endDate) || reason.length < 6) {
    return {
      error: "Fill leave type, valid dates, and a proper reason.",
      values: {
        leaveType: LEAVE_TYPES.includes(leaveType as LeaveType) ? (leaveType as LeaveType) : "PAID",
        startDate,
        endDate,
        reason,
      },
    };
  }

  if (endDate < startDate) {
    return {
      error: "End date cannot be earlier than start date.",
      values: { leaveType: leaveType as LeaveType, startDate, endDate, reason },
    };
  }

  await connectDb();

  const requester = await UserModel.findById(session.user.id, { managerId: 1 }).lean();

  const leaveRequest = await LeaveRequestModel.create({
    userId: session.user.id,
    leaveType,
    startDate,
    endDate,
    reason,
  });

  const adminRecipients = await getAdminUserIds();
  const recipients = [...adminRecipients, requester?.managerId ?? ""].filter(Boolean);
  await createNotificationsForUsers(recipients, {
    actorUserId: session.user.id,
    type: "LEAVE_REQUESTED",
    title: "New leave request",
    message: `${session.user.fullName} requested ${leaveType.toLowerCase()} leave from ${startDate} to ${endDate}.`,
    actionUrl: "/dashboard/leaves",
    sourceKey: `leave-requested:${leaveRequest._id.toString()}`,
  });

  revalidatePath("/dashboard/leaves");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");

  return {
    success: "Leave request submitted.",
    values: { leaveType: "PAID" },
  };
}

export async function reviewLeaveRequest(formData: FormData) {
  const session = await getCurrentSession();

  if (!session || session.user.role !== "MANAGER") {
    throw new Error("Only admin can review leaves.");
  }

  const leaveId = String(formData.get("leaveId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!leaveId || !LEAVE_STATUSES.includes(status as LeaveStatus) || status === "PENDING") {
    throw new Error("Invalid leave review request.");
  }

  await connectDb();

  const leaveRequest = await LeaveRequestModel.findById(leaveId, { userId: 1 }).lean();

  if (!leaveRequest) {
    throw new Error("Leave request not found.");
  }

  const visibleUserIds = await getVisibleUserIdsForSession(session, { employeesOnly: true });

  if (!visibleUserIds.includes(leaveRequest.userId)) {
    throw new Error("You can only review leave requests from employee accounts.");
  }

  await LeaveRequestModel.findByIdAndUpdate(leaveId, {
    status,
    reviewedByUserId: session.user.id,
  });

  await createNotificationsForUsers([leaveRequest.userId], {
    actorUserId: session.user.id,
    type: "LEAVE_REVIEWED",
    title: `Leave ${status === "APPROVED" ? "approved" : "rejected"}`,
    message: `Your leave request has been ${status.toLowerCase()} by ${session.user.fullName}.`,
    actionUrl: "/dashboard/leaves",
    sourceKey: `leave-reviewed:${leaveId}:${status}`,
  });

  revalidatePath("/dashboard/leaves");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}



