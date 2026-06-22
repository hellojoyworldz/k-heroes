export type ScenarioCategoryRef = {
  id: number;
  title: string;
  sort_order: number;
};

export type ScenarioCharacterRef = {
  id: number;
  name: string;
  sort_order: number;
  category: ScenarioCategoryRef;
};

export type ScenarioListItem = {
  id: number;
  character_id: number;
  character: ScenarioCharacterRef;
  sort_order: number;
  title: string;
  description: string;
  historical_facts: string;
  source_story_ids: number[];
  is_active: boolean;
};
