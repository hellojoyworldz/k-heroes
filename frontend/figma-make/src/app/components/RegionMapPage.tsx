import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import mapBg from "../../imports/image-15.png";
import { CHARACTERS } from "../data/characters";

const FEATURED_CHARS = ["yunbongil", "sejong", "yi_sunsin"] as const;

/* ──────────────────────────────────────────
   지역 & 인물 데이터
────────────────────────────────────────── */
interface Character {
  id: string;
  name: string;
  role: string;
  era: string;
  desc: string;
  img: string;
}

interface Province {
  id: string;
  name: string;
  tag: string;
  path: string;        // polygon points
  labelX: number;
  labelY: number;
  pinX: number;
  pinY: number;
  available: boolean;
  characters: Character[];
}

const PROVINCES: Province[] = [
  {
    id: "seoul-gyeonggi",
    name: "서울·경기",
    tag: "왕권 · 조선",
    labelX: 108, labelY: 102,
    pinX: 120,   pinY:  84,
    available: true,
    path: "78,60 143,45 162,95 158,126 128,136 80,128 78,95",
    characters: [
      {
        id: "sejong",
        name: "세종대왕",
        role: "조선 4대 왕",
        era: "1397–1450",
        desc: "한글을 창제하고 과학·예술·외교를 집대성한 성군. 백성을 위한 선택이 역사를 바꿉니다.",
        img: "https://images.unsplash.com/photo-1746911062158-7e15deb1d2f1?w=300&q=85&fit=crop&crop=top",
      },
      {
        id: "yi-sunsin",
        name: "이순신 장군",
        role: "삼도수군통제사",
        era: "1545–1598",
        desc: "13척의 배로 나라의 위기를 지켜낸 위대한 장군. 당신이라면 어떤 전술을 선택하겠습니까?",
        img: "https://images.unsplash.com/photo-1755359494724-7d9f74874275?w=300&q=85&fit=crop&crop=top",
      },
      {
        id: "sinsaimdang",
        name: "신사임당",
        role: "예술가 · 학자",
        era: "1504–1551",
        desc: "조선 최고의 여성 예술가이자 학자. 제도의 벽 앞에서 그녀는 어떤 선택을 했을까요?",
        img: "https://images.unsplash.com/photo-1751612428402-d66ea21380a8?w=300&q=85&fit=crop&crop=top",
      },
    ],
  },
  {
    id: "gangwon",
    name: "강원도",
    tag: "자연 · 개척",
    labelX: 228, labelY: 112,
    pinX: 238,   pinY:  98,
    available: false,
    path: "143,45 268,42 308,115 260,170 188,152 162,126 162,95",
    characters: [],
  },
  {
    id: "chungcheong",
    name: "충청도",
    tag: "실학 · 의병",
    labelX: 132, labelY: 168,
    pinX: 145,   pinY: 158,
    available: false,
    path: "80,128 128,136 158,126 162,126 188,152 188,176 162,192 138,200 105,196 80,176",
    characters: [],
  },
  {
    id: "jeolla",
    name: "전라도",
    tag: "독립 · 예술",
    labelX: 96,  labelY: 248,
    pinX: 110,   pinY: 230,
    available: true,
    path: "80,176 105,196 138,200 145,235 140,265 125,292 95,300 70,280 64,246 72,216",
    characters: [
      {
        id: "jeon-bong-jun",
        name: "전봉준",
        role: "동학농민군 지도자",
        era: "1854–1895",
        desc: "녹두장군 전봉준. 농민의 손으로 역사를 바꾸려 했던 그의 선택은 무엇을 남겼을까요?",
        img: "https://images.unsplash.com/photo-1774979301181-bbbfbcebda8b?w=300&q=85&fit=crop&crop=top",
      },
      {
        id: "yu-gwan-sun",
        name: "유관순",
        role: "독립운동가",
        era: "1902–1920",
        desc: "3.1 운동의 상징. 17세 청년이 선택한 길 위에 현재의 전주가 있습니다.",
        img: "https://images.unsplash.com/photo-1665562227617-93b89b3be218?w=300&q=85&fit=crop&crop=top",
      },
      {
        id: "choe-chi-won",
        name: "최치원",
        role: "문장가 · 유학자",
        era: "857–?",
        desc: "신라 말 천재 문장가. 당나라와 신라 사이에서 정체성의 갈림길에 선 지식인의 이야기.",
        img: "https://images.unsplash.com/photo-1750926013438-57fc3124bfa6?w=300&q=85&fit=crop&crop=top",
      },
    ],
  },
  {
    id: "gyeongsang",
    name: "경상도",
    tag: "선비 · 호국",
    labelX: 232, labelY: 232,
    pinX: 248,   pinY: 200,
    available: true,
    path: "308,115 310,206 305,252 285,276 250,300 215,312 175,316 140,312 125,292 140,265 145,235 138,200 162,192 188,176 188,152 260,170",
    characters: [
      {
        id: "ryu-seong-ryong",
        name: "류성룡",
        role: "영의정 · 문신",
        era: "1542–1607",
        desc: "징비록을 남긴 조선의 전략가. 임진왜란의 혼란 속 결단이 조선을 구했습니다.",
        img: "https://images.unsplash.com/photo-1766169776630-7f2a3708b283?w=300&q=85&fit=crop&crop=top",
      },
      {
        id: "yi-hwang",
        name: "이황",
        role: "성리학자 · 교육자",
        era: "1501–1570",
        desc: "퇴계 이황. 조선 성리학의 정수. 학문과 현실 사이에서 선비는 무엇을 선택했을까요?",
        img: "https://images.unsplash.com/photo-1766169776624-24399cc458ed?w=300&q=85&fit=crop&crop=top",
      },
      {
        id: "kim-si-min",
        name: "김시민",
        role: "진주목사 · 장군",
        era: "1554–1592",
        desc: "3,800명으로 30,000 왜군을 막아낸 진주대첩의 영웅. 성벽 위의 선택이 역사가 됩니다.",
        img: "https://images.unsplash.com/photo-1581365004391-d2104ff7e4fa?w=300&q=85&fit=crop&crop=top",
      },
    ],
  },
];

const REGION_OPTIONS = [
  { value: "전국", label: "전국" },
  { value: "서울·경기", label: "서울·경기" },
  { value: "전라도", label: "전라도" },
  { value: "경상도", label: "경상도" },
];

/* ──────────────────────────────────────────
   남한 SVG 지도
────────────────────────────────────────── */
function KoreaMap({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const getFill = (p: Province) => {
    if (selected === p.id) return "rgba(60,100,72,0.72)";
    if (hovered === p.id && p.available) return "rgba(80,120,90,0.55)";
    if (!p.available) return "rgba(180,165,138,0.32)";
    return "rgba(200,178,138,0.45)";
  };

  const getStroke = (p: Province) => {
    if (selected === p.id) return "#2A4232";
    return "rgba(110,90,60,0.55)";
  };

  return (
    <svg
      viewBox="0 0 350 430"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* 지도 외곽 그림자 */}
      <filter id="mapShadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
      </filter>

      {/* 각 행정구역 */}
      <g filter="url(#mapShadow)">
        {PROVINCES.map((p) => (
          <polygon
            key={p.id}
            points={p.path}
            fill={getFill(p)}
            stroke={getStroke(p)}
            strokeWidth={selected === p.id ? "1.5" : "1"}
            strokeLinejoin="round"
            style={{
              cursor: p.available ? "pointer" : "default",
              transition: "fill 0.18s ease",
            }}
            onClick={() => p.available && onSelect(p.id)}
            onMouseEnter={() => p.available && setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {/* 제주도 */}
        <ellipse
          cx="135" cy="394" rx="46" ry="21"
          fill="#D8D0C4" stroke="#A89E8C" strokeWidth="1"
        />
      </g>

      {/* 행정구역 라벨 + 핀 */}
      {PROVINCES.map((p) => (
        <g key={`label-${p.id}`}>
          {/* 핀 마커 */}
          {p.available && (
            <>
              <circle
                cx={p.pinX} cy={p.pinY} r={selected === p.id ? 7 : 5.5}
                fill={selected === p.id ? "#2A4232" : "rgba(248,242,228,0.9)"}
                stroke={selected === p.id ? "rgba(248,242,228,0.9)" : "#5A3E2B"}
                strokeWidth="1.5"
                style={{ cursor: "pointer", transition: "all 0.18s" }}
                onClick={() => onSelect(p.id)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
              />
              {selected === p.id && (
                <text
                  x={p.pinX} y={p.pinY + 4.5}
                  textAnchor="middle"
                  fontSize="7"
                  fill="white"
                  style={{ pointerEvents: "none", fontWeight: "bold" }}
                >✓</text>
              )}
            </>
          )}
          {/* 지역명 라벨 */}
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            fontSize={selected === p.id ? "10" : "9"}
            fontWeight={selected === p.id ? "700" : "500"}
            fill={
              !p.available
                ? "#A89E8C"
                : selected === p.id
                ? "white"
                : "#3A3028"
            }
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              pointerEvents: "none",
              transition: "all 0.18s",
            }}
          >
            {p.name}
          </text>
          {!p.available && (
            <text
              x={p.labelX} y={p.labelY + 11}
              textAnchor="middle" fontSize="7"
              fill="#B8AE9C"
              style={{ fontFamily: "'Noto Sans KR', sans-serif", pointerEvents: "none" }}
            >
              준비 중
            </text>
          )}
        </g>
      ))}

      {/* 제주도 라벨 */}
      <text x="135" y="397" textAnchor="middle" fontSize="8" fill="#A89E8C"
        style={{ fontFamily: "'Noto Sans KR', sans-serif", pointerEvents: "none" }}>
        제주도
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────
   인물 카드
────────────────────────────────────────── */
function CharacterCard({
  charId,
  onDetail,
}: {
  charId: string;
  onDetail: (id: string) => void;
}) {
  const char = CHARACTERS[charId];
  if (!char) return null;

  return (
    <div
      className="flex overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: "rgba(252,248,238,0.9)",
        border: "1.5px solid rgba(110,80,40,0.14)",
        boxShadow: "0 2px 14px rgba(90,60,20,0.1)",
        minHeight: "148px",
      }}
    >
      {/* 왼쪽: 초상화 — PNG 꽉 채움 */}
      <div
        className="flex-shrink-0 relative overflow-hidden"
        style={{
          width: "120px",
          background: "linear-gradient(170deg, #EDE0C4 0%, #D9C99A 100%)",
          alignSelf: "stretch",
        }}
      >
        <img
          src={char.img}
          alt={char.name}
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height: "100%",
            width: "auto",
            maxWidth: "none",
            objectFit: "contain",
            objectPosition: "bottom center",
            display: "block",
          }}
        />
        {/* 오른쪽 페이드 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, transparent 50%, rgba(252,248,238,0.72) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* 오른쪽: 정보 */}
      <div className="flex-1 px-4 py-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex gap-1.5 mb-2 flex-wrap">
            <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "0.6rem", background: "rgba(42,66,50,0.08)", color: "#4A6040", borderRadius: "99px", padding: "1px 7px" }}>{char.era}</span>
            <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "0.6rem", background: "rgba(201,147,58,0.1)", color: "#A06C1A", borderRadius: "99px", padding: "1px 7px", fontWeight: 600 }}>{char.mbti}</span>
          </div>
          <h3 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: "1rem", color: "#1A1714", marginBottom: "2px", lineHeight: 1.3 }}>
            {char.name}
          </h3>
          <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "0.7rem", color: "#7A7060", marginBottom: "6px" }}>
            {char.role.split(" · ")[0]}
          </p>
          <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "0.75rem", color: "#5A5248", lineHeight: 1.6 }}>
            {char.tagline}
          </p>
        </div>

        <button
          className="mt-3 flex items-center gap-1 transition-opacity hover:opacity-70 self-start"
          style={{ color: "#2A4232", fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, fontSize: "0.82rem" }}
          onClick={() => onDetail(charId)}
        >
          체험하기
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   메인 컴포넌트
────────────────────────────────────────── */
export function RegionMapPage({ onBack, onDetail }: { onBack: () => void; onDetail: (id: string) => void }) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState("전국");
  const [mobileTab, setMobileTab] = useState<"map" | "chars">("map");

  const province = PROVINCES.find((p) => p.id === selectedProvince) ?? null;

  const handleProvinceSelect = (id: string) => {
    setSelectedProvince(id);
    const p = PROVINCES.find((x) => x.id === id);
    if (p) setRegionFilter(p.name);
    setMobileTab("chars");
  };

  const handleDropdownChange = (val: string) => {
    setRegionFilter(val);
    if (val === "전국") {
      setSelectedProvince(null);
    } else {
      const p = PROVINCES.find((x) => x.name === val);
      if (p && p.available) {
        setSelectedProvince(p.id);
        setMobileTab("chars");
      }
    }
  };

  const panelBase = {
    background: "rgba(236,224,198,0.38)",
    backdropFilter: "blur(6px)",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @media (min-width: 768px) {
          .kh-map-panel {
            width: 56% !important;
            border-right: 1px solid rgba(110,80,40,0.15) !important;
            border-bottom: none !important;
          }
        }
      `}</style>

      {/* ── 배경 고지도 ── */}
      <div className="absolute inset-0">
        <img src={mapBg.src} alt="한국 고지도" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(232,218,190,0.08)" }} />
      </div>

      {/* ── 헤더 ── */}
      <header
        className="relative flex-shrink-0 flex items-center justify-between px-5 h-14 border-b"
        style={{ background: "rgba(240,230,208,0.60)", borderColor: "rgba(110,80,40,0.18)", backdropFilter: "blur(8px)" }}
      >
        <button onClick={onBack} className="flex items-center gap-2 transition-opacity hover:opacity-60" style={{ color: "#4A4035", fontSize: "13px" }}>
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">돌아가기</span>
        </button>
        <div className="flex items-center gap-2" style={{ fontSize: "13px" }}>
          <span style={{ color: province ? "#2A4232" : "#9A8E7E", fontWeight: province ? 600 : 400 }}>
            {province ? province.name : "지역 선택"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(253,250,244,0.72)",
              border: "1px solid rgba(42,66,50,0.18)",
            }}
          >
            <img src="/logo.svg" alt="K-Heroes 로고" className="h-5 w-auto" />
          </div>
          <span className="hidden sm:block" style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 600, fontSize: "14px", color: "#2A4232" }}>K-Heroes</span>
        </div>
      </header>

      {/* ── 모바일 탭 바 ── */}
      <div
        className="relative md:hidden flex-shrink-0 flex border-b"
        style={{ background: "rgba(240,230,208,0.72)", backdropFilter: "blur(8px)", borderColor: "rgba(110,80,40,0.15)" }}
      >
        {(["map", "chars"] as const).map((tab) => {
          const active = mobileTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className="flex-1 py-3 text-sm transition-all"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: active ? 700 : 400,
                color: active ? "#2A4232" : "#7A7060",
                borderBottom: active ? "2px solid #3D6B52" : "2px solid transparent",
              }}
            >
              {tab === "map" ? "🗺 지도 선택" : `👤 인물 선택${province ? ` · ${province.name}` : ""}`}
            </button>
          );
        })}
      </div>

      {/* ── 본문 ── */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ══ 지도 패널 ══ */}
        <div
          className={`kh-map-panel ${mobileTab === "map" ? "flex" : "hidden"} md:flex flex-col overflow-y-auto md:overflow-hidden px-5 py-5 md:px-10 md:py-8`}
          style={{
            ...panelBase,
            width: "100%",
            borderBottom: "1px solid rgba(110,80,40,0.12)",
          }}
        >
          <div className="flex flex-col flex-1 h-full">
            {/* 제목 */}
            <div className="mb-5">
              <p style={{ fontSize: "11px", color: "#9A8E7E", letterSpacing: "0.1em", marginBottom: "8px" }}>STEP 1 · 지역 선택</p>
              <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: "clamp(1.4rem, 2.6vw, 2rem)", color: "#1A1714", lineHeight: 1.3, marginBottom: "8px" }}>
                어느 지역의 이야기를<br />체험하시겠어요?
              </h2>
              <p style={{ fontSize: "13px", color: "#8A7E6E", lineHeight: 1.7 }}>지도에서 지역을 선택하면 해당 지역의 인물 목록이 나타납니다.</p>
            </div>

            {/* 지도 SVG */}
            <div className="flex-1 flex items-center justify-center overflow-hidden py-2" style={{ minHeight: "260px" }}>
              <div style={{ width: "100%", maxWidth: "380px", maxHeight: "460px" }}>
                <KoreaMap selected={selectedProvince} onSelect={handleProvinceSelect} />
              </div>
            </div>

            {/* 드롭다운 + 다음 단계 */}
            <div className="mt-4 flex flex-col gap-2.5">
              <div className="flex gap-2.5 items-end">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label style={{ fontSize: "11px", color: "#9A8E7E", letterSpacing: "0.04em" }}>지역 선택</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => handleDropdownChange(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none appearance-none cursor-pointer"
                    style={{ background: "rgba(248,242,228,0.92)", border: "1.5px solid rgba(110,80,40,0.22)", color: "#2A2420", fontFamily: "'Noto Sans KR', sans-serif" }}
                  >
                    {REGION_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => setMobileTab("chars")}
                  className="hidden md:flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium flex-shrink-0 transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg,#2A4232 0%,#3D6B52 100%)",
                    color: "white",
                    fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 700, whiteSpace: "nowrap",
                    boxShadow: "0 3px 12px rgba(42,66,50,0.28)",
                  }}
                >
                  인물 선택 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "#9A8E7E", lineHeight: 1.6 }}>💡 TIP: 스테이지를 완료할 때마다 현재 지역의 문화재 변화가 반영됩니다.</p>
            </div>
          </div>
        </div>

        {/* ══ 인물 카드 패널 ══ */}
        <div
          className={`${mobileTab === "chars" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden px-5 py-5 md:px-8 md:py-7`}
          style={{ background: "rgba(248,242,230,0.36)", backdropFilter: "blur(6px)" }}
        >
          {/* 패널 타이틀 */}
          <div className="mb-4">
            <p style={{ fontSize: "11px", color: "#9A8E7E", letterSpacing: "0.08em", marginBottom: "4px" }}>대표 인물</p>
            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 600, fontSize: "clamp(1rem,2vw,1.35rem)", color: "#1A1714", lineHeight: 1.35 }}>
              체험할 인물을 선택하세요
            </h2>
            <p style={{ fontSize: "12px", color: "#8A7E6E", lineHeight: 1.6, marginTop: "4px" }}>
              인물을 선택하고 결정적 순간을 직접 체험해보세요.
            </p>
          </div>

          {/* 인물 카드 목록 (항상 3인물 고정) */}
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            {FEATURED_CHARS.map((id) => (
              <CharacterCard key={id} charId={id} onDetail={onDetail} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
