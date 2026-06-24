"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type MypageCollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  headerAction?: ReactNode;
  meta?: ReactNode;
};

const sectionStyle = {
  background: "rgba(253,250,244,0.94)",
  borderColor: "rgba(42,66,50,0.12)",
} as const;

export function MypageCollapsibleSection({
  title,
  children,
  defaultOpen = true,
  headerAction,
  meta,
}: MypageCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border p-6" style={sectionStyle}>
      <div className="flex items-center gap-3">
        <button
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <ChevronDown
            aria-hidden
            className={cn("size-5 shrink-0 text-[#6B6458] transition-transform", open && "rotate-180")}
          />
          <h2
            className="text-lg font-semibold text-[#1A1714]"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            {title}
          </h2>
        </button>

        {meta ? <div className="shrink-0 text-xs text-[#8A847C]">{meta}</div> : null}

        {headerAction ? (
          <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
            {headerAction}
          </div>
        ) : null}
      </div>

      {open ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
