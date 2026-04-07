import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const PROJECT_STATUSES = ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"] as const;
export const PROJECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 600,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "PLANNING",
      required: true,
    },
    priority: {
      type: String,
      enum: PROJECT_PRIORITIES,
      default: "MEDIUM",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    assignedUserIds: {
      type: [String],
      default: [],
    },
    createdByUserId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export type ProjectRecord = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProjectModel =
  ((mongoose.models.Project as Model<ProjectRecord> | undefined) ??
    mongoose.model<ProjectRecord>("Project", projectSchema));
