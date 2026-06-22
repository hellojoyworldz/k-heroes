from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from db.models import Character, CharacterCategory, CharacterTurnStat, Ending, Scenario


def get_character(db: Session, name: str) -> Optional[Character]:
    return db.scalar(
        select(Character)
        .options(joinedload(Character.character_category))
        .where(Character.name == name)
    )


def get_category(db: Session, title: str) -> Optional[CharacterCategory]:
    return db.scalar(select(CharacterCategory).where(CharacterCategory.title == title))


def get_character_turn_stat_id(db: Session, character_name: str, stat_name: str) -> Optional[int]:
    character = get_character(db, character_name)
    if not character:
        return None
    return db.scalar(
        select(CharacterTurnStat.id).where(
            CharacterTurnStat.character_id == character.id,
            CharacterTurnStat.name == stat_name,
            CharacterTurnStat.deleted_at.is_(None),
        )
    )


def get_character_stat_index(db: Session, character_name: str, stat_name: str) -> Optional[int]:
    """하위 호환: turn_stats id 반환 (구 stat index 대체)."""
    return get_character_turn_stat_id(db, character_name, stat_name)


def get_scenario(db: Session, character_name: str, sort_order: int = 0) -> Optional[Scenario]:
    """인물의 시나리오를 sort_order(0-indexed)로 조회."""
    character = get_character(db, character_name)
    if not character:
        return None
    return db.scalar(
        select(Scenario).where(
            Scenario.character_id == character.id,
            Scenario.sort_order == sort_order,
            Scenario.deleted_at.is_(None),
        )
    )


def get_ending(
    db: Session,
    character_name: str,
    sort_order: int,
    path_key: str,
) -> Optional[Ending]:
    scenario = get_scenario(db, character_name, sort_order)
    if not scenario:
        return None
    return db.scalar(
        select(Ending).where(
            Ending.scenario_id == scenario.id,
            Ending.path_key == path_key,
        )
    )
