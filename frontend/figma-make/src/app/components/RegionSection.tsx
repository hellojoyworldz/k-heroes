import { ChevronRight, User } from "lucide-react";

interface BarProps {
  label: string;
  value: number;
  color: string;
}

function StatBar({ label, value, color }: BarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.72rem",
            color: "#7A7060",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "#4A4035",
          }}
        >
          {value}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(42,66,50,0.1)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

const REGIONS = [
  {
    id: "jeonju",
    name: "전주",
    theme: "독립 · 예술",
    themeColor: "#5C7A4A",
    period: "1919년 · 전북",
    image:
      "https://images.unsplash.com/photo-1523760957528-55d1d540360d?w=800&q=85&fit=crop",
    character: "유관순",
    role: "독립운동가",
    mbti: "INFJ",
    description:
      "이 땅의 어디서도 꺼지지 않는 독립운동의 불꽃이 당신의 선택을 기다리고 있습니다. 당신은 어떤 선택을 할 것인가?",
    tags: ["#3.1운동", "#독립운동", "#전통예술", "#전통문화"],
    bars: [
      { label: "문화 보존도", value: 78, color: "#3D6B52" },
      { label: "희망도", value: 82, color: "#5C8A6A" },
      { label: "위험도", value: 45, color: "#C17F3A" },
    ],
  },
  {
    id: "andong",
    name: "안동",
    theme: "선비 · 유교",
    themeColor: "#4A5C2A",
    period: "1592년 · 경북",
    image:
      "https://images.unsplash.com/photo-1601900245655-7719650f5b7a?w=800&q=85&fit=crop",
    character: "류성룡",
    role: "선비 · 학자",
    mbti: "INTJ",
    description:
      "전란 속에서 지켜야 할 것과 버려야 할 것이 무엇인지, 사대부인가, 사람인가, 선비의 선택이 역사를 바꾼다.",
    tags: ["#선비문화", "#임진왜란", "#유교문화", "#서원"],
    bars: [
      { label: "문화 보존도", value: 92, color: "#3D6B52" },
      { label: "희망도", value: 65, color: "#5C8A6A" },
      { label: "위험도", value: 60, color: "#C17F3A" },
    ],
  },
  {
    id: "jinju",
    name: "진주",
    theme: "호국 · 의병",
    themeColor: "#6B3A2A",
    period: "1592년 · 경남",
    image:
      "https://images.unsplash.com/photo-1723868255843-a26bf49febf8?w=800&q=85&fit=crop",
    character: "김시민",
    role: "호국 · 의병장",
    mbti: "ENTJ",
    description:
      "3,800명으로 30,000 왜군을 막아낸 진주성의 기억 속으로. 당신이라면 이 전투에서 어떤 결단을 내리겠는가?",
    tags: ["#진주대첩", "#호국정신", "#의병운동", "#남강"],
    bars: [
      { label: "문화 보존도", value: 65, color: "#3D6B52" },
      { label: "희망도", value: 70, color: "#5C8A6A" },
      { label: "위험도", value: 88, color: "#C17F3A" },
    ],
  },
];

export function RegionSection({ onStart }: { onStart?: () => void }) {
  return (
    <section style={{ background: "#FDFAF5", padding: "96px 0" }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs mb-4"
              style={{
                background: "rgba(42,66,50,0.08)",
                color: "#2A4232",
                border: "1px solid rgba(42,66,50,0.18)",
                fontFamily: "'Noto Sans KR', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              지금 체험 가능한 지역
            </span>
            <h2
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 600,
                color: "#1A1714",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                lineHeight: 1.35,
              }}
            >
              어느 지역의 이야기를
              <br />
              선택하시겠습니까?
            </h2>
          </div>
          <button
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80 self-start md:self-end mb-1"
            style={{
              color: "#2A4232",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 500,
            }}
          >
            전체 지역 보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Region Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REGIONS.map((region) => (
            <div
              key={region.id}
              className="rounded-2xl overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl"
              style={{
                background: "#FDFAF2",
                border: "1px solid rgba(42,66,50,0.1)",
                boxShadow: "0 4px 20px rgba(42,66,50,0.08)",
              }}
            >
              {/* Image area */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={region.image}
                  alt={region.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,16,12,0.85) 0%, rgba(10,16,12,0.2) 60%, transparent 100%)",
                  }}
                />
                {/* Region info on image */}
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "rgba(61,107,82,0.7)",
                        color: "#D4F0DE",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {region.theme}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {region.period}
                    </span>
                  </div>
                  <h3
                    className="text-white"
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontWeight: 700,
                      fontSize: "1.4rem",
                    }}
                  >
                    {region.name}
                  </h3>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col gap-4">
                {/* Character info */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(42,66,50,0.1)" }}
                  >
                    <User className="w-4 h-4" style={{ color: "#2A4232" }} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          fontFamily: "'Noto Serif KR', serif",
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "#1A1714",
                        }}
                      >
                        {region.character}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(201,147,58,0.12)",
                          color: "#A0692A",
                          border: "1px solid rgba(201,147,58,0.25)",
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                      >
                        {region.mbti}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "0.72rem",
                        color: "#8A7E6E",
                      }}
                    >
                      {region.role}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {region.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(42,66,50,0.07)",
                        color: "#4A6040",
                        fontFamily: "'Noto Sans KR', sans-serif",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "0.8rem",
                    color: "#6B6355",
                    lineHeight: 1.7,
                  }}
                >
                  {region.description}
                </p>

                {/* Progress bars */}
                <div className="flex flex-col gap-2.5">
                  {region.bars.map((bar) => (
                    <StatBar key={bar.label} {...bar} />
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={onStart}
                  className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 hover:shadow-md mt-1"
                  style={{
                    background: "linear-gradient(135deg, #2A4232 0%, #3D6B52 100%)",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  이야기 시작하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
