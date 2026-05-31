"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { ChatSession, Citation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SessionSidebar } from "./SessionSidebar";
import { ConversationArea, type StreamPhase } from "./ConversationArea";

export function ChatWorkspace() {
  const params = useParams<{ sessionId?: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>("idle");
  const [streamContent, setStreamContent] = useState("");
  const [streamCitations, setStreamCitations] = useState<Citation[] | null>(null);
  const [sending, setSending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"sessions" | "chat">("chat");

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.listSessions();
      setSessions(res.sessions);
    } catch {
      toast.error("Failed to load sessions");
    }
  }, []);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setMessages([]);
      return;
    }
    try {
      const s = await api.getSession(sessionId);
      setSession(s);
      setMessages(s.messages || []);
    } catch {
      toast.error("Session not found");
      router.push("/dashboard/chat");
    }
  }, [sessionId, router]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadSession();
    setStreamPhase("idle");
    setStreamContent("");
    setStreamCitations(null);
    setMobileTab("chat");
  }, [loadSession]);

  const handleSend = async (content: string) => {
    if (!sessionId) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(true);
    setStreamPhase("retrieving");
    setStreamContent("");
    setStreamCitations(null);
    setMobileTab("chat");

    try {
      let full = "";
      const citations: Citation[] = [];
      let started = false;

      for await (const token of api.streamMessage(sessionId, content, {
        onCitations: (c) => {
          if (c) citations.push(...c);
        },
      })) {
        if (!started) {
          started = true;
          setStreamPhase("streaming");
        }
        full += token;
        setStreamContent(full);
      }

      if (citations.length) setStreamCitations(citations);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            full.trim() ||
            "No response. Check GEMINI_API_KEY and GEMINI_MODEL in backend/.env.",
          citations: citations.length ? citations : null,
          created_at: new Date().toISOString(),
        },
      ]);
      setStreamContent("");
      await loadSession();
      await loadSessions();
    } catch (err) {
      const msg = err instanceof ApiError ? String(err.message) : "Request failed";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: msg, created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
      setStreamPhase("idle");
    }
  };

  return (
    <div className="dot-grid flex h-screen flex-col bg-void">
      <div className="flex min-h-0 flex-1">
        <motion.div
          className={cn(
            "min-h-0 shrink-0",
            mobileTab === "sessions" ? "flex w-full md:flex md:w-auto" : "hidden md:flex"
          )}
        >
          <SessionSidebar
            sessions={sessions}
            activeSessionId={sessionId}
            onSessionsChange={loadSessions}
          />
        </motion.div>

        <motion.div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            mobileTab === "chat" ? "flex" : "hidden md:flex"
          )}
        >
          <ConversationArea
            session={session}
            messages={messages}
            streamPhase={streamPhase}
            streamContent={streamContent}
            streamCitations={streamCitations}
            onSend={handleSend}
            sending={sending}
          />
        </motion.div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="border-t border-white/[0.07] bg-void/95 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-2 gap-1 p-2">
          <MobileTab
            active={mobileTab === "sessions"}
            onClick={() => setMobileTab("sessions")}
            icon={MessagesSquare}
            label="Sessions"
          />
          <MobileTab
            active={mobileTab === "chat"}
            onClick={() => setMobileTab("chat")}
            icon={MessageSquare}
            label="Chat"
          />
        </div>
      </nav>
    </div>
  );
}

function MobileTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-medium transition active:scale-[0.97]",
        active ? "text-cyan" : "text-ink-muted"
      )}
    >
      {active && (
        <motion.div
          layoutId="mobile-chat-tab"
          className="absolute inset-0 rounded-xl bg-cyan/10 shadow-[0_0_12px_rgba(0,212,255,0.15)]"
        />
      )}
      <Icon className="relative h-5 w-5" />
      <span className="relative">{label}</span>
    </button>
  );
}
