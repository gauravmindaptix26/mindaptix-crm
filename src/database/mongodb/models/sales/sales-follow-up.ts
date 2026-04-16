import mongoose, { type InferSchemaType, type Model } from "mongoose";
import { baseSchemaOptions } from "@/database/mongodb/models/shared/schema-options";

export const SALES_FOLLOW_UP_CHANNELS = ["CALL", "WHATSAPP", "EMAIL", "MEETING"] as const;

export type SalesFollowUpChannel = (typeof SALES_FOLLOW_UP_CHANNELS)[number];

export const SALES_FOLLOW_UP_STATUSES = ["PENDING", "COMPLETED", "MISSED", "RESCHEDULED"] as const;

export type SalesFollowUpStatus = (typeof SALES_FOLLOW_UP_STATUSES)[number];

const salesFollowUpSchema = new mongoose.Schema(
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
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    followUpDate: {
      type: String,
      required: true,
      trim: true,
    },
    followUpTime: {
      type: String,
      trim: true,
      default: "",
    },
    channel: {
      type: String,
      enum: SALES_FOLLOW_UP_CHANNELS,
      default: "CALL",
      required: true,
    },
    status: {
      type: String,
      enum: SALES_FOLLOW_UP_STATUSES,
      default: "PENDING",
      required: true,
    },
    outcome: {
      type: String,
      trim: true,
      maxlength: 280,
      default: "",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    nextFollowUpDate: {
      type: String,
      trim: true,
      default: "",
    },
  },
  baseSchemaOptions,
);

salesFollowUpSchema.index({ salesUserId: 1, followUpDate: 1, status: 1 });
salesFollowUpSchema.index({ salesLeadId: 1, followUpDate: -1 });

export type SalesFollowUpRecord = InferSchemaType<typeof salesFollowUpSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SalesFollowUpModel =
  ((mongoose.models.SalesFollowUp as Model<SalesFollowUpRecord> | undefined) ??
    mongoose.model<SalesFollowUpRecord>("SalesFollowUp", salesFollowUpSchema));
