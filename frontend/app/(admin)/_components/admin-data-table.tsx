import { Children, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type AdminTableColumn = {
  key: string;
  header: string;
  className?: string;
};

type AdminDataTableProps = {
  columns: AdminTableColumn[];
  emptyMessage: string;
  isEmpty?: boolean;
  children?: ReactNode;
};

export function AdminDataTable({
  children,
  columns,
  emptyMessage,
  isEmpty,
}: AdminDataTableProps) {
  const hasRows = isEmpty !== undefined ? !isEmpty : Children.count(children) > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-[#E8E4DC] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8E4DC] bg-[#FDFCFA]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-5 py-3.5 text-xs font-semibold tracking-wide text-[#8A847C]",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              children
            ) : (
              <tr>
                <td className="px-5 py-16 text-center text-sm text-[#8A847C]" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTableRow({
  children,
  className,
  onClick,
  ...props
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
} & ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-[#F0ECE4] transition-colors last:border-b-0",
        onClick ? "cursor-pointer hover:bg-[#FDFCFA]" : undefined,
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-5 py-4 text-[#3A3530]", className)}>{children}</td>;
}
