import { GripVertical } from "lucide-react";
import { type DragEvent, useState } from "react";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableRow,
  type AdminTableColumn,
} from "@/app/(admin)/_components/admin-data-table";
import type { TurnListItem } from "@/app/(admin)/admin/(dashboard)/turns/_types";
import { cn } from "@/lib/utils/cn";

const baseColumns: AdminTableColumn[] = [
  { key: "id", header: "ID", className: "w-16" },
  { key: "character", header: "인물" },
  { key: "scenario", header: "시나리오", className: "w-36" },
  { key: "title", header: "제목" },
  { key: "sort_order", header: "순서", className: "w-20" },
];

const handleColumn: AdminTableColumn = { key: "handle", header: "", className: "w-12" };

type TurnTableProps = {
  turns: TurnListItem[];
  emptyMessage: string;
  isReorderMode: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRowClick?: (turn: TurnListItem) => void;
};

export function TurnTable({
  turns,
  emptyMessage,
  isReorderMode,
  onReorder,
  onRowClick,
}: TurnTableProps) {
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

  function handleDragLeave() {
    setDragOverIndex(null);
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
    <AdminDataTable columns={columns} emptyMessage={emptyMessage} isEmpty={turns.length === 0}>
      {turns.map((turn, index) => (
        <AdminTableRow
          key={turn.id}
          className={cn(
            isReorderMode && draggedIndex === index && "opacity-50",
            isReorderMode && dragOverIndex === index && "bg-[#F4F1EA]",
            isReorderMode && "cursor-grab active:cursor-grabbing hover:bg-[#FDFCFA]",
          )}
          draggable={isReorderMode}
          onClick={isReorderMode ? undefined : () => onRowClick?.(turn)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          onDragOver={(event) => handleDragOver(event, index)}
          onDragStart={(event) => handleDragStart(event, index)}
          onDrop={(event) => handleDrop(event, index)}
        >
          {isReorderMode ? (
            <AdminTableCell className="text-[#8A847C]">
              <GripVertical aria-hidden="true" className="size-4" />
            </AdminTableCell>
          ) : null}
          <AdminTableCell className="text-[#8A847C]">{turn.id}</AdminTableCell>
          <AdminTableCell className="font-medium text-[#1A1714]">{turn.character.name}</AdminTableCell>
          <AdminTableCell className="text-[#8A847C]">{turn.scenario.title}</AdminTableCell>
          <AdminTableCell>{turn.title}</AdminTableCell>
          <AdminTableCell className="text-[#8A847C]">{turn.sort_order}</AdminTableCell>
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

export function applyTurnOrder(items: TurnListItem[]) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export { reorderItems as reorderTurnItems };
