import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
