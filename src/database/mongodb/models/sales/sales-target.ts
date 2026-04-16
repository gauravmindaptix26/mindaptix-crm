import mongoose, { type InferSchemaType, type Model } from "mongoose";
import { baseSchemaOptions } from "@/database/mongodb/models/shared/schema-options";

export const SALES_TARGET_STATUSES = ["OPEN", "ACHIEVED", "MISSED"] as const;

export type SalesTargetStatus = (typeof SALES_TARGET_STATUSES)[number];

const salesTargetSchema = new mongoose.Schema(
  {
    salesUserId: {
      type: String,
      required: true,
      index: true,
    },
    monthKey: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    achievedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    incentiveAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: SALES_TARGET_STATUSES,
      default: "OPEN",
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  baseSchemaOptions,
);

salesTargetSchema.index({ salesUserId: 1, monthKey: 1 }, { unique: true });
salesTargetSchema.index({ monthKey: 1, status: 1 });

export type SalesTargetRecord = InferSchemaType<typeof salesTargetSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SalesTargetModel =
  ((mongoose.models.SalesTarget as Model<SalesTargetRecord> | undefined) ??
    mongoose.model<SalesTargetRecord>("SalesTarget", salesTargetSchema));
