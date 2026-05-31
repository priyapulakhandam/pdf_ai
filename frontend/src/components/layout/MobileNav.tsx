"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, LayoutDashboard, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/documents", label: "Docs", icon: FileText },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.04] bg-surface/95 backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname?.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition active:scale-[0.97]",
                active ? "text-cyan" : "text-ink-muted"
              )}
            >
              {active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-cyan shadow-glow"
                />
              )}
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
