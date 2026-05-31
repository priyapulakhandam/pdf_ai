"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Document } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export function NewChatDialog({ open, onClose, onCreated }: NewChatDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .listDocuments()
      .then((r) => setDocuments(r.documents.filter((d) => d.status === "ready")))
      .catch(() => toast.error("Failed to load documents"))
      .finally(() => setLoading(false));
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const create = async () => {
    if (!selected.length) {
      toast.error("Select at least one indexed PDF");
      return;
    }
    setCreating(true);
    try {
      const session = await api.createSession("New Chat", selected);
      onCreated(session.id);
      setSelected([]);
    } catch {
      toast.error("Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={(e) => e.stopPropagation()}
          className="glass w-full max-w-lg rounded-2xl p-6 shadow-lift"
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">New session</h3>
              <p className="mt-1 text-sm text-ink-muted">Select PDFs to query together</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-muted hover:bg-white/[0.05] active:scale-[0.97]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="custom-scroll max-h-64 space-y-2 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-cyan" />
              </div>
            ) : documents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/[0.08] py-10 text-center text-sm text-ink-muted">
                No indexed documents. Upload PDFs first.
              </p>
            ) : (
              documents.map((doc) => {
                const checked = selected.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggle(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition active:scale-[0.99]",
                      checked
                        ? "border-cyan/40 bg-cyan/10 shadow-[0_0_12px_rgba(0,212,255,0.1)]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-cyan/20"
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-cyan" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.original_filename}</p>
                      <p className="font-mono text-[10px] text-ink-muted">
                        {doc.chunk_count} chunks · {doc.page_count ?? "—"} pages
                      </p>
                    </div>
                    <div
                      className={cn(
                        "h-4 w-4 rounded border",
                        checked ? "border-cyan bg-cyan" : "border-white/20"
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm text-ink-secondary transition hover:bg-white/[0.04] active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={create}
              disabled={creating || !selected.length}
              className="glow-btn flex-1 rounded-xl py-2.5 text-sm disabled:opacity-40"
            >
              {creating ? "Creating…" : "Launch chat"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
