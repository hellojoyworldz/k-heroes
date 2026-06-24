"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type PagePaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  accentColor?: string;
  className?: string;
  alwaysShow?: boolean;
};

const DEFAULT_ACCENT = "#2A4232";

export function PagePagination({
  total,
  page,
  pageSize,
  onPageChange,
  accentColor = DEFAULT_ACCENT,
  className,
  alwaysShow = false,
}: PagePaginationProps) {
  const calculatedPages = Math.max(Math.ceil(total / pageSize), 1);
  const totalPages = alwaysShow ? Math.max(calculatedPages, 2) : calculatedPages;
  if (!alwaysShow && totalPages <= 1) return null;

  return (
    <nav
      aria-label="페이지 탐색"
      className={cn("flex items-center justify-center gap-1.5 pt-4", className)}
    >
      <PaginationButton
        aria-label="이전 페이지"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </PaginationButton>

      {Array.from({ length: totalPages }).map((_, index) => {
        const isActive = index === page;

        return (
          <PaginationButton
            key={index}
            aria-current={isActive ? "page" : undefined}
            aria-label={`${index + 1}페이지`}
            isActive={isActive}
            accentColor={accentColor}
            onClick={() => onPageChange(index)}
          >
            {index + 1}
          </PaginationButton>
        );
      })}

      <PaginationButton
        aria-label="다음 페이지"
        disabled={page === totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight className="size-4" />
      </PaginationButton>
    </nav>
  );
}

type PaginationButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  isActive?: boolean;
  accentColor?: string;
  onClick: () => void;
  "aria-label"?: string;
  "aria-current"?: "page";
};

function PaginationButton({
  children,
  disabled = false,
  isActive = false,
  accentColor = DEFAULT_ACCENT,
  onClick,
  ...ariaProps
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg border text-sm transition"
      style={{
        background: disabled
          ? "rgba(42,66,50,0.05)"
          : isActive
            ? accentColor
            : "rgba(253,250,244,0.94)",
        borderColor: isActive ? accentColor : "rgba(42,66,50,0.15)",
        color: disabled ? "#C0B0A0" : isActive ? "#FFFFFF" : "#4A4438",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: isActive ? 700 : 400,
      }}
      {...ariaProps}
    >
      {children}
    </button>
  );
}
