import { ArrowLeft, ChevronRight } from "lucide-react";
import { CHARACTERS, type CharacterData } from "../data/characters";

/* ─── 별점 ─── */
function Stars({ score, max }: { score: number; max: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: "15px", color: i < score ? "#D4921E" : "#DDD5C5", lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

/* ─── 히어로: 타이틀 + 인물 PNG ─── */
function HeroSection({ char }: { char: CharacterData }) {
  return (
    <div className="relative overflow-hidden" style={{ minHeight: "240px" }}>
      {/* 인물 PNG — 오른쪽 상단, 자연스럽게 */}
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

      {/* 오른쪽 페이드 — 텍스트 가독성 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, #F4EFE4 38%, rgba(244,239,228,0.82) 54%, rgba(244,239,228,0.2) 72%, transparent 88%)",
          pointerEvents: "none",
        }}
      />

      {/* 왼쪽 텍스트 */}
      <div className="relative" style={{ maxWidth: "56%", padding: "36px 0 32px" }}>
        <h1
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 3.2vw, 2.4rem)",
            color: "#1A1714",
            lineHeight: 1.2,
            marginBottom: "8px",
          }}
        >
          {char.name} 시뮬레이션
        </h1>
        <p
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.84rem",
            color: "#6A6055",
            lineHeight: 1.6,
            maxWidth: "300px",
          }}
        >
          {char.tagline}
        </p>
      </div>
    </div>
  );
}

/* ─── 1. 인물 설명 카드 ─── */
function CharInfoCard({ char }: { char: CharacterData }) {
  const infoRows = [
    { label: "이름", value: char.name },
    { label: "시대", value: `${char.era}(${char.years})` },
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
      {/* 인물 정보 테이블 */}
      <div className="px-6 pt-5 pb-1">
        {infoRows.map((row, i) => (
          <div
            key={row.label}
            className="flex gap-4 py-3"
            style={{ borderBottom: i < infoRows.length - 1 ? "1px solid rgba(42,66,50,0.07)" : "none" }}
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
                fontFamily: row.label === "이름" ? "'Noto Serif KR', serif" : "'Noto Sans KR', sans-serif",
                fontWeight: row.label === "이름" ? 700 : 400,
                fontSize: row.label === "이름" ? "0.92rem" : "0.8rem",
                color: row.label === "한줄 요약" ? "#2A4232" : "#2A2420",
                lineHeight: 1.7,
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* 강점 */}
      <div
        className="px-6 py-4 mt-2"
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
              style={{ borderBottom: i < char.strengths.length - 1 ? "1px solid rgba(42,66,50,0.07)" : "none" }}
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
                  fontSize: "0.73rem",
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

/* ─── 2. MBTI 카드 ─── */
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
      {/* MBTI 헤더 */}
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
            MBTI
          </span>
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.72rem",
              color: "#8A7E6E",
              marginLeft: "6px",
            }}
          >
            ({char.mbtiTitle} / {char.mbtiSubtitle})
          </span>
        </div>
      </div>

      {/* 4 유형 */}
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
                fontSize: "2.2rem",
                color: "#2A4232",
                lineHeight: 1,
              }}
            >
              {t.letter}
            </span>
            <span
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.62rem",
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
                fontSize: "0.7rem",
                color: "#6A6055",
                lineHeight: 1.65,
                marginTop: "2px",
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

/* ─── 3. 스토리 인트로 카드 ─── */
function StoryCard({ char, onStart }: { char: CharacterData; onStart: () => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#FDFAF4",
        border: "1px solid rgba(42,66,50,0.09)",
        boxShadow: "0 2px 16px rgba(42,66,50,0.06)",
      }}
    >
      <div className="relative p-6 pb-8">
        {/* 인물 PNG — 우측 하단, 박스 없이 자연스럽게 */}
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            height: "92%",
            width: "38%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            pointerEvents: "none",
          }}
        >
          <img
            src={char.img}
            alt=""
            style={{
              height: "100%",
              width: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              objectPosition: "bottom right",
              opacity: 0.45,
              display: "block",
            }}
          />
        </div>

        {/* 오른쪽 페이드 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, #FDFAF4 48%, rgba(253,250,244,0.7) 65%, transparent 82%)",
            pointerEvents: "none",
          }}
        />

        {/* 콘텐츠 */}
        <div className="relative" style={{ maxWidth: "68%" }}>
          {/* 인용구 */}
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "4.5rem",
              color: "rgba(42,66,50,0.1)",
              lineHeight: 0.7,
              display: "block",
              marginBottom: "-4px",
            }}
          >
            "
          </span>
          <p
            className="mb-5"
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "#1A1714",
              lineHeight: 1.55,
            }}
          >
            {char.quote}
          </p>

          {/* 스토리 텍스트 */}
          {char.storyIntro.split("\n").map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.82rem",
                color: "#5A5248",
                lineHeight: 1.85,
                marginBottom: i < char.storyIntro.split("\n").length - 1 ? "12px" : 0,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* CTA 버튼 */}
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 py-4 transition-all hover:opacity-90 active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg, #1E3328 0%, #3D6B52 100%)",
          fontFamily: "'Noto Sans KR', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: "white",
          letterSpacing: "0.02em",
        }}
      >
        시뮬레이션 시작하기
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ─── 섹션 레이블 ─── */
function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        style={{
          fontFamily: "'Noto Serif KR', serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          color: "#1A1714",
        }}
      >
        {num}. {label}
      </span>
    </div>
  );
}

/* ─── 메인 페이지 ─── */
export function CharacterDetailPage({
  charId,
  onBack,
  onStart,
}: {
  charId: string;
  onBack: () => void;
  onStart?: () => void;
}) {
  const char = CHARACTERS[charId];
  if (!char) return null;

  const handleStart = () => onStart?.();

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "#F4EFE4", fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* ── 헤더 ── */}
      <header
        className="sticky top-0 z-10 px-6 py-3 border-b"
        style={{
          background: "rgba(244,239,228,0.94)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(42,66,50,0.09)",
        }}
      >
        <div className="max-w-[820px] mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 hover:opacity-60 transition-opacity"
            style={{ color: "#5A5248", fontSize: "13px", fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            <ArrowLeft className="w-4 h-4" />
            인물 목록으로
          </button>
        </div>
      </header>

      {/* ── 본문 ── */}
      <div className="max-w-[820px] mx-auto px-6 pb-16">
        {/* 히어로 */}
        <HeroSection char={char} />

        {/* 구분선 */}
        <div style={{ height: "1px", background: "rgba(42,66,50,0.1)", margin: "0 0 32px" }} />

        {/* 섹션들 */}
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

          {/* 3. 스토리 인트로 */}
          <div>
            <SectionLabel num="3" label="스토리 인트로" />
            <StoryCard char={char} onStart={handleStart} />
          </div>
        </div>
      </div>
    </div>
  );
}
