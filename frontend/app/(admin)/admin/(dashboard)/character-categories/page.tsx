"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { fetchAdminApi, type PaginatedResponse } from "@/app/(admin)/_lib/admin-api";
import { CharacterCategoryPanelForm } from "@/app/(admin)/admin/(dashboard)/character-categories/_components/character-category-panel-form";
import {
  applyCategoryOrder,
  CharacterCategoryTable,
  reorderCategoryItems,
} from "@/app/(admin)/admin/(dashboard)/character-categories/_components/character-category-table";
import type { CharacterCategoryListItem } from "@/app/(admin)/admin/(dashboard)/character-categories/_types";

type PanelMode = "create" | "edit" | null;

const reorderConfirmMessage = "순서를 변경하시겠습니까?";

function getCategoriesPath(filter: ActiveFilterValue, page: number, pageSize: AdminPageSize) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filter === "active") params.set("is_active", "true");
  if (filter === "inactive") params.set("is_active", "false");
  return `/api/v2/admin/character-categories?${params.toString()}`;
}

function requestCategories(
  filter: ActiveFilterValue,
  page: number,
  pageSize: AdminPageSize,
  signal?: AbortSignal,
) {
  return fetchAdminApi(getCategoriesPath(filter, page, pageSize), {
    cache: "no-store",
    signal,
  });
}

async function getApiError(response: Response, fallback: string) {
  if (response.status === 401) return "로그인이 만료되었습니다.";
  if (response.status === 422) return "입력 내용을 확인해 주세요.";

  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string" && data.detail.trim()) return data.detail;
  } catch {
    // 응답 본문이 JSON이 아니면 기본 메시지를 사용합니다.
  }

  return fallback;
}

export default function CharacterCategoriesPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [categories, setCategories] = useState<CharacterCategoryListItem[]>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedCategory, setSelectedCategory] = useState<CharacterCategoryListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftCategories, setDraftCategories] = useState<CharacterCategoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const displayCategories = isReorderMode ? draftCategories : categories;
  const showReorderButton =
    activeFilter === "all" &&
    categories.length > 0 &&
    !isLoading &&
    !isReorderMode &&
    !panelMode;

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const response = await requestCategories(
          activeFilter,
          page,
          pageSize,
          controller.signal,
        );

        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!response.ok) {
          throw new Error(await getApiError(response, "카테고리 목록을 불러오지 못했습니다."));
        }

        const data = (await response.json()) as PaginatedResponse<CharacterCategoryListItem>;
        setCategories(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPageError(
            error instanceof Error
              ? error.message
              : "카테고리 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, [activeFilter, page, pageSize, reloadKey, router]);

  function reloadCategories() {
    setIsReorderMode(false);
    setDraftCategories([]);
    setIsLoading(true);
    setPageError("");
    setReloadKey((current) => current + 1);
  }

  function changeActiveFilter(filter: ActiveFilterValue) {
    if (filter === activeFilter) return;
    setIsLoading(true);
    setPageError("");
    setPage(1);
    setActiveFilter(filter);
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return;
    setIsLoading(true);
    setPageError("");
    setPage(nextPage);
  }

  function changePageSize(nextPageSize: AdminPageSize) {
    if (nextPageSize === pageSize) return;
    setIsLoading(true);
    setPageError("");
    setPage(1);
    setPageSize(nextPageSize);
  }

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedCategory(null);
    setPanelError("");
  }

  function openEditPanel(category: CharacterCategoryListItem) {
    setSelectedCategory(category);
    setPanelMode("edit");
    setPanelError("");
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
      const response = await requestCategories("all", 1, 100);

      if (!response.ok) {
        setPageError(await getApiError(response, "정렬할 카테고리를 불러오지 못했습니다."));
        if (response.status === 401) router.replace("/admin/login");
        return;
      }

      const data = (await response.json()) as PaginatedResponse<CharacterCategoryListItem>;
      setDraftCategories(data.items);
      setIsReorderMode(true);
    } catch {
      setPageError("API 서버에 연결할 수 없습니다.");
    } finally {
      setIsPreparingReorder(false);
    }
  }

  function cancelReorderMode() {
    setDraftCategories([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    if (isReordering) return;
    setDraftCategories((current) =>
      applyCategoryOrder(reorderCategoryItems(current, fromIndex, toIndex)),
    );
  }

  async function applyReorder() {
    if (!window.confirm(reorderConfirmMessage)) {
      return;
    }

    setIsReordering(true);
    setPageError("");

    try {
      const response = await fetchAdminApi("/api/v2/admin/character-categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: draftCategories.map((category) => category.id) }),
      });

      if (!response.ok) {
        setPageError(await getApiError(response, "순서를 변경하지 못했습니다."));
        if (response.status === 401) router.replace("/admin/login");
        return;
      }

      setIsReorderMode(false);
      setDraftCategories([]);
      reloadCategories();
    } catch {
      setPageError("API 서버에 연결할 수 없습니다.");
    } finally {
      setIsReordering(false);
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

    setIsSaving(true);
    setPanelError("");

    try {
      const path =
        panelMode === "create"
          ? "/api/v2/admin/character-categories"
          : `/api/v2/admin/character-categories/${selectedCategory?.id}`;
      const response = await fetchAdminApi(path, {
        method: panelMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setPanelError(await getApiError(response, "카테고리를 저장하지 못했습니다."));
        if (response.status === 401) router.replace("/admin/login");
        return;
      }

      await response.json();
      resetPanel();
      reloadCategories();
    } catch {
      setPanelError("API 서버에 연결할 수 없습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedCategory) return;

    setIsDeleting(true);
    setPanelError("");

    try {
      const response = await fetchAdminApi(
        `/api/v2/admin/character-categories/${selectedCategory.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setPanelError(await getApiError(response, "카테고리를 삭제하지 못했습니다."));
        if (response.status === 401) router.replace("/admin/login");
        return;
      }

      const shouldMoveToPreviousPage = categories.length === 1 && page > 1;
      resetPanel();
      setIsLoading(true);
      setPageError("");
      if (shouldMoveToPreviousPage) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((current) => current + 1);
      }
    } catch {
      setPanelError("API 서버에 연결할 수 없습니다.");
    } finally {
      setIsDeleting(false);
    }
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
              disabled={isReordering}
              onClick={cancelReorderMode}
              size="sm"
              type="button"
              variant="secondary"
            >
              취소
            </AdminButton>
            <AdminButton
              className="w-auto"
              isLoading={isReordering}
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
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
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
        errorMessage={pageError}
        isLoading={isLoading}
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRetry={reloadCategories}
        onRowClick={openEditPanel}
      />

      <AdminSlidePanel
        description={
          panelMode === "create"
            ? "새 인물 카테고리를 등록합니다."
            : "카테고리 정보를 수정합니다."
        }
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
