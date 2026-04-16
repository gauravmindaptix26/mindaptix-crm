import mongoose, { type InferSchemaType, type Model } from "mongoose";
import { baseSchemaOptions } from "@/database/mongodb/models/shared/schema-options";

export const SALES_DEAL_STAGES = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "VERBAL_COMMIT", "WON", "LOST"] as const;

export type SalesDealStage = (typeof SALES_DEAL_STAGES)[number];

export const SALES_DEAL_STATUSES = ["OPEN", "WON", "LOST", "ON_HOLD"] as const;

export type SalesDealStatus = (typeof SALES_DEAL_STATUSES)[number];

const salesDealSchema = new mongoose.Schema(
  {
    salesLeadId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    salesUserId: {
      type: String,
      required: true,
      index: true,
    },
    customerId: {
      type: String,
      trim: true,
      default: "",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
    },
    stage: {
      type: String,
      enum: SALES_DEAL_STAGES,
      default: "DISCOVERY",
      required: true,
    },
    status: {
      type: String,
      enum: SALES_DEAL_STATUSES,
      default: "OPEN",
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    probability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    expectedCloseDate: {
      type: String,
      trim: true,
      default: "",
    },
    lostReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  baseSchemaOptions,
);

salesDealSchema.index({ salesUserId: 1, status: 1, stage: 1 });
salesDealSchema.index({ salesUserId: 1, expectedCloseDate: 1 });

export type SalesDealRecord = InferSchemaType<typeof salesDealSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SalesDealModel =
  ((mongoose.models.SalesDeal as Model<SalesDealRecord> | undefined) ??
    mongoose.model<SalesDealRecord>("SalesDeal", salesDealSchema));
