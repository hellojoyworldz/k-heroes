import { Play, ChevronRight } from "lucide-react";
import heroImg from "../../imports/image-16.png";

const STATS = [
  { value: "47개", label: "역사 시나리오" },
  { value: "16개", label: "참여 지역" },
  { value: "120+", label: "실제 역사 기록" },
];

export function HeroSection({ onStart }: { onStart?: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col">
      {/* ── 배경: 한국 전통 수채화 ── */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={heroImg.src}
          alt="한국 전통 수묵화 배경"
          className="w-full h-full object-cover object-center"
        />
        {/* 상단 텍스트 가독성용 부드러운 크림 그라데이션 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(240,232,214,0.42) 0%, rgba(240,232,214,0.06) 45%, rgba(240,232,214,0.38) 82%, rgba(240,232,214,0.82) 100%)",
          }}
        />
        {/* 중앙 텍스트 영역 밝힘 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(248,242,228,0.48) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* ── 콘텐츠 ── */}
      <div className="relative flex-1 flex flex-col justify-center items-center text-center px-6 pt-24 pb-0">
        {/* 배지 */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: "rgba(42,66,50,0.07)",
            border: "1px solid rgba(42,66,50,0.22)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#3D6B52" }}
          />
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.72rem",
              color: "#2A4232",
              letterSpacing: "0.06em",
            }}
          >
            문화 빅데이터 기반 역사 인터랙티브 시뮬레이션
          </span>
        </div>

        {/* 메인 헤드라인 */}
        <h1
          className="mb-6"
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 600,
            lineHeight: 1.28,
            letterSpacing: "-0.01em",
          }}
        >
          <span
            className="block"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", color: "#1A1714" }}
          >
            과거의 선택이
          </span>
          <span
            className="block"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", color: "#B07A22" }}
          >
            현재 우리 지역을
          </span>
          <span
            className="block"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.2rem)", color: "#1A1714" }}
          >
            만듭니다
          </span>
        </h1>

        {/* 부제 */}
        <p
          className="max-w-xl mb-10 leading-relaxed"
          style={{
            color: "#5A5248",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.93rem",
          }}
        >
          실제 역사 인물의 결정적 순간 속에서 당신의 선택을 체험하세요.
          당신의 선택이 어떻게 현재 지역 문화로 이어지는지 발견해 봅니다.
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={onStart}
            className="flex items-center gap-2.5 px-7 py-3 rounded-xl text-white transition-all hover:opacity-90 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #2A4232 0%, #3D6B52 100%)",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 500,
              fontSize: "0.95rem",
              boxShadow: "0 4px 20px rgba(42,66,50,0.35)",
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            지금 시작하기
          </button>
          <button
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl transition-all"
            style={{
              color: "#2A4232",
              border: "1px solid rgba(42,66,50,0.28)",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.95rem",
              background: "rgba(253,250,244,0.5)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(253,250,244,0.82)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(253,250,244,0.5)")
            }
          >
            서비스 소개 보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 하단 통계 바 ── */}
      <div className="relative mt-16 px-6">
        <div
          className="max-w-2xl mx-auto flex items-center justify-center gap-0 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(253,250,244,0.82)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(42,66,50,0.12)",
            boxShadow: "0 4px 24px rgba(42,66,50,0.1)",
            marginBottom: "40px",
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.value}
              className="flex-1 flex flex-col items-center py-5 px-4"
              style={{
                borderRight:
                  i < STATS.length - 1 ? "1px solid rgba(42,66,50,0.1)" : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 700,
                  fontSize: "1.55rem",
                  lineHeight: 1.1,
                  color: "#1A1714",
                }}
              >
                {stat.value}
              </span>
              <span
                className="mt-1"
                style={{
                  color: "#8A7E6E",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "0.75rem",
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
