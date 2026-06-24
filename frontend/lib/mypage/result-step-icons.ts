/** ResultPage RESULTS의 스텝별 실제/가상 여부 (combo → icons) */
export const RESULT_STEP_ICONS: Record<string, [boolean, boolean, boolean]> = {
  "A-A-A": [true, false, true],
  "A-A-B": [true, false, false],
  "A-B-A": [true, true, true],
  "A-B-B": [true, true, false],
  "B-A-A": [false, false, true],
  "B-A-B": [false, false, false],
  "B-B-A": [false, true, true],
  "B-B-B": [false, true, false],
};

export function buildComboKey(choices: string[]) {
  const [step1 = "A", step2 = "B", step3 = "A"] = choices
    .slice(0, 3)
    .map((choice) => choice.toUpperCase());

  return `${step1}-${step2}-${step3}`;
}

export function getResultStepIcons(choices: string[]) {
  return RESULT_STEP_ICONS[buildComboKey(choices)] ?? null;
}
