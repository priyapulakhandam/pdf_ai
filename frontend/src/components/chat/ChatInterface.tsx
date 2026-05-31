"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  FileText,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  MessagesSquare,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MessageBlock } from "@/components/chat/MessageBlock";
import { api, ApiError } from "@/lib/api";
import type { ChatSession, Citation, Document, Message, MessageConfidence } from "@/lib/types";
import { cn, sessionActivityTime, sessionDisplayTitle, sessionPreview } from "@/lib/utils";

type StreamPhase = "idle" | "retrieving" | "streaming";

const SUGGESTIONS = [
  "Summarize this document",
  "Find key clauses",
  "Extract all data points",
  "What are the main findings?",
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

export function ChatInterface() {
  const params = useParams<{ sessionId?: string }>();
  const router = useRouter();
  const sessionId = params?.sessionId;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamPhase, setStreamPhase] = useState<StreamPhase>("idle");
  const [streamContent, setStreamContent] = useState("");
  const [streamCitations, setStreamCitations] = useState<Citation[] | null>(null);
  const [streamConfidence, setStreamConfidence] = useState<MessageConfidence | null>(null);
  const [lastUserQuery, setLastUserQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"sessions" | "chat">("chat");
  const [prefill, setPrefill] = useState("");

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
    setStreamConfidence(null);
    setMobileTab("chat");
  }, [loadSession]);

  const handleSend = async (content: string) => {
    if (!sessionId || !content.trim()) return;

    const trimmed = content.trim();
    setLastUserQuery(trimmed);

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(true);
    setStreamPhase("retrieving");
    setStreamContent("");
    setStreamCitations(null);
    setStreamConfidence(null);
    setPrefill("");
    setMobileTab("chat");

    try {
      let full = "";
      const citations: Citation[] = [];
      let messageConfidence: MessageConfidence | null = null;
      let insufficientContext = false;
      let started = false;

      for await (const token of api.streamMessage(sessionId, trimmed, {
        onCitations: (c) => {
          if (c) citations.push(...c);
        },
        onConfidence: (conf) => {
          messageConfidence = conf;
          insufficientContext = conf.insufficient_context;
          setStreamConfidence(conf);
          if (conf.insufficient_context) {
            setStreamPhase("streaming");
          }
        },
      })) {
        if (!started) {
          started = true;
          if (!insufficientContext) {
            setStreamPhase("streaming");
          }
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
          content: insufficientContext
            ? ""
            : full.trim() ||
              "No response. Check GEMINI_API_KEY and GEMINI_MODEL in backend/.env.",
          citations: insufficientContext ? null : citations.length ? citations : null,
          confidence: messageConfidence || undefined,
          created_at: new Date().toISOString(),
        },
      ]);
      setStreamContent("");
      setStreamConfidence(null);
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
    <div className="relative flex h-screen flex-col bg-void">
      <div className="flex min-h-0 flex-1">
        <motion.div
          className={cn(
            "min-h-0 shrink-0",
            mobileTab === "sessions" ? "flex w-full md:flex md:w-auto" : "hidden md:flex"
          )}
        >
          <SessionsPanel
            sessions={sessions}
            activeSessionId={sessionId}
            onSessionsChange={loadSessions}
          />
        </motion.div>

        <motion.div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col bg-surface/30",
            mobileTab === "chat" ? "flex" : "hidden md:flex"
          )}
        >
          <ChatMain
            session={session}
            messages={messages}
            streamPhase={streamPhase}
            streamContent={streamContent}
            streamCitations={streamCitations}
            streamConfidence={streamConfidence}
            lastUserQuery={lastUserQuery}
            sending={sending}
            prefill={prefill}
            onPrefill={setPrefill}
            onSend={handleSend}
          />
        </motion.div>
      </div>

      <nav className="border-t border-white/[0.06] bg-surface/95 backdrop-blur-xl md:hidden">
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
        "relative flex flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-medium transition active:scale-[0.97]",
        active ? "text-cyan" : "text-ink-muted"
      )}
    >
      {active && (
        <motion.div
          layoutId="mobile-chat-tab"
          className="absolute inset-0 rounded-xl bg-cyan-500/10 shadow-glow"
        />
      )}
      <Icon className="relative h-5 w-5" />
      <span className="relative">{label}</span>
    </button>
  );
}

function SessionsPanel({
  sessions,
  activeSessionId,
  onSessionsChange,
}: {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionsChange: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const title = sessionDisplayTitle(s).toLowerCase();
      const preview = sessionPreview(s).toLowerCase();
      return title.includes(q) || preview.includes(q);
    });
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

  const lastPreview = sessionPreview;

  return (
    <>
      <aside className="flex h-full w-full flex-col bg-surface shadow-sidebar md:w-[300px] lg:w-[320px]">
        <div className="border-b border-white/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="label-caps text-cyan/80">Sessions</p>
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-ink-muted transition hover:bg-white/[0.04] hover:text-cyan active:scale-[0.97]"
              title="Back to dashboard"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions…"
              className="focus-glow w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-ink-primary placeholder:text-ink-muted transition-colors"
            />
          </div>

          <motion.button
            type="button"
            whileHover={{ boxShadow: "0 0 28px rgba(0,212,255,0.35)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNew(true)}
            className="relative mt-3 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-accent-blue py-2.5 text-sm font-semibold text-void shadow-glow"
          >
            <span className="absolute inset-0 animate-shimmer bg-shimmer-gradient opacity-40" />
            <MessageSquarePlus className="relative h-4 w-4" />
            <span className="relative">New Chat</span>
          </motion.button>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="mx-2 mt-8 rounded-xl border border-dashed border-white/[0.06] px-4 py-10 text-center">
              <p className="text-sm text-ink-muted">No conversations yet</p>
            </div>
          ) : (
            filtered.map((s) => {
              const active = s.id === activeSessionId;
              return (
                <Link key={s.id} href={`/dashboard/chat/${s.id}`} className="group block">
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={cn(
                      "relative mb-1 rounded-xl px-3 py-3 transition-all active:scale-[0.99]",
                      active ? "bg-cyan-500/10" : "hover:bg-white/[0.03]"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="session-bar"
                        className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,212,255,0.8)]"
                        initial={{ width: 0 }}
                        animate={{ width: 2 }}
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
                          {sessionDisplayTitle(s)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{lastPreview(s)}</p>
                        <p className="mt-1.5 font-mono text-[10px] text-ink-muted">
                          {s.document_ids.length} doc · {sessionActivityTime(s)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, s.id)}
                        className="rounded-md p-1.5 text-ink-muted opacity-0 transition hover:bg-white/[0.06] hover:text-error group-hover:opacity-100 active:scale-[0.97]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      <NewChatModal
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

function NewChatModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-lg p-6 shadow-lift"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold tracking-display">New session</h3>
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
                <p className="rounded-xl border border-dashed border-white/[0.06] py-10 text-center text-sm text-ink-muted">
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
                          ? "border-cyan/40 bg-cyan/10 shadow-glow"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-cyan/20"
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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.06] py-2.5 text-sm text-ink-secondary transition hover:bg-white/[0.04] active:scale-[0.97]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={creating || !selected.length}
                className="glow-btn flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                {creating ? "Creating…" : "Launch chat"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChatMain({
  session,
  messages,
  streamPhase,
  streamContent,
  streamCitations,
  streamConfidence,
  lastUserQuery,
  sending,
  prefill,
  onPrefill,
  onSend,
}: {
  session: ChatSession | null;
  messages: Message[];
  streamPhase: StreamPhase;
  streamContent: string;
  streamCitations: Citation[] | null;
  streamConfidence: MessageConfidence | null;
  lastUserQuery: string;
  sending: boolean;
  prefill: string;
  onPrefill: (v: string) => void;
  onSend: (content: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamContent, streamPhase, streamConfidence]);

  const showEmpty = session && messages.length === 0 && streamPhase === "idle";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="border-b border-white/[0.04] px-4 py-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="truncate font-display text-lg font-bold tracking-display text-ink-primary">
            {session ? sessionDisplayTitle(session) : "Select a conversation"}
          </h1>
          {session && (
            <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-cyan">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
              {session.document_ids.length} indexed documents · RAG mode
            </p>
          )}
        </div>
      </header>

      <div className="custom-scroll flex-1 overflow-y-auto px-4 py-6 pb-40 md:px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl space-y-6"
        >
          {!session ? (
            <motion.div variants={fadeUp} className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <div className="h-24 w-24 animate-pulse-soft rounded-full bg-cyan/20 blur-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-cyan" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-display">Your knowledge terminal</h2>
              <p className="mt-3 max-w-sm text-sm text-ink-muted">
                Select a session or create a new chat to query your indexed PDFs.
              </p>
            </motion.div>
          ) : showEmpty ? (
            <EmptyState onSelect={onPrefill} />
          ) : (
            messages.map((m) => (
              <MessageBlock
                key={m.id}
                message={m}
                onRephrase={() => onPrefill(lastUserQuery)}
              />
            ))
          )}

          <AnimatePresence mode="wait">
            {streamPhase === "retrieving" && <RetrievalStatus key="retrieve" />}
            {streamPhase === "streaming" &&
              !streamContent &&
              !streamConfidence?.insufficient_context && (
                <TypingIndicator key="typing" />
              )}
          </AnimatePresence>

          {streamPhase === "streaming" &&
            (streamContent || streamConfidence?.insufficient_context) && (
              <MessageBlock
                message={{
                  id: "stream",
                  role: "assistant",
                  content: streamContent,
                  citations: streamConfidence?.insufficient_context ? null : streamCitations,
                  confidence: streamConfidence || undefined,
                  created_at: new Date().toISOString(),
                }}
                streaming={!streamConfidence?.insufficient_context && !!streamContent}
                onRephrase={() => onPrefill(lastUserQuery)}
              />
            )}

          <div ref={bottomRef} />
        </motion.div>
      </div>

      <Composer
        disabled={!session || sending}
        prefill={prefill}
        onPrefill={onPrefill}
        onSend={onSend}
      />
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col items-center py-12 text-center">
      <div className="relative mb-8">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="h-32 w-32 rounded-full bg-gradient-to-br from-cyan/30 to-accent-blue/20 blur-2xl"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/30 bg-cyan/10 shadow-glow">
            <Sparkles className="h-7 w-7 text-cyan" />
          </div>
        </div>
      </div>
      <h2 className="font-display text-2xl font-bold tracking-display">Ready to analyze</h2>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Ask anything about your documents — summaries, clauses, data points, and more.
      </p>
      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s}
            type="button"
            whileHover={{ y: -2, boxShadow: "0 0 20px rgba(0,212,255,0.2)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(s)}
            className="glass rounded-full px-4 py-2.5 text-left text-sm text-ink-secondary transition hover:border-cyan/30 hover:text-ink-primary"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function RetrievalStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-3"
    >
      <Loader2 className="h-4 w-4 animate-spin text-cyan" />
      <span className="font-mono text-xs text-ink-muted">Retrieving relevant passages…</span>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
          />
        ))}
      </div>
      <span className="text-xs italic text-ink-muted">PDFChat is thinking...</span>
    </motion.div>
  );
}

function Composer({
  disabled,
  prefill,
  onPrefill,
  onSend,
}: {
  disabled?: boolean;
  prefill: string;
  onPrefill: (v: string) => void;
  onSend: (content: string) => void;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (prefill) setValue(prefill);
  }, [prefill]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    onPrefill("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void via-void/95 to-transparent px-4 pb-4 pt-12 md:px-6 md:pb-6">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        <motion.div
          animate={{
            borderColor: focused ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.08)",
            boxShadow: focused ? "0 0 24px rgba(0,212,255,0.2)" : "none",
          }}
          className="flex items-end gap-2 rounded-full border bg-white/[0.04] p-2 backdrop-blur-xl transition-colors"
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            rows={1}
            placeholder="Ask anything about your documents... ⌘K"
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-4 py-2.5 text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none disabled:opacity-50"
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <motion.button
            type="button"
            whileHover={{ rotate: 45, scale: 1.05, boxShadow: "0 0 28px rgba(0,212,255,0.5)" }}
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan text-void shadow-glow disabled:opacity-30"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        </motion.div>
        <p className="mt-2 text-center font-mono text-[10px] text-ink-muted">
          Grounded answers · Source citations included
        </p>
      </div>
    </div>
  );
}
