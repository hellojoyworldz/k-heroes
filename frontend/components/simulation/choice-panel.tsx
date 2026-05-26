import { Card } from "@/components/ui/card";

export function ChoicePanel() {
  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--primary)]">사용자 선택</p>
        <h2 className="text-2xl font-bold">선택지 영역</h2>
        <p className="leading-7 text-[var(--muted-foreground)]">
          사용자가 고를 수 있는 행동 선택지와 선택 영향이 들어갈 예정입니다.
        </p>
      </div>
    </Card>
  );
}
