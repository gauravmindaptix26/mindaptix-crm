"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
};

export function TextField({
  className = "",
  icon,
  label,
  trailing,
  ...props
}: TextFieldProps) {
  const isPasswordField = props.type === "password";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const resolvedType = isPasswordField && isPasswordVisible ? "text" : props.type;

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="group flex items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.05] transition duration-200 focus-within:border-blue-400/50 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_0_1px_rgba(96,165,250,0.16)]">
        {icon ? (
          <span className="pl-4 text-slate-400 transition duration-200 group-focus-within:text-blue-300">
            {icon}
          </span>
        ) : null}
        <input
          className={`min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-slate-500 ${className}`}
          {...props}
          type={resolvedType}
        />
        {trailing ? (
          isPasswordField ? (
            <button
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              className="pr-4 text-slate-400 transition duration-200 group-focus-within:text-blue-300"
              onClick={() => setIsPasswordVisible((value) => !value)}
              type="button"
            >
              {trailing}
            </button>
          ) : (
            <span className="pr-4 text-slate-400 transition duration-200 group-focus-within:text-blue-300">
              {trailing}
            </span>
          )
        ) : null}
      </div>
    </label>
  );
}
