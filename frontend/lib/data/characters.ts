import sejongImg from "@/public/images/image-21.png";
import yiSunsinImg from "@/public/images/image-20.png";
import yunbongilImg from "@/public/images/image-23.png";

export interface Strength {
  name: string;
  score: number;
  max: number;
  value: number; // 0–100 for progress bar display
  desc: string;
}

export interface MbtiType {
  letter: string;
  label: string;
  desc: string;
}

export interface CharacterData {
  id: string;
  name: string;
  role: string;
  tagline: string;
  era: string;
  years: string;
  situation: string;
  summary: string;
  mbti: string;
  mbtiTitle: string;
  mbtiSubtitle: string;
  strengths: Strength[];
  mbtiTypes: MbtiType[];
  quote: string;
  storyIntro: string;
  img: string;
  bgImg: string;
  tags: string[];
  region: string;
}

export const CHARACTERS: Record<string, CharacterData> = {
  yunbongil: {
    id: "yunbongil",
    name: "윤봉길 의사",
    role: "독립운동가 · 한인애국단",
    tagline: "대한민국 독립을 위해 상하이에서 거사를 결행한 청년",
    era: "일제강점기",
    years: "1908–1932",
    situation:
      "일제 강점을 지배하던 시기, 매국에서 독립운동을 해야 하는 절체절명의 상황!",
    summary: "폭탄 하나로 일제의 심장을 겨눈 독립의 영웅",
    mbti: "INFJ",
    mbtiTitle: "선의의 옹호자",
    mbtiSubtitle: "독립운동계의 철두철미한 계획러",
    strengths: [
      { name: "계획과 선택력", score: 5, max: 5, value: 92, desc: "완벽한 계획으로 임무를 실행" },
      { name: "용기와 결단력", score: 5, max: 5, value: 98, desc: "목숨을 걸고 조국을 위해 행동" },
      { name: "사명과 책임감", score: 5, max: 5, value: 95, desc: "백성을 사랑하는 마음으로 헌신" },
    ],
    mbtiTypes: [
      {
        letter: "I",
        label: "외향적/내향적(E/I)",
        desc: "혼자 조용히 책략을 품고 치밀하게 실천 사항들을 기록합니다.",
      },
      {
        letter: "N",
        label: "감각적/직관적(S/N)",
        desc: "나라의 미래를 이끌 큰 그림을 바라보고 그려냅니다.",
      },
      {
        letter: "F",
        label: "사고적/감정적(T/F)",
        desc: "진심으로 타인의 아픔에 공감하며 독립의 당위성을 느낍니다.",
      },
      {
        letter: "J",
        label: "판단적/인식적(J/P)",
        desc: "독립 거사부터 시간까지 1분의 오차도 없이 완벽하게 계획합니다.",
      },
    ],
    quote: "나라를 되찾기 전에는 살아서 돌아오지 않겠다!",
    storyIntro:
      "평범한 청년이었지만 나라를 빼앗긴 것에 더 이상 가만히 있을 수 없었습니다. 독립을 위해 죽을 수도 있다는 걸 알면서도, 목숨보다 조국을 먼저 생각했습니다.\n이제 당신이 윤봉길이 되어 역사 속 가장 중요한 선택의 순간을 경험합니다. 당신의 선택이 운명을 바꿀 수도 있습니다. 준비되셨나요?",
    img: yunbongilImg.src,
    bgImg: "https://images.unsplash.com/photo-1695730435725-861079fcf917?w=600&q=80&fit=crop",
    tags: ["#독립운동", "#3.1운동", "#한인애국단"],
    region: "서울",
  },

  yi_sunsin: {
    id: "yi_sunsin",
    name: "이순신 장군",
    role: "삼도수군통제사 · 임진왜란 영웅",
    tagline: "13척의 배로 나라의 위기를 지켜낸 위대한 장군",
    era: "조선 시대",
    years: "1545–1598",
    situation:
      "임진왜란 발발. 조선 수군이 무너진 상황에서 단 13척으로 왜군 330척에 맞서야 하는 상황!",
    summary: "불굴의 의지로 나라의 바다를 지켜낸 전략의 천재",
    mbti: "ISTJ",
    mbtiTitle: "청렴결백한 논리주의자",
    mbtiSubtitle: "원칙을 지키며 나라를 구한 수군 사령관",
    strengths: [
      { name: "전략적 사고", score: 5, max: 5, value: 97, desc: "지형과 조류를 이용한 명전술" },
      { name: "리더십", score: 5, max: 5, value: 88, desc: "부하들의 신뢰를 얻는 솔선수범" },
      { name: "불굴의 의지", score: 5, max: 5, value: 99, desc: "역경 속에서도 포기하지 않는 정신" },
    ],
    mbtiTypes: [
      {
        letter: "I",
        label: "외향적/내향적(E/I)",
        desc: "난중일기를 쓰며 혼자 전략을 수립하고 내면을 다독입니다.",
      },
      {
        letter: "S",
        label: "감각적/직관적(S/N)",
        desc: "지형·조류·날씨 등 현실적 데이터를 분석해 전투에 활용합니다.",
      },
      {
        letter: "T",
        label: "사고적/감정적(T/F)",
        desc: "감정보다 냉철한 판단으로 군사 전략을 세웁니다.",
      },
      {
        letter: "J",
        label: "판단적/인식적(J/P)",
        desc: "철저한 사전 준비와 규율로 군대를 이끕니다.",
      },
    ],
    quote: "죽고자 하면 살고, 살고자 하면 죽는다.",
    storyIntro:
      "300척이 넘는 왜군 함선이 조선 바다를 덮쳤습니다. 모두가 포기를 외칠 때, 단 한 사람만이 다르게 생각했습니다.\n13척의 배로 울돌목 앞에 선 당신. 조류를 무기로 삼아 역사를 뒤집을 수 있을까요?",
    img: yiSunsinImg.src,
    bgImg: "https://images.unsplash.com/photo-1719553946838-1190abdeee92?w=600&q=80&fit=crop",
    tags: ["#임진왜란", "#명량대첩", "#조선수군"],
    region: "경상도",
  },

  sejong: {
    id: "sejong",
    name: "세종대왕",
    role: "조선 4대 왕 · 훈민정음 창제자",
    tagline: "한글을 창제하고 백성을 사랑한 조선 최고의 왕",
    era: "조선 시대",
    years: "1397–1450",
    situation:
      "백성 대부분이 글을 읽지 못하는 시대. 새로운 문자를 만들어 지식의 문을 열어야 할 순간!",
    summary: "모든 백성이 글을 읽을 수 있는 세상을 꿈꾼 성군",
    mbti: "ENFJ",
    mbtiTitle: "정의로운 사회운동가",
    mbtiSubtitle: "조선을 황금기로 이끈 따뜻한 지도자",
    strengths: [
      { name: "창의적 혁신", score: 5, max: 5, value: 96, desc: "훈민정음 창제로 문화 혁명 주도" },
      { name: "소통과 공감", score: 5, max: 5, value: 94, desc: "백성의 목소리에 귀 기울이는 통치" },
      { name: "지적 탐구심", score: 5, max: 5, value: 98, desc: "과학·음악·농업 전 분야 발전 이끔" },
    ],
    mbtiTypes: [
      {
        letter: "E",
        label: "외향적/내향적(E/I)",
        desc: "신하들과 활발히 토론하며 집현전 학자들과 함께 연구합니다.",
      },
      {
        letter: "N",
        label: "감각적/직관적(S/N)",
        desc: "백성이 글을 읽는 미래를 먼저 그리고 역으로 설계합니다.",
      },
      {
        letter: "F",
        label: "사고적/감정적(T/F)",
        desc: "백성의 고통에 진심으로 공감하고 그 해결을 정책으로 잇습니다.",
      },
      {
        letter: "J",
        label: "판단적/인식적(J/P)",
        desc: "훈민정음 반포까지 체계적인 계획으로 완성도를 높입니다.",
      },
    ],
    quote: "백성이 나라의 근본이다. 근본이 튼튼해야 나라가 평안하다.",
    storyIntro:
      "수천 년 역사에서 백성 스스로 글을 쓰고 읽는 나라는 없었습니다. 당신은 그 벽을 허물기로 결심했습니다.\n학자들의 반대, 중국의 눈치, 수많은 시련 앞에서 당신의 선택은 무엇이었을까요?",
    img: sejongImg.src,
    bgImg: "https://images.unsplash.com/photo-1768006378015-2cb810dbeb90?w=600&q=80&fit=crop",
    tags: ["#훈민정음", "#집현전", "#조선황금기"],
    region: "서울",
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
