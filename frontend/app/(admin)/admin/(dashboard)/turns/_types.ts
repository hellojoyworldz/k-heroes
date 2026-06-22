export type TurnCategoryRef = {
  id: number;
  title: string;
  sort_order: number;
};

export type TurnCharacterRef = {
  id: number;
  name: string;
  sort_order: number;
  category: TurnCategoryRef;
};

export type TurnScenarioRef = {
  id: number;
  title: string;
  sort_order: number;
};

export type CharacterTurnStat = {
  id: number;
  name: string;
};

/** @deprecated 인물 stats index 참조 — turn_stats 사용 */
export type CharacterStatIndex = {
  id: number;
  name: string;
  value: number;
};

export type ChoiceTurnStat = {
  turn_stats_id: number;
  name: string;
  delta: number;
};

export type TurnChoice = {
  id?: number;
  choice_key: string;
  title: string;
  description: string;
  choice_image: string;
  turn_stats: ChoiceTurnStat[];
  result_text: string;
  is_historical: boolean;
};

export type TurnListItem = {
  id: number;
  scenario_id: number;
  scenario: TurnScenarioRef;
  character: TurnCharacterRef;
  sort_order: number;
  title: string;
  situation: string;
  turn_image: string;
  tip_title: string;
  tip_desc: string;
  turn_stats: CharacterTurnStat[];
  choices: Record<"A" | "B", TurnChoice>;
  is_active: boolean;
};
