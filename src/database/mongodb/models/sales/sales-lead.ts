import mongoose, { type InferSchemaType, type Model } from "mongoose";
import { baseSchemaOptions } from "@/database/mongodb/models/shared/schema-options";

export const SALES_TECH_OPTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "MERN",
  "WordPress",
  "Shopify",
  "Laravel",
  "PHP",
  "Python",
  "Django",
  "Flutter",
  "React Native",
  "UI/UX Design",
  "SEO",
  "Google Ads",
  "Meta Ads",
  "Content",
  "Automation",
  "AI Integration",
  "Custom CRM",
] as const;

export type SalesTechOption = (typeof SALES_TECH_OPTIONS)[number];

export const SALES_LEAD_SOURCES = [
  "Website",
  "Referral",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "WhatsApp",
  "Call",
  "Walk-in",
  "Campaign",
  "Other",
] as const;

export type SalesLeadSource = (typeof SALES_LEAD_SOURCES)[number];

export const SALES_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type SalesLeadStatus = (typeof SALES_LEAD_STATUSES)[number];

export const SALES_LEAD_PRIORITIES = ["HOT", "WARM", "COLD"] as const;

export type SalesLeadPriority = (typeof SALES_LEAD_PRIORITIES)[number];

const salesLeadSchema = new mongoose.Schema(
  {
    salesUserId: {
      type: String,
      required: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    clientPhone: {
      type: String,
      trim: true,
      maxlength: 32,
      default: "",
    },
    clientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
    },
    source: {
      type: String,
      enum: SALES_LEAD_SOURCES,
      default: "Website",
      required: true,
    },
    status: {
      type: String,
      enum: SALES_LEAD_STATUSES,
      default: "NEW",
      required: true,
    },
    priority: {
      type: String,
      enum: SALES_LEAD_PRIORITIES,
      default: "WARM",
      required: true,
    },
    technologies: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.every((item) => SALES_TECH_OPTIONS.includes(item as SalesTechOption)),
        message: "Invalid sales technology option.",
      },
    },
    meetingLink: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    meetingDate: {
      type: String,
      trim: true,
      default: "",
    },
    meetingTime: {
      type: String,
      trim: true,
      default: "",
    },
    nextFollowUpDate: {
      type: String,
      trim: true,
      default: "",
    },
    expectedCloseDate: {
      type: String,
      trim: true,
      default: "",
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    pitchedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryDate: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  baseSchemaOptions,
);

salesLeadSchema.index({ salesUserId: 1, createdAt: -1 });
salesLeadSchema.index({ salesUserId: 1, status: 1, priority: 1 });
salesLeadSchema.index({ salesUserId: 1, nextFollowUpDate: 1 });
salesLeadSchema.index({ meetingDate: 1, meetingTime: 1 });
salesLeadSchema.index({ clientEmail: 1, clientPhone: 1 });

export type SalesLeadRecord = InferSchemaType<typeof salesLeadSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SalesLeadModel =
  ((mongoose.models.SalesLead as Model<SalesLeadRecord> | undefined) ??
    mongoose.model<SalesLeadRecord>("SalesLead", salesLeadSchema));
