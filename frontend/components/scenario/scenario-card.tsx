import { Card } from "@/components/ui/card";

export function ScenarioCard() {
  return (
    <Card className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--primary)]">시나리오 카드</p>
        <h2 className="text-2xl font-bold">역사 인물 소개 영역</h2>
        <p className="leading-7 text-[var(--muted-foreground)]">
          시대, 지역, 인물 소개와 갈등 상황이 들어갈 예정입니다.
        </p>
      </div>
    </Card>
  );
}
