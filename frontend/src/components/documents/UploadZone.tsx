"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { FileUp, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onUpload: (files: FileList) => void;
  uploading?: boolean;
}

export function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <motion.label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onUpload(e.dataTransfer.files);
      }}
      whileHover={{ y: -2 }}
      className={cn(
        "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300",
        dragging
          ? "border-cyan bg-cyan/5 shadow-[0_0_30px_rgba(0,212,255,0.2)]"
          : "border-white/[0.1] bg-white/[0.02] hover:border-cyan/40",
        uploading && "pointer-events-none opacity-60"
      )}
    >
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        disabled={uploading}
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />
      <div
        className={cn(
          "mb-4 rounded-xl p-3 transition",
          dragging ? "bg-cyan/20 shadow-glow" : "bg-cyan/10"
        )}
      >
        {uploading ? (
          <FileUp className="h-7 w-7 animate-pulse text-cyan" />
        ) : (
          <Upload className="h-7 w-7 text-cyan" />
        )}
      </div>
      <p className="font-display text-lg font-semibold">
        {uploading ? "Uploading files…" : "Drop PDFs here"}
      </p>
      <p className="mt-2 text-sm text-ink-muted">or click to browse · multi-file supported</p>
    </motion.label>
  );
}
