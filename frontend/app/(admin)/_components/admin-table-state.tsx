import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type AdminTableStateProps = {
  children?: ReactNode;
  columnCount: number;
  emptyMessage: string;
  errorMessage?: string;
  hasRows: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  onRetry?: () => void;
};

export function AdminTableState({
  children,
  columnCount,
  emptyMessage,
  errorMessage,
  hasRows,
  isLoading = false,
  loadingMessage = "목록을 불러오고 있습니다.",
  onRetry,
}: AdminTableStateProps) {
  if (isLoading) {
    return (
      <tr>
        <td className="px-5 py-16 text-center" colSpan={columnCount}>
          <div className="flex items-center justify-center gap-2 text-sm text-[#8A847C]">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            {loadingMessage}
          </div>
        </td>
      </tr>
    );
  }

  if (errorMessage) {
    return (
      <tr>
        <td className="px-5 py-16 text-center" colSpan={columnCount}>
          <p className="text-sm text-[#9A3F38]">{errorMessage}</p>
          {onRetry ? (
            <button
              className="mt-3 text-sm font-medium text-[#9A3F38] underline"
              onClick={onRetry}
              type="button"
            >
              다시 시도
            </button>
          ) : null}
        </td>
      </tr>
    );
  }

  if (!hasRows) {
    return (
      <tr>
        <td className="px-5 py-16 text-center text-sm text-[#8A847C]" colSpan={columnCount}>
          {emptyMessage}
        </td>
      </tr>
    );
  }

  return children;
}
