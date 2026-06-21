import { useState, useEffect } from "react";
import { Play, Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const NAV_LINKS = [
  { label: "서비스 소개", target: "service" },
  { label: "대표 인물", target: "characters" },
  { label: "활용 데이터", target: "data" },
  { label: "공지사항", target: "footer" },
];

export function NavBar({ onStart }: { onStart?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToSection = (target: string) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "rgba(253,250,244,0.94)"
          : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(42,66,50,0.1)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <BrandLogo showBeta />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="transition-colors text-sm"
              style={{ color: "#4A4438", fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStart}
            className="hidden md:flex items-center gap-2 text-white text-sm px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{
              background: "#2A4232",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontWeight: 500,
              border: "1px solid rgba(61,107,82,0.5)",
            }}
          >
            <Play className="w-3 h-3 fill-current" />
            이야기 시작하기
          </button>
          <button
            className="md:hidden p-1"
            style={{ color: "#2A4232" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 pb-4"
          style={{ background: "rgba(253,250,244,0.97)", borderTop: "1px solid rgba(42,66,50,0.08)" }}
        >
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="block py-3 text-sm border-b"
              style={{
                width: "100%",
                textAlign: "left",
                color: "#4A4438",
                borderColor: "rgba(42,66,50,0.08)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={onStart}
            className="mt-4 w-full flex items-center justify-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg"
            style={{ background: "#2A4232" }}
          >
            <Play className="w-3 h-3 fill-current" />
            이야기 시작하기
          </button>
        </div>
      )}
    </nav>
  );
}
