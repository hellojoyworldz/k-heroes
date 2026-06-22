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
  value: number;
};

export type ChoiceTurnStat = {
  stat_id: number;
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
  character_stats: CharacterTurnStat[];
  sort_order: number;
  title: string;
  situation: string;
  turn_image: string;
  tip_title: string;
  tip_desc: string;
  choices: Record<"A" | "B", TurnChoice>;
  is_active: boolean;
};
