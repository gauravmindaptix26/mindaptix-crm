"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { loginUser } from "@/features/auth/actions";
import { Feedback } from "@/shared/ui/feedback";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { TextField } from "@/shared/ui/text-field";
import { INITIAL_AUTH_FORM_STATE } from "@/features/auth/lib/auth-form-state";

type LoginCardProps = {
  registered?: boolean;
  signupClosed?: boolean;
};

export function LoginCard({ registered = false, signupClosed = false }: LoginCardProps) {
  const [state, formAction, pending] = useActionState(loginUser, INITIAL_AUTH_FORM_STATE);

  return (
    <Card className="crm-panel w-full max-w-[30rem] rounded-[2rem] px-5 py-3.5 sm:px-7 sm:py-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Image
            alt="Mindaptix CRM"
            className="h-auto w-auto max-w-[10.5rem] object-contain"
            height={68}
            priority
            src="/3.png"
            width={168}
          />
        </div>
        <h2 className="text-[1.7rem] font-semibold tracking-tight text-white sm:text-[2.1rem]">
          <span className="inline-block min-w-[18rem] whitespace-nowrap sm:min-w-[20rem]">Welcome Back to</span>{" "}
          <span className="mt-1 block whitespace-nowrap bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
            Mindaptix CRM
          </span>
        </h2>
      </div>

      <form action={formAction} autoComplete="off" className="mt-4 space-y-2.5">
        {registered ? <Feedback tone="success">Account created. Please log in to continue.</Feedback> : null}
        {state.error ? <Feedback>{state.error}</Feedback> : null}
        <Feedback tone="success">
          Employees and admins should use the login credentials created by their Super Admin.
        </Feedback>

        <TextField
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          defaultValue={state.values?.email}
          label="Email address"
          name="email"
          placeholder="Email Address"
          required
          spellCheck={false}
          type="email"
        />
        {state.fieldErrors?.email ? <p className="px-1 text-sm text-red-300">{state.fieldErrors.email}</p> : null}

        <TextField
          autoComplete="new-password"
          className="px-3 py-2.5 text-[0.95rem]"
          label="Password"
          name="password"
          placeholder="Password"
          required
          trailing={<EyeIcon />}
          trailingClassName="pr-3 [&_svg]:h-[18px] [&_svg]:w-[18px]"
          type="password"
        />
        {state.fieldErrors?.password ? (
          <p className="px-1 text-sm text-red-300">{state.fieldErrors.password}</p>
        ) : null}

        <Button className="mt-1" disabled={pending} type="submit">
          {pending ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="mt-3.5 flex items-center gap-4 text-sm text-slate-400">
        <span className="h-px flex-1 bg-white/12" />
        <span>or</span>
        <span className="h-px flex-1 bg-white/12" />
      </div>

      <Button className="mt-3.5" disabled icon={<GoogleMark />} variant="secondary">
        Login with Google
      </Button>

      <p className="mt-4 text-center text-sm text-slate-400">
        {signupClosed ? (
          "Need an account? Contact your Super Admin to create one for you."
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-blue-300 transition hover:text-blue-200" href="/register">
              Create one
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" fill="currentColor" r="2.25" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M21.82 12.23c0-.73-.07-1.43-.18-2.1H12v3.98h5.52a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.52Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.91 6.78-2.45l-3.3-2.56c-.91.62-2.08.99-3.48.99-2.67 0-4.94-1.8-5.75-4.22H2.84v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.25 13.76a5.98 5.98 0 0 1 0-3.52V7.6H2.84a10 10 0 0 0 0 8.8l3.41-2.64Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.02c1.5 0 2.84.52 3.89 1.55l2.9-2.9C17.07 3.06 14.75 2 12 2A10 10 0 0 0 2.84 7.6l3.41 2.64C7.06 7.82 9.33 6.02 12 6.02Z"
        fill="#EA4335"
      />
    </svg>
  );
}



