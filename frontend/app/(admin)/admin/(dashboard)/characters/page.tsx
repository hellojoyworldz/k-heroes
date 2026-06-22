"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  AdminActiveFilter,
  AdminFilterRow,
  type ActiveFilterValue,
} from "@/app/(admin)/_components/admin-active-filter";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { CharacterPanelForm } from "@/app/(admin)/admin/(dashboard)/characters/_components/character-panel-form";
import { formatIdDotLabel } from "@/app/(admin)/_utils";
import {
  applyCharacterOrder,
  CharacterTable,
  reorderCharacterItems,
} from "@/app/(admin)/admin/(dashboard)/characters/_components/character-table";
import type { CharacterListItem } from "@/app/(admin)/admin/(dashboard)/characters/_types";

type PanelMode = "create" | "edit" | null;

const MOCK_CATEGORY_OPTIONS = [
  { id: 1, title: "정치 / 외교" },
  { id: 2, title: "군사 / 국방" },
  { id: 3, title: "예술 / 문학" },
];

const MOCK_CHARACTERS: CharacterListItem[] = [
  {
    id: 1,
    name: "이순신",
    category_id: 2,
    category: "군사 / 국방",
    sort_order: 0,
    era: "조선",
    era_tag: "조선 중기",
    role: "장군",
    years: "1545-1598",
    image_url: "",
    situation: "임진왜란 당시 조선 수군을 이끌며 나라를 지킨 명장.",
    one_line_summary: "바다 위에서 나라를 지킨 충무공",
    mbti: "ISTJ",
    mbti_nickname: "철벽의 수호자",
    mbti_e_i: "전장의 상황을 스스로 판단하고 고독하게 결단하는 내향적 성향.",
    mbti_s_n: "눈앞의 전황과 실전 경험을 바탕으로 판단하는 감각형.",
    mbti_t_f: "감정보다 임무와 원칙을 우선하는 사고형.",
    mbti_j_p: "계획을 세우고 끝까지 밀어붙이는 판단형.",
    intro_quote: "신에게는 죽음을, 조국에는 영광을.",
    intro_desc: "조선 중기 무신 출신으로 수군을 이끌며 임진왜란을 막아낸 인물입니다.",
    keywords: ["장군", "임진왜란", "수군"],
    turn_stats: [
      { id: 1, name: "충성", value: 95 },
      { id: 2, name: "전략", value: 98 },
    ],
    is_active: true,
  },
  {
    id: 2,
    name: "세종대왕",
    category_id: 1,
    category: "정치 / 외교",
    sort_order: 0,
    era: "조선",
    era_tag: "조선 전기",
    role: "왕",
    years: "1397-1450",
    image_url: "",
    situation: "한글 창제와 과학·문화 발전을 이끈 조선의 성군.",
    one_line_summary: "백성을 사랑한 성군",
    mbti: "ENFJ",
    mbti_nickname: "백성의 스승",
    mbti_e_i: "",
    mbti_s_n: "",
    mbti_t_f: "",
    mbti_j_p: "",
    intro_quote: "백성이 편히 쓸 문자를 만들어야 하겠다.",
    intro_desc: "훈민정음 창제와 집현전 학문 진흥으로 조선 문화의 기틀을 다졌습니다.",
    keywords: ["왕", "한글", "과학"],
    turn_stats: [
      { id: 3, name: "지혜", value: 99 },
      { id: 4, name: "인덕", value: 97 },
    ],
    is_active: true,
  },
  {
    id: 3,
    name: "김홍도",
    category_id: 3,
    category: "예술 / 문학",
    sort_order: 0,
    era: "조선",
    era_tag: "조선 후기",
    role: "화가",
    years: "1745-1806",
    image_url: "",
    situation: "풍속화로 당대 민생을 생생하게 그려낸 화가.",
    one_line_summary: "민속의 순간을 붓끝에 담은 화가",
    mbti: "ISFP",
    mbti_nickname: "거리의 관찰자",
    mbti_e_i: "",
    mbti_s_n: "",
    mbti_t_f: "",
    mbti_j_p: "",
    intro_quote: "사람 사는 모습이 곧 그림이다.",
    intro_desc: "단원 김홍도는 조선 후기 풍속화의 대표 화가로 평가받습니다.",
    keywords: ["화가", "풍속화", "단원"],
    turn_stats: [{ id: 5, name: "표현력", value: 96 }],
    is_active: false,
  },
  {
    id: 4,
    name: "이이",
    category_id: 1,
    category: "정치 / 외교",
    sort_order: 1,
    era: "조선",
    era_tag: "조선 중기",
    role: "학자",
    years: "1536-1584",
    image_url: "",
    situation: "성리학을 집대성하고 붕당 정치의 기틀을 마련한 율곡.",
    one_line_summary: "이성과 실천을 강조한 대학자",
    mbti: "INTJ",
    mbti_nickname: "이성의 설계자",
    mbti_e_i: "",
    mbti_s_n: "",
    mbti_t_f: "",
    mbti_j_p: "",
    intro_quote: "성의가 있으면 산도 통한다.",
    intro_desc: "퇴계 이황의 제자로 성리학 발전에 크게 기여했습니다.",
    keywords: ["학자", "성리학", "율곡"],
    turn_stats: [{ id: 6, name: "학문", value: 94 }],
    is_active: true,
  },
];

const reorderConfirmMessage = "순서를 변경하시겠습니까?";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<CharacterListItem[]>(MOCK_CHARACTERS);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterListItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [nameQuery, setNameQuery] = useState("");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftCharacters, setDraftCharacters] = useState<CharacterListItem[]>([]);

  const showReorderButton =
    categoryFilter !== "all" && characters.length > 0 && !isReorderMode && !panelMode;

  function openCreatePanel() {
    setPanelMode("create");
    setSelectedCharacter(null);
  }

  function openEditPanel(character: CharacterListItem) {
    setSelectedCharacter(character);
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode(null);
    setSelectedCharacter(null);
  }

  function startReorderMode() {
    setDraftCharacters([...characters]);
    setIsReorderMode(true);
  }

  function cancelReorderMode() {
    setDraftCharacters([]);
    setIsReorderMode(false);
  }

  function handleDraftReorder(fromIndex: number, toIndex: number) {
    setDraftCharacters((current) =>
      applyCharacterOrder(reorderCharacterItems(current, fromIndex, toIndex)),
    );
  }

  function applyReorder() {
    if (!window.confirm(reorderConfirmMessage)) {
      return;
    }

    const categoryId = Number(categoryFilter);

    setCharacters(draftCharacters);
    setIsReorderMode(false);
    setDraftCharacters([]);
    // TODO: PATCH /api/v2/admin/characters/reorder
    // body: { category_id: categoryId, ids: draftCharacters.map((character) => character.id) }
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
            인물 생성
          </AdminButton>
        }
        description="역사 인물과 능력치(turn_stats)를 관리합니다."
        title="인물"
      />

      <div className="mb-4 space-y-4 rounded-xl border border-[#E8E4DC] bg-white px-5 py-4">
        <AdminActiveFilter
          disabled={isReorderMode}
          onChange={setActiveFilter}
          value={activeFilter}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFilterRow htmlFor="character-category-filter" label="카테고리">
            <AdminSelect
              className="h-11"
              disabled={isReorderMode}
              id="character-category-filter"
              onChange={(event) => setCategoryFilter(event.target.value)}
              value={categoryFilter}
            >
              <option value="all">전체</option>
              {MOCK_CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={category.id}>
                  {formatIdDotLabel(category.id, category.title)}
                </option>
              ))}
            </AdminSelect>
          </AdminFilterRow>

          <AdminFilterRow htmlFor="character-name-filter" label="이름 검색">
            <AdminInput
              className="h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10"
              disabled={isReorderMode}
              id="character-name-filter"
              onChange={(event) => setNameQuery(event.target.value)}
              placeholder="이름으로 검색"
              type="search"
              value={nameQuery}
            />
          </AdminFilterRow>
        </div>
      </div>

      {isReorderMode ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E8E4DC] bg-[#F4F1EA] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[#3A3530]">
            선택한 카테고리 내에서 드래그하여 순서를 변경하세요.
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

      <CharacterTable
        characters={isReorderMode ? draftCharacters : characters}
        emptyMessage="등록된 인물이 없습니다."
        isReorderMode={isReorderMode}
        onReorder={handleDraftReorder}
        onRowClick={openEditPanel}
      />

      <AdminSlidePanel
        description={
          panelMode === "create" ? "새 인물을 등록합니다." : "인물 정보를 수정합니다."
        }
        footer={panelMode ? <AdminPanelFooter mode={panelMode} onCancel={closePanel} /> : null}
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "인물 생성" : "인물 수정"}
      >
        {panelMode ? (
          <CharacterPanelForm
            key={selectedCharacter?.id ?? "create"}
            categoryOptions={MOCK_CATEGORY_OPTIONS}
            character={selectedCharacter ?? undefined}
            mode={panelMode}
          />
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
