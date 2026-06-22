"""선택지 turn_stats(turn_stats_id + delta) 유틸."""

from __future__ import annotations

import copy
from typing import Dict, List, Optional, Sequence, Union

from models.character import ChoiceTurnStatItem, TurnStatGameItem

TurnStatInput = Union[ChoiceTurnStatItem, dict]

CATEGORY_STAT_TEMPLATE_KEYS: Dict[str, List[str]] = {
    "독립 / 호국": ["전투력", "팀워크", "성공 확률"],
    "정치 / 외교": ["국력", "백성의 지지", "성공 확률"],
    "예술 / 문학": ["예술성", "백성의 위로", "성공 확률"],
    "사상 / 학문": ["학문적 깊이", "실용성", "성공 확률"],
}

DEFAULT_GAME_STAT_VALUE = 50


def ordered_turn_stats_ids(turn_stats: Sequence[TurnStatGameItem]) -> List[int]:
    return [stat.id for stat in turn_stats]


def map_turn_stats_to_effects(
    turn_stats: Sequence[TurnStatInput],
    ordered_ids: Sequence[int],
) -> Dict[str, int]:
    id_to_index = {turn_stats_id: index for index, turn_stats_id in enumerate(ordered_ids)}
    effects: Dict[str, int] = {}
    for raw in turn_stats:
        if isinstance(raw, ChoiceTurnStatItem):
            turn_stats_id, delta = raw.turn_stats_id, raw.delta
        else:
            turn_stats_id, delta = raw["turn_stats_id"], raw["delta"]
        index = id_to_index.get(int(turn_stats_id))
        if index is not None:
            effects[f"stat_{index + 1}"] = delta
    return effects


def collect_turn_stat_names_from_profile(profile: dict, category_label: str) -> List[str]:
    for scenario in profile.get("scenarios", []):
        for turn in scenario.get("turns", []):
            for choice in turn.get("choices", {}).values():
                legacy_stats = choice.get("stats")
                if isinstance(legacy_stats, dict) and legacy_stats:
                    return list(legacy_stats.keys())
                raw_turn_stats = choice.get("turn_stats")
                if isinstance(raw_turn_stats, list) and raw_turn_stats:
                    names = [item.get("name") for item in raw_turn_stats if item.get("name")]
                    if names:
                        return names
    return list(CATEGORY_STAT_TEMPLATE_KEYS.get(category_label, []))


def resolve_choice_turn_stats_for_db(
    name_to_turn_stats_id: Dict[str, int],
    choice_data: dict,
    *,
    category_label: str = "",
    template_index: Optional[int] = None,
) -> List[dict]:
    """JSON turn_stats → DB 저장용 [{turn_stats_id, delta}]."""
    raw = choice_data.get("turn_stats")
    if raw is None:
        legacy = choice_data.get("stats", {})
        if isinstance(legacy, dict):
            raw = [{"name": name, "delta": delta} for name, delta in legacy.items()]
        else:
            return []

    template_keys = CATEGORY_STAT_TEMPLATE_KEYS.get(category_label, [])
    resolved: List[dict] = []
    for item in raw:
        if "turn_stats_id" in item:
            resolved.append(
                {"turn_stats_id": int(item["turn_stats_id"]), "delta": int(item["delta"])}
            )
            continue
        if "stat_id" in item and template_index is not None:
            stat_index = int(item["stat_id"])
            if stat_index < len(template_keys):
                name = template_keys[stat_index]
                turn_stats_id = name_to_turn_stats_id.get(name)
                if turn_stats_id is not None:
                    resolved.append(
                        {"turn_stats_id": turn_stats_id, "delta": int(item["delta"])}
                    )
            continue
        name = item.get("name")
        if name is None:
            continue
        turn_stats_id = name_to_turn_stats_id.get(name)
        if turn_stats_id is None:
            raise ValueError(f"Unknown turn stat name '{name}' for character")
        resolved.append({"turn_stats_id": turn_stats_id, "delta": int(item["delta"])})
    return resolved


def normalize_json_character_profile(profile: dict) -> dict:
    """v1 JSON 로드용: 선택지 turn_stats를 turn_stats_id 기반으로 정규화."""
    profile = copy.deepcopy(profile)
    category_label = profile.get("category", "")
    names = collect_turn_stat_names_from_profile(profile, category_label)
    name_to_id = {name: index for index, name in enumerate(names)}

    for s_index, scenario in enumerate(profile.get("scenarios", [])):
        if "id" not in scenario:
            scenario["id"] = scenario.get("scenario_id", s_index + 1)
        if "sort_order" not in scenario:
            scenario["sort_order"] = s_index

        for t_index, turn in enumerate(scenario.get("turns", [])):
            if "sort_order" not in turn:
                turn["sort_order"] = turn.get("turn_no", t_index + 1) - 1

            for choice in turn.get("choices", {}).values():
                choice["turn_stats"] = resolve_choice_turn_stats_for_db(
                    name_to_id,
                    choice,
                    category_label=category_label,
                )
                choice.pop("stats", None)

    return profile
