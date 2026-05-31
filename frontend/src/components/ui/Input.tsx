"use client";

import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="label-caps">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "focus-glow w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted backdrop-blur-xl transition-all duration-200",
          "border-white/[0.06] focus:border-cyan/60 focus:shadow-[0_0_20px_rgba(0,212,255,0.2)]",
          error && "border-error/50",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="font-mono text-[10px] text-ink-muted">{hint}</p>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
