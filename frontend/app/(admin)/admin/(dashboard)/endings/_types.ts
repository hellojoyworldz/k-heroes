export type EndingCategoryRef = {
  id: number;
  title: string;
  sort_order: number;
};

export type EndingCharacterRef = {
  id: number;
  name: string;
  sort_order: number;
  category: EndingCategoryRef;
};

export type EndingScenarioRef = {
  id: number;
  title: string;
  sort_order: number;
};

export type SummaryItem = {
  title: string;
  desc: string;
};

export type RecommendedPlace = {
  address: string;
  name: string;
  description: string;
  link: string;
  image_url: string;
};

export type EndingListItem = {
  id: number;
  scenario_id: number;
  scenario: EndingScenarioRef;
  character: EndingCharacterRef;
  sort_order: number;
  path_key: string;
  ending_type: string;
  title: string;
  history_fact: string;
  story_headline: string;
  story_contents: string;
  factual_contents: string;
  image_url: string;
  summary_items: SummaryItem[];
  recommended_places: RecommendedPlace[];
  is_active: boolean;
  deleted_at: string | null;
};
