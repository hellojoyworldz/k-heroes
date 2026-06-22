"""인물 시뮬 능력치(character_turn_stats) sync 유틸."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, List, Sequence

from sqlalchemy.orm import Session

from db.models import Character, CharacterTurnStat
from models.character import TurnStatCreate, TurnStatWrite


class CharacterTurnStatNotFoundError(Exception):
    def __init__(self, turn_stats_id: int):
        self.turn_stats_id = turn_stats_id
        super().__init__(f"시뮬 능력치를 찾을 수 없습니다. (id: {turn_stats_id})")


def active_turn_stats(character: Character) -> List[CharacterTurnStat]:
    return sorted(
        (row for row in character.turn_stats if row.deleted_at is None),
        key=lambda row: row.sort_order,
    )


def sync_character_turn_stats(
    db: Session,
    character: Character,
    items: Sequence[TurnStatWrite | TurnStatCreate],
) -> None:
    active_rows = {row.id: row for row in active_turn_stats(character)}
    kept_ids: set[int] = set()
    now = datetime.now(timezone.utc)

    for sort_order, item in enumerate(items):
        item_id = getattr(item, "id", None)
        if item_id is not None:
            row = active_rows.get(item_id)
            if row is None:
                raise CharacterTurnStatNotFoundError(item_id)
            row.name = item.name
            row.sort_order = sort_order
            kept_ids.add(item_id)
            continue

        row = CharacterTurnStat(
            character_id=character.id,
            name=item.name,
            sort_order=sort_order,
        )
        db.add(row)
        db.flush()
        kept_ids.add(row.id)

    for row_id, row in active_rows.items():
        if row_id not in kept_ids:
            row.deleted_at = now


def soft_delete_character_turn_stats(character: Character, *, deleted_at: datetime | None = None) -> None:
    now = deleted_at or datetime.now(timezone.utc)
    for row in character.turn_stats:
        if row.deleted_at is None:
            row.deleted_at = now


def turn_stat_name_to_id(character: Character) -> dict[str, int]:
    return {row.name: row.id for row in active_turn_stats(character)}


def seed_turn_stats_for_character(
    db: Session,
    character: Character,
    names: Iterable[str],
) -> dict[str, int]:
    name_to_id: dict[str, int] = {}
    for sort_order, name in enumerate(names):
        row = CharacterTurnStat(
            character_id=character.id,
            name=name,
            sort_order=sort_order,
        )
        db.add(row)
        db.flush()
        name_to_id[name] = row.id
    return name_to_id
