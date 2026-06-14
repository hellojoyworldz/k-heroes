import { ArrowLeft, ChevronRight, Clock, BarChart2 } from "lucide-react";
import { CHARACTERS, type CharacterData } from "../data/characters";
import { getScenariosForChar, type ScenarioMeta } from "../data/scenarios";
import { BrandLogo } from "./BrandLogo";

/* ─── 공통 헤더 ─── */
function PageHeader({
  onBack,
  backLabel,
  centerContent,
}: {
  onBack: () => void;
  backLabel?: string;
  centerContent?: React.ReactNode;
}) {
  return (
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
        <span className="hidden sm:inline">{backLabel ?? "돌아가기"}</span>
      </button>

      <div className="flex items-center">
        {centerContent}
      </div>

      <BrandLogo compact />
    </header>
  );
}

/* ─── 별점 ─── */
function Stars({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: "14px", color: i < score ? "#D4921E" : "#DDD5C5", lineHeight: 1 }}>
          ★
        </span>
      ))}
    </div>
  );
}

/* ─── 히어로 ─── */
function HeroSection({ char }: { char: CharacterData }) {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: "220px" }}>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "52%",
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
            display: "block",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, #F4EFE4 38%, rgba(244,239,228,0.82) 54%, rgba(244,239,228,0.2) 72%, transparent 88%)",
          pointerEvents: "none",
        }}
      />
      <div className="relative" style={{ maxWidth: "56%", padding: "32px 0 28px" }}>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {char.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.6rem",
                background: "rgba(42,66,50,0.1)",
                color: "#2A4232",
                borderRadius: "99px",
                padding: "2px 8px",
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        <h1
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
            color: "#1A1714",
            lineHeight: 1.2,
            marginBottom: "6px",
          }}
        >
          {char.name}
        </h1>
        <p
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.78rem",
            color: "#7A7060",
            marginBottom: "10px",
          }}
        >
          {char.role}
        </p>
        <p
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.82rem",
            color: "#6A6055",
            lineHeight: 1.65,
            maxWidth: "280px",
          }}
        >
          {char.tagline}
        </p>
      </div>
    </div>
  );
}

/* ─── 인물 정보 카드 ─── */
function CharInfoCard({ char }: { char: CharacterData }) {
  const infoRows = [
    { label: "시대", value: `${char.era} (${char.years})` },
    { label: "상황", value: char.situation },
    { label: "한줄 요약", value: char.summary },
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#FDFAF4",
        border: "1px solid rgba(42,66,50,0.09)",
        boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
      }}
    >
      <div className="px-6 pt-5 pb-1">
        {infoRows.map((row, i) => (
          <div
            key={row.label}
            className="flex gap-4 py-3"
            style={{
              borderBottom: i < infoRows.length - 1 ? "1px solid rgba(42,66,50,0.07)" : "none",
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.72rem",
                color: "#A89E8E",
                flexShrink: 0,
                width: "64px",
                paddingTop: "1px",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.8rem",
                color: row.label === "한줄 요약" ? "#2A4232" : "#2A2420",
                lineHeight: 1.7,
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div
        className="px-6 py-4 mt-1"
        style={{ borderTop: "1px solid rgba(42,66,50,0.08)", background: "rgba(42,66,50,0.015)" }}
      >
        <p
          className="mb-3"
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            fontSize: "0.84rem",
            color: "#1A1714",
          }}
        >
          강점
        </p>
        <div className="flex flex-col">
          {char.strengths.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-3 py-2.5 flex-wrap"
              style={{
                borderBottom:
                  i < char.strengths.length - 1 ? "1px solid rgba(42,66,50,0.07)" : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  color: "#2A2420",
                  width: "82px",
                  flexShrink: 0,
                }}
              >
                {s.name}
              </span>
              <Stars score={s.score} max={s.max} />
              <span
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "#C9933A",
                  flexShrink: 0,
                }}
              >
                {s.score}/{s.max}
              </span>
              <span
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "0.72rem",
                  color: "#7A7060",
                  flex: 1,
                  minWidth: "100px",
                }}
              >
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MBTI 카드 ─── */
function MbtiCard({ char }: { char: CharacterData }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#FDFAF4",
        border: "1px solid rgba(42,66,50,0.09)",
        boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
      }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: "1px solid rgba(42,66,50,0.08)" }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full"
          style={{ width: "32px", height: "32px", background: "rgba(42,66,50,0.1)" }}
        >
          <span style={{ fontSize: "16px" }}>👤</span>
        </div>
        <div>
          <span
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "#1A1714",
            }}
          >
            MBTI · {char.mbti}
          </span>
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.72rem",
              color: "#8A7E6E",
              marginLeft: "8px",
            }}
          >
            {char.mbtiTitle} / {char.mbtiSubtitle}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {char.mbtiTypes.map((t, i) => (
          <div
            key={t.letter}
            className="px-5 py-5 flex flex-col gap-2"
            style={{
              borderRight: i < char.mbtiTypes.length - 1 ? "1px solid rgba(42,66,50,0.08)" : "none",
              borderBottom: i < 2 ? "1px solid rgba(42,66,50,0.08)" : "none",
              background: i % 2 === 0 ? "rgba(42,66,50,0.015)" : "transparent",
            }}
          >
            <span
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 800,
                fontSize: "2rem",
                color: "#2A4232",
                lineHeight: 1,
              }}
            >
              {t.letter}
            </span>
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.6rem",
                color: "#5C5248",
                background: "rgba(42,66,50,0.08)",
                borderRadius: "4px",
                padding: "1px 7px",
                display: "inline-block",
                width: "fit-content",
                fontWeight: 600,
              }}
            >
              {t.label}
            </span>
            <p
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.68rem",
                color: "#6A6055",
                lineHeight: 1.65,
              }}
            >
              {t.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 시나리오 카드 ─── */
function ScenarioCard({
  scenario,
  index,
  onStart,
}: {
  scenario: ScenarioMeta;
  index: number;
  onStart: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        background: "#FDFAF4",
        border: "1px solid rgba(42,66,50,0.09)",
        boxShadow: "0 2px 12px rgba(42,66,50,0.06)",
      }}
    >
      <div className="flex items-stretch">
        {/* 번호 컬럼 */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-start pt-5 px-4"
          style={{
            borderRight: "1px solid rgba(42,66,50,0.08)",
            background: "rgba(42,66,50,0.018)",
            minWidth: "52px",
          }}
        >
          <span
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "rgba(42,66,50,0.18)",
              lineHeight: 1,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "1.4rem",
              marginTop: "10px",
              lineHeight: 1,
            }}
          >
            {scenario.themeIcon}
          </span>
        </div>

        {/* 본문 */}
        <div className="flex-1 px-5 py-4">
          {/* 상단 배지 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.6rem",
                color: "#8A7E6E",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Clock style={{ width: "10px", height: "10px" }} />
              {scenario.period}
            </span>
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.6rem",
                color: "#8A7E6E",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <BarChart2 style={{ width: "10px", height: "10px" }} />
              {scenario.stepCount}단계
            </span>
          </div>

          {/* 제목 */}
          <h3
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#1A1714",
              lineHeight: 1.3,
              marginBottom: "2px",
            }}
          >
            {scenario.title}
          </h3>
          <p
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.72rem",
              color: "#7A7060",
              marginBottom: "8px",
            }}
          >
            {scenario.subtitle}
          </p>
          <p
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.78rem",
              color: "#5A5248",
              lineHeight: 1.7,
              marginBottom: "14px",
            }}
          >
            {scenario.desc}
          </p>

          {/* CTA */}
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #1E3328 0%, #3D6B52 100%)",
              color: "white",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 700,
              fontSize: "0.82rem",
              boxShadow: "0 2px 10px rgba(30,51,40,0.24)",
            }}
          >
            시뮬레이션 시작하기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 섹션 레이블 ─── */
function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: "22px",
          height: "22px",
          background: "#2A4232",
        }}
      >
        <span
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            fontSize: "0.7rem",
            color: "white",
            lineHeight: 1,
          }}
        >
          {num}
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Noto Serif KR', serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          color: "#1A1714",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── 구분선 ─── */
function Divider() {
  return (
    <div
      style={{
        height: "1px",
        background: "rgba(42,66,50,0.1)",
        margin: "0 0 28px",
      }}
    />
  );
}

/* ─── 메인 페이지 ─── */
export function CharacterDetailPage({
  charId,
  onBack,
  onStartScenario,
}: {
  charId: string;
  onBack: () => void;
  onStartScenario?: (scenarioIdx: number) => void;
}) {
  const char = CHARACTERS[charId];
  if (!char) return null;

  const scenarios = getScenariosForChar(charId);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "#F4EFE4", fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <PageHeader
        onBack={onBack}
        backLabel="인물 목록으로"
        centerContent={
          <span
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 600,
              fontSize: "0.88rem",
              color: "#2A4232",
            }}
          >
            {char.name}
          </span>
        }
      />

      <div className="max-w-[820px] mx-auto px-6 pb-16">
        {/* 히어로 */}
        <HeroSection char={char} />
        <Divider />

        <div className="flex flex-col gap-8">
          {/* 1. 인물 설명 */}
          <div>
            <SectionLabel num="1" label="인물 설명" />
            <CharInfoCard char={char} />
          </div>

          {/* 2. MBTI */}
          <div>
            <SectionLabel num="2" label="MBTI" />
            <MbtiCard char={char} />
          </div>

          {/* 3. 시나리오 목록 */}
          <div>
            <SectionLabel num="3" label="체험 시나리오" />
            {/* 안내 */}
            <p
              className="mb-4"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.8rem",
                color: "#8A7E6E",
                lineHeight: 1.7,
              }}
            >
              {char.name}의 생애 중 결정적인 순간 {scenarios.length}가지를 선택해
              직접 체험해보세요. 당신의 선택이 역사를 바꿀 수 있습니다.
            </p>

            {/* 인용구 */}
            <div
              className="mb-5 px-5 py-4 rounded-2xl"
              style={{
                background: "rgba(42,66,50,0.04)",
                border: "1px solid rgba(42,66,50,0.1)",
              }}
            >
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "2.8rem",
                  color: "rgba(42,66,50,0.15)",
                  lineHeight: 0.7,
                  display: "block",
                  marginBottom: "-2px",
                }}
              >
                "
              </span>
              <p
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#1A1714",
                  lineHeight: 1.6,
                }}
              >
                {char.quote}
              </p>
            </div>

            {/* 시나리오 카드 목록 */}
            <div className="flex flex-col gap-3">
              {scenarios.map((scenario, idx) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  index={idx}
                  onStart={() => onStartScenario?.(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
