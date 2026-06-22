"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/app/(admin)/_components/admin-sidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#FAFAF8]"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#E8E4DC] bg-white px-4 lg:hidden">
        <button
          aria-label="메뉴 열기"
          className="flex size-9 items-center justify-center rounded-lg text-[#3A3530] hover:bg-[#F4F1EA]"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <p
          className="text-sm font-semibold text-[#1A1714]"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          K-Heroes Admin
        </p>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
