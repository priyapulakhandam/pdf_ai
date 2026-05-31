"use client";

import { motion } from "framer-motion";

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const pct = (score / 4) * 100;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const label = labels[Math.max(0, score - 1)] || "Weak";

  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
          className="h-full rounded-full bg-gradient-to-r from-error via-warning to-cyan"
          style={{ boxShadow: score >= 3 ? "0 0 10px rgba(0,212,255,0.4)" : undefined }}
        />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
        Strength: <span className="text-ink-secondary">{label}</span>
      </p>
    </div>
  );
}
