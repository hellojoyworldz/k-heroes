import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function AdminSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "box-border h-[52px] w-full appearance-none rounded-lg border border-[#D6D0C6] bg-white px-4 text-base text-[#1A1714] outline-none focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
