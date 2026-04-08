"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/features/auth/lib/auth-session";
import { assertAdminOrManager } from "@/features/auth/lib/user-admin";
import connectDb from "@/database/mongodb/connect";
import { SALES_TECH_OPTIONS, SalesLeadModel } from "@/database/mongodb/models/sales-lead";
import { UserModel } from "@/database/mongodb/models/user";

export type SalesLeadFormState = {
  error?: string;
  success?: string;
  values?: {
    salesUserId?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    technologies?: string[];
    meetingLink?: string;
    meetingDate?: string;
    meetingTime?: string;
    budget?: string;
    pitchedPrice?: string;
    deliveryDate?: string;
  };
};

export async function createSalesLead(
  _previousState: SalesLeadFormState,
  formData: FormData,
): Promise<SalesLeadFormState> {
  const session = await getCurrentSession();

  try {
    assertAdminOrManager(session);
  } catch {
    return { error: "Only admin can create sales records." };
  }

  const salesUserId = String(formData.get("salesUserId") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientPhone = String(formData.get("clientPhone") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim().toLowerCase();
  const technologies = formData
    .getAll("technologies")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const meetingLink = String(formData.get("meetingLink") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  const meetingTime = String(formData.get("meetingTime") ?? "").trim();
  const budget = String(formData.get("budget") ?? "").trim();
  const pitchedPrice = String(formData.get("pitchedPrice") ?? "").trim();
  const deliveryDate = String(formData.get("deliveryDate") ?? "").trim();

  const values = {
    salesUserId,
    clientName,
    clientPhone,
    clientEmail,
    technologies,
    meetingLink,
    meetingDate,
    meetingTime,
    budget,
    pitchedPrice,
    deliveryDate,
  };

  if (!salesUserId) {
    return { error: "Select a sales employee first.", values };
  }

  if (clientName.length < 2 || clientName.length > 120) {
    return { error: "Client name must be between 2 and 120 characters.", values };
  }

  if (clientPhone && !/^[0-9+\-()\s]{7,20}$/.test(clientPhone)) {
    return { error: "Enter a valid client phone number.", values };
  }

  if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return { error: "Enter a valid client email address.", values };
  }

  if (technologies.length === 0) {
    return { error: "Select at least one technology.", values };
  }

  if (technologies.some((item) => !SALES_TECH_OPTIONS.includes(item as (typeof SALES_TECH_OPTIONS)[number]))) {
    return { error: "One or more selected technologies are invalid.", values };
  }

  if (meetingLink && !/^https?:\/\//i.test(meetingLink)) {
    return { error: "Meeting link must start with http:// or https://", values };
  }

  const parsedBudget = Number(budget || "0");
  const parsedPitchedPrice = Number(pitchedPrice || "0");

  if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
    return { error: "Budget must be a valid positive number.", values };
  }

  if (!Number.isFinite(parsedPitchedPrice) || parsedPitchedPrice < 0) {
    return { error: "Pitched price must be a valid positive number.", values };
  }

  await connectDb();

  const salesUser = await UserModel.findById(salesUserId, { role: 1, status: 1 }).lean();

  if (!salesUser || salesUser.role !== "SALES") {
    return { error: "Selected sales employee is invalid.", values };
  }

  if (salesUser.status !== "ACTIVE") {
    return { error: "Selected sales employee must be active.", values };
  }

  const lead = await SalesLeadModel.create({
    salesUserId,
    clientName,
    clientPhone,
    clientEmail,
    technologies,
    meetingLink,
    meetingDate,
    meetingTime,
    budget: parsedBudget,
    pitchedPrice: parsedPitchedPrice,
    deliveryDate,
  });

  await UserModel.findByIdAndUpdate(salesUserId, {
    $addToSet: { leadIds: lead._id.toString() },
  });

  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard");

  return {
    success: "Sales client record added successfully.",
    values: {
      salesUserId,
      technologies,
      meetingDate,
      meetingTime,
      budget: "",
      pitchedPrice: "",
      deliveryDate,
    },
  };
}
