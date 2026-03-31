"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/auth-session";
import connectDb from "@/lib/connectDb";
import { AttendanceModel } from "@/lib/models/attendance";

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
