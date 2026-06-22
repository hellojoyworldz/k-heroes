import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";

const summaryCards = [
  { label: "인물 카테고리", value: "—", hint: "활성 카테고리" },
  { label: "인물", value: "—", hint: "등록된 인물" },
  { label: "시나리오", value: "—", hint: "운영 중 시나리오" },
  { label: "엔딩", value: "—", hint: "등록된 엔딩" },
];

const quickLinks = [
  { title: "인물 추가", href: "/admin/characters", description: "새 역사 인물 등록" },
  { title: "시나리오 관리", href: "/admin/scenarios", description: "시나리오 생성·수정" },
  { title: "턴 편집", href: "/admin/turns", description: "선택지 포함 턴 관리" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader
        description="콘텐츠 운영 현황을 한눈에 확인하세요."
        title="대시보드"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#E8E4DC] bg-white px-5 py-4"
          >
            <p className="text-sm text-[#8A847C]">{card.label}</p>
            <p
              className="mt-2 text-3xl font-semibold text-[#1A1714]"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-[#B0AAA2]">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold text-[#3A3530]">빠른 작업</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((link) => (
            <a
              key={link.href}
              className="rounded-xl border border-[#E8E4DC] bg-white px-5 py-4 transition-colors hover:border-[#2A4232]/30 hover:bg-[#FDFCFA]"
              href={link.href}
            >
              <p className="font-medium text-[#1A1714]">{link.title}</p>
              <p className="mt-1 text-sm text-[#8A847C]">{link.description}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-[#E8E4DC] bg-white px-6 py-5">
        <h2 className="text-sm font-semibold text-[#3A3530]">안내</h2>
        <p className="mt-2 text-sm leading-6 text-[#8A847C]">
          각 메뉴에서 콘텐츠 CRUD 화면을 순차적으로 구현할 예정입니다. API 연동 후
          상단 통계 숫자가 실제 데이터로 표시됩니다.
        </p>
      </section>
    </>
  );
}
