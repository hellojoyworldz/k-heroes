import type { ComponentProps } from "react";
import { AdminRequiredMark } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "./admin-input";

type AdminFormFieldProps = {
  label: string;
  id: string;
  required?: boolean;
} & ComponentProps<typeof AdminInput>;

export function AdminFormField({ id, label, required = false, ...inputProps }: AdminFormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#3A3530]" htmlFor={id}>
        {label}
        {required ? <AdminRequiredMark /> : null}
      </label>
      <AdminInput id={id} required={required} {...inputProps} />
    </div>
  );
}
