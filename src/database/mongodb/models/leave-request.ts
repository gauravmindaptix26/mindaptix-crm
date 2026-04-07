import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const LEAVE_TYPES = ["PAID", "SICK"] as const;
export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 600,
    },
    status: {
      type: String,
      enum: LEAVE_STATUSES,
      default: "PENDING",
      required: true,
    },
    reviewedByUserId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

leaveRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });
leaveRequestSchema.index({ reviewedByUserId: 1, status: 1 });

export type LeaveRequestRecord = InferSchemaType<typeof leaveRequestSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const LeaveRequestModel =
  ((mongoose.models.LeaveRequest as Model<LeaveRequestRecord> | undefined) ??
    mongoose.model<LeaveRequestRecord>("LeaveRequest", leaveRequestSchema));
