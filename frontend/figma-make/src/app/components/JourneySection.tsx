"use client";

import { BookOpen, Users, GitBranch, BarChart2, Landmark, MapPin } from "lucide-react";
import { useRevealOnView } from "../hooks/useRevealOnView";

const STEPS = [
  {
    num: "01",
    title: "발단",
    subtitle: "지역·시대·인물",
    icon: BookOpen,
    desc: "실제 문화 빅데이터 기반의 역사적 배경과 인물 소개",
  },
  {
    num: "02",
    title: "전개",
    subtitle: "갈등 상황 제시",
    icon: Users,
    desc: "당시의 사회적 갈등과 인물이 직면한 상황을 체험",
  },
  {
    num: "03",
    title: "선택",
    subtitle: "사회적 행동 결정",
    icon: GitBranch,
    desc: "위험도·희망도·문화보존도를 고려한 선택지 제공",
  },
  {
    num: "04",
    title: "결과",
    subtitle: "사회적 영향 표시",
    icon: BarChart2,
    desc: "선택에 따른 사회적·문화적 파급 효과를 시각화",
  },
  {
    num: "05",
    title: "역사 비교",
    subtitle: "실제 기록 연결",
    icon: Landmark,
    desc: "실제 역사 사례와 기록을 통한 비교 분석 제공",
  },
  {
    num: "06",
    title: "지역 연결",
    subtitle: "현재 문화 연결",
    icon: MapPin,
    desc: "현재 남아있는 문화재·장소·지역 이야기와의 연결",
  },
];

export function JourneySection() {
  const { ref, isVisible } = useRevealOnView<HTMLElement>();

  return (
    <section
      ref={ref}
      id="service"
      data-visible={isVisible}
      className="kh-journey-section relative overflow-hidden"
      style={{
        padding: "108px 0",
        background:
          "linear-gradient(rgba(244,239,228,0.72), rgba(244,239,228,0.72)), url('/story-background.png') center/cover fixed",
      }}
    >
      <style>{`
        @keyframes khJourneyRise {
          from { opacity: 0; transform: translateY(18px); filter: blur(3px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .kh-journey-section [data-reveal],
        .kh-journey-card {
          opacity: 0;
        }
        .kh-journey-section[data-visible="true"] [data-reveal],
        .kh-journey-section[data-visible="true"] .kh-journey-card {
          animation: khJourneyRise 0.72s cubic-bezier(0.22, 0.8, 0.28, 1) both;
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.4fr] gap-12 items-start">
          <div data-reveal className="lg:sticky lg:top-24">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-widest mb-5"
              style={{
                background: "rgba(42,66,50,0.09)",
                color: "#2A4232",
                border: "1px solid rgba(42,66,50,0.2)",
                fontFamily: "'Noto Sans KR', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              경험의 구조
            </span>
            <h2
              className="mb-5"
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 700,
                color: "#1A1714",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.28,
              }}
            >
              6단계 역사
              <br />
              체험 여정
            </h2>
            <p
              className="max-w-md"
              style={{
                color: "#6B6355",
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.95rem",
                lineHeight: 1.9,
              }}
            >
              단순한 지식 전달을 넘어, 직접 역사적 결정에 참여하고 그 결과를
              현재와 연결하는 몰입형 교육 경험입니다.
            </p>
            <div
              className="mt-8 rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(to right, rgba(253,250,244,0.72), rgba(253,250,244,0.22))",
                border: "1px solid rgba(42,66,50,0.11)",
                backdropFilter: "blur(8px)",
              }}
            >
              <p
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 700,
                  color: "#2A4232",
                  fontSize: "0.95rem",
                  marginBottom: "6px",
                }}
              >
                사용자는 인물이 되어 선택하고,
                <br />
                서비스는 기록과 지역을 다시 연결합니다.
              </p>
              <p
                style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  color: "#7A7060",
                  fontSize: "0.78rem",
                  lineHeight: 1.7,
                }}
              >
                발단에서 지역 연결까지, 하나의 이야기가 교육용 시뮬레이션으로
                이어지는 흐름을 설계했습니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.num}
                  className="kh-journey-card group relative min-h-[230px] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 70}ms`,
                    background:
                      "linear-gradient(145deg, rgba(253,250,244,0.86), rgba(253,250,244,0.34))",
                    border: "1px solid rgba(42,66,50,0.12)",
                    boxShadow: "0 14px 36px rgba(42,66,50,0.08)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span
                    aria-hidden
                    className="absolute right-4 top-3 select-none"
                    style={{
                      color: "rgba(42,66,50,0.075)",
                      fontFamily: "'Noto Serif KR', serif",
                      fontSize: "4.15rem",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {Number(step.num)}
                  </span>
                  <div
                    className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "rgba(42,66,50,0.1)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#2A4232" }} strokeWidth={1.7} />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontWeight: 800,
                      color: "#1A1714",
                      fontSize: "1.18rem",
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    className="mt-1 mb-4"
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      color: "#2A4232",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                    }}
                  >
                    {step.subtitle}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "0.8rem",
                      color: "#6B6355",
                      lineHeight: 1.75,
                    }}
                  >
                    {step.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
