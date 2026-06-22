import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const adminButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 box-border cursor-pointer rounded-lg outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "border-0 bg-[#2A4232] font-semibold text-white hover:bg-[#1E3028]",
        secondary:
          "border border-[#D6D0C6] bg-white font-medium text-[#3A3530] hover:bg-[#F4F1EA]",
        danger:
          "border-0 bg-transparent font-medium text-[#B4534B] hover:bg-[#FDF6F5] hover:text-[#9A3F38]",
      },
      size: {
        default: "h-[52px] w-full text-base font-semibold",
        sm: "h-11 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type AdminButtonProps = ComponentProps<"button"> &
  VariantProps<typeof adminButtonVariants> & {
    isLoading?: boolean;
    loadingText?: ReactNode;
  };

export function AdminButton({
  children,
  className,
  disabled,
  isLoading = false,
  loadingText = "처리 중...",
  size,
  variant,
  ...props
}: AdminButtonProps) {
  return (
    <button
      className={cn(adminButtonVariants({ size, variant }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
