import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/figma-make/src/app/components/BrandLogo";
import { site } from "@/lib/site";

type AuthFormLayoutProps = {
  children: ReactNode;
};

export function AuthFormLayout({ children }: AuthFormLayoutProps) {
  return (
    <div
      className="grid min-h-screen grid-cols-1 lg:grid-cols-2"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <section className="relative hidden overflow-hidden bg-[#2A4232] lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <BrandLogo dark showBeta />

        <div className="max-w-md text-white">
          <p
            className="text-3xl leading-snug font-semibold tracking-tight"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            역사 속 한 걸음,
            <br />
            당신의 선택으로 완성됩니다
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            {site.name}에서 지역과 인물의 이야기를 체험하고, 나만의 시뮬레이션 기록을 남겨보세요.
          </p>
        </div>

        <p className="text-xs text-white/35">{site.tagline}</p>

        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-16 size-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #3D6B52 0%, transparent 70%)" }}
        />
      </section>

      <section
        className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10"
        style={{
          background:
            "linear-gradient(rgba(244,239,228,0.35), rgba(244,239,228,0.35)), url('/story-background.png') center/cover fixed",
        }}
      >
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-xl bg-[#2A4232]">
                <Image alt="" className="brightness-0 invert" height={24} priority src="/logo.svg" width={22} />
              </span>
              <span
                className="text-xl font-semibold text-[#1A1714]"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                {site.name}
              </span>
            </Link>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}

type AuthFormCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthFormCard({ title, description, children, footer }: AuthFormCardProps) {
  return (
    <div
      className="rounded-2xl border px-6 py-8 shadow-sm sm:px-8"
      style={{
        background: "rgba(253,250,244,0.94)",
        borderColor: "rgba(42,66,50,0.12)",
        backdropFilter: "blur(12px)",
      }}
    >
      <h1
        className="text-2xl font-semibold text-[#1A1714]"
        style={{ fontFamily: "'Noto Serif KR', serif" }}
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-[#6B6458]">{description}</p>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-6 border-t border-[rgba(42,66,50,0.08)] pt-6">{footer}</div> : null}
    </div>
  );
}
