from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.models import Character, Ending, Scenario


def get_character(db: Session, name: str) -> Optional[Character]:
    return db.scalar(select(Character).where(Character.name == name))


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
