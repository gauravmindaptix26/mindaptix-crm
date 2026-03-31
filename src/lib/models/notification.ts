import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "TASK_ASSIGNED",
  "TASK_COMMENT",
  "LEAVE_REQUESTED",
  "LEAVE_REVIEWED",
  "DSR_REMINDER",
  "LATE_CHECKIN",
  "DEADLINE_REMINDER",
  "TASK_OVERDUE",
  "DSR_SUBMITTED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: String,
      required: true,
      index: true,
    },
    actorUserId: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
    actionUrl: {
      type: String,
      trim: true,
      maxlength: 260,
      default: "",
    },
    sourceKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 240,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipientUserId: 1, createdAt: -1 });
notificationSchema.index({ recipientUserId: 1, readAt: 1, createdAt: -1 });

export type NotificationRecord = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const NotificationModel =
  ((mongoose.models.Notification as Model<NotificationRecord> | undefined) ??
    mongoose.model<NotificationRecord>("Notification", notificationSchema));
