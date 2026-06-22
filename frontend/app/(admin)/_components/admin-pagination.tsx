import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";

export type AdminPageSize = 10 | 20 | 50 | 100;

type AdminPaginationProps = {
  page: number;
  pageSize: AdminPageSize;
  total: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminPageSize) => void;
  onRefresh: () => void;
};

const pageSizes: AdminPageSize[] = [10, 20, 50, 100];

export function AdminPagination({
  disabled = false,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  page,
  pageSize,
  total,
  totalPages,
}: AdminPaginationProps) {
  const displayTotalPages = Math.max(totalPages, 1);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <p className="text-sm text-[#8A847C]">총 {total.toLocaleString("ko-KR")}개</p>
        <button
          aria-label="목록 새로고침"
          className="flex size-8 items-center justify-center rounded-lg text-[#8A847C] transition-colors hover:bg-[#F4F1EA] hover:text-[#3A3530] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={onRefresh}
          title="현재 조건으로 새로고침"
          type="button"
        >
          <RefreshCw aria-hidden="true" className={disabled ? "size-4 animate-spin" : "size-4"} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <label className="flex items-center gap-2 text-sm text-[#6B6560]">
          페이지당
          <AdminSelect
            aria-label="페이지당 항목 수"
            className="h-9 w-24 px-3 text-sm"
            disabled={disabled}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value) as AdminPageSize)
            }
            value={pageSize}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}개
              </option>
            ))}
          </AdminSelect>
        </label>

        <div className="flex items-center gap-2">
          <AdminButton
            aria-label="이전 페이지"
            className="size-9 p-0"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </AdminButton>
          <span className="min-w-20 text-center text-sm text-[#6B6560]">
            {page} / {displayTotalPages}
          </span>
          <AdminButton
            aria-label="다음 페이지"
            className="size-9 p-0"
            disabled={disabled || totalPages === 0 || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
