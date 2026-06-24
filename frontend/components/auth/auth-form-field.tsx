"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AuthFormFieldProps = {
  label: string;
  id: string;
  hint?: string;
  error?: string;
  showPasswordToggle?: boolean;
  required?: boolean;
} & ComponentProps<"input">;

export function AuthFormField({
  className,
  error,
  hint,
  id,
  label,
  showPasswordToggle = false,
  required = false,
  ...inputProps
}: AuthFormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = inputProps.type === "password";
  const inputType = showPasswordToggle && isPasswordField && isPasswordVisible ? "text" : inputProps.type;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#3A3530]" htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-[#9A3F38]">*</span> : null}
      </label>
      <div className="relative">
        <input
          className={cn(
            "h-12 w-full rounded-lg border bg-white px-4 text-sm text-[#1A1714] outline-none transition",
            "placeholder:text-[#A39E94]",
            "focus:border-[#3D6B52] focus:ring-2 focus:ring-[#3D6B52]/15",
            "disabled:cursor-not-allowed disabled:opacity-60",
            showPasswordToggle && isPasswordField ? "pr-12" : "",
            className,
          )}
          id={id}
          required={required}
          style={{ borderColor: "rgba(42,66,50,0.18)" }}
          {...inputProps}
          type={inputType}
        />

        {showPasswordToggle && isPasswordField ? (
          <button
            aria-label={isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8A847C] transition hover:bg-[rgba(42,66,50,0.06)] hover:text-[#2A4232]"
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-[#8A847C]">{hint}</p> : null}
      {error ? <p className="text-xs text-[#9A3F38]">{error}</p> : null}
    </div>
  );
}
