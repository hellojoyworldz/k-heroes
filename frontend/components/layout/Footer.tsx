import Link from "next/link";
import { getCopyrightNotice, site } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";

type FooterLink = {
  label: string;
  href: string;
};

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  서비스: [
    { label: "서비스 소개", href: "#" },
    { label: "지역 선택", href: "/map" },
    { label: "역사 아카이브", href: "#" },
    { label: "이용 가이드", href: "#" },
  ],
  지원: [
    { label: "교육기관 문의", href: "#" },
    { label: "공지사항", href: "#" },
    { label: "자주 묻는 질문", href: "#" },
    { label: "이용약관", href: "/legal/terms" },
    { label: "개인정보처리방침", href: "/legal/privacy" },
  ],
  연계기관: [
    { label: "국립중앙박물관", href: "#" },
    { label: "국사편찬위원회", href: "#" },
    { label: "문화재청", href: "#" },
    { label: "한국학중앙연구원", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer id="footer" style={{ background: "#1A2520" }}>
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="md:col-span-1">
            <BrandLogo dark className="mb-5" />
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
                  <li key={link.label}>
                    <Link
                      className="transition-colors hover:text-white"
                      href={link.href}
                      style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.38)",
                      }}
                    >
                      {link.label}
                    </Link>
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
            {getCopyrightNotice()}
          </p>
          <p
            style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {site.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
