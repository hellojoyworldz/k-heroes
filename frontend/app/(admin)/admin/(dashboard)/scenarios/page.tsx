"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  AdminActiveFilter,
  AdminFilterRow,
  type ActiveFilterValue,
} from "@/app/(admin)/_components/admin-active-filter";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { ScenarioPanelForm } from "@/app/(admin)/admin/(dashboard)/scenarios/_components/scenario-panel-form";
import {
  applyScenarioOrder,
  reorderScenarioItems,
  ScenarioTable,
} from "@/app/(admin)/admin/(dashboard)/scenarios/_components/scenario-table";
import type { ScenarioListItem } from "@/app/(admin)/admin/(dashboard)/scenarios/_types";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

type PanelMode = "create" | "edit" | null;

const MOCK_CHARACTER_OPTIONS = [
  { id: 1, name: "이순신" },
  { id: 2, name: "세종대왕" },
  { id: 4, name: "이이" },
];

const MOCK_SCENARIOS: ScenarioListItem[] = [
  {
    id: 1,
    character_id: 1,
    character: {
      id: 1,
      name: "이순신",
      sort_order: 0,
      category: { id: 2, title: "군사 / 국방", sort_order: 1 },
    },
    sort_order: 0,
    title: "옥포 해전",
    description: "임진왜란 초기, 옥포 앞바다에서 벌어진 첫 승전의 순간.",
    historical_facts: "1592년 5월 1일 이순신이 옥포에서 왜군을 크게 무찔렀다.",
    source_story_ids: [101, 102],
    is_active: true,
  },
  {
    id: 2,
    character_id: 1,
    character: {
      id: 1,
      name: "이순신",
      sort_order: 0,
      category: { id: 2, title: "군사 / 국방", sort_order: 1 },
    },
    sort_order: 1,
    title: "한산도 대첩",
    description: "학익진을 펼쳐 왜군 수군을 괴멸한 결정적 해전.",
    historical_facts: "1592년 8월 한산도에서 이순신이 학익진 전법으로 대승을 거두었다.",
    source_story_ids: [103],
    is_active: true,
  },
  {
    id: 3,
    character_id: 2,
    character: {
      id: 2,
      name: "세종대왕",
      sort_order: 0,
      category: { id: 1, title: "정치 / 외교", sort_order: 0 },
    },
    sort_order: 0,
    title: "훈민정음 창제",
    description: "백성이 쉽게 배우고 쓸 수 있는 새 문자를 만드는 과정.",
    historical_facts: "1443년 훈민정음 창제가 시작되었고, 1446년 반포되었다.",
    source_story_ids: [201, 202, 203],
    is_active: true,
  },
  {
    id: 4,
    character_id: 4,
    character: {
      id: 4,
      name: "이이",
      sort_order: 1,
      category: { id: 1, title: "정치 / 외교", sort_order: 0 },
    },
    sort_order: 0,
    title: "성학십도",
    description: "이성과 실천의 균형을 강조한 학문적 여정.",
    historical_facts: "이이는 성학십도를 통해 성리학 실천론을 정리했다.",
    source_story_ids: [],
    is_active: false,
  },
];

const reorderConfirmMessage = "순서를 변경하시겠습니까?";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>(MOCK_SCENARIOS);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [characterFilter, setCharacterFilter] = useState<string>("all");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftScenarios, setDraftScenarios] = useState<ScenarioListItem[]>([]);

  const showReorderButton =
    characterFilter !== "all" && scenarios.length > 0 && !isReorderMode && !panelMode;

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedScenario(null);
  }

  function openEditPanel(scenario: ScenarioListItem) {
    setSelectedScenario(scenario);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode(null);
    setSelectedScenario(null);
  }

  function startReorderMode() {
    setDraftScenarios([...scenarios]);
    setIsReorderMode(true);
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

  function applyReorder() {
    if (!window.confirm(reorderConfirmMessage)) {
      return;
    }

    const characterId = Number(characterFilter);

    setScenarios(draftScenarios);
    setIsReorderMode(false);
    setDraftScenarios([]);
    // TODO: PATCH /api/v2/admin/scenarios/reorder
    // body: { character_id: characterId, ids: draftScenarios.map((scenario) => scenario.id) }
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
            시나리오 생성
          </AdminButton>
        }
        description="시나리오 메타데이터를 관리합니다."
        title="시나리오"
      />

      <div className="mb-4 space-y-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminActiveFilter
          disabled={isReorderMode}
          onChange={setActiveFilter}
          value={activeFilter}
        />

        <AdminFilterRow htmlFor="scenario-character-filter" label="인물">
          <AdminSelect
            className="h-11"
            disabled={isReorderMode}
            id="scenario-character-filter"
            onChange={(event) => setCharacterFilter(event.target.value)}
            value={characterFilter}
          >
            <option value="all">전체</option>
            {MOCK_CHARACTER_OPTIONS.map((character) => (
              <option key={character.id} value={character.id}>
                {formatIdDotLabel(character.id, character.name)}
              </option>
            ))}
          </AdminSelect>
        </AdminFilterRow>
        {/* TODO: GET /api/v2/admin/scenarios?character_id=&is_active= */}
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">
            선택한 인물 내에서 드래그하여 순서를 변경하세요.
          </p>
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

      <ScenarioTable
        emptyMessage="등록된 시나리오가 없습니다."
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRowClick={openEditPanel}
        scenarios={isReorderMode ? draftScenarios : scenarios}
      />

      <AdminSlidePanel
        description={
          panelMode === "create" ? "새 시나리오를 등록합니다." : "시나리오 정보를 수정합니다."
        }
        footer={panelMode ? <AdminPanelFooter mode={panelMode} onCancel={closePanel} /> : null}
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "시나리오 생성" : "시나리오 수정"}
      >
        {panelMode ? (
          <ScenarioPanelForm
            key={selectedScenario?.id ?? "create"}
            characterOptions={MOCK_CHARACTER_OPTIONS}
            mode={panelMode}
            scenario={selectedScenario ?? undefined}
          />
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
