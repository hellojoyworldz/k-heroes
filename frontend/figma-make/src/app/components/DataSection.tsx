import { Check, ExternalLink } from "lucide-react";

const STATS = [
  { value: "2,847건", label: "연계 역사 기록", sub: "국가기록원·문화재청 연계" },
  { value: "16,200+", label: "문화유산 데이터", sub: "전국 문화재 보유 현황" },
  { value: "47개", label: "역사 시나리오", sub: "고증 검토 완료" },
  { value: "16개", label: "연계 지역", sub: "전국 주요 읍성 도시" },
];

const FEATURES = [
  "국가 문화재 데이터 실시간 연계",
  "실제 역사 인물 고증 자문",
  "지역 문화재 현황 반영",
  "역사학자 검증 시나리오",
];

const SOURCES = ["국립중앙박물관", "국사편찬위원회", "문화재청", "한국학중앙연구원"];

export function DataSection() {
  return (
    <section style={{ background: "#F4EFE4", padding: "96px 0" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs mb-6"
              style={{
                background: "rgba(42,66,50,0.1)",
                color: "#2A4232",
                border: "1px solid rgba(42,66,50,0.2)",
                fontFamily: "'Noto Sans KR', sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              문화 빅데이터 기반
            </span>

            <h2
              className="mb-6"
              style={{
                fontFamily: "'Noto Serif KR', serif",
                fontWeight: 600,
                color: "#1A1714",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                lineHeight: 1.35,
              }}
            >
              실제 역사 기록을
              <br />
              바탕으로 만들어진
              <br />
              시뮬레이션
            </h2>

            <p
              className="mb-8 leading-relaxed"
              style={{
                color: "#6B6355",
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.9rem",
                lineHeight: 1.8,
              }}
            >
              국립중앙박물관, 국사편찬위원회, 한국학중앙연구원의 공식 사기 기록과 문화재청 데이터를 기반으로 설계되었습니다. 단순한 이야기가 아닌, 검증된 역사적 사실을 체험하는 교육형 플랫폼입니다.
            </p>

            {/* Feature list */}
            <ul className="flex flex-col gap-3 mb-10">
              {FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(42,66,50,0.12)" }}
                  >
                    <Check className="w-3 h-3" style={{ color: "#2A4232" }} strokeWidth={2.5} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "0.88rem",
                      color: "#4A4035",
                    }}
                  >
                    {feat}
                  </span>
                </li>
              ))}
            </ul>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                className="px-6 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #2A4232 0%, #3D6B52 100%)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontWeight: 500,
                }}
              >
                서비스 소개 보기
              </button>
              <button
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm transition-all hover:bg-black/5"
                style={{
                  color: "#2A4232",
                  border: "1px solid rgba(42,66,50,0.25)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontWeight: 500,
                }}
              >
                교육기관 문의
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Data sources */}
            <div className="mt-8">
              <p
                className="mb-3 text-xs"
                style={{
                  color: "#9A8E7E",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  letterSpacing: "0.05em",
                }}
              >
                데이터 연계 기관
              </p>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((src) => (
                  <span
                    key={src}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{
                      background: "#EDE8DF",
                      color: "#5C5045",
                      border: "1px solid rgba(42,66,50,0.12)",
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="rounded-2xl p-6 flex flex-col gap-2"
                style={{
                  background: i % 2 === 0 ? "#2A4232" : "#FDFAF2",
                  border: i % 2 !== 0 ? "1px solid rgba(42,66,50,0.1)" : "none",
                  boxShadow: "0 4px 20px rgba(42,66,50,0.1)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontWeight: 700,
                    fontSize: "1.8rem",
                    color: i % 2 === 0 ? "#FFFFFF" : "#1A1714",
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontWeight: 500,
                    fontSize: "0.88rem",
                    color: i % 2 === 0 ? "rgba(255,255,255,0.85)" : "#2A4232",
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "0.72rem",
                    color: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "#8A7E6E",
                    lineHeight: 1.5,
                  }}
                >
                  {stat.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
