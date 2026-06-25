import type { PlaySessionItem } from "@/lib/auth/types";

export type SessionLinkAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export function getSessionResultHref(session: PlaySessionItem) {
  if (!session.id) return null;
  return `/ending/${encodeURIComponent(session.id)}`;
}

export function getSessionReplayHref(session: PlaySessionItem) {
  if (session.scenario_sort_order == null) return null;

  const characterName = session.character_name.trim();
  if (!characterName) return null;

  const scenarioNo = session.scenario_sort_order + 1;
  return `/simulation/${encodeURIComponent(characterName)}?scenario=${scenarioNo}`;
}

export function getSessionActions(session: PlaySessionItem): SessionLinkAction[] {
  const actions: SessionLinkAction[] = [];

  const resultHref = getSessionResultHref(session);
  if (resultHref) {
    actions.push({ href: resultHref, label: "결과 보기", variant: "primary" });
  }

  const replayHref = getSessionReplayHref(session);
  if (replayHref) {
    actions.push({ href: replayHref, label: "다시 하기", variant: "secondary" });
  }

  return actions;
}
