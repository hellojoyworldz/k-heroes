"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";
import type {
  EndingListItem,
  RecommendedPlace,
  SummaryItem,
} from "@/app/(admin)/admin/(dashboard)/endings/_types";
import { ENDING_TYPE_OPTIONS } from "@/app/(admin)/admin/(dashboard)/endings/_constants";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

type ScenarioOption = {
  id: number;
  title: string;
  characterName: string;
};

type EndingPanelFormProps = {
  mode: "create" | "edit";
  ending?: EndingListItem;
  scenarioOptions: ScenarioOption[];
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const panelTextareaClassName =
  "min-h-[88px] rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const emptySummaryItem = (): SummaryItem => ({ title: "", desc: "" });

const emptyRecommendedPlace = (): RecommendedPlace => ({
  address: "",
  name: "",
  description: "",
  image_url: "",
});

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#3A3530]">{title}</h3>
      <AdminFormTable>{children}</AdminFormTable>
    </div>
  );
}

function SummaryItemsFields({ items }: { items: SummaryItem[] }) {
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>(
    items.length > 0 ? items : [emptySummaryItem()],
  );

  function addItem() {
    setSummaryItems((current) => [...current, emptySummaryItem()]);
  }

  function removeItem(index: number) {
    setSummaryItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <AdminFormRow alignTop label="요약 항목">
      <div className="space-y-3">
        {summaryItems.map((item, index) => (
          <div
            key={`summary-${index}`}
            className="space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[#8A847C]">항목 {index + 1}</p>
              {summaryItems.length > 1 ? (
                <AdminButton
                  className="h-8 w-auto gap-1.5 px-2.5"
                  onClick={() => removeItem(index)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  삭제
                </AdminButton>
              ) : null}
            </div>

            <AdminInput
              className={panelInputClassName}
              defaultValue={item.title}
              name={`summary_items.${index}.title`}
              placeholder="제목"
              required
              type="text"
            />
            <AdminTextarea
              className={panelTextareaClassName}
              defaultValue={item.desc}
              name={`summary_items.${index}.desc`}
              placeholder="설명"
              required
            />
          </div>
        ))}

        <AdminButton
          className="h-9 w-auto gap-1.5 px-3"
          onClick={addItem}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          항목 추가
        </AdminButton>
      </div>
    </AdminFormRow>
  );
}

function RecommendedPlacesFields({ items }: { items: RecommendedPlace[] }) {
  const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendedPlace[]>(
    items.length > 0 ? items : [emptyRecommendedPlace()],
  );

  function addItem() {
    setRecommendedPlaces((current) => [...current, emptyRecommendedPlace()]);
  }

  function removeItem(index: number) {
    setRecommendedPlaces((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <AdminFormRow alignTop label="추천 방문지">
      <div className="space-y-3">
        {recommendedPlaces.map((place, index) => (
          <div
            key={`place-${index}`}
            className="space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[#8A847C]">방문지 {index + 1}</p>
              {recommendedPlaces.length > 1 ? (
                <AdminButton
                  className="h-8 w-auto gap-1.5 px-2.5"
                  onClick={() => removeItem(index)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  삭제
                </AdminButton>
              ) : null}
            </div>

            <AdminInput
              className={panelInputClassName}
              defaultValue={place.name}
              name={`recommended_places.${index}.name`}
              placeholder="장소명"
              required
              type="text"
            />
            <AdminInput
              className={panelInputClassName}
              defaultValue={place.address}
              name={`recommended_places.${index}.address`}
              placeholder="주소"
              required
              type="text"
            />
            <AdminTextarea
              className={panelTextareaClassName}
              defaultValue={place.description}
              name={`recommended_places.${index}.description`}
              placeholder="설명"
              required
            />
            <AdminInput
              className={panelInputClassName}
              defaultValue={place.image_url}
              maxLength={500}
              name={`recommended_places.${index}.image_url`}
              placeholder="이미지 URL (선택)"
              type="url"
            />
          </div>
        ))}

        <AdminButton
          className="h-9 w-auto gap-1.5 px-3"
          onClick={addItem}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Plus aria-hidden="true" className="size-3.5" />
          방문지 추가
        </AdminButton>
      </div>
    </AdminFormRow>
  );
}

export function EndingPanelForm({ ending, mode, scenarioOptions }: EndingPanelFormProps) {
  const isCreate = mode === "create";
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    String(ending?.scenario_id ?? scenarioOptions[0]?.id ?? ""),
  );

  return (
    <div className="space-y-6">
      <FormSection title="기본 정보">
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

        {isCreate ? (
          <AdminFormRow htmlFor="ending-scenario" label="시나리오" required>
            <AdminSelect
              className={`${panelInputClassName} h-11`}
              id="ending-scenario"
              name="scenario_id"
              onChange={(event) => setSelectedScenarioId(event.target.value)}
              required
              value={selectedScenarioId}
            >
              {scenarioOptions.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {formatIdDotLabel(scenario.id, scenario.characterName, scenario.title)}
                </option>
              ))}
            </AdminSelect>
          </AdminFormRow>
        ) : (
          <>
            <AdminFormRow htmlFor="ending-scenario" label="시나리오">
              <AdminInput
                className={panelInputClassName}
                defaultValue={
                  ending
                    ? formatIdDotLabel(ending.scenario.id, ending.character.name, ending.scenario.title)
                    : ""
                }
                disabled
                id="ending-scenario"
                readOnly
                type="text"
              />
            </AdminFormRow>

            <AdminFormRow htmlFor="ending-character" label="인물">
              <AdminInput
                className={panelInputClassName}
                defaultValue={
                  ending ? formatIdDotLabel(ending.character.id, ending.character.name) : ""
                }
                disabled
                id="ending-character"
                readOnly
                type="text"
              />
            </AdminFormRow>
          </>
        )}

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
        <SummaryItemsFields items={ending?.summary_items ?? []} />
        <RecommendedPlacesFields items={ending?.recommended_places ?? []} />
      </FormSection>
    </div>
  );
}
