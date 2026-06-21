from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from db.models import Character, CharacterCategory, CharacterStat, Ending, Scenario


def get_character(db: Session, name: str) -> Optional[Character]:
    return db.scalar(
        select(Character)
        .options(joinedload(Character.character_category))
        .where(Character.name == name)
    )


def get_category(db: Session, label: str) -> Optional[CharacterCategory]:
    return db.scalar(select(CharacterCategory).where(CharacterCategory.label == label))


def get_character_stat(db: Session, character_name: str, stat_name: str) -> Optional[CharacterStat]:
    character = get_character(db, character_name)
    if not character:
        return None
    return db.scalar(
        select(CharacterStat).where(
            CharacterStat.character_id == character.id,
            CharacterStat.name == stat_name,
            CharacterStat.deleted_at.is_(None),
        )
    )


def get_scenario(db: Session, character_name: str, scenario_id: int) -> Optional[Scenario]:
    character = get_character(db, character_name)
    if not character:
        return None
    return db.scalar(
        select(Scenario).where(
            Scenario.character_id == character.id,
            Scenario.scenario_id == scenario_id,
        )
    )


def get_ending(db: Session, character_name: str, scenario_id: int, path_key: str) -> Optional[Ending]:
    scenario = get_scenario(db, character_name, scenario_id)
    if not scenario:
        return None
    return db.scalar(
        select(Ending).where(
            Ending.scenario_id == scenario.id,
            Ending.path_key == path_key,
        )
    )
