"""인물 stats JSON 컬럼 유틸."""

from __future__ import annotations

from typing import Dict, List, Sequence

from models.character.character import StatCreate, StatItem, StatWrite


def stats_to_storage(items: Sequence[StatCreate | StatWrite]) -> List[dict]:
    return [
        {"name": item.name, "value": item.value, "desc": item.desc}
        for item in items
    ]


def stat_items_from_json(stats_json: Sequence[dict] | None) -> List[StatItem]:
    return [
        StatItem(
            id=index,
            name=str(item.get("name", "")),
            value=int(item.get("value", 0)),
            desc=str(item.get("desc", "")),
        )
        for index, item in enumerate(stats_json or [])
    ]


def stat_name_to_index(stats_json: Sequence[dict] | None) -> Dict[str, int]:
    return {
        str(item.get("name", "")): index
        for index, item in enumerate(stats_json or [])
        if item.get("name")
    }
