"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

export function RetrievalLoader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="glass max-w-sm rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/10">
          <Search className="h-4 w-4 text-cyan" />
          <motion.span
            className="absolute inset-0 rounded-xl border border-cyan/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">Scanning vectors</p>
          <p className="font-mono text-[10px] text-ink-muted">Qdrant semantic retrieval…</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {[88, 72, 56].map((w, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-white/[0.06]"
            initial={{ width: 0 }}
            animate={{ width: `${w}%` }}
            transition={{ duration: 0.8, delay: i * 0.12, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
