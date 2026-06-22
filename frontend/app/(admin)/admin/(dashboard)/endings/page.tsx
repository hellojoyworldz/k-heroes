"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import {
  AdminActiveFilter,
  AdminFilterRow,
  type ActiveFilterValue,
} from "@/app/(admin)/_components/admin-active-filter";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import {
  AdminPagination,
  type AdminPageSize,
} from "@/app/(admin)/_components/admin-pagination";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { useAdminCharacterOptions } from "@/app/(admin)/_hooks/use-admin-characters";
import {
  fetchAdminEndingsForReorder,
  useAdminEndings,
  useCreateAdminEnding,
  useDeleteAdminEnding,
  useReorderAdminEndings,
  useUpdateAdminEnding,
} from "@/app/(admin)/_hooks/use-admin-endings";
import { useAdminScenarioOptions } from "@/app/(admin)/_hooks/use-admin-scenarios";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { EndingPanelForm } from "@/app/(admin)/admin/(dashboard)/endings/_components/ending-panel-form";
import {
  applyEndingOrder,
  EndingTable,
  reorderEndingItems,
} from "@/app/(admin)/admin/(dashboard)/endings/_components/ending-table";
import type {
  EndingListItem,
  RecommendedPlace,
  SummaryItem,
} from "@/app/(admin)/admin/(dashboard)/endings/_types";
type PanelMode = "create" | "edit" | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function parseSummaryItems(formData: FormData): SummaryItem[] {
  const items: SummaryItem[] = [];

  for (let index = 0; index < 100; index += 1) {
    if (!formData.has(`summary_items.${index}.title`)) {
      break;
    }

    const title = String(formData.get(`summary_items.${index}.title`) ?? "").trim();
    const desc = String(formData.get(`summary_items.${index}.desc`) ?? "").trim();
    if (!title && !desc) {
      continue;
    }
    if (title && desc) {
      items.push({ title, desc });
    }
  }

  return items;
}

function parseRecommendedPlaces(formData: FormData): RecommendedPlace[] {
  const items: RecommendedPlace[] = [];

  for (let index = 0; index < 100; index += 1) {
    if (!formData.has(`recommended_places.${index}.name`)) {
      break;
    }

    const name = String(formData.get(`recommended_places.${index}.name`) ?? "").trim();
    const address = String(formData.get(`recommended_places.${index}.address`) ?? "").trim();
    const description = String(
      formData.get(`recommended_places.${index}.description`) ?? "",
    ).trim();
    const link = String(formData.get(`recommended_places.${index}.link`) ?? "").trim();
    const imageUrl = String(formData.get(`recommended_places.${index}.image_url`) ?? "").trim();

    if (!name && !address && !description) {
      continue;
    }

    items.push({
      name,
      address,
      description,
      link,
      image_url: imageUrl,
    });
  }

  return items;
}

export default function EndingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedEnding, setSelectedEnding] = useState<EndingListItem | null>(null);
  const [characterFilter, setCharacterFilter] = useState<number | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftEndings, setDraftEndings] = useState<EndingListItem[]>([]);
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");

  const endingsQuery = useAdminEndings(
    { characterId: characterFilter, scenarioId: scenarioFilter, active: activeFilter },
    page,
    pageSize,
  );
  const scenarioOptionsQuery = useAdminScenarioOptions();
  const characterOptionsQuery = useAdminCharacterOptions();
  const createEnding = useCreateAdminEnding();
  const updateEnding = useUpdateAdminEnding();
  const deleteEnding = useDeleteAdminEnding();
  const reorderEndings = useReorderAdminEndings();

  const endings = endingsQuery.data?.items ?? [];
  const total = endingsQuery.data?.total ?? 0;
  const totalPages = endingsQuery.data?.total_pages ?? 0;
  const isLoading = endingsQuery.isFetching;
  const isSaving = createEnding.isPending || updateEnding.isPending;
  const isDeleting = deleteEnding.isPending;
  const tableError = pageError || (endingsQuery.error?.message ?? "");
  const displayEndings = isReorderMode ? draftEndings : endings;

  const scenarioOptions = scenarioOptionsQuery.data ?? [];

  const filteredScenarioOptions =
    characterFilter === null
      ? scenarioOptions
      : scenarioOptions.filter((scenario) => scenario.character_id === characterFilter);

  const characterOptions = characterOptionsQuery.data ?? [];

  const showReorderButton =
    scenarioFilter !== null && total > 0 && !isLoading && !isReorderMode && !panelMode;

  useEffect(() => {
    const error =
      endingsQuery.error ?? scenarioOptionsQuery.error ?? characterOptionsQuery.error;
    if (error instanceof AdminApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [characterOptionsQuery.error, endingsQuery.error, router, scenarioOptionsQuery.error]);

  function openCreatePanel() {
    setSelectedEnding(null);
    setPanelError("");
    setPanelMode("create");
  }

  function openEditPanel(ending: EndingListItem) {
    setSelectedEnding(ending);
    setPanelError("");
    setPanelMode("edit");
  }

  function resetPanel() {
    setPanelMode(null);
    setSelectedEnding(null);
    setPanelError("");
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    resetPanel();
  }

  function reloadEndings() {
    setIsReorderMode(false);
    setDraftEndings([]);
    setPageError("");
    void endingsQuery.refetch();
  }

  async function startReorderMode() {
    if (scenarioFilter === null) return;
    setIsPreparingReorder(true);
    setPageError("");
    try {
      setDraftEndings(await fetchAdminEndingsForReorder(queryClient, scenarioFilter));
      setIsReorderMode(true);
    } catch (error) {
      setPageError(errorMessage(error, "정렬할 엔딩을 불러오지 못했습니다."));
    } finally {
      setIsPreparingReorder(false);
    }
  }

  function cancelReorderMode() {
    setDraftEndings([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    setDraftEndings((current) =>
      applyEndingOrder(reorderEndingItems(current, fromIndex, toIndex)),
    );
  }

  async function applyReorder() {
    if (scenarioFilter === null || !window.confirm("순서를 변경하시겠습니까?")) {
      return;
    }

    setPageError("");
    try {
      await reorderEndings.mutateAsync({
        scenarioId: scenarioFilter,
        ids: draftEndings.map((ending) => ending.id),
      });
      setIsReorderMode(false);
      setDraftEndings([]);
    } catch (error) {
      setPageError(errorMessage(error, "순서를 변경하지 못했습니다."));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panelMode) return;

    const formData = new FormData(event.currentTarget);
    const pathKey = String(formData.get("path_key") ?? "").trim();
    const endingType = String(formData.get("ending_type") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const historyFact = String(formData.get("history_fact") ?? "").trim();
    const storyHeadline = String(formData.get("story_headline") ?? "").trim();
    const storyContents = String(formData.get("story_contents") ?? "").trim();

    if (!pathKey || !endingType || !title || !historyFact || !storyHeadline || !storyContents) {
      setPanelError("경로, 엔딩 유형, 제목, 역사적 사실, 스토리 헤드라인, 스토리 본문을 입력해 주세요.");
      return;
    }

    const scenarioId = Number(formData.get("scenario_id"));

    if (!scenarioId || !Number.isFinite(scenarioId)) {
      setPanelError("시나리오를 선택해 주세요.");
      return;
    }

    const sharedBody = {
      path_key: pathKey,
      ending_type: endingType,
      title,
      history_fact: historyFact,
      story_headline: storyHeadline,
      story_contents: storyContents,
      factual_contents: String(formData.get("factual_contents") ?? "").trim(),
      image_url: String(formData.get("image_url") ?? "").trim(),
      summary_items: parseSummaryItems(formData),
      recommended_places: parseRecommendedPlaces(formData),
    };

    setPanelError("");
    try {
      if (panelMode === "create") {
        await createEnding.mutateAsync({
          scenario_id: scenarioId,
          ...sharedBody,
        });
      } else if (selectedEnding) {
        await updateEnding.mutateAsync({
          id: selectedEnding.id,
          body: {
            scenario_id: scenarioId,
            ...sharedBody,
            is_active: formData.get("is_active") === "on",
          },
        });
      }
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "엔딩을 저장하지 못했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedEnding) return;

    setPanelError("");
    try {
      await deleteEnding.mutateAsync(selectedEnding.id);
      if (endings.length === 1 && page > 1) setPage((current) => current - 1);
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "엔딩을 삭제하지 못했습니다."));
    }
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton
            className="h-11 w-auto gap-2 px-5"
            disabled={
              isReorderMode || scenarioOptionsQuery.isLoading || scenarioOptions.length === 0
            }
            onClick={openCreatePanel}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            엔딩 생성
          </AdminButton>
        }
        description="시나리오별 엔딩을 관리합니다."
        title="엔딩"
      />

      <div className="mb-4 space-y-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminActiveFilter
          disabled={isReorderMode}
          onChange={(value) => {
            setPage(1);
            setActiveFilter(value);
            setPageError("");
          }}
          value={activeFilter}
        />

        <AdminFilterRow htmlFor="ending-character-filter" label="인물">
          <AdminSelect
            className="h-11"
            disabled={isReorderMode || characterOptionsQuery.isLoading}
            id="ending-character-filter"
            onChange={(event) => {
              setPage(1);
              setCharacterFilter(event.target.value ? Number(event.target.value) : null);
              setScenarioFilter(null);
              setPageError("");
            }}
            value={characterFilter ?? ""}
          >
            <option value="">전체</option>
            {characterOptions.map((character) => (
              <option key={character.id} value={character.id}>
                {character.label}
              </option>
            ))}
          </AdminSelect>
        </AdminFilterRow>

        <AdminFilterRow htmlFor="ending-scenario-filter" label="시나리오">
          <AdminSelect
            className="h-11"
            disabled={isReorderMode || scenarioOptionsQuery.isLoading}
            id="ending-scenario-filter"
            onChange={(event) => {
              setPage(1);
              setScenarioFilter(event.target.value ? Number(event.target.value) : null);
              setPageError("");
            }}
            value={scenarioFilter ?? ""}
          >
            <option value="">전체</option>
            {filteredScenarioOptions.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </AdminSelect>
        </AdminFilterRow>
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">
            선택한 시나리오 내에서 드래그하여 순서를 변경하세요.
          </p>
          <div className="flex gap-2">
            <AdminButton
              className="w-auto"
              disabled={reorderEndings.isPending}
              onClick={cancelReorderMode}
              size="sm"
              type="button"
              variant="secondary"
            >
              취소
            </AdminButton>
            <AdminButton
              className="w-auto"
              isLoading={reorderEndings.isPending}
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
          onRefresh={reloadEndings}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      <EndingTable
        emptyMessage="등록된 엔딩이 없습니다."
        endings={displayEndings}
        errorMessage={tableError}
        isLoading={isLoading}
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRetry={reloadEndings}
        onRowClick={openEditPanel}
      />

      <AdminSlidePanel
        description={panelMode === "create" ? "새 엔딩을 등록합니다." : "엔딩 정보를 수정합니다."}
        footer={
          panelMode ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 엔딩을 삭제하시겠습니까?"
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
        title={panelMode === "create" ? "엔딩 생성" : "엔딩 수정"}
      >
        {panelMode ? (
          <form
            key={selectedEnding?.id ?? "create"}
            ref={formRef}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <EndingPanelForm
              characterOptions={characterOptions}
              defaultCharacterId={panelMode === "create" ? characterFilter : null}
              defaultScenarioId={panelMode === "create" ? scenarioFilter : null}
              ending={selectedEnding ?? undefined}
              mode={panelMode}
              scenarioOptions={scenarioOptions}
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
