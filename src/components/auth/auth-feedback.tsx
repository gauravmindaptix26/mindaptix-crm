type AuthFeedbackProps = {
  children: string;
  tone?: "error" | "success";
};

const toneClasses = {
  error: "border-red-200 bg-red-50 text-red-800 shadow-[0_10px_25px_rgba(239,68,68,0.08)]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_10px_25px_rgba(16,185,129,0.08)]",
} as const;

export function AuthFeedback({ children, tone = "error" }: AuthFeedbackProps) {
  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${toneClasses[tone]}`}>{children}</div>;
}
