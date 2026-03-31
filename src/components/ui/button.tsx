import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-blue-400/30 bg-gradient-to-r from-blue-500 via-blue-500 to-blue-700 text-white shadow-[0_16px_40px_rgba(37,99,235,0.32)] hover:from-blue-400 hover:to-blue-600",
  secondary:
    "border border-white/12 bg-white/[0.05] text-slate-100 hover:border-white/20 hover:bg-white/[0.08]",
};

export function Button({
  children,
  className = "",
  icon,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${variantClasses[variant]} ${className}`}
      type={type}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
