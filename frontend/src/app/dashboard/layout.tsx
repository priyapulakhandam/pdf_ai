"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/dashboard/chat");

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  if (isChat) {
    return <div className="h-screen overflow-hidden bg-void dot-grid">{children}</div>;
  }

  return (
    <div className="dot-grid flex h-screen overflow-hidden bg-void">
      <Sidebar />
      <main className="custom-scroll flex-1 overflow-auto">{children}</main>
      <MobileNav />
    </div>
  );
}
