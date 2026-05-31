"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition active:scale-[0.97]",
        variant === "primary" && "glow-btn",
        variant === "secondary" &&
          "border border-white/[0.06] bg-white/[0.03] text-ink-secondary hover:border-cyan/30 hover:shadow-glow",
        variant === "ghost" && "text-ink-muted hover:text-cyan",
        (disabled || loading) && "cursor-not-allowed opacity-50",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading…" : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
