"use client";

import { FileText, Trash2, RefreshCw } from "lucide-react";
import type { Document } from "@/lib/types";
import { Button } from "@/components/ui/Button";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300",
  processing: "bg-blue-500/20 text-blue-300",
  ready: "bg-green-500/20 text-green-300",
  failed: "bg-red-500/20 text-red-300",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  doc: Document;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}

export function DocumentCard({ doc, onDelete, onReprocess }: Props) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="rounded-lg bg-brand-600/20 p-2 shrink-0">
          <FileText className="h-5 w-5 text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white truncate">{doc.original_filename}</p>
          <p className="text-sm text-slate-400">
            {formatBytes(doc.file_size)}
            {doc.page_count != null && ` · ${doc.page_count} pages`}
            {doc.chunk_count > 0 && ` · ${doc.chunk_count} chunks`}
          </p>
          {doc.error_message && (
            <p className="text-xs text-red-400 mt-1 truncate">{doc.error_message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[doc.status]}`}>
          {doc.status}
        </span>
        {(doc.status === "failed" || doc.status === "ready") && (
          <Button variant="ghost" className="!w-auto p-2" onClick={() => onReprocess(doc.id)} title="Reprocess">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" className="!w-auto p-2" onClick={() => onDelete(doc.id)} title="Delete">
          <Trash2 className="h-4 w-4 text-red-400" />
        </Button>
      </div>
    </div>
  );
}
