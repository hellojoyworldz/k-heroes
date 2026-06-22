import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ActiveFilterValue = "all" | "active" | "inactive";

type AdminFilterRowProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
};

export function AdminFilterRow({ children, htmlFor, label }: AdminFilterRowProps) {
  const labelClassName = "text-sm font-medium text-[#3A3530]";

  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-6">
      {htmlFor ? (
        <label className={labelClassName} htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className={labelClassName}>{label}</span>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

type AdminActiveFilterProps = {
  value: ActiveFilterValue;
  onChange: (value: ActiveFilterValue) => void;
  label?: string;
  disabled?: boolean;
};

const filterOptions: { value: ActiveFilterValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성" },
  { value: "inactive", label: "비활성" },
];

export function AdminActiveFilter({
  disabled = false,
  label = "상태",
  onChange,
  value,
}: AdminActiveFilterProps) {
  return (
    <AdminFilterRow label={label}>
      <div
        className="inline-flex rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-1"
        role="group"
        aria-label={label}
      >
        {filterOptions.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              aria-pressed={isSelected}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
                isSelected
                  ? "bg-[#2A4232] text-white"
                  : "text-[#6B6560] hover:bg-white hover:text-[#3A3530]",
                disabled && !isSelected && "hover:bg-transparent hover:text-[#6B6560]",
              )}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </AdminFilterRow>
  );
}

export function filterByActive<T extends { is_active: boolean }>(
  items: T[],
  filter: ActiveFilterValue,
) {
  if (filter === "active") {
    return items.filter((item) => item.is_active);
  }

  if (filter === "inactive") {
    return items.filter((item) => !item.is_active);
  }

  return items;
}
