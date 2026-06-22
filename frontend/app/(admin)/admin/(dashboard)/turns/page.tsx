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
import { useAdminScenarioOptions } from "@/app/(admin)/_hooks/use-admin-scenarios";
import {
  fetchAdminTurnsForReorder,
  useAdminTurns,
  useCreateAdminTurn,
  useDeleteAdminTurn,
  useReorderAdminTurns,
  useUpdateAdminTurn,
} from "@/app/(admin)/_hooks/use-admin-turns";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { TurnPanelForm } from "@/app/(admin)/admin/(dashboard)/turns/_components/turn-panel-form";
import {
  applyTurnOrder,
  reorderTurnItems,
  TurnTable,
} from "@/app/(admin)/admin/(dashboard)/turns/_components/turn-table";
import type { CharacterTurnStat, TurnListItem } from "@/app/(admin)/admin/(dashboard)/turns/_types";
type PanelMode = "create" | "edit" | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function parseChoices(formData: FormData, characterStats: CharacterTurnStat[]) {
  function parseOne(key: "A" | "B") {
    const title = String(formData.get(`choices.${key}.title`) ?? "").trim();
    const description = String(formData.get(`choices.${key}.description`) ?? "").trim();
    const resultText = String(formData.get(`choices.${key}.result_text`) ?? "").trim();

    const turnStats = characterStats
      .map((stat) => {
        const turnStatsId = Number(
          formData.get(`choices.${key}.turn_stats.${stat.id}.turn_stats_id`),
        );
        const delta = Number(formData.get(`choices.${key}.turn_stats.${stat.id}.delta`));
        if (!Number.isFinite(turnStatsId) || turnStatsId <= 0) {
          return null;
        }
        return { turn_stats_id: turnStatsId, delta: Number.isFinite(delta) ? delta : 0 };
      })
      .filter((item): item is { turn_stats_id: number; delta: number } => item !== null);

    return {
      title,
      description,
      choice_image: String(formData.get(`choices.${key}.choice_image`) ?? "").trim(),
      result_text: resultText,
      is_historical: formData.get(`choices.${key}.is_historical`) === "true",
      turn_stats: turnStats,
    };
  }

  return { A: parseOne("A"), B: parseOne("B") };
}

export default function TurnsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedTurn, setSelectedTurn] = useState<TurnListItem | null>(null);
  const [characterFilter, setCharacterFilter] = useState<number | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftTurns, setDraftTurns] = useState<TurnListItem[]>([]);
  const [isPreparingReorder, setIsPreparingReorder] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");

  const turnsQuery = useAdminTurns(
    { characterId: characterFilter, scenarioId: scenarioFilter, active: activeFilter },
    page,
    pageSize,
  );
  const scenarioOptionsQuery = useAdminScenarioOptions();
  const characterOptionsQuery = useAdminCharacterOptions();
  const createTurn = useCreateAdminTurn();
  const updateTurn = useUpdateAdminTurn();
  const deleteTurn = useDeleteAdminTurn();
  const reorderTurns = useReorderAdminTurns();

  const turns = turnsQuery.data?.items ?? [];
  const total = turnsQuery.data?.total ?? 0;
  const totalPages = turnsQuery.data?.total_pages ?? 0;
  const isLoading = turnsQuery.isFetching;
  const isSaving = createTurn.isPending || updateTurn.isPending;
  const isDeleting = deleteTurn.isPending;
  const tableError = pageError || (turnsQuery.error?.message ?? "");
  const displayTurns = isReorderMode ? draftTurns : turns;

  const scenarioOptions = scenarioOptionsQuery.data ?? [];

  const filteredScenarioOptions =
    characterFilter === null
      ? scenarioOptions
      : scenarioOptions.filter((scenario) => scenario.character_id === characterFilter);

  const characterOptions = characterOptionsQuery.data ?? [];

  const showReorderButton =
    scenarioFilter !== null && total > 0 && !isLoading && !isReorderMode && !panelMode;

  useEffect(() => {
    const error = turnsQuery.error ?? scenarioOptionsQuery.error ?? characterOptionsQuery.error;
    if (error instanceof AdminApiError && error.status === 401) {
      router.replace("/admin/login");
    }
  }, [characterOptionsQuery.error, router, scenarioOptionsQuery.error, turnsQuery.error]);

  function openCreatePanel() {
    setSelectedTurn(null);
    setPanelError("");
    setPanelMode("create");
  }

  function openEditPanel(turn: TurnListItem) {
    setSelectedTurn(turn);
    setPanelError("");
    setPanelMode("edit");
  }

  function resetPanel() {
    setPanelMode(null);
    setSelectedTurn(null);
    setPanelError("");
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    resetPanel();
  }

  function reloadTurns() {
    setIsReorderMode(false);
    setDraftTurns([]);
    setPageError("");
    void turnsQuery.refetch();
  }

  async function startReorderMode() {
    if (scenarioFilter === null) return;
    setIsPreparingReorder(true);
    setPageError("");
    try {
      setDraftTurns(await fetchAdminTurnsForReorder(queryClient, scenarioFilter));
      setIsReorderMode(true);
    } catch (error) {
      setPageError(errorMessage(error, "정렬할 턴을 불러오지 못했습니다."));
    } finally {
      setIsPreparingReorder(false);
    }
  }

  function cancelReorderMode() {
    setDraftTurns([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    setDraftTurns((current) => applyTurnOrder(reorderTurnItems(current, fromIndex, toIndex)));
  }

  async function applyReorder() {
    if (scenarioFilter === null || !window.confirm("순서를 변경하시겠습니까?")) {
      return;
    }

    setPageError("");
    try {
      await reorderTurns.mutateAsync({
        scenarioId: scenarioFilter,
        ids: draftTurns.map((turn) => turn.id),
      });
      setIsReorderMode(false);
      setDraftTurns([]);
    } catch (error) {
      setPageError(errorMessage(error, "순서를 변경하지 못했습니다."));
    }
  }

  function resolveCharacterTurnStats(
    scenarioId: number,
    turn?: TurnListItem | null,
  ): CharacterTurnStat[] {
    if (turn?.turn_stats?.length && turn.scenario_id === scenarioId) {
      return turn.turn_stats;
    }

    const scenario = scenarioOptions.find((item) => item.id === scenarioId);
    const character = characterOptions.find((item) => item.id === scenario?.character_id);
    return character?.turn_stats ?? [];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panelMode) return;

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const situation = String(formData.get("situation") ?? "").trim();
    const tipTitle = String(formData.get("tip_title") ?? "").trim();
    const tipDesc = String(formData.get("tip_desc") ?? "").trim();

    if (!title || !situation || !tipTitle || !tipDesc) {
      setPanelError("제목, 상황, 팁 질문, 팁 답변을 입력해 주세요.");
      return;
    }

    const scenarioId = Number(formData.get("scenario_id"));

    if (!scenarioId || !Number.isFinite(scenarioId)) {
      setPanelError("시나리오를 선택해 주세요.");
      return;
    }

    const characterStats = resolveCharacterTurnStats(scenarioId, selectedTurn);
    const choices = parseChoices(formData, characterStats);

    if (
      !choices.A.title ||
      !choices.A.description ||
      !choices.A.result_text ||
      !choices.B.title ||
      !choices.B.description ||
      !choices.B.result_text
    ) {
      setPanelError("선택지 A/B의 제목, 설명, 결과 텍스트를 모두 입력해 주세요.");
      return;
    }

    const sharedBody = {
      title,
      situation,
      turn_image: String(formData.get("turn_image") ?? "").trim(),
      tip_title: tipTitle,
      tip_desc: tipDesc,
      choices,
    };

    setPanelError("");
    try {
      if (panelMode === "create") {
        await createTurn.mutateAsync({
          scenario_id: scenarioId,
          ...sharedBody,
        });
      } else if (selectedTurn) {
        await updateTurn.mutateAsync({
          id: selectedTurn.id,
          body: {
            scenario_id: scenarioId,
            ...sharedBody,
            is_active: formData.get("is_active") === "on",
          },
        });
      }
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "턴을 저장하지 못했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedTurn) return;

    setPanelError("");
    try {
      await deleteTurn.mutateAsync(selectedTurn.id);
      if (turns.length === 1 && page > 1) setPage((current) => current - 1);
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "턴을 삭제하지 못했습니다."));
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
            턴 생성
          </AdminButton>
        }
        description="시나리오별 턴과 선택지(A/B)를 관리합니다."
        title="턴"
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

        <AdminFilterRow htmlFor="turn-character-filter" label="인물">
            <AdminSelect
              className="h-11"
              disabled={isReorderMode || characterOptionsQuery.isLoading}
              id="turn-character-filter"
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

        <AdminFilterRow htmlFor="turn-scenario-filter" label="시나리오">
            <AdminSelect
              className="h-11"
              disabled={isReorderMode || scenarioOptionsQuery.isLoading}
              id="turn-scenario-filter"
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
              disabled={reorderTurns.isPending}
              onClick={cancelReorderMode}
              size="sm"
              type="button"
              variant="secondary"
            >
              취소
            </AdminButton>
            <AdminButton
              className="w-auto"
              isLoading={reorderTurns.isPending}
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
          onRefresh={reloadTurns}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      <TurnTable
        emptyMessage="등록된 턴이 없습니다."
        errorMessage={tableError}
        isLoading={isLoading}
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRetry={reloadTurns}
        onRowClick={openEditPanel}
        turns={displayTurns}
      />

      <AdminSlidePanel
        description={panelMode === "create" ? "새 턴을 등록합니다." : "턴 정보를 수정합니다."}
        footer={
          panelMode ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 턴을 삭제하시겠습니까?"
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
        title={panelMode === "create" ? "턴 생성" : "턴 수정"}
      >
        {panelMode ? (
          <form
            key={selectedTurn?.id ?? "create"}
            ref={formRef}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <TurnPanelForm
              characterOptions={characterOptions}
              defaultCharacterId={panelMode === "create" ? characterFilter : null}
              defaultScenarioId={panelMode === "create" ? scenarioFilter : null}
              mode={panelMode}
              scenarioOptions={scenarioOptions}
              turn={selectedTurn ?? undefined}
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
