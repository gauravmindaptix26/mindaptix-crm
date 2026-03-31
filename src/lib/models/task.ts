import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 1000,
    },
    assignedUserId: {
      type: String,
      required: true,
      index: true,
    },
    assignedByUserId: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "PENDING",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ assignedByUserId: 1, status: 1, createdAt: -1 });
taskSchema.index({ assignedUserId: 1, status: 1, createdAt: -1 });

export type TaskRecord = InferSchemaType<typeof taskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TaskModel =
  ((mongoose.models.Task as Model<TaskRecord> | undefined) ??
    mongoose.model<TaskRecord>("Task", taskSchema));
