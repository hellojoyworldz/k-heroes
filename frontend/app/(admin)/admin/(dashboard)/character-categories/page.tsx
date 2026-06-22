"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AdminActiveFilter,
  type ActiveFilterValue,
} from "@/app/(admin)/_components/admin-active-filter";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import {
  AdminPagination,
  type AdminPageSize,
} from "@/app/(admin)/_components/admin-pagination";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import {
  fetchAdminCategoryOptions,
  useAdminCategories,
  useCreateAdminCategory,
  useDeleteAdminCategory,
  useReorderAdminCategories,
  useUpdateAdminCategory,
} from "@/app/(admin)/_hooks/use-admin-categories";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { CharacterCategoryPanelForm } from "@/app/(admin)/admin/(dashboard)/character-categories/_components/character-category-panel-form";
import {
  applyCategoryOrder,
  CharacterCategoryTable,
  reorderCategoryItems,
} from "@/app/(admin)/admin/(dashboard)/character-categories/_components/character-category-table";
import type { CharacterCategoryListItem } from "@/app/(admin)/admin/(dashboard)/character-categories/_types";

type PanelMode = "create" | "edit" | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CharacterCategoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategoryListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftCategories, setDraftCategories] = useState<CharacterCategoryListItem[]>([]);
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");

  const categoriesQuery = useAdminCategories(activeFilter, page, pageSize);
  const createCategory = useCreateAdminCategory();
  const updateCategory = useUpdateAdminCategory();
  const deleteCategory = useDeleteAdminCategory();
  const reorderCategories = useReorderAdminCategories();

  const categories = categoriesQuery.data?.items ?? [];
  const total = categoriesQuery.data?.total ?? 0;
  const totalPages = categoriesQuery.data?.total_pages ?? 0;
  const isLoading = categoriesQuery.isFetching;
  const isSaving = createCategory.isPending || updateCategory.isPending;
  const isDeleting = deleteCategory.isPending;
  const tableError = pageError || (categoriesQuery.error?.message ?? "");
  const displayCategories = isReorderMode ? draftCategories : categories;
  const showReorderButton =
    activeFilter === "all" && total > 0 && !isLoading && !isReorderMode && !panelMode;

  useEffect(() => {
    if (categoriesQuery.error instanceof AdminApiError && categoriesQuery.error.status === 401) {
      router.replace("/admin/login");
    }
  }, [categoriesQuery.error, router]);

  function reloadCategories() {
    setIsReorderMode(false);
    setDraftCategories([]);
    setPageError("");
    void categoriesQuery.refetch();
  }

  function changeActiveFilter(filter: ActiveFilterValue) {
    if (filter === activeFilter) return;
    setPage(1);
    setPageError("");
    setActiveFilter(filter);
  }

  function resetPanel() {
    setPanelMode(null);
    setSelectedCategory(null);
    setPanelError("");
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    resetPanel();
  }

  async function startReorderMode() {
    setIsPreparingReorder(true);
    setPageError("");
    try {
      setDraftCategories(await fetchAdminCategoryOptions(queryClient));
      setIsReorderMode(true);
    } catch (error) {
      setPageError(errorMessage(error, "정렬할 카테고리를 불러오지 못했습니다."));
    } finally {
      setIsPreparingReorder(false);
    }
  }

  async function applyReorder() {
    if (!window.confirm("순서를 변경하시겠습니까?")) return;
    setPageError("");
    try {
      await reorderCategories.mutateAsync(draftCategories.map((category) => category.id));
      setIsReorderMode(false);
      setDraftCategories([]);
    } catch (error) {
      setPageError(errorMessage(error, "순서를 변경하지 못했습니다."));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panelMode) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!title || !description) {
      setPanelError("카테고리명과 설명을 입력해 주세요.");
      return;
    }

    const body = {
      title,
      description,
      ...(panelMode === "edit"
        ? { is_active: formData.get("is_active") === "on" }
        : {}),
    };

    setPanelError("");
    try {
      if (panelMode === "create") {
        await createCategory.mutateAsync(body);
      } else if (selectedCategory) {
        await updateCategory.mutateAsync({ id: selectedCategory.id, body });
      }
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "카테고리를 저장하지 못했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return;
    setPanelError("");
    try {
      await deleteCategory.mutateAsync(selectedCategory.id);
      if (categories.length === 1 && page > 1) setPage((current) => current - 1);
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "카테고리를 삭제하지 못했습니다."));
    }
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton
            className="h-11 w-auto gap-2 px-5"
            disabled={isReorderMode}
            onClick={() => {
              setSelectedCategory(null);
              setPanelError("");
              setPanelMode("create");
            }}
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
          onChange={changeActiveFilter}
          value={activeFilter}
        />
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">드래그하여 순서를 변경하세요.</p>
          <div className="flex gap-2">
            <AdminButton
              className="w-auto"
              disabled={reorderCategories.isPending}
              onClick={() => {
                setDraftCategories([]);
                setIsReorderMode(false);
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              취소
            </AdminButton>
            <AdminButton
              className="w-auto"
              isLoading={reorderCategories.isPending}
              loadingText="변경 중..."
              onClick={applyReorder}
              size="sm"
              type="button"
            >
              순서 변경하기
            </AdminButton>
          </div>
        </div>
      ) : showReorderButton ? (
        <div className="mb-4 flex justify-end">
          <AdminButton
            className="w-auto"
            isLoading={isPreparingReorder}
            loadingText="불러오는 중..."
            onClick={startReorderMode}
            size="sm"
            type="button"
            variant="secondary"
          >
            순서 변경
          </AdminButton>
        </div>
      ) : null}

      {!isReorderMode ? (
        <AdminPagination
          disabled={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPage(1);
            setPageSize(value);
          }}
          onRefresh={reloadCategories}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      <CharacterCategoryTable
        categories={displayCategories}
        emptyMessage="등록된 카테고리가 없습니다."
        errorMessage={tableError}
        isLoading={isLoading}
        isReorderMode={isReorderMode}
        onReorder={(fromIndex, toIndex) =>
          setDraftCategories((current) =>
            applyCategoryOrder(reorderCategoryItems(current, fromIndex, toIndex)),
          )
        }
        onRetry={reloadCategories}
        onRowClick={(category) => {
          setSelectedCategory(category);
          setPanelError("");
          setPanelMode("edit");
        }}
      />

      <AdminSlidePanel
        description={panelMode === "create" ? "새 인물 카테고리를 등록합니다." : "카테고리 정보를 수정합니다."}
        footer={
          panelMode ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 인물 카테고리를 삭제하시겠습니까?"
              isDeleting={isDeleting}
              isSaving={isSaving}
              mode={panelMode}
              onCancel={closePanel}
              onDelete={handleDelete}
              onSave={() => formRef.current?.requestSubmit()}
            />
          ) : null
        }
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "카테고리 생성" : "카테고리 수정"}
      >
        {panelMode ? (
          <form
            key={selectedCategory?.id ?? "create"}
            ref={formRef}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <CharacterCategoryPanelForm
              category={selectedCategory ?? undefined}
              mode={panelMode}
            />
            {panelError ? (
              <p
                aria-live="polite"
                className="rounded-lg border border-[#E6C9C5] bg-[#FDF6F5] px-4 py-3 text-sm text-[#9A3F38]"
                role="alert"
              >
                {panelError}
              </p>
            ) : null}
          </form>
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
