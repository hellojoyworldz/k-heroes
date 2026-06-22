import { Children, type ComponentProps, type ReactNode } from "react";
import { AdminTableState } from "@/app/(admin)/_components/admin-table-state";
import { cn } from "@/lib/utils/cn";

export type AdminTableColumn = {
  key: string;
  header: string;
  className?: string;
};

type AdminDataTableProps = {
  columns: AdminTableColumn[];
  emptyMessage: string;
  errorMessage?: string;
  isEmpty?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export function AdminDataTable({
  children,
  columns,
  emptyMessage,
  errorMessage,
  isEmpty,
  isLoading = false,
  loadingMessage,
  onRetry,
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
            <AdminTableState
              columnCount={columns.length}
              emptyMessage={emptyMessage}
              errorMessage={errorMessage}
              hasRows={hasRows}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
              onRetry={onRetry}
            >
              {children}
            </AdminTableState>
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
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentProps<"td">) {
  return (
    <td className={cn("px-5 py-4 text-[#3A3530]", className)} {...props}>
      {children}
    </td>
  );
}
