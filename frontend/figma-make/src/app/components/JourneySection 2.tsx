import { BookOpen, Users, GitBranch, BarChart2, Landmark, MapPin } from "lucide-react";

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
  return (
    <section style={{ background: "#F4EFE4", padding: "96px 0" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Top badge */}
        <div className="flex justify-center mb-5">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs tracking-widest"
            style={{
              background: "rgba(42,66,50,0.1)",
              color: "#2A4232",
              border: "1px solid rgba(42,66,50,0.2)",
              fontFamily: "'Noto Sans KR', sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            경험의 구조
          </span>
        </div>

        {/* Heading */}
        <div className="text-center mb-4">
          <h2
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 600,
              color: "#1A1714",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              lineHeight: 1.3,
            }}
          >
            6단계 역사 체험 여정
          </h2>
        </div>
        <p
          className="text-center max-w-xl mx-auto mb-14"
          style={{
            color: "#6B6355",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.9rem",
            lineHeight: 1.7,
          }}
        >
          단순한 지식 전달을 넘어, 직접 역사적 결정에 참여하고 그 결과를 현재와 연결하는 몰입형 교육 경험
        </p>

        {/* Steps grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="rounded-xl p-5 flex flex-col gap-3 group cursor-pointer transition-all hover:-translate-y-1"
                style={{
                  background: "#FDFAF4",
                  border: "1px solid rgba(42,66,50,0.1)",
                  boxShadow: "0 2px 12px rgba(42,66,50,0.06)",
                }}
              >
                {/* Number */}
                <span
                  style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontWeight: 300,
                    fontSize: "0.7rem",
                    color: "#B5AA9A",
                    letterSpacing: "0.05em",
                  }}
                >
                  {step.num}
                </span>

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(42,66,50,0.08)" }}
                >
                  <Icon
                    className="w-4.5 h-4.5"
                    style={{ color: "#2A4232" }}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Title */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontWeight: 600,
                      color: "#2A4232",
                      fontSize: "0.95rem",
                      marginBottom: "2px",
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "0.72rem",
                      color: "#8A7E6E",
                    }}
                  >
                    {step.subtitle}
                  </p>
                </div>

                {/* Desc */}
                <p
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "0.75rem",
                    color: "#7A7060",
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
