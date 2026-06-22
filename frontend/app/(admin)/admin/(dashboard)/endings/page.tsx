"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminFilterRow } from "@/app/(admin)/_components/admin-active-filter";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { EndingPanelForm } from "@/app/(admin)/admin/(dashboard)/endings/_components/ending-panel-form";
import { EndingTable } from "@/app/(admin)/admin/(dashboard)/endings/_components/ending-table";
import type { EndingListItem } from "@/app/(admin)/admin/(dashboard)/endings/_types";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

type PanelMode = "create" | "edit" | null;

const MOCK_SCENARIO_OPTIONS = [
  { id: 1, title: "옥포 해전", characterName: "이순신", characterId: 1 },
  { id: 2, title: "한산도 대첩", characterName: "이순신", characterId: 1 },
  { id: 3, title: "훈민정음 창제", characterName: "세종대왕", characterId: 2 },
];

const LEE_CATEGORY = { id: 2, title: "군사 / 국방", sort_order: 1 };
const SEJONG_CATEGORY = { id: 1, title: "정치 / 외교", sort_order: 0 };

const MOCK_ENDINGS: EndingListItem[] = [
  {
    id: 1,
    scenario_id: 1,
    scenario: { id: 1, title: "옥포 해전", sort_order: 0 },
    character: {
      id: 1,
      name: "이순신",
      sort_order: 0,
      category: LEE_CATEGORY,
    },
    path_key: "A-A",
    ending_type: "True Ending",
    title: "옥포의 승리, 전쟁의 전환점",
    history_fact:
      "1592년 5월 1일 이순신이 이끈 조선 수군이 옥포에서 왜군을 크게 무찔렀다. 이는 임진왜란 초기 조선 수군의 첫 승전이었다.",
    story_headline: "좁은 해협에서 펼쳐진 역사의 첫 승리",
    story_contents:
      "기습 공격과 정비 후 재배치를 모두 역사적 선택으로 맞춘 당신은 옥포 해전에서 승리하며 전쟁의 흐름을 바꿨습니다.",
    factual_contents:
      "실제 역사에서도 이순신은 옥포 해전에서 왜군을 크게 격파했으며, 이후 연전연승의 기반을 마련했습니다.",
    image_url: "",
    summary_items: [
      {
        title: "첫 승전의 의미",
        desc: "옥포 해전은 조선 수군이 사기를 회복한 전환점이었습니다.",
      },
      {
        title: "해전의 교훈",
        desc: "지형과 전술을 활용한 기습이 승패를 가를 수 있음을 보여줍니다.",
      },
    ],
    recommended_places: [
      {
        address: "전라남도 여수시 돌산읍",
        name: "옥포 해전 기념공원",
        description: "옥포 해전의 역사를 기념하는 공원입니다.",
        image_url: "",
      },
    ],
    deleted_at: null,
  },
  {
    id: 2,
    scenario_id: 1,
    scenario: { id: 1, title: "옥포 해전", sort_order: 0 },
    character: {
      id: 1,
      name: "이순신",
      sort_order: 0,
      category: LEE_CATEGORY,
    },
    path_key: "A-B",
    ending_type: "Alternative Ending",
    title: "육지로 물러선 수군",
    history_fact:
      "옥포 해전 당시 조선 수군은 해전을 통해 왜군을 격퇴했으며, 육지로 후퇴하는 선택은 역사와 달랐습니다.",
    story_headline: "해전을 포기한 선택의 대가",
    story_contents:
      "해전을 피하고 육지 방어에 집중한 당신은 왜군에게 해상 우위를 내주었고, 전쟁은 더 길어졌습니다.",
    factual_contents:
      "실제 역사에서 이순신은 해전을 통해 왜군을 연속으로 격퇴했으며, 수군의 역할이 전쟁 전반에 결정적이었습니다.",
    image_url: "",
    summary_items: [
      {
        title: "해상력의 중요성",
        desc: "임진왜란에서 수군의 역할이 얼마나 중요했는지 보여줍니다.",
      },
    ],
    recommended_places: [],
    deleted_at: null,
  },
  {
    id: 3,
    scenario_id: 3,
    scenario: { id: 3, title: "훈민정음 창제", sort_order: 0 },
    character: {
      id: 2,
      name: "세종대왕",
      sort_order: 0,
      category: SEJONG_CATEGORY,
    },
    path_key: "A-A",
    ending_type: "True Ending",
    title: "백성을 위한 새 글자",
    history_fact:
      "1443년 훈민정음 창제가 시작되었고, 1446년 반포되어 백성이 쉽게 글을 배울 수 있게 되었습니다.",
    story_headline: "쉬운 글자로 열린 새 시대",
    story_contents:
      "새 글자 창제를 선택한 당신은 백성이 스스로 말과 뜻을 전할 수 있는 길을 열었습니다.",
    factual_contents:
      "실제 역사에서 세종은 집현전 학자들과 함께 훈민정음을 창제했으며, 이는 한국 문화사의 큰 전환점이었습니다.",
    image_url: "",
    summary_items: [
      {
        title: "문자 생활의 혁신",
        desc: "훈민정음은 백성 중심의 문자 생활을 가능하게 했습니다.",
      },
      {
        title: "지식의 확산",
        desc: "쉬운 문자는 지식과 정보의 확산을 가속했습니다.",
      },
    ],
    recommended_places: [
      {
        address: "서울특별시 종로구 세종로",
        name: "세종대왕 기념관",
        description: "세종대왕과 훈민정음의 역사를 전시하는 기념관입니다.",
        image_url: "",
      },
      {
        address: "경기도 양주시",
        name: "훈민정음 상징 조형물",
        description: "훈민정음 창제를 기념하는 조형물이 있는 공간입니다.",
        image_url: "",
      },
    ],
    deleted_at: null,
  },
];

export default function EndingsPage() {
  const [endings] = useState<EndingListItem[]>(MOCK_ENDINGS);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedEnding, setSelectedEnding] = useState<EndingListItem | null>(null);
  const [scenarioFilter, setScenarioFilter] = useState<string>("all");

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedEnding(null);
  }

  function openEditPanel(ending: EndingListItem) {
    setSelectedEnding(ending);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode(null);
    setSelectedEnding(null);
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton className="h-11 w-auto gap-2 px-5" onClick={openCreatePanel} type="button">
            <Plus aria-hidden="true" className="size-4" />
            엔딩 생성
          </AdminButton>
        }
        description="시나리오별 엔딩을 관리합니다."
        title="엔딩"
      />

      <div className="mb-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminFilterRow htmlFor="ending-scenario-filter" label="시나리오">
          <AdminSelect
            className="h-11"
            id="ending-scenario-filter"
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
        {/* TODO: GET /api/v2/admin/endings?scenario_id= */}
      </div>

      <EndingTable
        emptyMessage="등록된 엔딩이 없습니다."
        endings={endings}
        onRowClick={openEditPanel}
      />

      <AdminSlidePanel
        description={panelMode === "create" ? "새 엔딩을 등록합니다." : "엔딩 정보를 수정합니다."}
        footer={panelMode ? <AdminPanelFooter mode={panelMode} onCancel={closePanel} /> : null}
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "엔딩 생성" : "엔딩 수정"}
      >
        {panelMode ? (
          <EndingPanelForm
            key={selectedEnding?.id ?? "create"}
            ending={selectedEnding ?? undefined}
            mode={panelMode}
            scenarioOptions={MOCK_SCENARIO_OPTIONS}
          />
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
