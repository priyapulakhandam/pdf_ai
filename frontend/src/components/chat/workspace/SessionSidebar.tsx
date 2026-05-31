"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, MessageSquarePlus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ChatSession } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NewChatDialog } from "./NewChatDialog";

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionsChange: () => void;
}

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSessionsChange,
}: SessionSidebarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, query]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await api.deleteSession(id);
      toast.success("Deleted");
      onSessionsChange();
      if (activeSessionId === id) router.push("/dashboard/chat");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      <aside className="flex h-full w-full flex-col border-r border-white/[0.07] bg-white/[0.02] md:w-[300px] lg:w-[320px]">
        <div className="border-b border-white/[0.07] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink-primary">
                PDFChat
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/70">
                Sessions
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-ink-muted transition hover:bg-white/[0.05] hover:text-cyan active:scale-[0.97]"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="focus-glow w-full rounded-xl border border-white/[0.07] bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-muted"
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNew(true)}
            className="glow-btn mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </motion.button>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-2">
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mx-2 mt-8 rounded-xl border border-dashed border-white/[0.08] px-4 py-10 text-center"
              >
                <p className="text-sm text-ink-muted">No conversations yet</p>
                <button
                  type="button"
                  onClick={() => setShowNew(true)}
                  className="mt-3 inline-flex items-center gap-1 text-sm text-cyan hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Start one
                </button>
              </motion.div>
            ) : (
              filtered.map((session) => {
                const active = session.id === activeSessionId;
                const preview =
                  session.title === "New Chat"
                    ? "Start a conversation…"
                    : session.title;

                return (
                  <Link key={session.id} href={`/dashboard/chat/${session.id}`} className="group block">
                    <motion.div
                      layout
                      whileHover={{ x: 2 }}
                      className={cn(
                        "relative mb-1 rounded-xl px-3 py-3 transition-all active:scale-[0.99]",
                        active
                          ? "bg-cyan/10 shadow-[0_0_16px_rgba(0,212,255,0.12)]"
                          : "hover:bg-white/[0.04]"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="session-indicator"
                          className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-cyan shadow-[0_0_8px_rgba(0,212,255,0.8)]"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2 pl-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              active ? "text-ink-primary" : "text-ink-secondary"
                            )}
                          >
                            {session.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{preview}</p>
                          <p className="mt-1.5 font-mono text-[10px] text-ink-muted/80">
                            {session.document_ids.length} docs · {formatRelativeTime(session.updated_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, session.id)}
                          className="rounded-md p-1.5 text-ink-muted opacity-0 transition hover:bg-white/[0.06] hover:text-red-400 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  </Link>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </aside>

      <NewChatDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(id) => {
          setShowNew(false);
          onSessionsChange();
          router.push(`/dashboard/chat/${id}`);
        }}
      />
    </>
  );
}
