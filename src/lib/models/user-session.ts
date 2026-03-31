import mongoose, { type InferSchemaType, type Model } from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
      maxlength: 500,
    },
    ipAddress: {
      type: String,
      default: "",
      maxlength: 120,
    },
  },
  {
    timestamps: true,
  },
);

userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UserSessionRecord = InferSchemaType<typeof userSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserSessionModel =
  ((mongoose.models.UserSession as Model<UserSessionRecord> | undefined) ??
    mongoose.model<UserSessionRecord>("UserSession", userSessionSchema));
