"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Database,
  FileSearch,
  Layers,
  Lock,
  LogIn,
  MessageSquare,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

const words = ["Research papers", "Legal contracts", "Financial reports", "Technical docs"];

const bento = [
  { icon: MessageSquare, title: "Grounded chat", desc: "Answers cite exact pages from your PDFs.", color: "cyan" },
  { icon: Zap, title: "Real-time stream", desc: "Token-by-token responses with live retrieval.", color: "blue" },
  { icon: Shield, title: "Private workspace", desc: "JWT auth with tenant-scoped vector search.", color: "success" },
  { icon: Database, title: "Vector index", desc: "Qdrant-powered semantic chunk retrieval.", color: "cyan" },
  { icon: Layers, title: "Multi-PDF", desc: "Query across your entire document library.", color: "blue" },
  { icon: Lock, title: "Production stack", desc: "FastAPI · Postgres · Redis · Celery.", color: "warning" },
];

const iconStyles: Record<string, string> = {
  cyan: "bg-cyan/15 text-cyan shadow-[0_0_16px_rgba(0,212,255,0.2)]",
  blue: "bg-accent-blue/15 text-accent-blue shadow-[0_0_16px_rgba(59,130,246,0.2)]",
  success: "bg-success/15 text-success shadow-[0_0_16px_rgba(16,185,129,0.2)]",
  warning: "bg-warning/15 text-warning shadow-[0_0_16px_rgba(245,158,11,0.2)]",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HomePage() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % words.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-void">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-cyan/[0.06] blur-3xl" />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-void/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg font-bold tracking-display">
            <span className="text-ink-primary">PDF</span>
            <span className="text-cyan">Chat</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-ink-secondary transition hover:text-cyan active:scale-[0.97]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
            <Link
              href="/signup"
              className="glow-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="label-caps text-cyan/80"
          >
            Document Intelligence · RAG Platform
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-display sm:text-7xl"
          >
            Chat with your PDFs.
            <br />
            <span className="text-cyan" style={{ textShadow: "0 0 48px rgba(0,212,255,0.35)" }}>
              Instantly.
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-6 max-w-xl text-lg text-ink-muted"
          >
            Built for{" "}
            <motion.span
              key={wordIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-medium text-ink-primary"
            >
              {words[wordIdx]}
            </motion.span>
            . Upload, index, ask — with citations you can trust.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="glow-btn inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm"
            >
              Launch workspace
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-8 py-3.5 text-sm text-ink-secondary backdrop-blur-xl transition hover:border-cyan/30 hover:shadow-glow active:scale-[0.97]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </motion.div>
        </div>

        {/* Demo mockup */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div
            className="glass-card overflow-hidden shadow-lift"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 60px rgba(0,212,255,0.08)" }}
          >
            <div className="flex items-center gap-2 border-b border-white/[0.04] bg-surface/50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                pdfchat — session
              </span>
            </div>

            <div className="space-y-4 bg-gradient-to-b from-surface/30 to-void/50 p-5">
              <div className="flex justify-end">
                <div className="max-w-[72%] rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-cyan-600 px-4 py-2.5 text-sm text-white shadow-[0_4px_20px_rgba(0,212,255,0.15)]">
                  Summarize the key findings in section 3
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 shadow-glow">
                  <Bot className="h-3.5 w-3.5 text-cyan" />
                </div>
                <div className="glass max-w-[85%] rounded-2xl rounded-bl-md border-l border-l-cyan px-4 py-3 text-sm text-ink-secondary">
                  Section 3 identifies three primary trends: revenue growth of 24%, expanded R&D
                  allocation, and revised compliance frameworks…
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-cyan"
                  >
                    📎 1 source found
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Bento */}
      <section className="border-t border-white/[0.04] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="label-caps text-cyan/80">Capabilities</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-display">Everything you need</h2>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bento.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, boxShadow: "0 0 28px rgba(0,212,255,0.12)" }}
                className="glass-card p-6 transition-colors hover:border-white/[0.1]"
              >
                <div className={`mb-4 inline-flex rounded-xl p-2.5 ${iconStyles[color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold tracking-display">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-t border-white/[0.04] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="label-caps mb-6 text-cyan/80">How it works</p>
          <div className="glass-card inline-flex flex-wrap items-center justify-center gap-3 px-8 py-5 font-mono text-xs text-ink-secondary">
            {["Upload", "Extract", "Chunk", "Embed", "Index", "Answer"].map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                {i > 0 && <span className="text-ink-muted">→</span>}
                <span className={i === 0 || i === 5 ? "text-cyan" : ""}>{step}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.04] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-cyan/[0.04] blur-3xl" />
            <div className="glass-card relative p-10">
              <FileSearch className="mx-auto h-8 w-8 text-cyan" />
              <h2 className="mt-4 font-display text-2xl font-bold tracking-display">
                Ready to analyze your documents?
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Free to start. Upload a PDF and ask your first question in under a minute.
              </p>
              <Link
                href="/signup"
                className="glow-btn mt-6 inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm"
              >
                <Upload className="h-4 w-4" />
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          © {new Date().getFullYear()} PDFChat · Document intelligence platform
        </p>
      </footer>
    </div>
  );
}
