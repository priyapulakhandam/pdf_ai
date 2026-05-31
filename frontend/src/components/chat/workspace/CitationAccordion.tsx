"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";
import type { Citation } from "@/lib/types";
import { cn } from "@/lib/utils";

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[10px] text-ink-muted">
        <span>Similarity</span>
        <span className="text-cyan">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-cyan/60 via-cyan to-teal-400"
          style={{ boxShadow: "0 0 8px rgba(0,212,255,0.4)" }}
        />
      </div>
    </div>
  );
}

function CitationItem({ citation, index }: { citation: Citation; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const score = citation.score ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03] active:scale-[0.99]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan/10 font-mono text-[11px] font-bold text-cyan">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-primary">{citation.document_name}</p>
          <p className="font-mono text-[10px] text-ink-muted">
            {citation.page_number != null ? `Page ${citation.page_number}` : "Page —"}
            {citation.score != null && ` · ${Math.round(citation.score * 100)}% match`}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="space-y-3 p-3">
              {citation.score != null && <SimilarityBar score={score} />}
              <p className="rounded-lg bg-void/60 p-3 font-mono text-xs leading-6 text-ink-secondary">
                {citation.excerpt}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CitationAccordion({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-cyan" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          {citations.length} source{citations.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {citations.map((c, i) => (
          <CitationItem key={`${c.document_id}-${c.chunk_index}-${i}`} citation={c} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
