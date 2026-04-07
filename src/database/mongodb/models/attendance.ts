import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const ATTENDANCE_STATUSES = ["PRESENT", "COMPLETED"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    checkInAt: {
      type: Date,
      required: true,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: "PRESENT",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export type AttendanceRecord = InferSchemaType<typeof attendanceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AttendanceModel =
  ((mongoose.models.Attendance as Model<AttendanceRecord> | undefined) ??
    mongoose.model<AttendanceRecord>("Attendance", attendanceSchema));
