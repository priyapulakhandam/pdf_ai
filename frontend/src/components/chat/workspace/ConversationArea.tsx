"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatSession, Citation, Message } from "@/lib/types";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { ChatComposer } from "./ChatComposer";
import { RetrievalLoader } from "./RetrievalLoader";

export type StreamPhase = "idle" | "retrieving" | "streaming";

interface ConversationAreaProps {
  session: ChatSession | null;
  messages: Message[];
  streamPhase: StreamPhase;
  streamContent: string;
  streamCitations: Citation[] | null;
  onSend: (content: string) => void;
  sending: boolean;
}

export function ConversationArea({
  session,
  messages,
  streamPhase,
  streamContent,
  streamCitations,
  onSend,
  sending,
}: ConversationAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent, streamPhase]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.07] px-4 py-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="truncate font-display text-lg font-semibold tracking-tight text-ink-primary">
            {session?.title || "Select a conversation"}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            {session
              ? `${session.document_ids.length} indexed documents · RAG mode`
              : "Awaiting session"}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="custom-scroll flex-1 overflow-y-auto px-4 py-6 pb-36 md:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {!session ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[50vh] flex-col items-center justify-center text-center"
            >
              <div className="mb-6 h-16 w-16 rounded-2xl bg-cyan/10 shadow-glow" />
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Your knowledge terminal
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">
                Select a session or create a new chat to query your indexed PDFs with grounded
                citations.
              </p>
            </motion.div>
          ) : messages.length === 0 && streamPhase === "idle" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl px-6 py-12 text-center"
            >
              <p className="font-display text-lg font-medium">Ready to analyze</p>
              <p className="mt-2 text-sm text-ink-muted">
                Ask about summaries, clauses, data points, or specific sections.
              </p>
            </motion.div>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                citations={m.citations}
                createdAt={m.created_at}
              />
            ))
          )}

          <AnimatePresence mode="wait">
            {streamPhase === "retrieving" && <RetrievalLoader key="retrieve" />}
            {streamPhase === "streaming" && !streamContent && (
              <TypingIndicator key="typing" />
            )}
          </AnimatePresence>

          {streamPhase === "streaming" && streamContent && (
            <MessageBubble
              role="assistant"
              content={streamContent}
              citations={streamCitations}
              streaming
            />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <ChatComposer onSend={onSend} disabled={!session || sending} />
    </div>
  );
}
