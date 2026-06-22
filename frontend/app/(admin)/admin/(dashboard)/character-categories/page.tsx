"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  AdminActiveFilter,
  type ActiveFilterValue,
} from "@/app/(admin)/_components/admin-active-filter";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { CharacterCategoryPanelForm } from "@/app/(admin)/admin/(dashboard)/character-categories/_components/character-category-panel-form";
import {
  applyCategoryOrder,
  CharacterCategoryTable,
  reorderCategoryItems,
} from "@/app/(admin)/admin/(dashboard)/character-categories/_components/character-category-table";
import type { CharacterCategoryListItem } from "@/app/(admin)/admin/(dashboard)/character-categories/_types";

type PanelMode = "create" | "edit" | null;

const reorderConfirmMessage = "순서를 변경하시겠습니까?";

export default function CharacterCategoriesPage() {
  const [categories, setCategories] = useState<CharacterCategoryListItem[]>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategoryListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftCategories, setDraftCategories] = useState<CharacterCategoryListItem[]>([]);

  const displayCategories = isReorderMode ? draftCategories : categories;
  const showReorderButton =
    activeFilter === "all" && categories.length > 0 && !isReorderMode && !panelMode;

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedCategory(null);
  }

  function openEditPanel(category: CharacterCategoryListItem) {
    setSelectedCategory(category);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode(null);
    setSelectedCategory(null);
  }

  function startReorderMode() {
    setDraftCategories([...categories]);
    setIsReorderMode(true);
  }

  function cancelReorderMode() {
    setDraftCategories([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    setDraftCategories((current) => applyCategoryOrder(reorderCategoryItems(current, fromIndex, toIndex)));
  }

  function applyReorder() {
    if (!window.confirm(reorderConfirmMessage)) {
      return;
    }

    setCategories(draftCategories);
    setIsReorderMode(false);
    setDraftCategories([]);
    // TODO: PATCH /api/v2/admin/character-categories/reorder
    // body: { ids: draftCategories.map((category) => category.id) }
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton
            className="h-11 w-auto gap-2 px-5"
            disabled={isReorderMode}
            onClick={openCreatePanel}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            카테고리 생성
          </AdminButton>
        }
        description="인물 분류 카테고리를 관리합니다."
        title="인물 카테고리"
      />

      <div className="mb-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminActiveFilter
          disabled={isReorderMode}
          onChange={setActiveFilter}
          value={activeFilter}
        />
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">드래그하여 순서를 변경하세요.</p>
          <div className="flex gap-2">
            <AdminButton
              className="w-auto"
              onClick={cancelReorderMode}
              size="sm"
              type="button"
              variant="secondary"
            >
              취소
            </AdminButton>
            <AdminButton className="w-auto" onClick={applyReorder} size="sm" type="button">
              순서 변경하기
            </AdminButton>
          </div>
        </div>
      ) : showReorderButton ? (
        <div className="mb-4 flex justify-end">
          <AdminButton
            className="w-auto"
            onClick={startReorderMode}
            size="sm"
            type="button"
            variant="secondary"
          >
            순서 변경
          </AdminButton>
        </div>
      ) : null}

      <CharacterCategoryTable
        categories={displayCategories}
        emptyMessage="등록된 카테고리가 없습니다."
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRowClick={openEditPanel}
      />

      <AdminSlidePanel
        description={
          panelMode === "create"
            ? "새 인물 카테고리를 등록합니다."
            : "카테고리 정보를 수정합니다."
        }
        footer={
          panelMode ? <AdminPanelFooter mode={panelMode} onCancel={closePanel} /> : null
        }
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "카테고리 생성" : "카테고리 수정"}
      >
        {panelMode ? (
          <CharacterCategoryPanelForm
            key={selectedCategory?.id ?? "create"}
            category={selectedCategory ?? undefined}
            mode={panelMode}
          />
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
