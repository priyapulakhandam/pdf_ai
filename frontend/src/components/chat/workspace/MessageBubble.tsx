"use client";

import { useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { Citation } from "@/lib/types";
import { CitationAccordion } from "./CitationAccordion";

interface StreamingTextProps {
  content: string;
  streaming?: boolean;
}

export function StreamingText({ content, streaming }: StreamingTextProps) {
  const prevLen = useRef(0);
  const newCharsStart = streaming ? prevLen.current : content.length;

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

  const stable = content.slice(0, newCharsStart);
  const fresh = content.slice(newCharsStart);

  return (
    <div className="text-[15px] leading-7 text-ink-secondary">
      <span>{stable}</span>
      {fresh.split("").map((char, i) => (
        <motion.span
          key={`${newCharsStart}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {char}
        </motion.span>
      ))}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-cursor bg-cyan align-middle" />
    </div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.55,
              repeat: Infinity,
              delay: i * 0.14,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-xs italic text-ink-muted">
        PDFChat is thinking...
      </span>
    </motion.div>
  );
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[] | null;
  streaming?: boolean;
  createdAt?: string;
}

export function MessageBubble({
  role,
  content,
  citations,
  streaming,
  createdAt,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[88%] md:max-w-[75%] ${isUser ? "" : "w-full"}`}>
        {!isUser && (
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan/70">
            PDFChat
          </p>
        )}

        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-md bg-cyan/15 px-4 py-3 ring-1 ring-cyan/25"
              : "glass rounded-2xl rounded-bl-md border-l-2 border-l-cyan px-4 py-3"
          }
        >
          {isUser ? (
            <p className="text-[15px] leading-7 text-ink-primary">{content}</p>
          ) : (
            <StreamingText content={content} streaming={streaming} />
          )}
        </div>

        {!isUser && citations && citations.length > 0 && !streaming && (
          <CitationAccordion citations={citations} />
        )}

        {createdAt && (
          <p className={`mt-2 font-mono text-[10px] text-ink-muted ${isUser ? "text-right" : ""}`}>
            {new Date(createdAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
