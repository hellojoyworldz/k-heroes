"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminImageUrlField } from "@/app/(admin)/_components/admin-image-url-field";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";
import type { CharacterOption } from "@/app/(admin)/_hooks/use-admin-characters";
import type { ScenarioOption } from "@/app/(admin)/_hooks/use-admin-scenarios";
import type { CharacterTurnStat, TurnChoice, TurnListItem } from "@/app/(admin)/admin/(dashboard)/turns/_types";

type TurnPanelFormProps = {
  mode: "create" | "edit";
  turn?: TurnListItem;
  scenarioOptions: ScenarioOption[];
  characterOptions: CharacterOption[];
  defaultCharacterId?: number | null;
  defaultScenarioId?: number | null;
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const panelTextareaClassName =
  "min-h-[88px] rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const deltaInputClassName =
  "h-10 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#3A3530]">{title}</h3>
      <AdminFormTable>{children}</AdminFormTable>
    </div>
  );
}

function ChoiceStatDeltas({
  characterStats,
  choiceKey,
  turnStats = [],
}: {
  choiceKey: "A" | "B";
  characterStats: CharacterTurnStat[];
  turnStats?: TurnChoice["turn_stats"];
}) {
  const deltaByStatId = useMemo(
    () => new Map(turnStats.map((stat) => [stat.turn_stats_id, stat.delta])),
    [turnStats],
  );

  if (characterStats.length === 0) {
    return (
      <AdminFormRow alignTop label="능력치 변화">
        <p className="text-sm text-[#8A847C]">인물 턴 능력치가 없습니다. 인물 패널에서 먼저 등록해 주세요.</p>
      </AdminFormRow>
    );
  }

  return (
    <AdminFormRow alignTop label="능력치 변화">
      <div className="overflow-hidden rounded-lg border border-[#E8E4DC]">
        <div className="grid grid-cols-[4.5rem_1fr_7rem] border-b border-[#E8E4DC] bg-[#FDFCFA] text-xs font-medium text-[#8A847C]">
          <div className="px-3 py-2.5">ID</div>
          <div className="px-3 py-2.5">능력치</div>
          <div className="px-3 py-2.5">변화량</div>
        </div>

        {characterStats.map((stat) => (
          <div
            key={`${choiceKey}-${stat.id}`}
            className="grid grid-cols-[4.5rem_1fr_7rem] items-center border-b border-[#F0ECE4] last:border-b-0"
          >
            <div className="px-3 py-2.5 text-sm text-[#8A847C]">{stat.id}</div>
            <div className="px-3 py-2.5 text-sm text-[#1A1714]">{stat.name}</div>
            <div className="px-2 py-2">
              <AdminInput
                className={deltaInputClassName}
                defaultValue={deltaByStatId.get(stat.id) ?? 0}
                name={`choices.${choiceKey}.turn_stats.${stat.id}.delta`}
                type="number"
              />
              <input
                name={`choices.${choiceKey}.turn_stats.${stat.id}.turn_stats_id`}
                type="hidden"
                value={stat.id}
              />
            </div>
          </div>
        ))}
      </div>
    </AdminFormRow>
  );
}

function ChoiceFields({
  characterStats,
  choice,
  choiceKey,
}: {
  choiceKey: "A" | "B";
  choice?: TurnChoice;
  characterStats: CharacterTurnStat[];
}) {
  const keyLower = choiceKey.toLowerCase();

  return (
    <FormSection title={`선택지 ${choiceKey}`}>
      {choice?.id ? (
        <AdminFormRow htmlFor={`choice-${keyLower}-id`} label="선택지 ID">
          <AdminInput
            className={panelInputClassName}
            defaultValue={choice.id}
            disabled
            id={`choice-${keyLower}-id`}
            readOnly
            type="text"
          />
        </AdminFormRow>
      ) : null}

      <AdminFormRow htmlFor={`choice-${keyLower}-title`} label="제목" required>
        <AdminInput
          className={panelInputClassName}
          defaultValue={choice?.title}
          id={`choice-${keyLower}-title`}
          name={`choices.${choiceKey}.title`}
          required
          type="text"
        />
      </AdminFormRow>

      <AdminFormRow alignTop htmlFor={`choice-${keyLower}-description`} label="설명" required>
        <AdminTextarea
          className={panelTextareaClassName}
          defaultValue={choice?.description}
          id={`choice-${keyLower}-description`}
          name={`choices.${choiceKey}.description`}
          required
        />
      </AdminFormRow>

      <AdminFormRow htmlFor={`choice-${keyLower}-image`} label="이미지 URL">
        <AdminImageUrlField
          className={panelInputClassName}
          defaultValue={choice?.choice_image}
          id={`choice-${keyLower}-image`}
          name={`choices.${choiceKey}.choice_image`}
          previewAlt={`선택지 ${choiceKey} 이미지 미리보기`}
        />
      </AdminFormRow>

      <AdminFormRow alignTop htmlFor={`choice-${keyLower}-result`} label="결과 텍스트" required>
        <AdminTextarea
          className={panelTextareaClassName}
          defaultValue={choice?.result_text}
          id={`choice-${keyLower}-result`}
          name={`choices.${choiceKey}.result_text`}
          required
        />
      </AdminFormRow>

      <ChoiceStatDeltas
        characterStats={characterStats}
        choiceKey={choiceKey}
        turnStats={choice?.turn_stats}
      />

      <AdminFormRow label="역사 선택">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3A3530]">
          <input
            className="size-4 rounded border-[#D6D0C6] accent-[#2A4232]"
            defaultChecked={choice?.is_historical ?? choiceKey === "A"}
            name={`choices.${choiceKey}.is_historical`}
            type="checkbox"
            value="true"
          />
          실제 역사에서 있었던 선택
        </label>
      </AdminFormRow>
    </FormSection>
  );
}

export function TurnPanelForm({
  characterOptions,
  defaultCharacterId = null,
  defaultScenarioId = null,
  mode,
  scenarioOptions,
  turn,
}: TurnPanelFormProps) {
  const isCreate = mode === "create";

  const initialCharacterId =
    turn?.character.id ??
    defaultCharacterId ??
    characterOptions[0]?.id ??
    scenarioOptions[0]?.character_id ??
    "";

  const initialScenarioId = (() => {
    if (turn) return turn.scenario_id;
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

  const characterStats: CharacterTurnStat[] = useMemo(() => {
    const scenarioId = Number(selectedScenarioId);
    if (turn?.turn_stats?.length && turn.scenario_id === scenarioId) {
      return turn.turn_stats;
    }

    return (
      characterOptions.find((character) => character.id === Number(selectedCharacterId))
        ?.turn_stats ?? []
    );
  }, [turn, selectedScenarioId, selectedCharacterId, characterOptions]);

  return (
    <div className="space-y-6">
      <FormSection title="기본 정보">
        {!isCreate ? (
          <AdminFormRow label="상태">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3A3530]">
              <input
                className="size-4 rounded border-[#D6D0C6] accent-[#2A4232]"
                defaultChecked={turn?.is_active ?? true}
                name="is_active"
                type="checkbox"
              />
              사용
            </label>
          </AdminFormRow>
        ) : null}

        {!isCreate ? (
          <AdminFormRow htmlFor="turn-id" label="ID">
            <AdminInput
              className={panelInputClassName}
              defaultValue={turn?.id}
              disabled
              id="turn-id"
              name="id"
              readOnly
              type="text"
            />
          </AdminFormRow>
        ) : null}

        <AdminFormRow htmlFor="turn-character" label="인물" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            id="turn-character"
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

        <AdminFormRow htmlFor="turn-scenario" label="시나리오" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            disabled={filteredScenarioOptions.length === 0}
            id="turn-scenario"
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

        <AdminFormRow htmlFor="turn-title" label="제목" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={turn?.title}
            id="turn-title"
            maxLength={200}
            name="title"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="turn-situation" label="상황" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={turn?.situation}
            id="turn-situation"
            name="situation"
            required
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="turn-image" label="턴 이미지 URL">
          <AdminImageUrlField
            className={panelInputClassName}
            defaultValue={turn?.turn_image}
            id="turn-image"
            name="turn_image"
            previewAlt="턴 이미지 미리보기"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="turn-tip-title" label="팁 질문" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={turn?.tip_title}
            id="turn-tip-title"
            name="tip_title"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="turn-tip-desc" label="팁 답변" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={turn?.tip_desc}
            id="turn-tip-desc"
            name="tip_desc"
            required
          />
        </AdminFormRow>
      </FormSection>

      <ChoiceFields
        characterStats={characterStats}
        choice={turn?.choices.A}
        choiceKey="A"
      />
      <ChoiceFields
        characterStats={characterStats}
        choice={turn?.choices.B}
        choiceKey="B"
      />
    </div>
  );
}
