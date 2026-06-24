"use client";

import type { ReactNode } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { cn } from "@/lib/utils/cn";

export type SessionHistoryFilters = {
  dateFrom: string;
  dateTo: string;
  characterName: string;
  scenarioTitle: string;
};

export const emptySessionHistoryFilters: SessionHistoryFilters = {
  dateFrom: "",
  dateTo: "",
  characterName: "",
  scenarioTitle: "",
};

type MypageSessionFiltersProps = {
  values: SessionHistoryFilters;
  onChange: (values: SessionHistoryFilters) => void;
  onSearch: () => void;
  onReset: () => void;
};

const inputClassName = cn(
  "h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#1A1714] outline-none transition",
  "placeholder:text-[#A39E94]",
  "focus:border-[#3D6B52] focus:ring-2 focus:ring-[#3D6B52]/15",
);

export function MypageSessionFilters({
  values,
  onChange,
  onSearch,
  onReset,
}: MypageSessionFiltersProps) {
  function updateField<K extends keyof SessionHistoryFilters>(key: K, value: SessionHistoryFilters[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div
      className="mt-5 rounded-xl border p-4"
      style={{ borderColor: "rgba(42,66,50,0.1)", background: "rgba(42,66,50,0.02)" }}
    >
      <p className="text-xs font-medium text-[#6B6458]">검색 조건</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <FilterField label="완료일 시작" id="session-date-from">
          <input
            className={inputClassName}
            id="session-date-from"
            onChange={(event) => updateField("dateFrom", event.target.value)}
            type="date"
            value={values.dateFrom}
            style={{ borderColor: "rgba(42,66,50,0.18)" }}
          />
        </FilterField>

        <FilterField label="완료일 종료" id="session-date-to">
          <input
            className={inputClassName}
            id="session-date-to"
            onChange={(event) => updateField("dateTo", event.target.value)}
            type="date"
            value={values.dateTo}
            style={{ borderColor: "rgba(42,66,50,0.18)" }}
          />
        </FilterField>

        <FilterField label="인물명" id="session-character-name">
          <input
            className={inputClassName}
            id="session-character-name"
            onChange={(event) => updateField("characterName", event.target.value)}
            placeholder="인물명 검색"
            type="text"
            value={values.characterName}
            style={{ borderColor: "rgba(42,66,50,0.18)" }}
          />
        </FilterField>

        <FilterField label="시나리오 제목" id="session-scenario-title">
          <input
            className={inputClassName}
            id="session-scenario-title"
            onChange={(event) => updateField("scenarioTitle", event.target.value)}
            placeholder="시나리오 제목 검색"
            type="text"
            value={values.scenarioTitle}
            style={{ borderColor: "rgba(42,66,50,0.18)" }}
          />
        </FilterField>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AuthButton className="w-auto min-w-[88px]" onClick={onSearch} size="sm" type="button">
          검색
        </AuthButton>
        <AuthButton className="w-auto min-w-[88px]" onClick={onReset} size="sm" type="button" variant="secondary">
          초기화
        </AuthButton>
      </div>
    </div>
  );
}

function FilterField({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#6B6458]" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
