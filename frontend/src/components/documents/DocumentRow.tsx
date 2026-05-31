"use client";

import { motion } from "framer-motion";
import { Calendar, FileText, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { Document } from "@/lib/types";
import { cn, formatRelativeTime, statusLabel } from "@/lib/utils";

const statusStyles: Record<string, { badge: string; bar: string }> = {
  pending: { badge: "bg-amber-accent/15 text-amber-accent border-amber-accent/30", bar: "bg-amber-accent" },
  processing: { badge: "bg-cyan/15 text-cyan border-cyan/30", bar: "bg-cyan" },
  ready: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", bar: "bg-emerald-500" },
  failed: { badge: "bg-red-500/15 text-red-400 border-red-500/30", bar: "bg-red-500" },
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentRowProps {
  doc: Document;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}

export function DocumentRow({ doc, onDelete, onReprocess }: DocumentRowProps) {
  const styles = statusStyles[doc.status];
  const isProcessing = doc.status === "processing" || doc.status === "pending";

  return (
    <motion.div
      layout
      whileHover={{ y: -4, boxShadow: "0 0 20px rgba(0,212,255,0.08)" }}
      className="glass relative flex flex-col gap-4 overflow-hidden rounded-xl p-4 sm:flex-row sm:items-center"
    >
      <div className={`absolute bottom-0 left-0 top-0 w-1 ${styles.bar}`} />

      <div className="flex flex-1 items-start gap-4 min-w-0 pl-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/10">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan" />
          ) : (
            <FileText className="h-5 w-5 text-cyan" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{doc.original_filename}</p>
          <p className="mt-1 font-mono text-[10px] text-ink-muted">
            {formatBytes(doc.file_size)}
            {doc.page_count != null && ` · ${doc.page_count} pages`}
            {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
            {" · "}
            <Calendar className="inline h-3 w-3" /> {formatRelativeTime(doc.created_at)}
          </p>
          {doc.error_message && (
            <p className="mt-1 text-xs text-red-400">{doc.error_message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-2 sm:pl-0">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide",
            styles.badge
          )}
        >
          {doc.status === "ready" ? "READY" : statusLabel(doc.status).toUpperCase()}
        </span>
        {(doc.status === "failed" || doc.status === "ready") && (
          <button
            type="button"
            onClick={() => onReprocess(doc.id)}
            className="rounded-lg p-2 text-ink-muted hover:text-cyan active:scale-[0.97]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(doc.id)}
          className="rounded-lg p-2 text-ink-muted hover:text-red-400 active:scale-[0.97]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
