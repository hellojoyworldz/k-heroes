/* 인물별 시나리오 목록 */
export interface ScenarioMeta {
  id: string;           // "yunbongil-1"
  charId: string;
  index: number;        // 0-based
  title: string;
  subtitle: string;
  period: string;       // 연도 / 시대
  difficulty: "입문" | "중급" | "심화";
  desc: string;
  themeIcon: string;
  stepCount: number;
  imageUrl?: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  /* ── 윤봉길 ── */
  {
    id: "yunbongil-0",
    charId: "yunbongil",
    index: 0,
    title: "상하이 거사",
    subtitle: "목숨을 건 결단의 순간",
    period: "1931–1932년",
    difficulty: "입문",
    desc: "상하이 망명부터 홍커우 공원 거사까지. 윤봉길 의사의 가장 결정적인 선택을 함께 합니다.",
    themeIcon: "💣",
    stepCount: 3,
  },
  {
    id: "yunbongil-1",
    charId: "yunbongil",
    index: 1,
    title: "농촌 계몽 운동",
    subtitle: "붓으로 싸우는 독립운동",
    period: "1926–1930년",
    difficulty: "중급",
    desc: "고향 예산에서 야학을 세우고 농촌 계몽에 나선 청년 윤봉길. 교육이냐, 직접 행동이냐의 갈림길.",
    themeIcon: "✏️",
    stepCount: 3,
  },
  {
    id: "yunbongil-2",
    charId: "yunbongil",
    index: 2,
    title: "한인애국단 입단",
    subtitle: "김구와의 운명적 만남",
    period: "1932년 초",
    difficulty: "심화",
    desc: "김구 선생을 처음 만난 날부터 애국단 선서까지. 조직 내 역할을 어떻게 선택하느냐에 따라 역사가 달라집니다.",
    themeIcon: "🤝",
    stepCount: 3,
  },

  /* ── 이순신 ── */
  {
    id: "yi_sunsin-0",
    charId: "yi_sunsin",
    index: 0,
    title: "명량대첩",
    subtitle: "13척의 기적",
    period: "1597년",
    difficulty: "입문",
    desc: "330척 왜군 함대에 맞서 단 13척으로 싸운 명량. 전술과 지형을 어떻게 활용할 것인가.",
    themeIcon: "⚓",
    stepCount: 3,
  },
  {
    id: "yi_sunsin-1",
    charId: "yi_sunsin",
    index: 1,
    title: "한산도 대첩",
    subtitle: "학익진의 탄생",
    period: "1592년",
    difficulty: "중급",
    desc: "임진왜란 초기, 한산도 앞바다에서 펼친 학익진 전술. 당신이 이순신이라면 어떤 진형을 선택하겠습니까?",
    themeIcon: "🦅",
    stepCount: 3,
  },
  {
    id: "yi_sunsin-2",
    charId: "yi_sunsin",
    index: 2,
    title: "삼도수군통제사 파직",
    subtitle: "억울한 누명과 재기",
    period: "1597년",
    difficulty: "심화",
    desc: "선조의 명을 거스르고 누명을 쓴 이순신. 백의종군에서 다시 통제사로 복귀하기까지의 결단.",
    themeIcon: "⚖️",
    stepCount: 3,
  },

  /* ── 세종 ── */
  {
    id: "sejong-0",
    charId: "sejong",
    index: 0,
    title: "훈민정음 창제",
    subtitle: "백성을 위한 문자",
    period: "1443년",
    difficulty: "입문",
    desc: "집현전 학자들의 반대 속에서도 한글을 만든 세종. 어떤 설득과 선택으로 훈민정음이 완성되었을까요?",
    themeIcon: "📜",
    stepCount: 3,
  },
  {
    id: "sejong-1",
    charId: "sejong",
    index: 1,
    title: "과학과 기술 혁명",
    subtitle: "측우기·앙부일구의 탄생",
    period: "1430년대",
    difficulty: "중급",
    desc: "장영실과 함께 만든 조선의 과학 기기들. 신분의 벽을 넘어 재능을 등용한 세종의 선택.",
    themeIcon: "🔭",
    stepCount: 3,
  },
  {
    id: "sejong-2",
    charId: "sejong",
    index: 2,
    title: "대마도 정벌 vs 외교",
    subtitle: "강경과 화해 사이",
    period: "1419년",
    difficulty: "심화",
    desc: "왜구 소탕을 위해 대마도를 정벌할 것인가, 외교적 해결을 선택할 것인가. 상왕 태종의 뜻과 젊은 세종의 판단.",
    themeIcon: "🗡️",
    stepCount: 3,
  },
];

export function getScenariosForChar(charId: string): ScenarioMeta[] {
  return SCENARIOS.filter((s) => s.charId === charId);
}
