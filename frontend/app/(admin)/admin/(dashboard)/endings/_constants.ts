export const ENDING_TYPE_OPTIONS = [
  { value: "True Ending", label: "역사 엔딩" },
  { value: "Alternative Ending", label: "가상 엔딩" },
] as const;

export type EndingTypeValue = (typeof ENDING_TYPE_OPTIONS)[number]["value"];

export function formatEndingTypeLabel(endingType: string) {
  return ENDING_TYPE_OPTIONS.find((option) => option.value === endingType)?.label ?? endingType;
}
