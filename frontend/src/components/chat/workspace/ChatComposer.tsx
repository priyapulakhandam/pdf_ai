"use client";

import { useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/95 to-transparent px-4 pb-4 pt-10 md:px-6 md:pb-6">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 24px rgba(0,212,255,0.25), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
          className={cn(
            "flex items-end gap-2 rounded-full border bg-white/[0.04] p-2 backdrop-blur-xl transition-colors",
            focused ? "border-cyan/40" : "border-white/[0.08]"
          )}
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            rows={1}
            placeholder="Ask anything about your documents…"
            className="focus-glow max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-4 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none disabled:opacity-50"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <motion.button
            type="button"
            whileHover={{ rotate: 45, scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan text-void shadow-glow transition-shadow hover:shadow-[0_0_28px_rgba(0,212,255,0.5)] disabled:opacity-30"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        </motion.div>
        <p className="mt-2 text-center font-mono text-[10px] text-ink-muted">
          Grounded answers · Source citations included
        </p>
      </div>
    </div>
  );
}
