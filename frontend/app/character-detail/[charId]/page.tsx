"use client";

import { useParams, useRouter } from "next/navigation";
import { CharacterDetailPage } from "@/figma-make/src/app/components/CharacterDetailPage";

function normalizeCharId(charId: string) {
  return decodeURIComponent(charId);
}

export default function CharacterDetailRoutePage() {
  const router = useRouter();
  const params = useParams<{ charId: string }>();
  const charId = normalizeCharId(params.charId);

  return (
    <CharacterDetailPage
      charId={charId}
      onBack={() => router.push("/select")}
      onStartScenario={(scenarioIdx) =>
        router.push(`/simulation/${encodeURIComponent(charId)}?scenario=${scenarioIdx}`)
      }
    />
  );
}
