import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AdminFormRowProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  alignTop?: boolean;
};

export function AdminFormTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E4DC] bg-white">
      {children}
    </div>
  );
}

export function AdminRequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-[#B4534B]">
      *
    </span>
  );
}

export function AdminFormRow({
  alignTop = false,
  children,
  className,
  htmlFor,
  label,
  required = false,
}: AdminFormRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[7.5rem_1fr] gap-4 border-b border-[#F0ECE4] px-5 py-3.5 last:border-b-0",
        alignTop ? "items-start" : "items-center",
        className,
      )}
    >
      <label className="text-sm font-medium text-[#3A3530]" htmlFor={htmlFor}>
        {label}
        {required ? <AdminRequiredMark /> : null}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
