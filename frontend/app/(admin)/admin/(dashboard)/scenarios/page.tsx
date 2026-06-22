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
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import {
  AdminPagination,
  type AdminPageSize,
} from "@/app/(admin)/_components/admin-pagination";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { useAdminCharacterOptions } from "@/app/(admin)/_hooks/use-admin-characters";
import {
  fetchAdminScenariosForReorder,
  useAdminScenarios,
  useCreateAdminScenario,
  useDeleteAdminScenario,
  useReorderAdminScenarios,
  useUpdateAdminScenario,
} from "@/app/(admin)/_hooks/use-admin-scenarios";
import { ScenarioPanelForm } from "@/app/(admin)/admin/(dashboard)/scenarios/_components/scenario-panel-form";
import {
  applyScenarioOrder,
  reorderScenarioItems,
  ScenarioTable,
} from "@/app/(admin)/admin/(dashboard)/scenarios/_components/scenario-table";
import type { ScenarioListItem } from "@/app/(admin)/admin/(dashboard)/scenarios/_types";
type PanelMode = "create" | "edit" | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ScenariosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [characterFilter, setCharacterFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftScenarios, setDraftScenarios] = useState<ScenarioListItem[]>([]);
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");

  const scenariosQuery = useAdminScenarios(
    { active: activeFilter, characterId: characterFilter },
    page,
    pageSize,
  );
  const characterOptionsQuery = useAdminCharacterOptions();
  const createScenario = useCreateAdminScenario();
  const updateScenario = useUpdateAdminScenario();
  const deleteScenario = useDeleteAdminScenario();
  const reorderScenarios = useReorderAdminScenarios();

  const scenarios = scenariosQuery.data?.items ?? [];
  const characterOptions = characterOptionsQuery.data ?? [];
  const total = scenariosQuery.data?.total ?? 0;
  const totalPages = scenariosQuery.data?.total_pages ?? 0;
  const isLoading = scenariosQuery.isFetching;
  const isSaving = createScenario.isPending || updateScenario.isPending;
  const isDeleting = deleteScenario.isPending;
  const tableError = pageError || (scenariosQuery.error?.message ?? "");
  const displayScenarios = isReorderMode ? draftScenarios : scenarios;
  const showReorderButton =
    characterFilter !== null && total > 0 && !isLoading && !isReorderMode && !panelMode;

  useEffect(() => {
    const error = scenariosQuery.error ?? characterOptionsQuery.error;
    if (error instanceof AdminApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [characterOptionsQuery.error, scenariosQuery.error, router]);

  function openCreatePanel() {
    setSelectedScenario(null);
    setPanelError("");
    setPanelMode("create");
  }

  function openEditPanel(scenario: ScenarioListItem) {
    setSelectedScenario(scenario);
    setPanelError("");
    setPanelMode("edit");
  }

  function resetPanel() {
    setPanelMode(null);
    setSelectedScenario(null);
    setPanelError("");
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    resetPanel();
  }

  function reloadScenarios() {
    setIsReorderMode(false);
    setDraftScenarios([]);
    setPageError("");
    void scenariosQuery.refetch();
  }

  async function startReorderMode() {
    if (characterFilter === null) return;
    setIsPreparingReorder(true);
    setPageError("");
    try {
      setDraftScenarios(
        await fetchAdminScenariosForReorder(queryClient, characterFilter),
      );
      setIsReorderMode(true);
    } catch (error) {
      setPageError(errorMessage(error, "정렬할 시나리오를 불러오지 못했습니다."));
    } finally {
      setIsPreparingReorder(false);
    }
  }

  function cancelReorderMode() {
    setDraftScenarios([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    setDraftScenarios((current) =>
      applyScenarioOrder(reorderScenarioItems(current, fromIndex, toIndex)),
    );
  }

  async function applyReorder() {
    if (characterFilter === null || !window.confirm("순서를 변경하시겠습니까?")) {
      return;
    }

    setPageError("");
    try {
      await reorderScenarios.mutateAsync({
        characterId: characterFilter,
        ids: draftScenarios.map((scenario) => scenario.id),
      });
      setIsReorderMode(false);
      setDraftScenarios([]);
    } catch (error) {
      setPageError(errorMessage(error, "순서를 변경하지 못했습니다."));
    }
  }

  function parseSourceStoryIds(value: FormDataEntryValue | null) {
    return String(value ?? "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panelMode) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const historicalFacts = String(formData.get("historical_facts") ?? "").trim();

    if (!title || !description || !historicalFacts) {
      setPanelError("제목, 설명, 역사적 사실을 입력해 주세요.");
      return;
    }

    const body =
      panelMode === "create"
        ? {
            character_id: Number(formData.get("character_id")),
            title,
            description,
            historical_facts: historicalFacts,
            source_story_ids: parseSourceStoryIds(formData.get("source_story_ids")),
          }
        : {
            character_id: Number(formData.get("character_id")),
            title,
            description,
            historical_facts: historicalFacts,
            source_story_ids: parseSourceStoryIds(formData.get("source_story_ids")),
            is_active: formData.get("is_active") === "on",
          };

    setPanelError("");
    try {
      if (panelMode === "create") {
        await createScenario.mutateAsync(body);
      } else if (selectedScenario) {
        await updateScenario.mutateAsync({
          id: selectedScenario.id,
          body,
        });
      }
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "시나리오를 저장하지 못했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedScenario) return;

    setPanelError("");
    try {
      await deleteScenario.mutateAsync(selectedScenario.id);
      if (scenarios.length === 1 && page > 1) setPage((current) => current - 1);
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "시나리오를 삭제하지 못했습니다."));
    }
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton
            className="h-11 w-auto gap-2 px-5"
            disabled={isReorderMode || characterOptionsQuery.isLoading || characterOptions.length === 0}
            onClick={openCreatePanel}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            시나리오 생성
          </AdminButton>
        }
        description="시나리오를 관리합니다."
        title="시나리오"
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

        <AdminFilterRow htmlFor="scenario-character-filter" label="인물">
          <AdminSelect
            className="h-11"
            disabled={isReorderMode || characterOptionsQuery.isLoading}
            id="scenario-character-filter"
            onChange={(event) => {
              setPage(1);
              setCharacterFilter(event.target.value ? Number(event.target.value) : null);
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
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">선택한 인물 내에서 드래그하여 순서를 변경하세요.</p>
          <div className="flex gap-2">
            <AdminButton
              className="w-auto"
              disabled={reorderScenarios.isPending}
              onClick={cancelReorderMode}
              size="sm"
              type="button"
              variant="secondary"
            >
              취소
            </AdminButton>
            <AdminButton
              className="w-auto"
              isLoading={reorderScenarios.isPending}
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
          onRefresh={reloadScenarios}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      <ScenarioTable
        emptyMessage="등록된 시나리오가 없습니다."
        errorMessage={tableError}
        isLoading={isLoading}
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRetry={reloadScenarios}
        onRowClick={openEditPanel}
        scenarios={displayScenarios}
      />

      <AdminSlidePanel
        description={
          panelMode === "create" ? "새 시나리오를 등록합니다." : "시나리오 정보를 수정합니다."
        }
        footer={
          panelMode ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 시나리오를 삭제하시겠습니까?"
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
        title={panelMode === "create" ? "시나리오 생성" : "시나리오 수정"}
      >
        {panelMode ? (
          <form
            key={selectedScenario?.id ?? "create"}
            ref={formRef}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <ScenarioPanelForm
              characterOptions={characterOptions}
              mode={panelMode}
              scenario={selectedScenario ?? undefined}
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
