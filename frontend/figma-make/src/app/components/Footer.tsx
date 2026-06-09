const FOOTER_LINKS = {
  서비스: ["서비스 소개", "지역 선택", "역사 아카이브", "이용 가이드"],
  지원: ["교육기관 문의", "공지사항", "자주 묻는 질문", "개인정보처리방침"],
  연계기관: ["국립중앙박물관", "국사편찬위원회", "문화재청", "한국학중앙연구원"],
};

export function Footer() {
  return (
    <footer style={{ background: "#1A2520" }}>
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(253,250,244,0.95)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                <img src="/logo.svg" alt="K-Heroes 로고" className="h-6 w-auto" />
              </div>
              <span
                style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 600, fontSize: "15px", color: "#2A4232" }}
              >
                K-Heroes
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.7,
              }}
            >
              과거의 선택이
              <br />
              현재 지역 문화를 만듭니다.
              <br />
              역사 인터랙티브 시뮬레이션 서비스
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p
                className="mb-4"
                style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: "0.05em",
                }}
              >
                {group}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="transition-colors hover:text-white"
                      style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.38)",
                      }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            © 2024 K-Heroes. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            문화 빅데이터 기반 역사 인터랙티브 시뮬레이션
          </p>
        </div>
      </div>
    </footer>
  );
}
