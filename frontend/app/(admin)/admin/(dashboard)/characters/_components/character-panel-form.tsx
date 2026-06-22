"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { DragEvent, ReactNode } from "react";
import { useState } from "react";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";
import type { CharacterListItem, CharacterStat, CharacterTurnStatDef } from "@/app/(admin)/admin/(dashboard)/characters/_types";
import type { CategoryOption } from "@/app/(admin)/_hooks/use-admin-categories";

type StatFormItem = {
  key: string;
  name: string;
  value: string;
  desc: string;
};

type CharacterPanelFormProps = {
  mode: "create" | "edit";
  character?: CharacterListItem;
  categoryOptions: CategoryOption[];
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const panelTextareaClassName =
  "min-h-[88px] rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#3A3530]">{title}</h3>
      <AdminFormTable>{children}</AdminFormTable>
    </div>
  );
}

function CharacterImageUrlField({ defaultValue }: { defaultValue?: string }) {
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [hasError, setHasError] = useState(false);

  const trimmedUrl = imageUrl.trim();
  const showPreview = trimmedUrl.length > 0;

  return (
    <div className="space-y-3">
      <AdminInput
        className={panelInputClassName}
        id="character-image"
        name="image_url"
        onChange={(event) => {
          setImageUrl(event.target.value);
          setHasError(false);
        }}
        placeholder="https://"
        type="url"
        value={imageUrl}
      />

      {showPreview ? (
        hasError ? (
          <p className="rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-6 text-center text-sm text-[#8A847C]">
            이미지를 불러올 수 없습니다. URL을 확인해 주세요.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="프로필 이미지 미리보기"
              className="mx-auto max-h-48 w-full object-contain"
              onError={() => setHasError(true)}
              onLoad={() => setHasError(false)}
              src={trimmedUrl}
            />
          </div>
        )
      ) : null}
    </div>
  );
}

function formatStoryIds(ids?: number[]) {
  return (ids ?? []).join(", ");
}

function createStatItem(key: string, item?: Partial<CharacterStat>): StatFormItem {
  return {
    key,
    name: item?.name ?? "",
    value: item?.value !== undefined ? String(item.value) : "",
    desc: item?.desc ?? "",
  };
}

type TurnStatFormItem = {
  key: string;
  id?: number;
  name: string;
};

function createTurnStatItem(key: string, item?: Partial<CharacterTurnStatDef>): TurnStatFormItem {
  return {
    key,
    id: item?.id,
    name: item?.name ?? "",
  };
}

function TurnStatFields({ items }: { items: TurnStatFormItem[] }) {
  const [turnStats, setTurnStats] = useState<TurnStatFormItem[]>(
    items.length > 0
      ? items
      : [
          createTurnStatItem("turn-stat-0"),
          createTurnStatItem("turn-stat-1"),
          createTurnStatItem("turn-stat-2"),
        ],
  );
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  function addItem() {
    setTurnStats((current) => [...current, createTurnStatItem(`turn-stat-${crypto.randomUUID()}`)]);
  }

  function removeItem(index: number) {
    setTurnStats((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, key: string) {
    setDraggedKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, key: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, key: string) {
    event.preventDefault();

    if (!draggedKey || draggedKey === key) {
      return;
    }

    setTurnStats((current) => {
      const fromIndex = current.findIndex((item) => item.key === draggedKey);
      const toIndex = current.findIndex((item) => item.key === key);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDraggedKey(null);
    setDragOverKey(null);
  }

  function handleDragEnd() {
    setDraggedKey(null);
    setDragOverKey(null);
  }

  return (
    <AdminFormRow alignTop label="턴 능력치">
      <div className="space-y-3">
        {turnStats.map((item, index) => (
          <div
            key={item.key}
            className={`space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4 cursor-grab active:cursor-grabbing ${
              dragOverKey === item.key ? "bg-[#F4F1EA]" : ""
            } ${draggedKey === item.key ? "opacity-50" : ""}`}
            draggable
            onDragEnd={handleDragEnd}
            onDragStart={(event) => handleDragStart(event, item.key)}
            onDragOver={(event) => handleDragOver(event, item.key)}
            onDrop={(event) => handleDrop(event, item.key)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GripVertical aria-hidden="true" className="size-4 text-[#8A847C]" />
                <p className="text-xs font-medium text-[#8A847C]">항목 {index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                {turnStats.length > 1 ? (
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
            </div>

            {item.id !== undefined ? (
              <input name={`turn_stats.${index}.id`} type="hidden" value={item.id} />
            ) : null}

            <AdminInput
              className={panelInputClassName}
              defaultValue={item.name}
              name={`turn_stats.${index}.name`}
              placeholder="능력치명 (예: 국력)"
              required
              type="text"
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
          턴 능력치 추가
        </AdminButton>
      </div>
    </AdminFormRow>
  );
}

function StatFields({ items }: { items: StatFormItem[] }) {
  const [stats, setStats] = useState<StatFormItem[]>(
    items.length > 0
      ? items
      : [createStatItem("stat-0"), createStatItem("stat-1"), createStatItem("stat-2")],
  );
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  function addItem() {
    setStats((current) => [...current, createStatItem(`stat-${crypto.randomUUID()}`)]);
  }

  function removeItem(index: number) {
    setStats((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, key: string) {
    setDraggedKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, key: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverKey(key);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, key: string) {
    event.preventDefault();

    if (!draggedKey || draggedKey === key) {
      return;
    }

    setStats((current) => {
      const fromIndex = current.findIndex((item) => item.key === draggedKey);
      const toIndex = current.findIndex((item) => item.key === key);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDraggedKey(null);
    setDragOverKey(null);
  }

  function handleDragEnd() {
    setDraggedKey(null);
    setDragOverKey(null);
  }

  return (
    <AdminFormRow alignTop label="강점">
      <div className="space-y-3">
        {stats.map((item, index) => (
          <div
            key={item.key}
            className={`space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4 cursor-grab active:cursor-grabbing ${
              dragOverKey === item.key ? "bg-[#F4F1EA]" : ""
            } ${draggedKey === item.key ? "opacity-50" : ""}`}
            draggable
            onDragEnd={handleDragEnd}
            onDragStart={(event) => handleDragStart(event, item.key)}
            onDragOver={(event) => handleDragOver(event, item.key)}
            onDrop={(event) => handleDrop(event, item.key)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GripVertical aria-hidden="true" className="size-4 text-[#8A847C]" />
                <p className="text-xs font-medium text-[#8A847C]">항목 {index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                {stats.length > 1 ? (
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
            </div>

            <AdminInput
              className={panelInputClassName}
              defaultValue={item.name}
              name={`stats.${index}.name`}
              placeholder="강점명"
              required
              type="text"
            />
            <AdminInput
              className={panelInputClassName}
              defaultValue={item.value}
              name={`stats.${index}.value`}
              placeholder="기본값"
              required
              type="number"
            />
            <AdminTextarea
              className={panelTextareaClassName}
              defaultValue={item.desc}
              name={`stats.${index}.desc`}
              placeholder="강점 설명"
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
          강점 추가
        </AdminButton>
      </div>
    </AdminFormRow>
  );
}

export function CharacterPanelForm({ categoryOptions, character, mode }: CharacterPanelFormProps) {
  const isCreate = mode === "create";
  const keywordsValue = character?.keywords.join(", ") ?? "";
  const statItems =
    character?.stats.map((item, index) => ({
      key: `existing-${index}-${item.name}`,
      name: item.name,
      value: String(item.value),
      desc: item.desc,
    })) ?? [];
  const turnStatItems =
    character?.turn_stats.map((item, index) => ({
      key: `existing-turn-${index}-${item.id}`,
      id: item.id,
      name: item.name,
    })) ?? [];

  const associatedStories = character?.associated_stories ?? {};

  return (
    <div className="space-y-6">
      <FormSection title="기본 정보">
        {!isCreate ? (
          <AdminFormRow label="상태">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3A3530]">
              <input
                className="size-4 rounded border-[#D6D0C6] accent-[#2A4232]"
                defaultChecked={character?.is_active ?? true}
                name="is_active"
                type="checkbox"
              />
              사용
            </label>
          </AdminFormRow>
        ) : null}

        {!isCreate ? (
          <AdminFormRow htmlFor="character-id" label="ID">
            <AdminInput
              className={panelInputClassName}
              defaultValue={character?.id}
              disabled
              id="character-id"
              name="id"
              readOnly
              type="text"
            />
          </AdminFormRow>
        ) : null}

        <AdminFormRow htmlFor="character-name" label="이름" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.name}
            id="character-name"
            name="name"
            placeholder="인물 이름"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="character-category" label="카테고리" required>
          <AdminSelect
            className={`${panelInputClassName} h-11`}
            defaultValue={String(character?.category_id ?? categoryOptions[0]?.id ?? "")}
            id="character-category"
            name="category_id"
            required
          >
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </AdminSelect>
        </AdminFormRow>

        <AdminFormRow htmlFor="character-role" label="역할" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.role}
            id="character-role"
            name="role"
            placeholder="예: 장군, 왕"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="character-era" label="시대" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.era}
            id="character-era"
            name="era"
            placeholder="예: 조선"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="character-era-tag" label="시대 태그" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.era_tag}
            id="character-era-tag"
            name="era_tag"
            placeholder="예: 조선 중기"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="character-years" label="생몰년" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.years}
            id="character-years"
            name="years"
            placeholder="예: 1545-1598"
            required
            type="text"
          />
        </AdminFormRow>
      </FormSection>

      <FormSection title="소개">
        <AdminFormRow htmlFor="character-summary" label="한 줄 요약" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.one_line_summary}
            id="character-summary"
            name="one_line_summary"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-situation" label="상황" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.situation}
            id="character-situation"
            name="situation"
            required
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-intro-quote" label="소개 인용" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.intro_quote}
            id="character-intro-quote"
            name="intro_quote"
            required
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-intro-desc" label="소개 본문" required>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.intro_desc}
            id="character-intro-desc"
            name="intro_desc"
            required
          />
        </AdminFormRow>
      </FormSection>

      <FormSection title="MBTI">
        <AdminFormRow htmlFor="character-mbti" label="MBTI" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.mbti}
            id="character-mbti"
            name="mbti"
            placeholder="예: ISTJ"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow htmlFor="character-mbti-nickname" label="별명" required>
          <AdminInput
            className={panelInputClassName}
            defaultValue={character?.mbti_nickname}
            id="character-mbti-nickname"
            name="mbti_nickname"
            required
            type="text"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-mbti-e-i" label="E/I 설명">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.mbti_e_i}
            id="character-mbti-e-i"
            name="mbti_e_i"
            placeholder="외향(E) / 내향(I) 축 설명"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-mbti-s-n" label="S/N 설명">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.mbti_s_n}
            id="character-mbti-s-n"
            name="mbti_s_n"
            placeholder="감각(S) / 직관(N) 축 설명"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-mbti-t-f" label="T/F 설명">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.mbti_t_f}
            id="character-mbti-t-f"
            name="mbti_t_f"
            placeholder="사고(T) / 감정(F) 축 설명"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-mbti-j-p" label="J/P 설명">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.mbti_j_p}
            id="character-mbti-j-p"
            name="mbti_j_p"
            placeholder="판단(J) / 인식(P) 축 설명"
          />
        </AdminFormRow>
      </FormSection>

      <FormSection title="강점">
        <StatFields items={statItems} />
      </FormSection>

      <FormSection title="턴 능력치">
        <TurnStatFields items={turnStatItems} />
      </FormSection>

      <FormSection title="연관 스토리">
        <AdminFormRow alignTop htmlFor="associated-stories-prsn" label="인물 (prsn)">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={formatStoryIds(associatedStories.prsn)}
            id="associated-stories-prsn"
            name="associated_stories.prsn"
            placeholder="쉼표로 구분 (예: 370, 371, 372)"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="associated-stories-cltur" label="문화 (cltur)">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={formatStoryIds(associatedStories.cltur)}
            id="associated-stories-cltur"
            name="associated_stories.cltur"
            placeholder="쉼표로 구분"
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="associated-stories-textbook" label="국사교과서">
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={formatStoryIds(associatedStories.국사교과서)}
            id="associated-stories-textbook"
            name="associated_stories.국사교과서"
            placeholder="쉼표로 구분"
          />
        </AdminFormRow>
      </FormSection>

      <FormSection title="기타">
        <AdminFormRow htmlFor="character-image" label="이미지 URL">
          <CharacterImageUrlField defaultValue={character?.image_url} />
        </AdminFormRow>

        <AdminFormRow htmlFor="character-keywords" label="키워드">
          <AdminInput
            className={panelInputClassName}
            defaultValue={keywordsValue}
            id="character-keywords"
            name="keywords"
            placeholder="쉼표로 구분 (예: 장군, 임진왜란)"
            type="text"
          />
        </AdminFormRow>
      </FormSection>
    </div>
  );
}
