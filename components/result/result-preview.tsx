import { Card } from "@/components/ui/card";

export function ResultPreview() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card>
        <p className="text-sm font-semibold text-[var(--primary)]">실제 역사 비교</p>
        <h2 className="mt-2 text-2xl font-bold">역사 연결 영역</h2>
        <p className="mt-4 leading-7 text-[var(--muted-foreground)]">
          사용자 선택과 실제 역사 흐름을 비교하는 내용이 들어갈 예정입니다.
        </p>
      </Card>
      <Card>
        <p className="text-sm font-semibold text-[var(--primary)]">현재 지역 연결</p>
        <h2 className="mt-2 text-2xl font-bold">지역 문화 연결 영역</h2>
        <p className="mt-4 leading-7 text-[var(--muted-foreground)]">
          현재 문화재, 지역 스토리, 방문 정보가 들어갈 예정입니다.
        </p>
      </Card>
    </section>
  );
}
