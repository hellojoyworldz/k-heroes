"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { type DragEvent, type ReactNode, useState } from "react";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminFormRow } from "@/app/(admin)/_components/admin-form-row";
import { cn } from "@/lib/utils/cn";

export type ReorderableFormItem = {
  key: string;
};

type AdminReorderableFormListProps<T extends ReorderableFormItem> = {
  label: string;
  initialItems: T[];
  createItem: () => T;
  minItems?: number;
  itemLabel: (index: number) => string;
  renderFields: (item: T, index: number) => ReactNode;
};

export function AdminReorderableFormList<T extends ReorderableFormItem>({
  createItem,
  initialItems,
  itemLabel,
  label,
  minItems = 1,
  renderFields,
}: AdminReorderableFormListProps<T>) {
  const [items, setItems] = useState<T[]>(
    initialItems.length > 0 ? initialItems : minItems > 0 ? [createItem()] : [],
  );
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  function addItem() {
    setItems((current) => [...current, createItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, key: string) {
    setDraggedKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, key: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, key: string) {
    event.preventDefault();

    if (!draggedKey || draggedKey === key) {
      return;
    }

    setItems((current) => {
      const fromIndex = current.findIndex((item) => item.key === draggedKey);
      const toIndex = current.findIndex((item) => item.key === key);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDraggedKey(null);
    setDragOverKey(null);
  }

  function handleDragEnd() {
    setDraggedKey(null);
    setDragOverKey(null);
  }

  return (
    <AdminFormRow alignTop label={label}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.key}
            className={cn(
              "space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4",
              "cursor-grab active:cursor-grabbing",
              dragOverKey === item.key && "bg-[#F4F1EA]",
              draggedKey === item.key && "opacity-50",
            )}
            draggable
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, item.key)}
            onDragStart={(event) => handleDragStart(event, item.key)}
            onDrop={(event) => handleDrop(event, item.key)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GripVertical aria-hidden="true" className="size-4 text-[#8A847C]" />
                <p className="text-xs font-medium text-[#8A847C]">{itemLabel(index)}</p>
              </div>
              {items.length > minItems ? (
                <AdminButton
                  className="h-8 w-auto gap-1.5 px-2.5"
                  onClick={() => removeItem(index)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  삭제
                </AdminButton>
              ) : null}
            </div>

            {renderFields(item, index)}
          </div>
        ))}

        <AdminButton
          className="h-9 w-auto gap-1.5 px-3"
          onClick={addItem}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          항목 추가
        </AdminButton>
      </div>
    </AdminFormRow>
  );
}
