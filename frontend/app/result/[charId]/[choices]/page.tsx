"use client";

import { useParams, useRouter } from "next/navigation";
import { ResultPage } from "@/figma-make/src/app/components/ResultPage";

function normalizeCharId(charId: string) {
  return charId === "yi-sunsin" ? "yi_sunsin" : charId;
}

function decodeChoices(choices: string) {
  const values = choices.split("-").filter((choice): choice is "A" | "B" => {
    return choice === "A" || choice === "B";
  });

  return {
    0: values[0] ?? "A",
    1: values[1] ?? "B",
    2: values[2] ?? "A",
  };
}

export default function ResultRoutePage() {
  const router = useRouter();
  const params = useParams<{ charId: string; choices: string }>();
  const charId = normalizeCharId(params.charId);
  const choices = decodeChoices(params.choices);

  return (
    <ResultPage
      charId={charId}
      selections={choices}
      onBack={() => router.push(`/simulation/${charId}`)}
      onNextChar={() => router.push("/select")}
    />
  );
}
