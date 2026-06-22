"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";
import type { CharacterListItem } from "@/app/(admin)/admin/(dashboard)/characters/_types";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

type CategoryOption = {
  id: number;
  title: string;
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

export function CharacterPanelForm({ categoryOptions, character, mode }: CharacterPanelFormProps) {
  const isCreate = mode === "create";
  const keywordsValue = character?.keywords.join(", ") ?? "";

  return (
    <div className="space-y-6">
      <FormSection title="기본 정보">
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
                {formatIdDotLabel(category.id, category.title)}
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

        <AdminFormRow alignTop htmlFor="character-situation" label="상황" required={isCreate}>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.situation}
            id="character-situation"
            name="situation"
            required={isCreate}
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-intro-quote" label="소개 인용" required={isCreate}>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.intro_quote}
            id="character-intro-quote"
            name="intro_quote"
            required={isCreate}
          />
        </AdminFormRow>

        <AdminFormRow alignTop htmlFor="character-intro-desc" label="소개 본문" required={isCreate}>
          <AdminTextarea
            className={panelTextareaClassName}
            defaultValue={character?.intro_desc}
            id="character-intro-desc"
            name="intro_desc"
            required={isCreate}
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
