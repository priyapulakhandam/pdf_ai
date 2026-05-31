"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  FileSearch,
  RotateCcw,
} from "lucide-react";
import type { Citation, Message, MessageConfidence } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBlockProps {
  message: Message;
  streaming?: boolean;
  onRephrase?: () => void;
}

function ConfidenceMeter({ score }: { score: number }) {
  const pct = Math.min(Math.max(score * 100, 0), 100);

  return (
    <div className="relative mt-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
          style={{ width: "100%" }}
        />
      </div>
      <div
        className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        style={{ left: `calc(${pct}% - 1px)` }}
      />
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-muted">
        <span>Match strength</span>
        <span className="text-amber-400">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function InsufficientContextCard({ onRephrase }: { onRephrase?: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 shadow-[0_0_24px_rgba(245,158,11,0.08)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold tracking-display text-ink-primary">
            I couldn&apos;t find relevant information in your documents for this question
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            The retrieved passages didn&apos;t meet the minimum relevance threshold. Try a different
            approach below.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRephrase}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-secondary transition hover:border-cyan/30 hover:text-cyan active:scale-[0.97]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try rephrasing
            </button>
            <Link
              href="/dashboard/documents"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-secondary transition hover:border-cyan/30 hover:text-cyan active:scale-[0.97]"
            >
              <FileSearch className="h-3.5 w-3.5" />
              Check a different document
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LowConfidenceBanner({ confidence }: { confidence: MessageConfidence }) {
  return (
    <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-medium text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Weak match found in documents — this answer may be incomplete
      </p>
      <ConfidenceMeter score={confidence.confidence_score} />
    </div>
  );
}

function StreamingMarkdown({ content, streaming }: { content: string; streaming?: boolean }) {
  const prevLen = useRef(0);
  const newStart = streaming ? prevLen.current : content.length;

  useEffect(() => {
    prevLen.current = content.length;
  }, [content]);

  if (!streaming) {
    return (
      <div className="prose-chat">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  const stable = content.slice(0, newStart);
  const fresh = content.slice(newStart);

  return (
    <div className="text-[15px] leading-7 text-ink-secondary">
      <span>{stable}</span>
      {fresh.split("").map((char, i) => (
        <motion.span
          key={`${newStart}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.08 }}
        >
          {char}
        </motion.span>
      ))}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-cursor bg-cyan align-middle" />
    </div>
  );
}

function CitationBlock({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mt-3"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-ink-secondary transition hover:border-cyan/30 hover:shadow-glow active:scale-[0.97]"
      >
        <span>📎</span>
        <span>
          {citations.length} source{citations.length > 1 ? "s" : ""} found
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-2 overflow-hidden"
          >
            {citations.map((c, i) => (
              <div key={`${c.document_id}-${c.chunk_index}-${i}`} className="glass-card p-3">
                <p className="truncate text-sm font-medium">{c.document_name}</p>
                <p className="mt-1 font-mono text-[10px] text-ink-muted">
                  {c.page_number != null ? `Page ${c.page_number}` : "Page —"}
                  {c.score != null && ` · ${Math.round(c.score * 100)}% match`}
                </p>
                <p className="mt-2 rounded-lg border border-white/[0.04] bg-void/60 p-2 font-mono text-xs leading-5 text-ink-secondary">
                  {c.excerpt}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MessageBlock({ message, streaming, onRephrase }: MessageBlockProps) {
  const isUser = message.role === "user";
  const confidence = message.confidence;
  const insufficient = confidence?.insufficient_context === true;
  const level = confidence?.confidence_level;

  if (!isUser && insufficient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start gap-3"
      >
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
          <Bot className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="max-w-[88%] flex-1 md:max-w-[78%]">
          <InsufficientContextCard onRephrase={onRephrase} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex", isUser ? "justify-end" : "justify-start gap-3")}
    >
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 shadow-glow">
          <Bot className="h-3.5 w-3.5 text-cyan" />
        </div>
      )}

      <div className={cn("max-w-[88%] md:max-w-[78%]", !isUser && "relative flex-1")}>
        {!isUser && level === "medium" && confidence && (
          <span className="absolute -top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="h-3 w-3" />
            Moderate confidence
          </span>
        )}

        {!isUser && level === "low" && confidence && !streaming && (
          <LowConfidenceBanner confidence={confidence} />
        )}

        <div
          className={cn(
            isUser
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-cyan-600 px-4 py-3 shadow-[0_4px_24px_rgba(0,212,255,0.15)]"
              : "glass rounded-2xl rounded-bl-md px-4 py-3",
            !isUser && level === "medium" &&
              "border-l-2 border-l-warning shadow-[inset_2px_0_12px_rgba(245,158,11,0.15)]",
            !isUser && level === "high" && "border-l border-l-cyan",
            !isUser && level === "low" && "border-l-2 border-l-amber-500/50"
          )}
        >
          {isUser ? (
            <p className="text-[15px] leading-7 text-white">{message.content}</p>
          ) : (
            <StreamingMarkdown content={message.content} streaming={streaming} />
          )}
        </div>

        {!isUser && message.citations && message.citations.length > 0 && !streaming && (
          <CitationBlock citations={message.citations} />
        )}
      </div>
    </motion.div>
  );
}
