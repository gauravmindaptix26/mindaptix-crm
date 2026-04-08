"use client";

import { useActionState } from "react";
import { updateCompanySettings } from "@/features/dashboard/actions/settings";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import type { SettingsPageData } from "@/features/dashboard/types";

type SettingsPanelProps = {
  data: SettingsPageData;
};

const INITIAL_SETTINGS_STATE = {
  values: {
    companyName: "",
    workStart: "09:00",
    workEnd: "18:00",
    leavePolicy: "",
  },
};

export function SettingsPanel({ data }: SettingsPanelProps) {
  const [state, formAction, pending] = useActionState(updateCompanySettings, {
    ...INITIAL_SETTINGS_STATE,
    values: {
      companyName: data.companyName,
      workStart: data.workStart,
      workEnd: data.workEnd,
      leavePolicy: data.leavePolicy,
    },
  });

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">Settings</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Company Settings</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Manage company name, working hours, and a simple leave policy for the MVP system.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          {state.error ? <Feedback>{state.error}</Feedback> : null}
          {state.success ? <Feedback tone="success">{state.success}</Feedback> : null}

          <Field
            defaultValue={state.values?.companyName}
            label="Company Name"
            name="companyName"
            placeholder="Enter company name"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field defaultValue={state.values?.workStart} label="Work Start" name="workStart" placeholder="09:00" type="time" />
            <Field defaultValue={state.values?.workEnd} label="Work End" name="workEnd" placeholder="18:00" type="time" />
          </div>

          <TextAreaField
            defaultValue={state.values?.leavePolicy}
            label="Leave Policy"
            name="leavePolicy"
            placeholder="Write a short leave policy"
          />

          <Button className="sm:w-auto" disabled={pending} type="submit">
            {pending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </section>
    </div>
  );
}

type FieldProps = {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
};

function Field({ defaultValue, label, name, placeholder, type = "text" }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ${
          type === "time" ? "[color-scheme:light]" : ""
        }`}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

function TextAreaField({ defaultValue, label, name, placeholder }: Omit<FieldProps, "type">) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}



