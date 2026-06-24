"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AdminActiveFilter,
  AdminFilterRow,
  type ActiveFilterValue,
} from "@/app/(admin)/_components/admin-active-filter";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import {
  AdminPagination,
  type AdminPageSize,
} from "@/app/(admin)/_components/admin-pagination";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { useAdminCategoryOptions } from "@/app/(admin)/_hooks/use-admin-categories";
import {
  fetchAdminCharactersForReorder,
  useAdminCharacters,
  useCreateAdminCharacter,
  useDeleteAdminCharacter,
  useReorderAdminCharacters,
  useUpdateAdminCharacter,
} from "@/app/(admin)/_hooks/use-admin-characters";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { CharacterPanelForm } from "@/app/(admin)/admin/(dashboard)/characters/_components/character-panel-form";
import {
  applyCharacterOrder,
  CharacterTable,
  reorderCharacterItems,
} from "@/app/(admin)/admin/(dashboard)/characters/_components/character-table";
import type { CharacterListItem } from "@/app/(admin)/admin/(dashboard)/characters/_types";
type PanelMode = "create" | "edit" | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CharactersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [submittedNameQuery, setSubmittedNameQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftCharacters, setDraftCharacters] = useState<CharacterListItem[]>([]);
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");

  const categoryOptionsQuery = useAdminCategoryOptions();
  const charactersQuery = useAdminCharacters(
    { active: activeFilter, categoryId: categoryFilter, name: submittedNameQuery },
    page,
    pageSize,
  );
  const createCharacter = useCreateAdminCharacter();
  const updateCharacter = useUpdateAdminCharacter();
  const deleteCharacter = useDeleteAdminCharacter();
  const reorderCharacters = useReorderAdminCharacters();

  const characters = charactersQuery.data?.items ?? [];
  const categories = categoryOptionsQuery.data ?? [];
  const total = charactersQuery.data?.total ?? 0;
  const totalPages = charactersQuery.data?.total_pages ?? 0;
  const isLoading = charactersQuery.isPending;
  const isRefreshing = charactersQuery.isFetching && !charactersQuery.isPending;
  const isSaving = createCharacter.isPending || updateCharacter.isPending;
  const isDeleting = deleteCharacter.isPending;
  const tableError = pageError || (charactersQuery.error?.message ?? "");
  const displayCharacters = isReorderMode ? draftCharacters : characters;
  const showReorderButton =
    categoryFilter !== null && total > 0 && !isLoading && !isReorderMode && !panelMode;

  useEffect(() => {
    const error = charactersQuery.error ?? categoryOptionsQuery.error;
    if (error instanceof AdminApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [categoryOptionsQuery.error, charactersQuery.error, router]);

  function resetPanel() {
    setPanelMode(null);
    setSelectedCharacter(null);
    setPanelError("");
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    resetPanel();
  }

  function reloadCharacters() {
    setIsReorderMode(false);
    setDraftCharacters([]);
    setPageError("");
    void charactersQuery.refetch();
  }

  async function startReorderMode() {
    if (categoryFilter === null) return;
    setIsPreparingReorder(true);
    setPageError("");
    try {
      setDraftCharacters(
        await fetchAdminCharactersForReorder(queryClient, categoryFilter),
      );
      setIsReorderMode(true);
    } catch (error) {
      setPageError(errorMessage(error, "정렬할 인물을 불러오지 못했습니다."));
    } finally {
      setIsPreparingReorder(false);
    }
  }

  async function applyReorder() {
    if (categoryFilter === null || !window.confirm("순서를 변경하시겠습니까?")) return;
    setPageError("");
    try {
      await reorderCharacters.mutateAsync({
        categoryId: categoryFilter,
        ids: draftCharacters.map((character) => character.id),
      });
      setIsReorderMode(false);
      setDraftCharacters([]);
    } catch (error) {
      setPageError(errorMessage(error, "순서를 변경하지 못했습니다."));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panelMode) return;

    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const requiredFields = [
      "name",
      "role",
      "era",
      "era_tag",
      "years",
      "situation",
      "one_line_summary",
      "mbti",
      "mbti_nickname",
      "intro_quote",
      "intro_desc",
    ];
    if (requiredFields.some((field) => !text(field))) {
      setPanelError("필수 항목을 모두 입력해 주세요.");
      return;
    }

    function parseStoryIds(field: string) {
      return text(field)
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
    }

    const statMap = new Map<number, { name: string; value: number; desc: string }>();
    for (const [key, rawValue] of formData.entries()) {
      const match = /^stats\.(\d+)\.(name|value|desc)$/.exec(String(key));
      if (!match) continue;

      const index = Number(match[1]);
      const field = match[2];
      const current = statMap.get(index) ?? { name: "", value: 0, desc: "" };

      if (field === "name") {
        current.name = String(rawValue).trim();
      } else if (field === "value") {
        current.value = Number(rawValue);
      } else if (field === "desc") {
        current.desc = String(rawValue).trim();
      }

      statMap.set(index, current);
    }

    const stats = [...statMap.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, item]) => item);

    if (stats.some((item) => !item.name || !Number.isFinite(item.value))) {
      setPanelError("강점 이름과 값을 모두 입력해 주세요.");
      return;
    }

    const turnStatMap = new Map<number, { id?: number; name: string }>();
    for (const [key, rawValue] of formData.entries()) {
      const match = /^turn_stats\.(\d+)\.(id|name)$/.exec(String(key));
      if (!match) continue;

      const index = Number(match[1]);
      const field = match[2];
      const current = turnStatMap.get(index) ?? { name: "" };

      if (field === "name") {
        current.name = String(rawValue).trim();
      } else if (field === "id") {
        const parsedId = Number(rawValue);
        if (Number.isFinite(parsedId) && parsedId > 0) {
          current.id = parsedId;
        }
      }

      turnStatMap.set(index, current);
    }

    const turnStats = [...turnStatMap.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, item]) => item)
      .filter((item) => item.name)
      .map((item) => (item.id ? { id: item.id, name: item.name } : { name: item.name }));

    if (turnStats.some((item) => !item.name)) {
      setPanelError("턴 능력치 이름을 모두 입력해 주세요.");
      return;
    }

    const associatedStories = {
      prsn: parseStoryIds("associated_stories.prsn"),
      cltur: parseStoryIds("associated_stories.cltur"),
      국사교과서: parseStoryIds("associated_stories.국사교과서"),
    };

    const body: Record<string, unknown> = {
      name: text("name"),
      category_id: Number(formData.get("category_id")),
      role: text("role"),
      era: text("era"),
      era_tag: text("era_tag"),
      years: text("years"),
      situation: text("situation"),
      one_line_summary: text("one_line_summary"),
      mbti: text("mbti").toUpperCase(),
      mbti_nickname: text("mbti_nickname"),
      mbti_e_i: text("mbti_e_i"),
      mbti_s_n: text("mbti_s_n"),
      mbti_t_f: text("mbti_t_f"),
      mbti_j_p: text("mbti_j_p"),
      intro_quote: text("intro_quote"),
      intro_desc: text("intro_desc"),
      image_url: text("image_url"),
      keywords: text("keywords")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      stats,
      turn_stats: turnStats,
      associated_stories: associatedStories,
      ...(panelMode === "edit"
        ? { is_active: formData.get("is_active") === "on" }
        : {}),
    };

    setPanelError("");
    try {
      if (panelMode === "create") {
        await createCharacter.mutateAsync(body);
      } else if (selectedCharacter) {
        await updateCharacter.mutateAsync({ id: selectedCharacter.id, body });
      }
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "인물을 저장하지 못했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedCharacter) return;
    setPanelError("");
    try {
      await deleteCharacter.mutateAsync(selectedCharacter.id);
      if (characters.length === 1 && page > 1) setPage((current) => current - 1);
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "인물을 삭제하지 못했습니다."));
    }
  }

  function handleNameSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSubmittedNameQuery(nameQuery.trim());
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton
            className="h-11 w-auto gap-2 px-5"
            disabled={isReorderMode || categoryOptionsQuery.isLoading || categories.length === 0}
            onClick={() => {
              setSelectedCharacter(null);
              setPanelError("");
              setPanelMode("create");
            }}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            인물 생성
          </AdminButton>
        }
        description="역사 인물을 관리합니다."
        title="인물"
      />

      <div className="mb-4 space-y-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminActiveFilter
          disabled={isReorderMode}
          onChange={(value) => {
            setPage(1);
            setActiveFilter(value);
          }}
          value={activeFilter}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFilterRow htmlFor="character-category-filter" label="카테고리">
            <AdminSelect
              className="h-11"
              disabled={isReorderMode || categoryOptionsQuery.isLoading}
              id="character-category-filter"
              onChange={(event) => {
                setPage(1);
                setCategoryFilter(event.target.value ? Number(event.target.value) : null);
              }}
              value={categoryFilter ?? ""}
            >
              <option value="">전체</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </AdminSelect>
          </AdminFilterRow>

          <AdminFilterRow htmlFor="character-name-filter" label="이름 검색">
            <form className="min-w-0" onSubmit={handleNameSearchSubmit}>
              <AdminInput
                className="h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10"
                disabled={isReorderMode}
                id="character-name-filter"
                onChange={(event) => setNameQuery(event.target.value)}
                placeholder="이름으로 검색"
                type="search"
                value={nameQuery}
              />
            </form>
          </AdminFilterRow>
        </div>
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">선택한 카테고리 내에서 드래그하여 순서를 변경하세요.</p>
          <div className="flex gap-2">
            <AdminButton
              className="w-auto"
              disabled={reorderCharacters.isPending}
              onClick={() => {
                setDraftCharacters([]);
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
              isLoading={reorderCharacters.isPending}
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
          isRefreshing={isRefreshing}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPage(1);
            setPageSize(value);
          }}
          onRefresh={reloadCharacters}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      <CharacterTable
        characters={displayCharacters}
        emptyMessage="등록된 인물이 없습니다."
        errorMessage={tableError}
        isLoading={isLoading}
        isReorderMode={isReorderMode}
        onReorder={(fromIndex, toIndex) =>
          setDraftCharacters((current) =>
            applyCharacterOrder(reorderCharacterItems(current, fromIndex, toIndex)),
          )
        }
        onRetry={reloadCharacters}
        onRowClick={(character) => {
          setSelectedCharacter(character);
          setPanelError("");
          setPanelMode("edit");
        }}
      />

      <AdminSlidePanel
        description={panelMode === "create" ? "새 인물을 등록합니다." : "인물 정보를 수정합니다."}
        footer={
          panelMode ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 인물을 삭제하시겠습니까?"
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
        title={panelMode === "create" ? "인물 생성" : "인물 수정"}
      >
        {panelMode ? (
          <form
            key={selectedCharacter?.id ?? "create"}
            ref={formRef}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <CharacterPanelForm
              categoryOptions={categories}
              character={selectedCharacter ?? undefined}
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
