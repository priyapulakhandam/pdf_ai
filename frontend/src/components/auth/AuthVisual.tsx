"use client";

import { motion } from "framer-motion";
import { Bot, FileText, Sparkles } from "lucide-react";

export function AuthVisual() {
  const orbit = [0, 1, 2, 3, 4, 5];

  return (
    <div className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-card/50 to-void lg:min-h-full">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.1)_0%,transparent_55%)]" />
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-40 w-40 rounded-full bg-cyan/10 blur-3xl"
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="relative h-52 w-52"
      >
        {orbit.map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2"
            style={{ transform: `rotate(${i * 60}deg) translateY(-88px)` }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="glass flex h-11 w-11 items-center justify-center rounded-xl shadow-glow"
            >
              <FileText className="h-4 w-4 text-cyan" />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      <div className="absolute flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/30 bg-cyan/15 shadow-glow-lg">
          <Sparkles className="h-7 w-7 text-cyan" />
        </div>
        <p className="label-caps mt-4 text-cyan/70">Neural index</p>
      </div>

      <div className="absolute bottom-8 left-8 right-8 hidden lg:block">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan/10">
              <Bot className="h-3 w-3 text-cyan" />
            </div>
            <p className="font-mono text-[10px] text-ink-muted">RAG pipeline active</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-secondary">
            Upload → chunk → embed → query with grounded citations.
          </p>
        </div>
      </div>
    </div>
  );
}
