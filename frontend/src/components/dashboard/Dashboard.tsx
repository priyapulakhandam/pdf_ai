"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  HardDrive,
  Layers,
  MessageSquare,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ChatSession, Document } from "@/lib/types";
import { useUser } from "@/lib/useUser";
import { formatBytes, formatRelativeTime, statusLabel } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const SPARKLINES = [
  "M0,20 L8,16 L16,18 L24,10 L32,12 L40,6 L48,8",
  "M0,18 L8,14 L16,16 L24,8 L32,10 L40,4 L48,6",
  "M0,16 L8,12 L16,14 L24,6 L32,8 L40,2 L48,4",
  "M0,22 L8,18 L16,20 L24,12 L32,14 L40,8 L48,10",
];

const STAT_CONFIG = [
  {
    label: "PDFs uploaded",
    tooltip: "Total PDF files stored in your knowledge base",
    icon: FileText,
    accent: "cyan" as const,
    iconBg: "bg-cyan/20",
    iconText: "text-cyan",
    bloom: "rgba(0,212,255,0.35)",
    topGlow: "shadow-[0_1px_0_0_rgba(0,212,255,0.6),0_0_12px_rgba(0,212,255,0.25)]",
    sparkGlow: "drop-shadow(0 0 6px rgba(0,212,255,0.7))",
    hoverWash: "hover:bg-cyan/[0.05]",
    hoverShadow: "hover:shadow-[0_8px_40px_rgba(0,212,255,0.15)]",
  },
  {
    label: "Active chats",
    tooltip: "Chat sessions you've started with your documents",
    icon: MessageSquare,
    accent: "blue" as const,
    iconBg: "bg-accent-blue/20",
    iconText: "text-accent-blue",
    bloom: "rgba(59,130,246,0.35)",
    topGlow: "shadow-[0_1px_0_0_rgba(59,130,246,0.6),0_0_12px_rgba(59,130,246,0.25)]",
    sparkGlow: "drop-shadow(0 0 6px rgba(59,130,246,0.7))",
    hoverWash: "hover:bg-accent-blue/[0.05]",
    hoverShadow: "hover:shadow-[0_8px_40px_rgba(59,130,246,0.15)]",
  },
  {
    label: "Indexed chunks",
    tooltip: "Text segments embedded and searchable via RAG",
    icon: Layers,
    accent: "green" as const,
    iconBg: "bg-success/20",
    iconText: "text-success",
    bloom: "rgba(16,185,129,0.35)",
    topGlow: "shadow-[0_1px_0_0_rgba(16,185,129,0.6),0_0_12px_rgba(16,185,129,0.25)]",
    sparkGlow: "drop-shadow(0 0 6px rgba(16,185,129,0.7))",
    hoverWash: "hover:bg-success/[0.05]",
    hoverShadow: "hover:shadow-[0_8px_40px_rgba(16,185,129,0.15)]",
  },
  {
    label: "Storage used",
    tooltip: "Combined disk space of all uploaded PDFs",
    icon: HardDrive,
    accent: "amber" as const,
    iconBg: "bg-warning/20",
    iconText: "text-warning",
    bloom: "rgba(245,158,11,0.35)",
    topGlow: "shadow-[0_1px_0_0_rgba(245,158,11,0.6),0_0_12px_rgba(245,158,11,0.25)]",
    sparkGlow: "drop-shadow(0 0 6px rgba(245,158,11,0.7))",
    hoverWash: "hover:bg-warning/[0.05]",
    hoverShadow: "hover:shadow-[0_8px_40px_rgba(245,158,11,0.15)]",
  },
];

const STATUS_DOT: Record<string, string> = {
  ready: "bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  processing: "bg-cyan shadow-[0_0_8px_rgba(0,212,255,0.8)]",
  pending: "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)]",
  failed: "bg-error shadow-[0_0_8px_rgba(239,68,68,0.8)]",
};

const STATUS_BAR: Record<string, string> = {
  ready: "bg-success shadow-[2px_0_12px_rgba(16,185,129,0.5)]",
  processing: "bg-cyan shadow-[2px_0_12px_rgba(0,212,255,0.5)]",
  pending: "bg-warning shadow-[2px_0_12px_rgba(245,158,11,0.5)]",
  failed: "bg-error shadow-[2px_0_12px_rgba(239,68,68,0.5)]",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Dashboard() {
  const user = useUser();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([api.listDocuments(), api.listSessions()])
      .then(([docs, chats]) => {
        setDocuments(docs.documents);
        setSessions(chats.sessions);
        setLoaded(true);
      })
      .catch(() => toast.error("Failed to load dashboard"));
  }, []);

  const ready = documents.filter((d) => d.status === "ready");
  const processing = documents.filter((d) => d.status === "processing" || d.status === "pending");
  const totalChunks = documents.reduce((s, d) => s + d.chunk_count, 0);
  const storageMb = documents.reduce((s, d) => s + d.file_size, 0) / (1024 * 1024);

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const lastSync = useMemo(() => {
    const times = [
      ...documents.map((d) => d.created_at),
      ...sessions.map((s) => s.updated_at),
    ];
    if (!times.length) return null;
    return times.sort().reverse()[0];
  }, [documents, sessions]);

  const queueProgress =
    documents.length === 0 ? 100 : Math.round((ready.length / documents.length) * 100);

  const stats = [
    { value: documents.length, decimal: false as const, suffix: undefined },
    { value: sessions.length, decimal: false as const, suffix: undefined },
    { value: totalChunks, decimal: false as const, suffix: undefined },
    { value: storageMb, decimal: true as const, suffix: " MB" },
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes dash-check-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes dash-pulse-green {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes dash-dot-grid {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.045; }
        }
        .dash-check-animate { animation: dash-check-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .dash-pulse-dot { animation: dash-pulse-green 2s ease-in-out infinite; }
      `,
        }}
      />

      {/* Vercel-style brand bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-cyan shadow-[0_0_10px_rgba(0,212,255,0.55)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-8 pb-24 md:pb-8">
        {/* Ambient background */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(600px circle at 90% 10%, rgba(0,212,255,0.04), transparent),
              radial-gradient(400px circle at 5% 95%, rgba(59,130,246,0.04), transparent)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            animation: "dash-dot-grid 8s ease-in-out infinite",
          }}
        />

        {/* Header */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan/80">Overview</p>
          <h1 className="mt-2 font-display text-[32px] leading-tight tracking-display">
            <span className="font-normal text-ink-secondary">Welcome back, </span>
            <span
              className="font-bold text-white"
              style={{ textShadow: "0 0 24px rgba(0,212,255,0.25)" }}
            >
              {firstName}
            </span>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              System ready
            </span>
            <span className="text-ink-muted/40">·</span>
            <span>{ready.length} docs indexed</span>
            {lastSync && (
              <>
                <span className="text-ink-muted/40">·</span>
                <span>Last sync {formatRelativeTime(lastSync)}</span>
              </>
            )}
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ value, decimal, suffix }, i) => {
            const cfg = STAT_CONFIG[i];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={cfg.label}
                custom={i + 1}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                whileHover={{ y: -4 }}
                title={cfg.tooltip}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/80 p-5 backdrop-blur-xl transition-all duration-300 ${cfg.hoverWash} ${cfg.hoverShadow}`}
              >
                {/* Glowing top edge */}
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-80 ${cfg.iconText} ${cfg.topGlow}`}
                />

                {/* Icon with radial bloom */}
                <div className="relative inline-flex">
                  <div
                    className="absolute inset-0 scale-[2] rounded-full blur-xl"
                    style={{ background: `radial-gradient(circle, ${cfg.bloom} 0%, transparent 70%)` }}
                  />
                  <div
                    className={`relative rounded-xl p-2.5 ${cfg.iconBg} ring-1 ring-white/[0.06]`}
                  >
                    <Icon className={`h-5 w-5 ${cfg.iconText}`} />
                  </div>
                </div>

                <p className="mt-4 font-display text-5xl font-black tracking-tight text-white">
                  {loaded ? (
                    decimal ? (
                      `${value.toFixed(1)}${suffix || ""}`
                    ) : (
                      <AnimatedCounter value={value} suffix={suffix} />
                    )
                  ) : (
                    "—"
                  )}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  {cfg.label}
                </p>

                {/* Sparkline */}
                <svg
                  className="absolute bottom-3 right-3 opacity-70 transition-opacity group-hover:opacity-100"
                  width="52"
                  height="26"
                  viewBox="0 0 48 24"
                  fill="none"
                >
                  <path
                    d={SPARKLINES[i]}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cfg.iconText}
                    style={{ filter: cfg.sparkGlow }}
                  />
                </svg>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Documents */}
        <motion.section
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold tracking-display text-white">
              Recent Documents
            </h2>
            <Link
              href="/dashboard/documents"
              className="group/link flex items-center gap-1 text-sm text-cyan transition hover:text-cyan/90"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-card/80 px-8 py-16 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan/10 shadow-[0_0_24px_rgba(0,212,255,0.2)]">
                <Upload className="h-6 w-6 text-cyan" />
              </div>
              <p className="mt-4 font-display text-lg font-bold tracking-display">Upload your first PDF</p>
              <p className="mt-2 text-sm text-ink-muted">Build your knowledge base in seconds.</p>
              <Link
                href="/dashboard/documents"
                className="glow-btn mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm"
              >
                <Upload className="h-4 w-4" />
                Get started
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => (
                <motion.div
                  key={doc.id}
                  whileHover={{ y: -2 }}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-card/80 py-3.5 pl-4 pr-4 backdrop-blur-xl transition-all duration-300 hover:border-cyan/20 hover:bg-cyan/[0.04] hover:shadow-[0_4px_24px_rgba(0,212,255,0.08)]"
                >
                  <div
                    className={`absolute bottom-2 left-0 top-2 w-[3px] rounded-full ${STATUS_BAR[doc.status]}`}
                  />

                  <span
                    className={`ml-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[doc.status]}`}
                  />

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan/10 shadow-[inset_0_0_12px_rgba(0,212,255,0.15),0_0_16px_rgba(0,212,255,0.1)] ring-1 ring-cyan/20">
                    <FileText className="h-5 w-5 text-cyan" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-secondary transition-colors group-hover:text-white">
                      {doc.original_filename}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <MetaChip>{formatBytes(doc.file_size)}</MetaChip>
                      <MetaChip>{doc.page_count ?? "—"} pages</MetaChip>
                      <MetaChip>{doc.chunk_count} chunks</MetaChip>
                      <MetaChip>{formatRelativeTime(doc.created_at)}</MetaChip>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/chat"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-cyan opacity-0 transition-all group-hover:opacity-100"
                  >
                    Open
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Bottom row */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* Processing Queue */}
          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/80 p-5 backdrop-blur-xl"
          >
            {/* Progress bar */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-success/80 to-success transition-all duration-700"
                style={{ width: `${queueProgress}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  processing.length === 0
                    ? "dash-pulse-dot bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "animate-pulse bg-warning shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                }`}
              />
              <h3 className="font-display font-bold tracking-display text-white">
                Processing Queue
              </h3>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              {processing.length} active
            </p>

            <div className="mt-4 space-y-2">
              {processing.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
                  <CheckCircle2 className="dash-check-animate h-5 w-5 text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <p className="text-sm font-medium text-success">All systems ready</p>
                </div>
              ) : (
                processing.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2"
                  >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-warning shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                    <span className="truncate text-sm text-ink-secondary">{d.original_filename}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-warning">
                      {statusLabel(d.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Chat CTA */}
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show">
            <Link href="/dashboard/chat" className="group block h-full">
              <motion.div
                whileHover={{ y: -3 }}
                className="relative flex h-full items-center justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/10 to-accent-blue/10 p-5 backdrop-blur-xl transition-all duration-300 group-hover:border-cyan/25 group-hover:from-cyan-500/15 group-hover:to-accent-blue/15 group-hover:shadow-[0_8px_40px_rgba(0,212,255,0.12)]"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 shadow-[0_0_20px_rgba(0,212,255,0.2)] ring-1 ring-cyan/25">
                    <MessageSquare className="h-5 w-5 text-cyan" />
                  </div>
                  <p className="mt-3 font-display font-bold tracking-display text-white">
                    Open Chat Workspace
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan/25 bg-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan shadow-[0_0_12px_rgba(0,212,255,0.15)]">
                    {ready.length} docs ready for analysis
                  </span>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan/15 shadow-[0_0_20px_rgba(0,212,255,0.35)] ring-1 ring-cyan/30 transition-all duration-300 group-hover:shadow-[0_0_28px_rgba(0,212,255,0.5)]">
                  <ArrowRight className="h-5 w-5 text-cyan transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-ink-muted">
      {children}
    </span>
  );
}
