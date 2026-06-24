import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type AuthFormFieldProps = {
  label: string;
  id: string;
  hint?: string;
  required?: boolean;
} & ComponentProps<"input">;

export function AuthFormField({
  className,
  hint,
  id,
  label,
  required = false,
  ...inputProps
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#3A3530]" htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-[#9A3F38]">*</span> : null}
      </label>
      <input
        className={cn(
          "h-12 w-full rounded-lg border bg-white px-4 text-sm text-[#1A1714] outline-none transition",
          "placeholder:text-[#A39E94]",
          "focus:border-[#3D6B52] focus:ring-2 focus:ring-[#3D6B52]/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        id={id}
        required={required}
        style={{ borderColor: "rgba(42,66,50,0.18)" }}
        {...inputProps}
      />
      {hint ? <p className="text-xs text-[#8A847C]">{hint}</p> : null}
    </div>
  );
}
