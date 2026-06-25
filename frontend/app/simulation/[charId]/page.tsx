"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SimulationPage } from "@/components/simulation/SimulationPage";
import { Suspense } from "react";

function normalizeCharId(charId: string) {
  return decodeURIComponent(charId);
}

function SimulationInner() {
  const router = useRouter();
  const params = useParams<{ charId: string }>();
  const searchParams = useSearchParams();
  const charId = normalizeCharId(params.charId);
  const scenarioStr = searchParams.get("scenario") ?? "0";
  const scenarioIdx = parseInt(scenarioStr, 10) || 0;

  return (
    <SimulationPage
      charId={charId}
      scenarioIdx={scenarioIdx}
      onBack={() => router.push(`/character/${charId}`)}
      onComplete={(uuid) => router.push(`/ending/${uuid}`)}
    />
  );
}

export default function SimulationRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FDFAF4] text-[#7A7060]">로딩 중...</div>}>
      <SimulationInner />
    </Suspense>
  );
}
