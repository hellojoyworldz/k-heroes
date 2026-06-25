import { CHARACTERS } from "@/lib/data/characters";
import type { PlaySessionItem } from "@/lib/auth/types";

const CHARACTER_NAME_ALIASES: Record<string, string> = {
  윤봉길: "yunbongil",
  "윤봉길 의사": "yunbongil",
  이순신: "yi_sunsin",
  "이순신 장군": "yi_sunsin",
  세종대왕: "sejong",
};

export function encodeChoicesPath(choices: string[]) {
  const [step1 = "A", step2 = "B", step3 = "A"] = choices
    .slice(0, 3)
    .map((choice) => choice.toUpperCase());

  return `${step1}-${step2}-${step3}`;
}

export function resolveCharacterId(characterName: string) {
  const normalized = characterName.trim();
  if (!normalized) return null;

  const alias = CHARACTER_NAME_ALIASES[normalized];
  if (alias) return alias;

  const matched = Object.values(CHARACTERS).find((character) => {
    const shortName = character.name.replace(/\s*(의사|장군)/, "");
    return (
      normalized === character.name ||
      normalized === shortName ||
      character.name.includes(normalized) ||
      normalized.includes(shortName)
    );
  });

  return matched?.id ?? null;
}

export function getSessionResultHref(session: PlaySessionItem) {
  const charId = resolveCharacterId(session.character_name);
  if (!charId || session.choices_path.length === 0) return null;

  return `/ending/${encodeURIComponent(charId)}/${encodeChoicesPath(session.choices_path)}`;
}

export function getSessionContinueHref(session: PlaySessionItem) {
  const charId = resolveCharacterId(session.character_name);
  if (!charId) return null;

  return `/simulation/${encodeURIComponent(charId)}`;
}

export function getSessionAction(session: PlaySessionItem) {
  if (session.status === "completed") {
    const href = getSessionResultHref(session);
    return href
      ? { href, label: "결과 다시 보기" as const }
      : null;
  }

  const href = getSessionContinueHref(session);
  return href ? { href, label: "이어하기" as const } : null;
}
