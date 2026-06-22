import { cn } from "@/lib/utils/cn";

export type AdminRole = "superadmin" | "admin" | "partner";

const roleLabels: Record<AdminRole, string> = {
  superadmin: "최고 관리자",
  admin: "관리자",
  partner: "파트너",
};

const roleStyles: Record<AdminRole, string> = {
  superadmin: "bg-[#2A4232] text-white",
  admin: "bg-[#E8F0EB] text-[#2A4232]",
  partner: "bg-[#F4F1EA] text-[#6B6560]",
};

type AdminRoleBadgeProps = {
  role: AdminRole;
  className?: string;
};

export function AdminRoleBadge({ className, role }: AdminRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        roleStyles[role],
        className,
      )}
    >
      {roleLabels[role]}
    </span>
  );
}

type AdminStatusBadgeProps = {
  isActive: boolean;
  className?: string;
};

export function AdminStatusBadge({ className, isActive }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive ? "bg-[#E8F0EB] text-[#2A4232]" : "bg-[#F4F1EA] text-[#8A847C]",
        className,
      )}
    >
      {isActive ? "활성" : "비활성"}
    </span>
  );
}
