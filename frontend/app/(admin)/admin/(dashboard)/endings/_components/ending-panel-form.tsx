"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AdminReorderableFormList,
  type ReorderableFormItem,
} from "@/app/(admin)/_components/admin-reorderable-form-list";
import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";
import type { CharacterOption } from "@/app/(admin)/_hooks/use-admin-characters";
import type { ScenarioOption } from "@/app/(admin)/_hooks/use-admin-scenarios";
import type {
  EndingListItem,
  RecommendedPlace,
  SummaryItem,
} from "@/app/(admin)/admin/(dashboard)/endings/_types";
import { ENDING_TYPE_OPTIONS } from "@/app/(admin)/admin/(dashboard)/endings/_constants";

type EndingPanelFormProps = {
  mode: "create" | "edit";
  ending?: EndingListItem;
  scenarioOptions: ScenarioOption[];
  characterOptions: CharacterOption[];
  defaultCharacterId?: number | null;
  defaultScenarioId?: number | null;
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const panelTextareaClassName =
  "min-h-[88px] rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

type SummaryFormItem = SummaryItem & ReorderableFormItem;
type PlaceFormItem = RecommendedPlace & ReorderableFormItem;

function createSummaryItem(item?: SummaryItem): SummaryFormItem {
  return {
    key: crypto.randomUUID(),
    title: item?.title ?? "",
    desc: item?.desc ?? "",
  };
}

function createPlaceItem(item?: RecommendedPlace): PlaceFormItem {
  return {
    key: crypto.randomUUID(),
    address: item?.address ?? "",
    name: item?.name ?? "",
    description: item?.description ?? "",
    link: item?.link ?? "",
    image_url: item?.image_url ?? "",
  };
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#3A3530]">{title}</h3>
      <AdminFormTable>{children}</AdminFormTable>
    </div>
  );
}

export function EndingPanelForm({
  characterOptions,
  defaultCharacterId = null,
  defaultScenarioId = null,
  ending,
  mode,
  scenarioOptions,
}: EndingPanelFormProps) {
  const isCreate = mode === "create";

  const initialCharacterId =
    ending?.character.id ??
    defaultCharacterId ??
    characterOptions[0]?.id ??
    scenarioOptions[0]?.character_id ??
    "";

  const initialScenarioId = (() => {
    if (ending) return ending.scenario_id;
    if (defaultScenarioId) return defaultScenarioId;
    const scenarios = scenarioOptions.filter(
      (scenario) => scenario.character_id === initialCharacterId,
    );
    return scenarios[0]?.id ?? "";
  })();

  const [selectedCharacterId, setSelectedCharacterId] = useState(String(initialCharacterId));
  const [selectedScenarioId, setSelectedScenarioId] = useState(String(initialScenarioId));

  const filteredScenarioOptions = useMemo(
    () =>
      scenarioOptions.filter(
        (scenario) => scenario.character_id === Number(selectedCharacterId),
      ),
    [scenarioOptions, selectedCharacterId],
  );

  function handleCharacterChange(characterId: string) {
    setSelectedCharacterId(characterId);
    const nextScenarios = scenarioOptions.filter(
      (scenario) => scenario.character_id === Number(characterId),
    );
    setSelectedScenarioId(String(nextScenarios[0]?.id ?? ""));
  }

  const summaryInitialItems = (ending?.summary_items ?? []).map((item) => createSummaryItem(item));
  const placeInitialItems = (ending?.recommended_places ?? []).map((item) => createPlaceItem(item));

  return (
    <div className="space-y-6">
      <FormSection title="기본 정보">
        {!isCreate ? (
          <AdminFormRow label="상태">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3A3530]">
              <input
                className="size-4 rounded border-[#D6D0C6] accent-[#2A4232]"
                defaultChecked={ending?.is_active ?? true}
                name="is_active"
                type="checkbox"
              />
              사용
            </label>
          </AdminFormRow>
        ) : null}

        {!isCreate ? (
          <AdminFormRow htmlFor="ending-id" label="ID">
            <AdminInput
              className={panelInputClassName}
              defaultValue={ending?.id}
              disabled
              id="ending-id"
              name="id"
              readOnly
              type="text"
            />
          </AdminFormRow>
        ) : null}

        <AdminFormRow htmlFor="ending-character" label="인물" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            id="ending-character"
            onChange={(event) => handleCharacterChange(event.target.value)}
            required
            value={selectedCharacterId}
          >
            {characterOptions.map((character) => (
              <option key={character.id} value={character.id}>
                {character.label}
              </option>
            ))}
          </AdminSelect>
        </AdminFormRow>

        <AdminFormRow htmlFor="ending-scenario" label="시나리오" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            disabled={filteredScenarioOptions.length === 0}
            id="ending-scenario"
            name="scenario_id"
            onChange={(event) => setSelectedScenarioId(event.target.value)}
            required
            value={selectedScenarioId}
          >
            {filteredScenarioOptions.length === 0 ? (
              <option value="">시나리오 없음</option>
            ) : (
              filteredScenarioOptions.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))
            )}
          </AdminSelect>
        </AdminFormRow>

        <AdminFormRow htmlFor="ending-path-key" label="경로" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={ending?.path_key}
            id="ending-path-key"
            maxLength={50}
            name="path_key"
            placeholder="예: A-A-B"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="ending-type" label="엔딩 유형" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            defaultValue={ending?.ending_type ?? ENDING_TYPE_OPTIONS[0].value}
            id="ending-type"
            name="ending_type"
            required
          >
            {ENDING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </AdminFormRow>
      </FormSection>

      <FormSection title="콘텐츠">
        <AdminFormRow htmlFor="ending-title" label="제목" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={ending?.title}
            id="ending-title"
            maxLength={200}
            name="title"
            placeholder="엔딩 제목"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="ending-history-fact" label="역사적 사실" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={ending?.history_fact}
            id="ending-history-fact"
            name="history_fact"
            placeholder="역사적 사실"
            required
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="ending-story-headline" label="스토리 헤드라인" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={ending?.story_headline}
            id="ending-story-headline"
            name="story_headline"
            placeholder="스토리 헤드라인"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="ending-story-contents" label="스토리 본문" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={ending?.story_contents}
            id="ending-story-contents"
            name="story_contents"
            placeholder="스토리 본문"
            required
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="ending-factual-contents" label="사실 본문">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={ending?.factual_contents}
            id="ending-factual-contents"
            name="factual_contents"
            placeholder="사실 본문"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="ending-image-url" label="이미지 URL">
          <AdminInput
            className={panelInputClassName}
            defaultValue={ending?.image_url}
            id="ending-image-url"
            maxLength={500}
            name="image_url"
            placeholder="https://..."
            type="url"
          />
        </AdminFormRow>
      </FormSection>

      <FormSection title="부가 정보">
        <AdminReorderableFormList
          createItem={() => createSummaryItem()}
          initialItems={summaryInitialItems}
          itemLabel={(index) => `항목 ${index + 1}`}
          label="요약 항목"
          minItems={0}
          renderFields={(item, index) => (
            <>
              <AdminInput
                className={panelInputClassName}
                defaultValue={item.title}
                name={`summary_items.${index}.title`}
                placeholder="제목"
                type="text"
              />
              <AdminTextarea
                className={panelTextareaClassName}
                defaultValue={item.desc}
                name={`summary_items.${index}.desc`}
                placeholder="설명"
              />
            </>
          )}
        />

        <AdminReorderableFormList
          createItem={() => createPlaceItem()}
          initialItems={placeInitialItems}
          itemLabel={(index) => `방문지 ${index + 1}`}
          label="추천 방문지"
          minItems={0}
          renderFields={(item, index) => (
            <>
              <AdminInput
                className={panelInputClassName}
                defaultValue={item.name}
                name={`recommended_places.${index}.name`}
                placeholder="장소명"
                type="text"
              />
              <AdminInput
                className={panelInputClassName}
                defaultValue={item.address}
                name={`recommended_places.${index}.address`}
                placeholder="주소"
                type="text"
              />
              <AdminTextarea
                className={panelTextareaClassName}
                defaultValue={item.description}
                name={`recommended_places.${index}.description`}
                placeholder="설명"
              />
              <AdminInput
                className={panelInputClassName}
                defaultValue={item.link}
                name={`recommended_places.${index}.link`}
                placeholder="링크 URL (선택)"
                type="url"
              />
              <AdminInput
                className={panelInputClassName}
                defaultValue={item.image_url}
                maxLength={500}
                name={`recommended_places.${index}.image_url`}
                placeholder="이미지 URL (선택)"
                type="url"
              />
            </>
          )}
        />
      </FormSection>
    </div>
  );
}
