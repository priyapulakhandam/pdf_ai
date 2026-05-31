"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Document, DocumentStatus } from "@/lib/types";
import { cn, formatBytes, formatRelativeTime } from "@/lib/utils";

const STATUS_STRIP: Record<DocumentStatus, string> = {
  ready: "bg-success",
  processing: "bg-cyan",
  pending: "bg-warning",
  failed: "bg-error",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4 },
  }),
};

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.listDocuments();
      setDocuments(res.documents);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleUpload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (!list.length) {
      toast.error("Please upload PDF files only");
      return;
    }
    setUploading(true);
    setUploadPct(0);
    try {
      for (let i = 0; i < list.length; i++) {
        await api.uploadDocument(list[i]);
        setUploadPct(Math.round(((i + 1) / list.length) * 100));
      }
      toast.success("Upload complete — indexing started");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 pb-24 md:pb-8">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
        <p className="label-caps text-cyan/80">Documents</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-display">Knowledge Base</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Upload PDFs to index, chunk, and embed for RAG-powered chat.
        </p>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="mt-8">
        <UploadZone
          dragOver={dragOver}
          uploading={uploading}
          onDragOver={setDragOver}
          onUpload={handleUpload}
        />
      </motion.div>

      {uploading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mt-4 flex items-center gap-4 p-4"
        >
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="-rotate-90" width="56" height="56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={150.8}
                strokeDashoffset={150.8 - (uploadPct / 100) * 150.8}
                style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.5))" }}
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-medium text-cyan">{uploadPct}%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-primary">Uploading…</p>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-muted">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-cyan" />
              Processing pipeline queued
            </span>
          </div>
        </motion.div>
      )}

      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-ink-muted" />
            <p className="mt-4 text-ink-muted">No documents yet — drop a PDF above</p>
          </div>
        ) : (
          documents.map((doc, i) => (
            <motion.div key={doc.id} custom={i + 2} variants={fadeUp} initial="hidden" animate="show">
              <DocumentCard
                doc={doc}
                onDelete={async (id) => {
                  if (!confirm("Delete this document?")) return;
                  await api.deleteDocument(id);
                  toast.success("Deleted");
                  load();
                }}
                onReprocess={async (id) => {
                  await api.reprocessDocument(id);
                  toast.success("Reprocessing started");
                  load();
                }}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function UploadZone({
  dragOver,
  uploading,
  onDragOver,
  onUpload,
}: {
  dragOver: boolean;
  uploading: boolean;
  onDragOver: (v: boolean) => void;
  onUpload: (files: FileList | File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(false);
    if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(true);
      }}
      onDragLeave={() => onDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-2xl p-8 transition-all duration-300 active:scale-[0.99]",
        dragOver ? "scale-[1.02] shadow-glow-lg" : "hover:shadow-glow"
      )}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="16"
          fill="rgba(255,255,255,0.02)"
          stroke={dragOver ? "#00d4ff" : "rgba(255,255,255,0.12)"}
          strokeWidth="2"
          strokeDasharray="8 6"
          className="animate-dash-trace"
          style={{ transition: "stroke 0.3s" }}
        />
      </svg>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />

      <div className="relative flex flex-col items-center text-center">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
            dragOver ? "bg-cyan/20 shadow-glow-lg" : "bg-cyan/10 shadow-glow"
          )}
        >
          <Upload className="h-6 w-6 text-cyan" />
        </div>
        <p className="mt-4 font-display text-lg font-bold tracking-display">
          {dragOver ? "Drop to upload" : "Drag & drop PDFs here"}
        </p>
        <p className="mt-1 text-sm text-ink-muted">or click to browse · PDF up to 50MB</p>
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  onDelete,
  onReprocess,
}: {
  doc: Document;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}) {
  const isReady = doc.status === "ready";
  const isProcessing = doc.status === "processing" || doc.status === "pending";

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 0 24px rgba(0,212,255,0.1)" }}
      className="group glass-card relative flex items-center gap-4 overflow-hidden p-4 pl-5 transition hover:bg-cyan/[0.02]"
    >
      <div
        className={cn(
          "absolute bottom-3 left-0 top-3 w-[3px] rounded-full transition-shadow",
          STATUS_STRIP[doc.status],
          isReady && "group-hover:shadow-[0_0_10px_rgba(16,185,129,0.6)]"
        )}
      />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan/10">
        <FileText className="h-5 w-5 text-cyan" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold tracking-display text-ink-primary">
          {doc.original_filename}
        </p>
        <p className="mt-1 font-mono text-[10px] text-ink-muted">
          {formatBytes(doc.file_size)} · {doc.page_count ?? "—"} pages · {doc.chunk_count} chunks ·{" "}
          {formatRelativeTime(doc.created_at)}
        </p>
        {doc.error_message && (
          <p className="mt-1 truncate text-xs text-error">{doc.error_message}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isReady && <StatusBadge status="READY" color="success" dot />}
        {isProcessing && (
          <StatusBadge status="PROCESSING" color="cyan" dot pulse icon={<Loader2 className="h-3 w-3 animate-spin" />} />
        )}
        {doc.status === "failed" && <StatusBadge status="FAILED" color="error" dot />}
        {doc.status === "pending" && <StatusBadge status="PENDING" color="warning" dot pulse />}

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {isReady && (
            <Link
              href="/dashboard/chat"
              className="rounded-lg p-2 text-ink-muted transition hover:bg-white/[0.05] hover:text-cyan active:scale-[0.97]"
              title="Open chat"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
          )}
          {(doc.status === "failed" || doc.status === "ready") && (
            <button
              type="button"
              onClick={() => onReprocess(doc.id)}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-white/[0.05] hover:text-cyan active:scale-[0.97]"
              title="Reprocess"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(doc.id)}
            className="rounded-lg p-2 text-ink-muted transition hover:bg-white/[0.05] hover:text-error active:scale-[0.97]"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({
  status,
  color,
  dot,
  pulse,
  icon,
}: {
  status: string;
  color: "success" | "cyan" | "error" | "warning";
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}) {
  const styles = {
    success: "border-success/30 bg-success/10 text-success",
    cyan: "border-cyan/30 bg-cyan/10 text-cyan",
    error: "border-error/30 bg-error/10 text-error",
    warning: "border-warning/30 bg-warning/10 text-warning",
  };

  const dotColor = {
    success: "bg-success",
    cyan: "bg-cyan",
    error: "bg-error",
    warning: "bg-warning",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
        styles[color]
      )}
    >
      {icon || (dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[color], pulse && "animate-pulse-badge")} />
      ))}
      {status}
    </span>
  );
}
