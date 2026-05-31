"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
} from "lucide-react";
import { clearAuth } from "@/lib/auth";
import { useUser } from "@/lib/useUser";
import { cn, userInitials } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/chat", label: "Chats", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const initials = userInitials(user?.full_name, user?.email);

  return (
    <aside className="relative hidden h-full w-[272px] flex-col bg-gradient-to-b from-[#0a1220] via-surface to-void shadow-sidebar md:flex">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />

      <div className="relative p-5">
        <Link href="/dashboard" className="block">
          <p className="font-display text-xl font-bold tracking-display">
            <span className="text-ink-primary">PDF</span>
            <span className="text-cyan">Chat</span>
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Workspace
          </p>
        </Link>
      </div>

      <nav className="relative flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname?.startsWith(href + "/");

          return (
            <Link key={href} href={href} className="relative block">
              {active && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-xl bg-cyan-500/10"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 active:scale-[0.97]",
                  active ? "text-white" : "text-ink-muted hover:text-white"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-bar"
                    className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,212,255,0.9),2px_0_8px_rgba(0,212,255,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-4 w-4", active ? "text-cyan" : "transition-colors")} />
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="relative p-4">
        <div className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-cyan/20 opacity-40" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan/50 bg-cyan/10 font-mono text-xs font-bold text-cyan shadow-[0_0_16px_rgba(0,212,255,0.35)]">
                {initials}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-primary">
                {user?.full_name || "User"}
              </p>
              <p className="truncate font-mono text-[10px] text-ink-muted">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              router.push("/login");
            }}
            className="group mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted transition hover:bg-error/10 hover:text-error active:scale-[0.97]"
          >
            <LogOut className="h-4 w-4 transition group-hover:-translate-x-0.5" />
            Sign out
            <ArrowLeft className="ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
          </button>
        </div>
      </div>
    </aside>
  );
}
