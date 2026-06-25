"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { NavBar } from "@/components/layout/NavBar";

const sitePageBackground = {
  fontFamily: "'Noto Sans KR', sans-serif",
  background:
    "linear-gradient(rgba(244,239,228,0.2), rgba(244,239,228,0.2)), url('/story-background.png') center/cover fixed",
} as const;

type SitePageShellProps = {
  children: ReactNode;
};

export function SitePageShell({ children }: SitePageShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={sitePageBackground}>
      <NavBar onStart={() => router.push("/select")} />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}
