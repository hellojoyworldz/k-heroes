import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Check } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

/* ────────────────────────────
   타입
──────────────────────────── */
interface Indicator {
  icon: string;
  label: string;
  value: number;
  isPercent?: boolean;
}

interface ChoiceData {
  id: "A" | "B";
  tag: "실제 역사" | "가상 분기";
  title: string;
  desc: string;
  img: string;
  indicators: Indicator[];
}

interface StepData {
  step: number;
  title: string;
  year: string;
  situation: string;
  img: string;
  toggleQ: string;
  toggleA: string;
  choices: [ChoiceData, ChoiceData];
}

/* ────────────────────────────
   윤봉길 시나리오 데이터
──────────────────────────── */
const STEPS: StepData[] = [
  {
    step: 1,
    title: "상하이 망명",
    year: "1931년",
    situation: "고향을 떠나 상하이에 온 당신.\n독립운동의 리더 김구 선생을 만났습니다.\n어떤 길을 가겠습니까?",
    img: "https://images.unsplash.com/photo-1765290350401-90088bd9ef6c?w=800&q=80&fit=crop",
    toggleQ: "왜 고향을 떠나 상하이에 왔을까요?",
    toggleA: "윤봉길 의사는 원래 농민들을 가르치며 살았습니다.\n하지만 교육만으로는 나라를 되찾을 수 없다고 생각했습니다.\n그래서 직접 행동하기 위해 상하이 임시정부를 찾아왔습니다.",
    choices: [
      {
        id: "A",
        tag: "실제 역사",
        title: "목숨을 걸고\n비밀 대원이 된다",
        desc: "한인애국단에 합류해 김구 선생의 지휘 아래 독립운동에 헌신한다",
        img: "https://images.unsplash.com/photo-1710194948588-890d867407df?w=600&q=80&fit=crop",
        indicators: [
          { icon: "💰", label: "독립 자금", value: -10 },
          { icon: "🤝", label: "팀워크", value: 20 },
          { icon: "🎯", label: "성공 확률", value: 15, isPercent: true },
        ],
      },
      {
        id: "B",
        tag: "가상 분기",
        title: "상하이에서 공장을 차려\n돈을 버는 데 집중한다",
        desc: "독립운동 자금을 마련하겠다는 명목으로 사업에 집중한다",
        img: "https://images.unsplash.com/photo-1579618215542-2ed5e10b65ed?w=600&q=80&fit=crop",
        indicators: [
          { icon: "💰", label: "독립 자금", value: 30 },
          { icon: "🤝", label: "팀워크", value: -10 },
          { icon: "🎯", label: "성공 확률", value: -15, isPercent: true },
        ],
      },
    ],
  },
  {
    step: 2,
    title: "무기 선택",
    year: "1932년 4월",
    situation: "일본군의 큰 파티장을 공격해야 합니다.\n하지만 입구에서는 도시락과 물통만 통과시키고 있습니다.",
    img: "https://images.unsplash.com/photo-1559695572-912854d44626?w=800&q=80&fit=crop",
    toggleQ: "왜 하필 도시락과 물통일까요?",
    toggleA: "일본군은 야외 행사였기 때문에\n도시락과 물통을 허용했습니다.\n윤봉길 의사와 김구 선생은\n이 허점을 이용했습니다.",
    choices: [
      {
        id: "A",
        tag: "가상 분기",
        title: "권총과 대형 폭탄을\n옷 속에 숨긴다",
        desc: "더 강력한 무기를 선택하지만 경비 검문에서 발각될 위험이 크다",
        img: "https://images.unsplash.com/photo-1650693200206-4e9083332307?w=600&q=80&fit=crop",
        indicators: [
          { icon: "💰", label: "독립 자금", value: -5 },
          { icon: "🤝", label: "팀워크", value: 5 },
          { icon: "🎯", label: "성공 확률", value: -25, isPercent: true },
        ],
      },
      {
        id: "B",
        tag: "실제 역사",
        title: "물통 폭탄과\n도시락 폭탄을 챙긴다",
        desc: "도시락과 물통 모양으로 위장한 폭탄을 선택해 경비를 통과한다",
        img: "https://images.unsplash.com/photo-1607437817193-3b3b029b5b75?w=600&q=80&fit=crop",
        indicators: [
          { icon: "💰", label: "독립 자금", value: -10 },
          { icon: "🤝", label: "팀워크", value: 10 },
          { icon: "🎯", label: "성공 확률", value: 30, isPercent: true },
        ],
      },
    ],
  },
  {
    step: 3,
    title: "거사의 순간",
    year: "1932년 4월 29일",
    situation: "변장을 하고 행사장에 들어왔습니다.\n언제 폭탄을 던질까요?",
    img: "https://images.unsplash.com/photo-1633124360553-af420d18cd79?w=800&q=80&fit=crop",
    toggleQ: "왜 일본 국가가 울릴 때였을까요?",
    toggleA: "일본 국가가 울리자\n모든 장군과 경비병이 무대를 향해 경례했습니다.\n그 순간이 가장 완벽한 기회였습니다.",
    choices: [
      {
        id: "A",
        tag: "실제 역사",
        title: "모두가 경례하는 순간\n폭탄을 던진다",
        desc: "모든 시선이 무대를 향한 완벽한 순간을 포착해 결행한다",
        img: "https://images.unsplash.com/photo-1562463921-26a24fda45c2?w=600&q=80&fit=crop",
        indicators: [
          { icon: "💰", label: "독립 자금", value: 0 },
          { icon: "🤝", label: "팀워크", value: 30 },
          { icon: "🎯", label: "성공 확률", value: 20, isPercent: true },
        ],
      },
      {
        id: "B",
        tag: "가상 분기",
        title: "행사가 끝난 뒤\n장군들이 이동할 때 던진다",
        desc: "행사가 끝난 후 경비가 느슨해질 때를 노린다",
        img: "https://images.unsplash.com/photo-1770325323993-27ae9433aa2a?w=600&q=80&fit=crop",
        indicators: [
          { icon: "💰", label: "독립 자금", value: 0 },
          { icon: "🤝", label: "팀워크", value: 10 },
          { icon: "🎯", label: "성공 확률", value: -10, isPercent: true },
        ],
      },
    ],
  },
];

/* ────────────────────────────
   진행도 표시
──────────────────────────── */
function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        style={{
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: "0.65rem",
          color: "#7A7060",
          letterSpacing: "0.06em",
        }}
      >
        STEP {current} / {total}
      </span>
      <div className="flex items-center">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i + 1 === current;
          const isDone = i + 1 < current;
          return (
            <div key={i} className="flex items-center">
              <div
                style={{
                  width: isActive ? "10px" : "8px",
                  height: isActive ? "10px" : "8px",
                  borderRadius: "50%",
                  background: isActive ? "#2A4232" : isDone ? "#6B9E7A" : "transparent",
                  border: isActive || isDone ? "none" : "1.5px solid #C0B8A8",
                  transition: "all 0.3s",
                  flexShrink: 0,
                }}
              />
              {i < total - 1 && (
                <div
                  style={{
                    width: "32px",
                    height: "1.5px",
                    background: isDone ? "#6B9E7A" : "#D8D0C4",
                    transition: "background 0.3s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────
   시나리오 카드
──────────────────────────── */
function ScenarioCard({ data }: { data: StepData }) {
  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        background: "#FDFAF4",
        border: "1px solid rgba(42,66,50,0.09)",
        boxShadow: "0 4px 24px rgba(42,66,50,0.09)",
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .kh-scenario-row { height: 196px !important; }
          .kh-scenario-text { overflow: hidden; }
        }
      `}</style>
      <div className="kh-scenario-row flex flex-col md:flex-row">
        {/* 모바일: 이미지 상단 */}
        <div className="md:hidden relative overflow-hidden" style={{ height: "160px" }}>
          <img
            src={data.img}
            alt={data.title}
            className="w-full h-full object-cover"
            style={{ filter: "sepia(0.22) saturate(0.82) brightness(0.9)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, transparent 45%, #FDFAF4 100%)",
            }}
          />
        </div>

        {/* 텍스트 */}
        <div className="kh-scenario-text flex-1 px-6 py-5 md:py-6 md:pl-7 md:pr-5">
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.62rem",
              color: "#2A4232",
              background: "rgba(42,66,50,0.1)",
              borderRadius: "4px",
              padding: "2px 8px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              display: "inline-block",
              marginBottom: "10px",
            }}
          >
            STEP {data.step}
          </span>
          <div className="mb-3">
            <h2
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                fontSize: "clamp(1.3rem, 2.5vw, 1.9rem)",
                color: "#1A1714",
                lineHeight: 1.2,
                display: "inline",
              }}
            >
              {data.title}
            </h2>
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.8rem",
                color: "#9A8E7E",
                marginLeft: "8px",
              }}
            >
              ({data.year})
            </span>
          </div>
          <div>
            {data.situation.split("\n").map((line, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "0.86rem",
                  color: "#4A4035",
                  lineHeight: 1.8,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* 데스크탑: 이미지 우측 */}
        <div
          className="hidden md:block flex-shrink-0 relative overflow-hidden"
          style={{ width: "42%", height: "100%" }}
        >
          <img
            src={data.img}
            alt={data.title}
            className="w-full h-full object-cover"
            style={{ filter: "sepia(0.22) saturate(0.82) brightness(0.9)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #FDFAF4 0%, rgba(253,250,244,0.4) 30%, transparent 60%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────
   역사 설명 토글
──────────────────────────── */
function HistoryToggle({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl mb-5 overflow-hidden"
      style={{
        background: "rgba(253,250,244,0.88)",
        border: "1px solid rgba(201,147,58,0.22)",
        boxShadow: "0 2px 10px rgba(180,140,60,0.07)",
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
        onClick={onToggle}
      >
        <span style={{ fontSize: "15px", flexShrink: 0 }}>💡</span>
        <span
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 600,
            fontSize: "0.88rem",
            color: "#2A2420",
            flex: 1,
          }}
        >
          {question}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#9A8E7E" }} />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#9A8E7E" }} />
        )}
      </button>
      {open && (
        <div
          className="px-5 pb-4"
          style={{ borderTop: "1px solid rgba(201,147,58,0.14)" }}
        >
          {answer.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.82rem",
                color: "#5A5248",
                lineHeight: 1.85,
                marginTop: "8px",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────
   지표 아이템
──────────────────────────── */
function IndicatorRow({ indicator }: { indicator: Indicator }) {
  const { icon, label, value, isPercent } = indicator;
  const color =
    value > 0 ? "#1F6B3A" : value < 0 ? "#8B2525" : "#8A7E6E";
  const display = `${value > 0 ? "+" : ""}${value}${isPercent ? "%" : ""}`;

  return (
    <div
      className="flex items-center gap-2 py-1.5"
      style={{ borderBottom: "1px solid rgba(42,66,50,0.055)" }}
    >
      <span style={{ fontSize: "13px", flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: "0.7rem",
          color: "#7A7060",
          flex: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Noto Serif KR', serif",
          fontWeight: 700,
          fontSize: "0.78rem",
          color,
          flexShrink: 0,
        }}
      >
        {display}
      </span>
    </div>
  );
}

/* ────────────────────────────
   선택 카드
──────────────────────────── */
function ChoiceCard({
  choice,
  selected,
  onSelect,
}: {
  choice: ChoiceData;
  selected: boolean;
  onSelect: () => void;
}) {
  const isA = choice.id === "A";

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: selected ? "rgba(218,238,226,0.72)" : "#FDFAF4",
        border: selected
          ? "2px solid rgba(42,100,60,0.72)"
          : "1.5px solid rgba(42,66,50,0.1)",
        boxShadow: selected
          ? "0 6px 24px rgba(42,100,60,0.14)"
          : "0 2px 12px rgba(42,66,50,0.07)",
        transform: selected ? "translateY(-2px)" : "none",
      }}
      onClick={onSelect}
    >
      {/* 이미지 + 배지 */}
      <div className="relative overflow-hidden" style={{ height: "155px" }}>
        <img
          src={choice.img}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "sepia(0.28) saturate(0.78) brightness(0.88)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "rgba(160,120,60,0.08)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 35%, rgba(253,250,244,0.88) 100%)",
          }}
        />

        {/* 배지 */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: "30px",
              height: "30px",
              background: selected
                ? "#2A4232"
                : isA
                ? "rgba(42,66,50,0.82)"
                : "rgba(160,108,26,0.82)",
              backdropFilter: "blur(6px)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            {selected ? (
              <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
            ) : (
              <span
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "white",
                  lineHeight: 1,
                }}
              >
                {choice.id}
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.6rem",
              color: "white",
              background: isA
                ? "rgba(42,66,50,0.78)"
                : "rgba(140,90,20,0.78)",
              borderRadius: "4px",
              padding: "2px 7px",
              fontWeight: 700,
              backdropFilter: "blur(4px)",
            }}
          >
            {choice.tag}
          </span>
        </div>
      </div>

      {/* 텍스트 */}
      <div className="p-4 pt-3.5">
        <h3
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "#1A1714",
            lineHeight: 1.45,
            marginBottom: "6px",
            whiteSpace: "pre-line",
          }}
        >
          {choice.title}
        </h3>
        <p
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.75rem",
            color: "#6A6055",
            lineHeight: 1.65,
            marginBottom: "12px",
          }}
        >
          {choice.desc}
        </p>

        {/* 지표 */}
        <div>
          {choice.indicators.map((ind) => (
            <IndicatorRow key={ind.label} indicator={ind} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────
   메인 컴포넌트
──────────────────────────── */
export function SimulationPage({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (selections: Record<number, "A" | "B">) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<number, "A" | "B">>({});
  const [toggleOpen, setToggleOpen] = useState(false);

  const step = STEPS[currentStep];
  const selected = selections[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (!selected) return;
    if (isLast) {
      onComplete(selections);
    } else {
      setCurrentStep((p) => p + 1);
      setToggleOpen(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onBack();
    } else {
      setCurrentStep((p) => p - 1);
      setToggleOpen(false);
    }
  };

  const handleSelect = (id: "A" | "B") => {
    setSelections((prev) => ({ ...prev, [currentStep]: id }));
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
          onClick={handleBack}
          className="flex items-center gap-1.5 hover:opacity-60 transition-opacity"
          style={{ color: "#5A5248", fontSize: "13px", fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">돌아가기</span>
        </button>

        <ProgressIndicator current={currentStep + 1} total={STEPS.length} />

        <BrandLogo compact />
      </header>

      {/* ── 본문 ── */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 pt-5 pb-28">
        {/* 시나리오 카드 */}
        <ScenarioCard data={step} />

        {/* 역사 토글 */}
        <HistoryToggle
          question={step.toggleQ}
          answer={step.toggleA}
          open={toggleOpen}
          onToggle={() => setToggleOpen((v) => !v)}
        />

        {/* 선택 영역 */}
        <div>
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "#1A1714",
              marginBottom: "14px",
            }}
          >
            당신의 선택
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {step.choices.map((choice) => (
              <ChoiceCard
                key={choice.id}
                choice={choice}
                selected={selected === choice.id}
                onSelect={() => handleSelect(choice.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 하단 고정 버튼 ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "16px 16px 24px",
          background:
            "linear-gradient(to top, #F4EFE4 60%, rgba(244,239,228,0))",
          pointerEvents: selected ? "auto" : "none",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <button
            onClick={handleNext}
            disabled={!selected}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-all"
            style={{
              background: selected
                ? "linear-gradient(135deg, #1E3328 0%, #3D6B52 100%)"
                : "rgba(42,66,50,0.12)",
              color: selected ? "white" : "#A89E8C",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.02em",
              cursor: selected ? "pointer" : "not-allowed",
              boxShadow: selected
                ? "0 4px 20px rgba(30,51,40,0.3)"
                : "none",
              pointerEvents: "auto",
            }}
          >
            {isLast ? "시뮬레이션 완료하기" : "선택하고 다음 단계로"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
