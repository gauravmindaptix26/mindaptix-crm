"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateAccountPassword, updateCompanySettings } from "@/features/dashboard/actions/settings";
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

const INITIAL_PASSWORD_STATE = {
  values: {
    confirmPassword: "",
    currentPassword: "",
    newPassword: "",
  },
};

export function SettingsPanel({ data }: SettingsPanelProps) {
  const [settingsState, settingsAction, settingsPending] = useActionState(updateCompanySettings, {
    ...INITIAL_SETTINGS_STATE,
    values: {
      companyName: data.companyName,
      workStart: data.workStart,
      workEnd: data.workEnd,
      leavePolicy: data.leavePolicy,
    },
  });
  const [passwordState, passwordAction, passwordPending] = useActionState(updateAccountPassword, INITIAL_PASSWORD_STATE);

  return (
    <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
      <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">Account Settings</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Profile And Password</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          View the signed-in account and set a new password directly from settings.
        </p>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <article className="rounded-[1.7rem] border border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_100%)] p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-600">Signed In Account</p>
            <div className="mt-5 space-y-4">
              <InfoBlock label="Full Name" value={data.currentUserName} />
              <InfoBlock label="Login Email" value={data.currentUserEmail} />
              <InfoBlock label="Role" value={data.currentUserRoleLabel} />
            </div>
          </article>

          <article className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-blue-600">Set New Password</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Change Password</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              If you forgot the old password, set a new strong password here for this account.
            </p>

            <form action={passwordAction} className="mt-5 space-y-4">
              {passwordState.error ? <Feedback>{passwordState.error}</Feedback> : null}
              {passwordState.success ? <Feedback tone="success">{passwordState.success}</Feedback> : null}

              <PasswordField
                defaultValue={passwordState.values?.currentPassword}
                label="Current Password"
                name="currentPassword"
                placeholder="Optional current password"
              />
              <PasswordField
                defaultValue={passwordState.values?.newPassword}
                label="New Password"
                name="newPassword"
                placeholder="Enter new password"
              />
              <PasswordField
                defaultValue={passwordState.values?.confirmPassword}
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Confirm new password"
              />

              <p className="text-xs leading-5 text-slate-500">
                Current password optional hai. Fill karoge to verify hoga, blank chhodoge to direct new password set ho jayega.
              </p>

              <Button className="sm:w-auto" disabled={passwordPending} type="submit">
                {passwordPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </article>
        </div>
      </section>

      {data.canManageCompany ? (
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">Company Settings</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Workspace Controls</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Manage company name, working hours, and leave policy for the CRM workspace.
          </p>

          <form action={settingsAction} className="mt-6 space-y-4">
            {settingsState.error ? <Feedback>{settingsState.error}</Feedback> : null}
            {settingsState.success ? <Feedback tone="success">{settingsState.success}</Feedback> : null}

            <Field
              defaultValue={settingsState.values?.companyName}
              label="Company Name"
              name="companyName"
              placeholder="Enter company name"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field defaultValue={settingsState.values?.workStart} label="Work Start" name="workStart" placeholder="09:00" type="time" />
              <Field defaultValue={settingsState.values?.workEnd} label="Work End" name="workEnd" placeholder="18:00" type="time" />
            </div>

            <TextAreaField
              defaultValue={settingsState.values?.leavePolicy}
              label="Leave Policy"
              name="leavePolicy"
              placeholder="Write a short leave policy"
            />

            <Button className="sm:w-auto" disabled={settingsPending} type="submit">
              {settingsPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_12px_30px_rgba(37,99,235,0.06)]">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-blue-500">{label}</p>
      <p className="mt-2 break-all text-base font-semibold text-slate-950">{value}</p>
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

function PasswordField({
  defaultValue,
  label,
  name,
  placeholder,
}: Omit<FieldProps, "type">) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <input
          className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none"
          defaultValue={defaultValue}
          name={name}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="ml-3 text-sm font-medium text-blue-600"
          onClick={() => setIsVisible((value) => !value)}
          type="button"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}
