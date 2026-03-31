type AuthFeedbackProps = {
  children: string;
  tone?: "error" | "success";
};

const toneClasses = {
  error: "border-red-400/20 bg-red-500/10 text-red-100",
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
} as const;

export function AuthFeedback({ children, tone = "error" }: AuthFeedbackProps) {
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[tone]}`}>{children}</div>;
}
