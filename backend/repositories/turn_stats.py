"""선택지 turn_stats(stat_id + delta) 유틸."""

from __future__ import annotations

import copy
from typing import Dict, List, Optional, Sequence, Union

from models.character import ChoiceTurnStatItem, StatItem

TurnStatInput = Union[ChoiceTurnStatItem, dict]


def ordered_stat_ids(stats: Sequence[StatItem]) -> List[int]:
    return [stat.id for stat in stats]


def map_turn_stats_to_effects(
    turn_stats: Sequence[TurnStatInput],
    ordered_ids: Sequence[int],
) -> Dict[str, int]:
    id_to_index = {stat_id: index for index, stat_id in enumerate(ordered_ids)}
    effects: Dict[str, int] = {}
    for raw in turn_stats:
        if isinstance(raw, ChoiceTurnStatItem):
            stat_id, delta = raw.stat_id, raw.delta
        else:
            stat_id, delta = raw["stat_id"], raw["delta"]
        index = id_to_index.get(stat_id)
        if index is not None:
            effects[f"stat_{index + 1}"] = delta
    return effects


CATEGORY_STAT_TEMPLATE_KEYS: Dict[str, List[str]] = {
    "독립 / 호국": ["전투력", "팀워크", "성공 확률"],
    "정치 / 외교": ["국력", "백성의 지지", "성공 확률"],
    "예술 / 문학": ["예술성", "백성의 위로", "성공 확률"],
    "사상 / 학문": ["학문적 깊이", "실용성", "성공 확률"],
}


def _resolve_stat_id(
    *,
    stat_name_to_id: Dict[str, int],
    profile_stat_names: Sequence[str],
    category_label: str,
    name: str,
) -> Optional[int]:
    if name in stat_name_to_id:
        return stat_name_to_id[name]

    template_keys = CATEGORY_STAT_TEMPLATE_KEYS.get(category_label, [])
    if name in template_keys:
        index = template_keys.index(name)
        if index < len(profile_stat_names):
            return stat_name_to_id.get(profile_stat_names[index])
    return None


def resolve_choice_turn_stats_for_db(
    stat_name_to_id: Dict[str, int],
    choice_data: dict,
    *,
    profile_stat_names: Sequence[str],
    category_label: str = "",
) -> List[dict]:
    """JSON turn_stats → DB 저장용 [{stat_id, delta}]."""
    raw = choice_data.get("turn_stats")
    if raw is None:
        legacy = choice_data.get("stats", {})
        if isinstance(legacy, dict):
            raw = [{"name": name, "delta": delta} for name, delta in legacy.items()]
        else:
            return []

    resolved: List[dict] = []
    for item in raw:
        if "stat_id" in item:
            resolved.append({"stat_id": int(item["stat_id"]), "delta": int(item["delta"])})
            continue
        name = item.get("name")
        if name is None:
            continue
        stat_id = _resolve_stat_id(
            stat_name_to_id=stat_name_to_id,
            profile_stat_names=profile_stat_names,
            category_label=category_label,
            name=name,
        )
        if stat_id is None:
            raise ValueError(f"Unknown stat name '{name}' for character")
        resolved.append({"stat_id": stat_id, "delta": int(item["delta"])})
    return resolved


def normalize_json_character_profile(profile: dict) -> dict:
    """v1 JSON 로드용: stats에 id 부여, 선택지 turn_stats를 stat_id 기반으로 정규화."""
    profile = copy.deepcopy(profile)
    category_label = profile.get("category", "")

    profile_stat_names = [stat["name"] for stat in profile.get("stats", [])]
    stat_name_to_id: Dict[str, int] = {}
    for index, stat in enumerate(profile.get("stats", [])):
        stat_id = index + 1
        stat["id"] = stat_id
        stat_name_to_id[stat["name"]] = stat_id

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
                    stat_name_to_id,
                    choice,
                    profile_stat_names=profile_stat_names,
                    category_label=category_label,
                )
                choice.pop("stats", None)

    return profile
