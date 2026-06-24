export const site = {
  name: "K-Heroes",
  /** app/layout.tsx — 메타 description (검색·SNS 미리보기) */
  description:
    "문화 빅데이터 기반 한국 역사·지역 문화 인터랙티브 시뮬레이션 서비스",
  /** auth-form-layout, Footer — 로그인/회원가입 패널·푸터 하단 문구 */
  tagline: "문화 빅데이터 기반 역사·지역 문화 인터랙티브 시뮬레이션",
  email: {
    contact: "nightbonus@outlook.com",
    privacy: "nightbonus@outlook.com",
  },
  legal: {
    effectiveDate: "2026년 6월 24일",
    privacyOfficerTitle: "개인정보 보호책임자",
  },
  copyright: {
    year: 2026,
  },
} as const;

export function getCopyrightNotice(): string {
  return `© ${site.copyright.year} ${site.name}. All rights reserved.`;
}
