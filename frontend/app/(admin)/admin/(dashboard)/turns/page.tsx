"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminFilterRow } from "@/app/(admin)/_components/admin-active-filter";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { TurnPanelForm } from "@/app/(admin)/admin/(dashboard)/turns/_components/turn-panel-form";
import {
  applyTurnOrder,
  reorderTurnItems,
  TurnTable,
} from "@/app/(admin)/admin/(dashboard)/turns/_components/turn-table";
import type { TurnListItem } from "@/app/(admin)/admin/(dashboard)/turns/_types";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

type PanelMode = "create" | "edit" | null;

const MOCK_CHARACTER_STATS_BY_CHARACTER_ID = {
  1: [
    { id: 1, name: "충성", value: 95 },
    { id: 2, name: "전략", value: 98 },
  ],
  2: [
    { id: 3, name: "지혜", value: 99 },
    { id: 4, name: "인덕", value: 97 },
  ],
};

const MOCK_SCENARIO_OPTIONS = [
  { id: 1, title: "옥포 해전", characterName: "이순신", characterId: 1 },
  { id: 2, title: "한산도 대첩", characterName: "이순신", characterId: 1 },
  { id: 3, title: "훈민정음 창제", characterName: "세종대왕", characterId: 2 },
];

const LEE_STATS = MOCK_CHARACTER_STATS_BY_CHARACTER_ID[1];
const SEJONG_STATS = MOCK_CHARACTER_STATS_BY_CHARACTER_ID[2];

const MOCK_TURNS: TurnListItem[] = [
  {
    id: 1,
    scenario_id: 1,
    scenario: { id: 1, title: "옥포 해전", sort_order: 0 },
    character: {
      id: 1,
      name: "이순신",
      sort_order: 0,
      category: { id: 2, title: "군사 / 국방", sort_order: 1 },
    },
    character_stats: LEE_STATS,
    sort_order: 0,
    title: "옥포 앞바다",
    situation: "왜군 함대가 옥포에 접근하고 있습니다. 수군을 이끌고 맞설 준비를 해야 합니다.",
    turn_image: "",
    tip_title: "옥포 해전은?",
    tip_desc: "1592년 5월 1일 이순신이 이끈 조선 수군의 첫 승전입니다.",
    choices: {
      A: {
        id: 1,
        choice_key: "A",
        title: "기습 공격",
        description: "좁은 해협을 이용해 왜군을 기습합니다.",
        choice_image: "",
        turn_stats: [
          { stat_id: 1, name: "충성", delta: 5 },
          { stat_id: 2, name: "전략", delta: 0 },
        ],
        result_text: "적의 선두 함대를 무너뜨리며 첫 승리를 거둡니다.",
        is_historical: true,
      },
      B: {
        id: 2,
        choice_key: "B",
        title: "육지로 후퇴",
        description: "해전을 피하고 육지 방어선을 구축합니다.",
        choice_image: "",
        turn_stats: [
          { stat_id: 1, name: "충성", delta: -3 },
          { stat_id: 2, name: "전략", delta: 0 },
        ],
        result_text: "수군 사기가 떨어지고 왜군이 상륙할 여지를 줍니다.",
        is_historical: false,
      },
    },
  },
  {
    id: 2,
    scenario_id: 1,
    scenario: { id: 1, title: "옥포 해전", sort_order: 0 },
    character: {
      id: 1,
      name: "이순신",
      sort_order: 0,
      category: { id: 2, title: "군사 / 국방", sort_order: 1 },
    },
    character_stats: LEE_STATS,
    sort_order: 1,
    title: "승리 직후",
    situation: "옥포 해전에서 승리했지만, 추가로 올라오는 왜군을 어떻게 대응할지 결정해야 합니다.",
    turn_image: "",
    tip_title: "추격의 딜레마",
    tip_desc: "승전 직후 함대를 정비하지 않고 추격하면 리스크가 따릅니다.",
    choices: {
      A: {
        id: 3,
        choice_key: "A",
        title: "즉시 추격",
        description: "퇴각하는 왜군을 끝까지 쫓습니다.",
        choice_image: "",
        turn_stats: [
          { stat_id: 1, name: "충성", delta: 0 },
          { stat_id: 2, name: "전략", delta: 3 },
        ],
        result_text: "추가 전과를 올리지만 함선 피로가 쌓입니다.",
        is_historical: false,
      },
      B: {
        id: 4,
        choice_key: "B",
        title: "정비 후 재배치",
        description: "함대를 정비하고 다음 전투를 준비합니다.",
        choice_image: "",
        turn_stats: [
          { stat_id: 1, name: "충성", delta: 0 },
          { stat_id: 2, name: "전략", delta: 5 },
        ],
        result_text: "장기전에 대비한 안정적인 선택입니다.",
        is_historical: true,
      },
    },
  },
  {
    id: 3,
    scenario_id: 3,
    scenario: { id: 3, title: "훈민정음 창제", sort_order: 0 },
    character: {
      id: 2,
      name: "세종대왕",
      sort_order: 0,
      category: { id: 1, title: "정치 / 외교", sort_order: 0 },
    },
    character_stats: SEJONG_STATS,
    sort_order: 0,
    title: "백성을 위한 글자",
    situation: "한자만으로는 백성이 글을 배우기 어렵다는 문제를 어떻게 풀까요?",
    turn_image: "",
    tip_title: "훈민정음의 취지",
    tip_desc: "쉬운 문자로 백성 스스로 말과 뜻을 전할 수 있게 하려는 목표가 있었습니다.",
    choices: {
      A: {
        id: 5,
        choice_key: "A",
        title: "새 글자 창제",
        description: "백성이 쉽게 배울 새 문자를 만듭니다.",
        choice_image: "",
        turn_stats: [
          { stat_id: 3, name: "지혜", delta: 8 },
          { stat_id: 4, name: "인덕", delta: 0 },
        ],
        result_text: "훈민정음 창제로 이어지는 역사적 선택입니다.",
        is_historical: true,
      },
      B: {
        id: 6,
        choice_key: "B",
        title: "기존 한자 교육 강화",
        description: "관료 중심 한자 교육만 확대합니다.",
        choice_image: "",
        turn_stats: [
          { stat_id: 3, name: "지혜", delta: -2 },
          { stat_id: 4, name: "인덕", delta: 0 },
        ],
        result_text: "백성의 문자 생활 문제는 해결되지 않습니다.",
        is_historical: false,
      },
    },
  },
];

const reorderConfirmMessage = "순서를 변경하시겠습니까?";

export default function TurnsPage() {
  const [turns, setTurns] = useState<TurnListItem[]>(MOCK_TURNS);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedTurn, setSelectedTurn] = useState<TurnListItem | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftTurns, setDraftTurns] = useState<TurnListItem[]>([]);

  const showReorderButton =
    scenarioFilter !== "all" && turns.length > 0 && !isReorderMode && !panelMode;

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedTurn(null);
  }

  function openEditPanel(turn: TurnListItem) {
    setSelectedTurn(turn);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode(null);
    setSelectedTurn(null);
  }

  function startReorderMode() {
    setDraftTurns([...turns]);
    setIsReorderMode(true);
  }

  function cancelReorderMode() {
    setDraftTurns([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    setDraftTurns((current) => applyTurnOrder(reorderTurnItems(current, fromIndex, toIndex)));
  }

  function applyReorder() {
    if (!window.confirm(reorderConfirmMessage)) {
      return;
    }

    const scenarioId = Number(scenarioFilter);

    setTurns(draftTurns);
    setIsReorderMode(false);
    setDraftTurns([]);
    // TODO: PATCH /api/v2/admin/turns/reorder
    // body: { scenario_id: scenarioId, ids: draftTurns.map((turn) => turn.id) }
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
            턴 생성
          </AdminButton>
        }
        description="시나리오별 턴과 선택지(A/B)를 관리합니다."
        title="턴"
      />

      <div className="mb-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminFilterRow htmlFor="turn-scenario-filter" label="시나리오">
          <AdminSelect
            className="h-11"
            disabled={isReorderMode}
            id="turn-scenario-filter"
            onChange={(event) => setScenarioFilter(event.target.value)}
            value={scenarioFilter}
          >
            <option value="all">전체</option>
            {MOCK_SCENARIO_OPTIONS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {formatIdDotLabel(scenario.id, scenario.characterName, scenario.title)}
              </option>
            ))}
          </AdminSelect>
        </AdminFilterRow>
        {/* TODO: GET /api/v2/admin/turns?scenario_id= */}
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

      <TurnTable
        emptyMessage="등록된 턴이 없습니다."
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRowClick={openEditPanel}
        turns={isReorderMode ? draftTurns : turns}
      />

      <AdminSlidePanel
        description={panelMode === "create" ? "새 턴을 등록합니다." : "턴 정보를 수정합니다."}
        footer={panelMode ? <AdminPanelFooter mode={panelMode} onCancel={closePanel} /> : null}
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "턴 생성" : "턴 수정"}
      >
        {panelMode ? (
          <TurnPanelForm
            key={selectedTurn?.id ?? "create"}
            characterStatsByCharacterId={MOCK_CHARACTER_STATS_BY_CHARACTER_ID}
            mode={panelMode}
            scenarioOptions={MOCK_SCENARIO_OPTIONS}
            turn={selectedTurn ?? undefined}
          />
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
