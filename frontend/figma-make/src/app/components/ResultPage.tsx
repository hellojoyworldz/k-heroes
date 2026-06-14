import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Share2, ChevronRight, MapPin } from "lucide-react";
import { CHARACTERS } from "../data/characters";
import { BrandLogo } from "./BrandLogo";

/* ─── 타입 ─── */
interface ResultData {
  resultNum: number;
  combo: string;
  icons: [boolean, boolean, boolean];
  title: string;
  isReal: boolean;
  stats: { money: number; team: number; success: number };
  historicalNote: string;
  storyQuote: string;
  storyBody: string;
  summaryPoints: string[];
}

/* ─── 8가지 결과 데이터 ─── */
const RESULTS: Record<string, ResultData> = {
  "A-A-A": {
    resultNum: 1,
    combo: "A-A-A",
    icons: [true, false, true],
    title: "삼엄한 검문소 앞, 멈춰 선 청년의 발걸음",
    isReal: false,
    stats: { money: 35, team: 75, success: 40 },
    historicalNote:
      "첫 단추는 잘 채웠지만, 무기 선택에서 가상 분기를 선택했습니다. 실제 윤봉길 의사는 옷 속에 무기를 숨기지 않고, 일본군의 허점을 찌르기 위해 도시락과 물통 모양으로 정교하게 만들어진 특수 폭탄을 준비해 검문을 통과했습니다.",
    storyQuote: "정지! 품속에 든 것은 무엇이냐!",
    storyBody:
      "옷 속에 권총과 커다란 폭탄을 숨긴 채 삼엄한 홍구공원 입구로 다가가던 중, 금속 탐지기와 꼼꼼한 몸수색에 걸려 거사를 시작하기도 전에 붙잡히고 말았습니다.",
    summaryPoints: [
      "거사 사전 발각: 작전 장소인 공원 안으로 발을 들이지 못하고 입구에서 안타깝게 체포되었습니다.",
      "임시정부의 위기: 비밀 대원의 정체가 드러날 위험에 처하면서 상하이 임시정부가 긴급히 거처를 옮겨야 했습니다.",
      "더 엄격해진 검문: 이 사건으로 인해 일제의 조선인 경계와 검문 수준이 상상할 수 없을 정도로 삼엄해졌습니다.",
    ],
  },
  "A-A-B": {
    resultNum: 2,
    combo: "A-A-B",
    icons: [true, false, false],
    title: "엇갈린 타이밍, 삼엄한 경계 속의 눈물",
    isReal: false,
    stats: { money: 35, team: 65, success: 10 },
    historicalNote:
      "무기로 권총을 택한 데다 투척 타이밍까지 놓쳐버린 최악의 가상 시나리오입니다. 실제 역사 속 윤봉길 의사는 일본 국가가 울려 퍼져 모든 군인의 시선이 한곳에 묶인 최고의 타이밍을 정확히 낚아채 물통 폭탄을 던졌습니다.",
    storyQuote: "탕! 탕!... 저 놈을 잡아라!",
    storyBody:
      "삼엄한 검문을 피해 어렵게 행사장 구석으로 숨어들었지만, 장군들이 움직이기 시작하자 사방의 경비병들이 눈을 부릅뜨고 순찰을 돌았고, 권총을 꺼내 들자마자 사방에서 총탄이 날아왔습니다.",
    summaryPoints: [
      "일제 장성 처단 실패: 목표물이었던 일본군 핵심 수뇌부들이 아무런 피해 없이 현장을 빠져나갔습니다.",
      "작전의 완전한 실패: 화력이 부족한 권총으로는 수만 명의 군경이 둘러싼 현장을 장악할 수 없었습니다.",
      "독립운동의 침체: 큰 기대를 모았던 한인애국단의 비밀 작전이 실패로 끝나며 독립운동가들이 깊은 슬픔에 잠겼습니다.",
    ],
  },
  "A-B-A": {
    resultNum: 3,
    combo: "A-B-A",
    icons: [true, true, true],
    title: "역사를 바꾼 위대한 폭발, 상하이 거사 대성공!",
    isReal: true,
    stats: { money: 30, team: 100, success: 115 },
    historicalNote:
      "정답입니다! 당신의 선택이 실제 역사와 100% 정확히 일치합니다! 1932년 4월 29일, 24세 청년 윤봉길 의사가 행한 위대한 역사 그대로입니다. 이 대담한 행동 덕분에 전 세계에 대한민국 국민들의 강렬한 독립 의지가 증명되었고, 우리 독립운동의 불씨가 다시 세차게 타오를 수 있었습니다.",
    storyQuote: "쾅-!!! 공원을 뒤흔든 위대한 폭발!",
    storyBody:
      '당신은 물통 폭탄을 품고 삼엄한 파티장에 들어가, 모두가 얼어붙어 경례하던 완벽한 타이밍에 단상 위로 폭탄을 던졌습니다. 일본군의 높은 장성들이 한꺼번에 쓰러졌고, 당신은 붙잡히는 순간까지 당당하게 "대한 독립 만세!"를 외쳤습니다.',
    summaryPoints: [
      "일제 수뇌부 타격: 상하이 홍구공원 거사에 완벽하게 성공하여 침략자들의 중심 지도부에 치명적인 타격을 입혔습니다.",
      '세계적인 극찬: 중국의 장제스 총통은 "중국의 100만 대군도 못한 일을 한국의 한 청년이 해냈다"며 감탄했습니다.',
      "독립운동의 터닝포인트: 힘을 잃어가던 대한민국 임시정부가 중국 정부의 전폭적인 군사 및 재정 지원을 받게 되었습니다.",
    ],
  },
  "A-B-B": {
    resultNum: 4,
    combo: "A-B-B",
    icons: [true, true, false],
    title: "터지지 못한 물통, 멈춰버린 시계 바늘",
    isReal: false,
    stats: { money: 30, team: 80, success: 85 },
    historicalNote:
      "무기는 완벽하게 골랐지만 투척 타이밍을 놓친 가상 분기입니다. 실제 윤봉길 의사는 국가가 끝날 무렵인 오전 11시 40분경 폭탄을 던졌습니다. 만약 행사가 끝나고 장군들이 흩어질 때까지 기다렸다면 사방의 경계가 풀려 접근조차 불가능했을 것입니다.",
    storyQuote: "이보게, 저 청년의 품에 든 것이 무엇인가?",
    storyBody:
      "완벽하게 위장된 물통 폭탄을 들고 행사장에 잠입하는 데는 성공했습니다. 하지만 장군들이 내려오기만을 기다리는 사이, 행사가 끝나 경비가 분산되면서 오히려 관객석 주변을 순찰하던 사복 경찰에게 거동이 수상하다며 붙잡히고 말았습니다.",
    summaryPoints: [
      "무기 회수 및 체포: 폭탄을 던져보지도 못한 채 현장에서 무기를 압수당하고 체포되었습니다.",
      "위장술의 빛바램: 정교한 도시락·물통 폭탄의 비밀이 일본군에게 통째로 넘어가 분석당하는 결과를 낳았습니다.",
      "아쉬운 타이밍: 단 한 번뿐이었던 역사적 기회를 타이밍 미스로 놓쳐 큰 아쉬움을 남겼습니다.",
    ],
  },
  "B-A-A": {
    resultNum: 5,
    combo: "B-A-A",
    icons: [false, false, true],
    title: "자금은 넉넉하지만, 영웅을 잃은 임시정부",
    isReal: false,
    stats: { money: 75, team: 45, success: 15 },
    historicalNote:
      "처음부터 김구 선생을 만나지 않고 공장을 차려 돈을 벌기로 선택한 가상 분기입니다. 실제 윤봉길 의사는 중국에 온 목적이 장사가 아닌 '독립'임을 명확히 하고, 상하이에서 채소 장사 등을 하며 생계를 이어가다 김구 선생을 찾아가 거사를 자원했습니다.",
    storyQuote: "돈은 모았으나... 내 가슴은 여전히 차디찬 얼음이구나.",
    storyBody:
      "상하이에서 모자 공장을 성공적으로 운영하며 임시정부에 엄청난 독립 자금을 대주었습니다. 하지만 직접 거사를 치를 영웅을 구하지 못한 임시정부는 권총과 대형 폭탄을 든 다른 대원을 보냈다가 검문소에서 허무하게 발각되고 말았습니다.",
    summaryPoints: [
      "풍족한 자금, 빈약한 행동: 임시정부의 금고는 채워졌으나, 일제 장성들을 단죄할 결정적인 한방을 날리지 못했습니다.",
      "한인애국단 결성 위기: 김구 선생과 윤봉길 의사의 운명적인 만남이 어긋나면서 독립운동의 가장 뜨거웠던 불꽃이 피어나지 못했습니다.",
      "상업가로서의 삶: 윤봉길 의사는 독립투사가 아닌 상하이의 자본가로 역사에 기록될 뻔했습니다.",
    ],
  },
  "B-A-B": {
    resultNum: 6,
    combo: "B-A-B",
    icons: [false, false, false],
    title: "무너진 계획, 돈도 영웅도 잃어버린 상하이",
    isReal: false,
    stats: { money: 75, team: 35, success: -15 },
    historicalNote:
      "임시정부와의 팀워크가 완전히 바닥을 치고, 무기와 타이밍까지 모두 어긋난 최악의 가상 시나리오입니다. 실제 역사의 윤봉길 의사는 자신의 목숨을 바쳐 나라를 구하겠다는 일념 하나로 김구 선생과 손을 잡고 완벽한 계획을 세웠습니다.",
    storyQuote: "탕! 움직이면 쏜다! 공장을 샅샅이 뒤져라!",
    storyBody:
      "공장을 운영하며 몰래 무기를 사 모으고 뒤늦게 독립운동을 시도하려 했습니다. 하지만 임시정부와의 긴밀한 협조가 없다 보니 보안이 유지되지 않았고, 거사일이 되기도 전에 일본 순사들이 공장으로 들이닥쳐 모든 것을 빼앗겼습니다.",
    summaryPoints: [
      "비밀 유지 실패: 임시정부의 정교한 정보망 없이 독단적으로 행동하다 정보가 새어나갔습니다.",
      "모든 자산 압류: 공장과 어렵게 모은 독립 자금이 일제에 의해 전부 강탈당했습니다.",
      "독립 세력의 약화: 상하이 지역 내 독립운동가들을 돕던 자금줄이 끊기며 임시정부가 큰 타격을 입었습니다.",
    ],
  },
  "B-B-A": {
    resultNum: 7,
    combo: "B-B-A",
    icons: [false, true, true],
    title: "거금으로 만든 특수 폭탄, 그러나 절반의 성공",
    isReal: false,
    stats: { money: 70, team: 50, success: 60 },
    historicalNote:
      "처음엔 장사를 시작했으나 결국 임시정부를 도와 물통 폭탄을 제작해 낸 가상 분기입니다. 실제 역사와 다른 점은 윤봉길 의사가 직접 폭탄을 던진 것이 아니라, 자신이 번 돈으로 폭탄을 만들어 다른 대원을 지원했다는 설정입니다.",
    storyQuote: "내가 던지진 못했지만, 이 폭탄이 내 대신 조국을 울릴 것이다.",
    storyBody:
      "공장 운영으로 번 돈을 아낌없이 쏟아부어 일본군 검문을 완벽히 통과할 물통 폭탄을 수십 개 제작했습니다. 이를 전달받은 임시정부 대원들이 완벽한 타이밍에 던져 성공하긴 했으나, 윤 의사 본인은 현장에 함께하지 못했습니다.",
    summaryPoints: [
      "재정적 영웅: 전폭적인 자금 지원으로 폭탄 제조 기술을 최고 수준으로 끌어올렸습니다.",
      "홍구공원 타격 성공: 다른 대원의 손을 통해 일제 수뇌부에 타격을 주는 데 성공했습니다.",
      "직접 행동의 부재: 윤봉길 의사만의 독보적인 '대담함'과 '실행력'이 역사의 전면에 드러나지 않아 아쉬움을 남겼습니다.",
    ],
  },
  "B-B-B": {
    resultNum: 8,
    combo: "B-B-B",
    icons: [false, true, false],
    title: "안개 속으로 사라진 독립의 꿈",
    isReal: false,
    stats: { money: 70, team: 40, success: 20 },
    historicalNote:
      '돈은 많이 모았고 정교한 무기까지 준비했으나, 임시정부와의 호흡이 맞지 않고 투척 타이밍마저 놓쳐버린 안타까운 가상 분기입니다. 실제 역사의 윤봉길 의사는 "준비는 끝났고 타이밍은 단 한 번뿐이다"라며 완벽한 기회를 놓치지 않았습니다.',
    storyQuote: "아차, 벌써 차를 타고 가버리다니...!",
    storyBody:
      "자금을 들여 물통 폭탄을 만드는 데는 기여했지만, 현장에서 폭탄을 던지기로 한 대원과 사인이 맞지 않았습니다. 행사가 다 끝나고 장군들이 차를 타고 떠날 때 뒤늦게 폭탄을 던지는 바람에 경갑차에 맞아 폭탄이 튕겨 나가고 말았습니다.",
    summaryPoints: [
      "거사 실패 및 요인 암살 실패: 폭탄이 엉뚱한 곳에서 터져 일제 장성들이 상처 하나 없이 대피했습니다.",
      "자금의 낭비: 큰돈을 들여 만든 특수 무기들이 아무런 소득 없이 소모되었습니다.",
      "일제의 대대적 보복: 거사 시도 흔적을 찾아낸 일본군이 상하이 내 한인 사회를 샅샅이 뒤지며 수많은 동포가 체포되는 비극을 낳았습니다.",
    ],
  },
};

/* ─── 추천 방문지 ─── */
const PLACES = [
  {
    name: "매헌윤봉길의사기념관",
    location: "서울특별시 서초구 양재동",
    desc: "윤봉길 의사의 생애와 독립운동을 기리는 기념관. 의거 관련 유물과 사료가 전시되어 있습니다.",
    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=80&fit=crop",
  },
  {
    name: "충의사 (윤봉길 의사 생가)",
    location: "충청남도 예산군 덕산면",
    desc: "윤봉길 의사가 태어나고 자란 생가를 복원한 사적지. 의사의 어린 시절과 교육 활동을 엿볼 수 있습니다.",
    img: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&q=80&fit=crop",
  },
];

/* ─── 아이콘 배지 ─── */
function ComboIcon({ isReal, step }: { isReal: boolean; step: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: isReal ? "rgba(42,150,80,0.18)" : "rgba(180,100,20,0.18)",
          border: isReal ? "2px solid rgba(42,150,80,0.5)" : "2px solid rgba(180,100,20,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        <span style={{ fontSize: "17px", lineHeight: 1 }}>{isReal ? "🅾️" : "❎"}</span>
      </div>
      <span
        style={{
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: "0.58rem",
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.04em",
        }}
      >
        STEP {step}
      </span>
    </div>
  );
}

/* ─── 능력치 바 ─── */
function StatBar({ icon, label, value, isPercent, max }: { icon: string; label: string; value: number; isPercent?: boolean; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = value >= 80 ? "#4CAF72" : value >= 50 ? "#C9933A" : value >= 20 ? "#A0856A" : "#8B4040";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "14px" }}>{icon}</span>
          <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "0.7rem", color: "#7A7060" }}>{label}</span>
        </div>
        <span style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: "0.85rem", color }}>
          {value > 0 && isPercent !== true ? "" : ""}{value}{isPercent ? "%" : ""}
        </span>
      </div>
      <div style={{ height: "6px", borderRadius: "3px", background: "rgba(42,66,50,0.1)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "3px",
            background: color,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */
export function ResultPage({
  charId,
  selections,
  onBack,
  onNextChar,
}: {
  charId: string;
  selections: Record<number, "A" | "B">;
  onBack: () => void;
  onNextChar: () => void;
}) {
  const key = `${selections[0] ?? "A"}-${selections[1] ?? "B"}-${selections[2] ?? "A"}`;
  const result = RESULTS[key] ?? RESULTS["A-B-A"];
  const char = CHARACTERS[charId];

  const [historyOpen, setHistoryOpen] = useState(false);

  const handleShare = async () => {
    const text = `K-Heroes: ${char?.name} 시뮬레이션에서 RESULT ${result.resultNum}을 달성했습니다!\n"${result.title}"`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "K-Heroes 시뮬레이션 결과", text });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert("결과가 클립보드에 복사되었습니다!");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "#F4EFE4", fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* ── 헤더 ── */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 h-14 border-b"
        style={{
          background: "rgba(244,239,228,0.94)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(42,66,50,0.09)",
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 hover:opacity-60 transition-opacity"
          style={{ color: "#5A5248", fontSize: "13px", fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">돌아가기</span>
        </button>
        <span
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 600,
            fontSize: "0.88rem",
            color: "#2A4232",
          }}
        >
          최종 결과
        </span>
        <BrandLogo compact />
      </header>

      {/* ── 히어로 (다크) ── */}
      <div
        style={{
          background: result.isReal
            ? "linear-gradient(135deg, #1A2820 0%, #2E4A38 60%, #1E3328 100%)"
            : "linear-gradient(135deg, #1A1814 0%, #2A2420 60%, #1E1A16 100%)",
          position: "relative",
          overflow: "hidden",
          minHeight: "280px",
        }}
      >
        {/* 배경 패턴 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(201,147,58,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(42,66,50,0.15) 0%, transparent 50%)",
          }}
        />

        {/* 인물 PNG */}
        {char && (
          <>
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                top: 0,
                width: "45%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                pointerEvents: "none",
              }}
            >
              <img
                src={char.img}
                alt={char.name}
                style={{
                  height: "100%",
                  width: "auto",
                  maxWidth: "100%",
                  objectFit: "contain",
                  objectPosition: "bottom right",
                  opacity: 0.55,
                  display: "block",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to right, rgba(26,28,20,0.98) 30%, rgba(26,28,20,0.75) 55%, rgba(26,28,20,0.1) 75%, transparent 90%)",
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {/* 콘텐츠 */}
        <div
          className="relative max-w-[820px] mx-auto px-6"
          style={{ paddingTop: "36px", paddingBottom: "36px", maxWidth: "55%" }}
        >
          {/* RESULT 배지 */}
          <div className="flex items-center gap-3 mb-4">
            <div
              style={{
                background: result.isReal
                  ? "linear-gradient(135deg, #C9933A, #E8B84B)"
                  : "rgba(255,255,255,0.1)",
                borderRadius: "6px",
                padding: "4px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                border: result.isReal ? "none" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {result.isReal && <span style={{ fontSize: "12px" }}>★</span>}
              <span
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  color: result.isReal ? "#1A1714" : "rgba(255,255,255,0.7)",
                  letterSpacing: "0.08em",
                }}
              >
                RESULT {result.resultNum}
              </span>
            </div>

            {result.isReal && (
              <div
                style={{
                  background: "rgba(42,150,80,0.2)",
                  border: "1px solid rgba(42,150,80,0.4)",
                  borderRadius: "6px",
                  padding: "3px 10px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "0.62rem",
                    color: "#6ECF90",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  실제 역사 100% 일치
                </span>
              </div>
            )}
          </div>

          {/* 콤보 아이콘 */}
          <div className="flex items-center gap-3 mb-5">
            {result.icons.map((isR, i) => (
              <ComboIcon key={i} isReal={isR} step={i + 1} />
            ))}
          </div>

          {/* 타이틀 */}
          <div>
            {!result.isReal && (
              <p
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "0.68rem",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "4px",
                  letterSpacing: "0.04em",
                }}
              >
                가상 시나리오
              </p>
            )}
            <h1
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 2.8vw, 1.9rem)",
                color: result.isReal ? "#F5E9CC" : "rgba(255,255,255,0.88)",
                lineHeight: 1.35,
              }}
            >
              {result.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="max-w-[820px] mx-auto px-5 py-7 pb-32 flex flex-col gap-5">

        {/* ─ 최종 능력치 ─ */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FDFAF4",
            border: "1px solid rgba(42,66,50,0.09)",
            boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
          }}
        >
          <p
            className="mb-4"
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "#1A1714",
            }}
          >
            최종 능력치
          </p>
          <div className="flex flex-col gap-4">
            <StatBar icon="💰" label="독립 자금" value={result.stats.money} max={100} />
            <StatBar icon="🤝" label="팀워크" value={result.stats.team} max={100} />
            <StatBar icon="🎯" label="성공 확률" value={result.stats.success} isPercent max={120} />
          </div>
        </div>

        {/* ─ 실제 역사와 비교 ─ */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FDFAF4",
            border: "1px solid rgba(201,147,58,0.22)",
            boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
          }}
        >
          <button
            className="w-full flex items-center gap-3 px-5 py-4 text-left"
            onClick={() => setHistoryOpen((v) => !v)}
          >
            <span style={{ fontSize: "16px", flexShrink: 0 }}>💡</span>
            <span
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#2A2420",
                flex: 1,
              }}
            >
              이 엔딩은 실제 역사와 어떤 차이가 있을까요?
            </span>
            {historyOpen ? (
              <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#9A8E7E" }} />
            ) : (
              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#9A8E7E" }} />
            )}
          </button>
          {historyOpen && (
            <div
              className="px-5 pb-5"
              style={{ borderTop: "1px solid rgba(201,147,58,0.14)" }}
            >
              <p
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "0.83rem",
                  color: "#5A5248",
                  lineHeight: 1.9,
                  marginTop: "12px",
                }}
              >
                {result.historicalNote}
              </p>
            </div>
          )}
        </div>

        {/* ─ 내가 만든 이야기 ─ */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FDFAF4",
            border: "1px solid rgba(42,66,50,0.09)",
            boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
          }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(42,66,50,0.07)" }}
          >
            <span style={{ fontSize: "16px" }}>📖</span>
            <span
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#1A1714",
              }}
            >
              내가 만든 이야기
            </span>
          </div>

          <div className="p-5 pt-4">
            {/* 인용 */}
            <div
              className="rounded-xl px-5 py-4 mb-4"
              style={{
                background: result.isReal
                  ? "linear-gradient(135deg, rgba(42,66,50,0.07), rgba(42,66,50,0.04))"
                  : "rgba(42,66,50,0.03)",
                border: result.isReal
                  ? "1px solid rgba(42,66,50,0.15)"
                  : "1px solid rgba(42,66,50,0.07)",
              }}
            >
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "3rem",
                  color: result.isReal ? "rgba(42,66,50,0.2)" : "rgba(42,66,50,0.1)",
                  lineHeight: 0.6,
                  display: "block",
                  marginBottom: "2px",
                }}
              >
                "
              </span>
              <p
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#1A1714",
                  lineHeight: 1.55,
                }}
              >
                {result.storyQuote}
              </p>
            </div>

            {/* 본문 */}
            <p
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.84rem",
                color: "#5A5248",
                lineHeight: 1.9,
              }}
            >
              {result.storyBody}
            </p>
          </div>
        </div>

        {/* ─ 결과 요약 ─ */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#FDFAF4",
            border: "1px solid rgba(42,66,50,0.09)",
            boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(42,66,50,0.07)" }}
          >
            <span style={{ fontSize: "16px" }}>📌</span>
            <span
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#1A1714",
              }}
            >
              결과 요약
            </span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {result.summaryPoints.map((pt, i) => {
              const colonIdx = pt.indexOf(":");
              const bold = colonIdx >= 0 ? pt.slice(0, colonIdx) : "";
              const rest = colonIdx >= 0 ? pt.slice(colonIdx + 1).trim() : pt;
              return (
                <div key={i} className="flex gap-3">
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: result.isReal
                        ? "linear-gradient(135deg, #C9933A, #E8B84B)"
                        : "rgba(42,66,50,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontWeight: 800,
                        fontSize: "0.65rem",
                        color: result.isReal ? "#1A1714" : "#5A5248",
                        lineHeight: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "0.82rem",
                      color: "#4A4035",
                      lineHeight: 1.8,
                    }}
                  >
                    {bold && (
                      <span style={{ fontWeight: 700, color: "#2A2420" }}>{bold}: </span>
                    )}
                    {rest}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─ 추천 방문지 ─ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4" style={{ color: "#2A4232" }} />
            <span
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#1A1714",
              }}
            >
              추천 방문지
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLACES.map((place) => (
              <div
                key={place.name}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#FDFAF4",
                  border: "1px solid rgba(42,66,50,0.09)",
                  boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
                }}
              >
                <div style={{ height: "140px", overflow: "hidden" }}>
                  <img
                    src={place.img}
                    alt={place.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "sepia(0.18) saturate(0.85) brightness(0.92)",
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#C9933A" }} />
                    <p
                      style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "0.65rem",
                        color: "#A89E8E",
                      }}
                    >
                      {place.location}
                    </p>
                  </div>
                  <p
                    className="mb-1.5"
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#1A1714",
                    }}
                  >
                    {place.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "0.74rem",
                      color: "#6A6055",
                      lineHeight: 1.7,
                    }}
                  >
                    {place.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 하단 플로팅 버튼 ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "12px 16px 28px",
          background: "linear-gradient(to top, #F4EFE4 60%, rgba(244,239,228,0))",
        }}
      >
        <div
          style={{ maxWidth: "820px", margin: "0 auto", display: "flex", gap: "10px" }}
        >
          {/* 공유하기 */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all hover:opacity-80"
            style={{
              flex: "0 0 auto",
              padding: "14px 20px",
              background: "rgba(42,66,50,0.08)",
              border: "1.5px solid rgba(42,66,50,0.15)",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#2A4232",
              cursor: "pointer",
              borderRadius: "12px",
              whiteSpace: "nowrap",
            }}
          >
            <Share2 className="w-4 h-4" />
            공유하기
          </button>

          {/* 다음 인물 체험하기 */}
          <button
            onClick={onNextChar}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.99]"
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #1E3328 0%, #3D6B52 100%)",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "white",
              letterSpacing: "0.02em",
              cursor: "pointer",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(30,51,40,0.3)",
            }}
          >
            다음 인물 체험하기
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
