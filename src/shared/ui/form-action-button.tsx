"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { emitDashboardSync } from "@/features/dashboard/lib/live-sync";
import { Button } from "@/shared/ui/button";

type FormActionButtonProps = React.ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function FormActionButton({ children, disabled, pendingLabel, ...props }: FormActionButtonProps) {
  const { pending } = useFormStatus();
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (pending) {
      hasSubmitted.current = true;
      return;
    }

    if (hasSubmitted.current) {
      hasSubmitted.current = false;
      emitDashboardSync("form-settled");
    }
  }, [pending]);

  return (
    <Button disabled={disabled || pending} {...props}>
      {pending ? pendingLabel ?? "Saving..." : children}
    </Button>
  );
}
