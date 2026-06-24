import Link from "next/link";
import type { ReactNode } from "react";
import { SitePageShell } from "@/components/layout/site-page-shell";

type LegalDocumentLayoutProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalDocumentLayout({ title, effectiveDate, children }: LegalDocumentLayoutProps) {
  return (
    <SitePageShell>
      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <header className="mb-10 border-b border-[rgba(42,66,50,0.1)] pb-8">
          <h1
            className="text-3xl font-semibold text-[#1A1714] sm:text-4xl"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            {title}
          </h1>
          <p className="mt-3 text-sm text-[#6B6458]">시행일: {effectiveDate}</p>
        </header>

        <article className="space-y-8">{children}</article>

        <nav className="mt-12 flex flex-wrap gap-4 border-t border-[rgba(42,66,50,0.1)] pt-8 text-sm">
          <Link className="text-[#2A4232] underline-offset-4 hover:underline" href="/terms">
            이용약관
          </Link>
          <Link className="text-[#2A4232] underline-offset-4 hover:underline" href="/privacy">
            개인정보처리방침
          </Link>
        </nav>
      </div>
    </SitePageShell>
  );
}

type LegalSectionProps = {
  title: string;
  children: ReactNode;
};

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2
        className="mb-4 text-lg font-semibold text-[#1A1714]"
        style={{ fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </h2>
      <div
        className="space-y-3 text-sm leading-relaxed text-[#4A4438]"
        style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {children}
      </div>
    </section>
  );
}
