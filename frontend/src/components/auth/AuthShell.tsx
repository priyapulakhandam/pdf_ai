"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AuthVisual } from "./AuthVisual";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-void p-4">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent-blue/[0.05] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        className="glass-card relative w-full max-w-4xl overflow-hidden shadow-lift"
      >
        <div className="grid lg:grid-cols-2">
          <div className="hidden lg:block">
            <AuthVisual />
          </div>
          <div className="p-8 lg:p-10">
            <Link href="/" className="inline-flex items-center gap-1">
              <span className="font-display text-sm font-bold tracking-display text-ink-primary">
                PDF
              </span>
              <span className="font-display text-sm font-bold tracking-display text-cyan">Chat</span>
            </Link>
            <h1 className="mt-6 font-display text-2xl font-bold tracking-display text-ink-primary">
              {title}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
