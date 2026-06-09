"use client";

import { useParams, useRouter } from "next/navigation";
import { SimulationPage } from "@/figma-make/src/app/components/SimulationPage";

function normalizeCharId(charId: string) {
  return charId === "yi-sunsin" ? "yi_sunsin" : charId;
}

function encodeChoices(selections: Record<number, "A" | "B">) {
  return [0, 1, 2].map((step) => selections[step] ?? "A").join("-");
}

export default function SimulationRoutePage() {
  const router = useRouter();
  const params = useParams<{ charId: string }>();
  const charId = normalizeCharId(params.charId);

  return (
    <SimulationPage
      onBack={() => router.push(`/character-detail/${charId}`)}
      onComplete={(selections) => router.push(`/result/${charId}/${encodeChoices(selections)}`)}
    />
  );
}
