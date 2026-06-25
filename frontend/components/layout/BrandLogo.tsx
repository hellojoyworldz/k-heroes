import { site } from "@/lib/site";

type BrandLogoProps = {
  compact?: boolean;
  dark?: boolean;
  showBeta?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, dark = false, showBeta = false, className = "" }: BrandLogoProps) {
  return (
    <a
      href="/"
      aria-label={`${site.name} 홈으로 이동`}
      className={`flex items-center gap-2.5 transition-opacity hover:opacity-70 ${className}`}
    >
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-md"
        style={{
          background: dark ? "rgba(253,250,244,0.94)" : "rgba(253,250,244,0.72)",
          border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(42,66,50,0.14)",
        }}
      >
        <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
      </span>
      <span
        className={compact ? "hidden sm:block" : "block"}
        style={{
          fontFamily: "'Noto Serif KR', serif",
          fontWeight: 600,
          fontSize: compact ? "14px" : "15px",
          color: dark ? "#FFFFFF" : "#1A1714",
        }}
      >
        {site.name}
      </span>
      {showBeta && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: "rgba(42,66,50,0.09)",
            color: "#3D6B52",
            border: "1px solid rgba(42,66,50,0.22)",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          BETA
        </span>
      )}
    </a>
  );
}
