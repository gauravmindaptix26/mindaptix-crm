"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import connectDb from "@/database/mongodb/connect";
import { AttendanceModel } from "@/database/mongodb/models/attendance";

export async function checkInAttendance() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Authentication required.");
  }

  await connectDb();

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  await AttendanceModel.findOneAndUpdate(
    { userId: session.user.id, dateKey },
    {
      $setOnInsert: {
        userId: session.user.id,
        dateKey,
        checkInAt: now,
        status: "PRESENT",
      },
    },
    { new: true, upsert: true },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/reports");
}

export async function checkOutAttendance() {
  const session = await getCurrentSession();

  if (!session) {
    throw new Error("Authentication required.");
  }

  await connectDb();

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  const existingAttendance = await AttendanceModel.findOne({ userId: session.user.id, dateKey }).lean();

  if (!existingAttendance) {
    throw new Error("Check in first before checking out.");
  }

  await AttendanceModel.findOneAndUpdate(
    { userId: session.user.id, dateKey },
    {
      $set: {
        checkOutAt: now,
        status: "COMPLETED",
      },
    },
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/reports");
}


