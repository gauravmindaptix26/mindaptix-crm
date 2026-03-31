import mongoose, { type InferSchemaType, type Model } from "mongoose";

const dailyUpdateSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      default: "",
    },
    workDate: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 200,
    },
    accomplishments: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 1200,
    },
    blockers: {
      type: String,
      trim: true,
      maxlength: 600,
      default: "",
    },
    nextPlan: {
      type: String,
      trim: true,
      maxlength: 600,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

dailyUpdateSchema.index({ userId: 1, workDate: -1 });
dailyUpdateSchema.index({ userId: 1, workDate: 1 });

export type DailyUpdateRecord = InferSchemaType<typeof dailyUpdateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DailyUpdateModel =
  ((mongoose.models.DailyUpdate as Model<DailyUpdateRecord> | undefined) ??
    mongoose.model<DailyUpdateRecord>("DailyUpdate", dailyUpdateSchema));
