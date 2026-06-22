export type CharacterStat = {
  id: number;
  name: string;
  value: number;
  desc: string;
};

export type AssociatedStories = {
  prsn?: number[];
  cltur?: number[];
  국사교과서?: number[];
};

export type CharacterTurnStatDef = {
  id: number;
  name: string;
};

export type CharacterListItem = {
  id: number;
  name: string;
  category_id: number;
  category: string;
  sort_order: number;
  era: string;
  era_tag: string;
  role: string;
  years: string;
  image_url: string;
  situation: string;
  one_line_summary: string;
  mbti: string;
  mbti_nickname: string;
  mbti_e_i: string;
  mbti_s_n: string;
  mbti_t_f: string;
  mbti_j_p: string;
  intro_quote: string;
  intro_desc: string;
  keywords: string[];
  associated_stories: AssociatedStories;
  stats: CharacterStat[];
  turn_stats: CharacterTurnStatDef[];
  is_active: boolean;
  deleted_at: string | null;
};
