import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const AdminTextarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function AdminTextarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "box-border min-h-[100px] w-full resize-y rounded-lg border border-[#D6D0C6] bg-white px-4 py-3 text-base text-[#1A1714] outline-none placeholder:text-[#B0AAA2] focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
