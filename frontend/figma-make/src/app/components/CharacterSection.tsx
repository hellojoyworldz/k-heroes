import { ChevronRight, Flame } from "lucide-react";
import { CHARACTER_LIST, type CharacterData } from "../data/characters";

/* ─── 강점 바 ─── */
function StrengthBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.68rem",
            color: "#7A7060",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.68rem",
            color: "#2A4232",
            fontWeight: 700,
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          height: "5px",
          background: "rgba(42,66,50,0.1)",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: "linear-gradient(to right, #243C2C, #4A7058)",
            borderRadius: "99px",
          }}
        />
      </div>
    </div>
  );
}

/* ─── 인물 카드 ─── */
function CharacterCard({
  char,
  onDetail,
}: {
  char: CharacterData;
  onDetail: (id: string) => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        background: "#FDFAF4",
        border: "1.5px solid rgba(42,66,50,0.1)",
        boxShadow: "0 4px 20px rgba(42,66,50,0.08)",
      }}
      onClick={() => onDetail(char.id)}
    >
      {/* ── 상단: 인물 일러스트 ── */}
      <div
        className="relative overflow-hidden flex items-end justify-center"
        style={{ height: "230px", background: "linear-gradient(160deg, #F5EBD0 0%, #EDE0C0 100%)" }}
      >
        <img
          src={char.img}
          alt={char.name}
          className="h-full w-auto object-contain object-bottom transition-transform duration-500 group-hover:scale-105"
          style={{ maxWidth: "100%" }}
        />
        {/* 하단 자연스러운 페이드 */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: "60px", background: "linear-gradient(to top, #FDFAF4 0%, transparent 100%)" }}
        />
        {/* 카테고리 태그 */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {char.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.6rem",
                background: "rgba(42,40,30,0.55)",
                color: "rgba(255,250,235,0.95)",
                borderRadius: "99px",
                padding: "2px 8px",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,240,200,0.2)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        {/* 연도·시대 */}
        <div className="absolute top-3 right-3">
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.58rem",
              color: "rgba(80,60,30,0.75)",
              letterSpacing: "0.02em",
            }}
          >
            {char.years}
          </span>
        </div>
      </div>

      {/* ── 하단: 콘텐츠 ── */}
      <div className="flex-1 flex flex-col p-4">
        {/* 이름 */}
        <h3
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#1A1714",
            lineHeight: 1.25,
            marginBottom: "4px",
          }}
        >
          {char.name}
        </h3>

        {/* 태그라인 */}
        <p
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.72rem",
            color: "#7A7060",
            lineHeight: 1.55,
            marginBottom: "10px",
          }}
        >
          {char.tagline}
        </p>

        {/* 아바타 + 역할 + 체험하기 */}
        <div
          className="flex items-center gap-2 pb-3"
          style={{ borderBottom: "1px solid rgba(42,66,50,0.08)" }}
        >
          <img
            src={char.img}
            alt={char.name}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "top center",
              background: "#F0E5CC",
              border: "1.5px solid rgba(42,66,50,0.18)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.68rem",
              color: "#5A5248",
              flex: 1,
              minWidth: 0,
            }}
          >
            {char.role.split(" · ")[0]}
          </span>
          <button
            className="flex items-center gap-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.68rem",
              color: "#2A4232",
              fontWeight: 700,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDetail(char.id);
            }}
          >
            체험하기
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* 해시태그 */}
        <div className="flex flex-wrap gap-1 py-3">
          {char.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.6rem",
                background: "rgba(42,66,50,0.07)",
                color: "#4A6040",
                borderRadius: "99px",
                padding: "2px 8px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 강점 바 */}
        <div
          className="flex flex-col gap-2.5 py-3"
          style={{ borderTop: "1px solid rgba(42,66,50,0.07)" }}
        >
          {char.strengths.map((s) => (
            <StrengthBar key={s.name} label={s.name} value={s.value} />
          ))}
        </div>

        {/* CTA 버튼 */}
        <button
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl mt-2 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #1E3328 0%, #3D6B52 100%)",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "white",
            letterSpacing: "0.01em",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDetail(char.id);
          }}
        >
          이야기 시작하기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── 메인 섹션 ─── */
export function CharacterSection({
  onDetail,
}: {
  onDetail: (id: string) => void;
}) {
  return (
    <section style={{ background: "#F4EFE4", padding: "80px 0" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-2 mb-3">
          <span
            style={{
              fontFamily: "'Noto Serif KR', serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
              color: "#1A1714",
            }}
          >
            대표 인물 체험하기
          </span>
          <Flame className="w-6 h-6" style={{ color: "#C9933A" }} fill="#C9933A" />
        </div>
        <p
          className="mb-10"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "0.88rem",
            color: "#8A7E6E",
            lineHeight: 1.6,
          }}
        >
          역사 속 인물이 되어, 그들이 마주했던 결정적 순간을 직접 선택해보세요.
        </p>

        {/* 3열 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CHARACTER_LIST.map((char) => (
            <CharacterCard key={char.id} char={char} onDetail={onDetail} />
          ))}
        </div>
      </div>
    </section>
  );
}
