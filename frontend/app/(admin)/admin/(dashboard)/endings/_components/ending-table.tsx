import { GripVertical } from "lucide-react";
import { type DragEvent, useState } from "react";
import { AdminStatusBadge } from "@/app/(admin)/_components/admin-badge";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableRow,
  type AdminTableColumn,
} from "@/app/(admin)/_components/admin-data-table";
import type { EndingListItem } from "@/app/(admin)/admin/(dashboard)/endings/_types";
import { formatEndingTypeLabel } from "@/app/(admin)/admin/(dashboard)/endings/_constants";
import { cn } from "@/lib/utils/cn";

const baseColumns: AdminTableColumn[] = [
  { key: "id", header: "ID", className: "w-16" },
  { key: "character", header: "인물", className: "w-28" },
  { key: "scenario", header: "시나리오", className: "w-52" },
  { key: "path_key", header: "경로", className: "w-28" },
  { key: "ending_type", header: "엔딩 유형", className: "w-36" },
  { key: "title", header: "제목", className: "w-36" },
  { key: "sort_order", header: "순서", className: "w-20" },
  { key: "status", header: "상태", className: "w-24" },
];

const handleColumn: AdminTableColumn = { key: "handle", header: "", className: "w-12" };

type EndingTableProps = {
  endings: EndingListItem[];
  emptyMessage: string;
  isReorderMode: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRowClick?: (ending: EndingListItem) => void;
  onRetry?: () => void;
};

export function EndingTable({
  endings,
  emptyMessage,
  errorMessage,
  isLoading,
  isReorderMode,
  onReorder,
  onRowClick,
  onRetry,
}: EndingTableProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const columns = isReorderMode ? [handleColumn, ...baseColumns] : baseColumns;

  function handleDragStart(event: DragEvent<HTMLTableRowElement>, index: number) {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(event: DragEvent<HTMLTableRowElement>, index: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDrop(event: DragEvent<HTMLTableRowElement>, index: number) {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }
    onReorder(draggedIndex, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  return (
    <AdminDataTable
      columns={columns}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      isEmpty={!isLoading && endings.length === 0}
      isLoading={isLoading}
      onRetry={onRetry}
    >
      {endings.map((ending, index) => (
        <AdminTableRow
          key={ending.id}
          className={cn(
            isReorderMode && draggedIndex === index && "opacity-50",
            isReorderMode && dragOverIndex === index && "bg-[#F4F1EA]",
            isReorderMode && "cursor-grab active:cursor-grabbing hover:bg-[#FDFCFA]",
          )}
          draggable={isReorderMode}
          onClick={isReorderMode ? undefined : () => onRowClick?.(ending)}
          onDragEnd={handleDragEnd}
          onDragOver={(event) => handleDragOver(event, index)}
          onDragStart={(event) => handleDragStart(event, index)}
          onDrop={(event) => handleDrop(event, index)}
        >
          {isReorderMode ? (
            <AdminTableCell>
              <GripVertical aria-hidden="true" className="size-4" />
            </AdminTableCell>
          ) : null}
          <AdminTableCell className="text-[#8A847C]">{ending.id}</AdminTableCell>
          <AdminTableCell className="font-medium text-[#1A1714]">{ending.character.name}</AdminTableCell>
          <AdminTableCell className="max-w-52 truncate text-[#8A847C]" title={ending.scenario.title}>
            {ending.scenario.title}
          </AdminTableCell>
          <AdminTableCell className="font-mono text-sm text-[#3A3530]">{ending.path_key}</AdminTableCell>
          <AdminTableCell className="text-[#8A847C]">
            {formatEndingTypeLabel(ending.ending_type)}
          </AdminTableCell>
          <AdminTableCell className="max-w-36 truncate" title={ending.title}>
            {ending.title}
          </AdminTableCell>
          <AdminTableCell className="text-[#8A847C]">{ending.sort_order}</AdminTableCell>
          <AdminTableCell>
            <AdminStatusBadge isActive={ending.is_active} />
          </AdminTableCell>
        </AdminTableRow>
      ))}
    </AdminDataTable>
  );
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function applyEndingOrder(items: EndingListItem[]) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export { reorderItems as reorderEndingItems };
