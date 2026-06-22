export type CharacterTurnStat = {
  id?: number;
  name: string;
  value: number;
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
  turn_stats: CharacterTurnStat[];
  is_active: boolean;
};
