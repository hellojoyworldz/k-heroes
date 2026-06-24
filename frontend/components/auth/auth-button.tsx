import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const authButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-[#2A4232] text-white hover:bg-[#1E3028]",
        secondary:
          "border border-[rgba(42,66,50,0.18)] bg-white text-[#3A3530] hover:bg-[#F4F1EA]",
        ghost: "bg-transparent text-[#3D6B52] hover:bg-[rgba(42,66,50,0.06)]",
      },
      size: {
        default: "h-12 w-full text-base",
        sm: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type AuthButtonProps = ComponentProps<"button"> &
  VariantProps<typeof authButtonVariants> & {
    isLoading?: boolean;
    loadingText?: ReactNode;
  };

export function AuthButton({
  children,
  className,
  disabled,
  isLoading = false,
  loadingText = "처리 중...",
  size,
  variant,
  ...props
}: AuthButtonProps) {
  return (
    <button
      className={cn(authButtonVariants({ size, variant }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
