import mongoose, { type InferSchemaType, type Model } from "mongoose";
import { USER_ROLES } from "@/features/auth/lib/rbac";

export const USER_STATUSES = ["ACTIVE", "SUSPENDED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 32,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    documentName: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    documentUrl: {
      type: String,
      trim: true,
      maxlength: 260,
      default: "",
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "EMPLOYEE",
      required: true,
    },
    managerId: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "ACTIVE",
      required: true,
    },
    projectIds: {
      type: [String],
      default: [],
    },
    techStack: {
      type: [String],
      default: [],
    },
    leadIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);
userSchema.index({ role: 1, status: 1 });
userSchema.index({ managerId: 1, role: 1, status: 1 });

export type UserRecord = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel =
  ((mongoose.models.User as Model<UserRecord> | undefined) ?? mongoose.model<UserRecord>("User", userSchema));

