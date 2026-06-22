import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";
import type { ScenarioListItem } from "@/app/(admin)/admin/(dashboard)/scenarios/_types";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

type CharacterOption = {
  id: number;
  name: string;
};

type ScenarioPanelFormProps = {
  mode: "create" | "edit";
  scenario?: ScenarioListItem;
  characterOptions: CharacterOption[];
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const panelTextareaClassName =
  "min-h-[100px] rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

export function ScenarioPanelForm({ characterOptions, mode, scenario }: ScenarioPanelFormProps) {
  const isCreate = mode === "create";
  const sourceStoryIdsValue = scenario?.source_story_ids.join(", ") ?? "";

  return (
    <AdminFormTable>
      {!isCreate ? (
        <AdminFormRow htmlFor="scenario-id" label="ID">
          <AdminInput
            className={panelInputClassName}
            defaultValue={scenario?.id}
            disabled
            id="scenario-id"
            name="id"
            readOnly
            type="text"
          />
        </AdminFormRow>
      ) : null}

      {!isCreate ? (
        <AdminFormRow label="상태">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3A3530]">
            <input
              className="size-4 rounded border-[#D6D0C6] accent-[#2A4232]"
              defaultChecked={scenario?.is_active ?? true}
              name="is_active"
              type="checkbox"
            />
            사용
          </label>
        </AdminFormRow>
      ) : null}

      {isCreate ? (
        <AdminFormRow htmlFor="scenario-character" label="인물" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            defaultValue={String(characterOptions[0]?.id ?? "")}
            id="scenario-character"
            name="character_id"
            required
          >
            {characterOptions.map((character) => (
              <option key={character.id} value={character.id}>
                {formatIdDotLabel(character.id, character.name)}
              </option>
            ))}
          </AdminSelect>
        </AdminFormRow>
      ) : (
        <AdminFormRow htmlFor="scenario-character" label="인물">
          <AdminInput
            className={panelInputClassName}
            defaultValue={
              scenario
                ? formatIdDotLabel(scenario.character_id, scenario.character.name)
                : ""
            }
            disabled
            id="scenario-character"
            readOnly
            type="text"
          />
        </AdminFormRow>
      )}

      <AdminFormRow htmlFor="scenario-title" label="제목" required>
        <AdminInput
          className={panelInputClassName}
          defaultValue={scenario?.title}
          id="scenario-title"
          maxLength={200}
          name="title"
          placeholder="시나리오 제목"
          required
          type="text"
        />
      </AdminFormRow>

      <AdminFormRow alignTop htmlFor="scenario-description" label="설명" required>
        <AdminTextarea
          className={panelTextareaClassName}
          defaultValue={scenario?.description}
          id="scenario-description"
          name="description"
          placeholder="시나리오 설명"
          required
        />
      </AdminFormRow>

      <AdminFormRow alignTop htmlFor="scenario-historical-facts" label="역사적 사실" required>
        <AdminTextarea
          className={panelTextareaClassName}
          defaultValue={scenario?.historical_facts}
          id="scenario-historical-facts"
          name="historical_facts"
          placeholder="시나리오의 역사적 배경·사실"
          required
        />
      </AdminFormRow>

      <AdminFormRow htmlFor="scenario-source-story-ids" label="근거 스토리 ID">
        <AdminInput
          className={panelInputClassName}
          defaultValue={sourceStoryIdsValue}
          id="scenario-source-story-ids"
          name="source_story_ids"
          placeholder="쉼표로 구분 (예: 1, 2, 3)"
          type="text"
        />
      </AdminFormRow>
    </AdminFormTable>
  );
}
