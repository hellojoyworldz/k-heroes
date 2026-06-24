from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from db.models import Character, Scenario
from models.scenario.scenario import ScenarioCreate, ScenarioReorderRequest, ScenarioUpdate
from repositories.character.character import _get_character_or_raise


class ScenarioNotFoundError(Exception):
    def __init__(self, scenario_id: int):
        self.scenario_id = scenario_id
        super().__init__(f"시나리오를 찾을 수 없습니다. (ID: {scenario_id})")


def _get_scenario_or_raise(db: Session, scenario_db_id: int) -> Scenario:
    scenario = db.scalar(
        _scenario_query().where(
            Scenario.id == scenario_db_id,
            Scenario.deleted_at.is_(None),
        )
    )
    if not scenario:
        raise ScenarioNotFoundError(scenario_db_id)
    return scenario


def _next_sort_order(db: Session, character_id: int) -> int:
    current_max = db.scalar(
        select(func.max(Scenario.sort_order)).where(
            Scenario.character_id == character_id,
            Scenario.deleted_at.is_(None),
        )
    )
    return (current_max or -1) + 1


def _scenario_query():
    return select(Scenario).options(
        joinedload(Scenario.character).joinedload(Character.character_category),
    )


def _filtered_scenario_query(
    *,
    character_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    query = (
        _scenario_query()
        .join(Scenario.character)
        .where(Scenario.deleted_at.is_(None))
        .order_by(Character.name, Scenario.sort_order, Scenario.id)
    )
    if is_active is not None:
        query = query.where(Scenario.is_active.is_(is_active))
    if character_id is not None:
        query = query.where(Scenario.character_id == character_id)
    return query


def list_scenarios(
    db: Session,
    *,
    character_id: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> List[Scenario]:
    return list(
        db.scalars(
            _filtered_scenario_query(
                character_id=character_id,
                is_active=is_active,
            )
        ).unique()
    )


def list_scenarios_paginated(
    db: Session,
    *,
    character_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Scenario], int]:
    query = _filtered_scenario_query(
        character_id=character_id,
        is_active=is_active,
    )
    total = db.scalar(
        select(func.count()).select_from(query.order_by(None).subquery())
    ) or 0
    items = list(
        db.scalars(query.offset((page - 1) * page_size).limit(page_size)).unique()
    )
    return items, total


def get_scenario_by_id(db: Session, scenario_db_id: int) -> Scenario:
    return _get_scenario_or_raise(db, scenario_db_id)


def create_scenario(db: Session, data: ScenarioCreate) -> Scenario:
    _get_character_or_raise(db, data.character_id)

    scenario = Scenario(
        character_id=data.character_id,
        sort_order=_next_sort_order(db, data.character_id),
        title=data.title,
        description=data.description,
        historical_facts=data.historical_facts,
        source_story_ids=data.source_story_ids,
        is_active=True,
    )
    db.add(scenario)
    db.flush()
    return get_scenario_by_id(db, scenario.id)


def update_scenario(db: Session, scenario_db_id: int, data: ScenarioUpdate) -> Scenario:
    scenario = _get_scenario_or_raise(db, scenario_db_id)
    updates = data.model_dump(exclude_unset=True)

    if "character_id" in updates:
        _get_character_or_raise(db, updates["character_id"])
        if updates["character_id"] != scenario.character_id:
            updates["sort_order"] = _next_sort_order(db, updates["character_id"])

    for field, value in updates.items():
        setattr(scenario, field, value)

    db.flush()
    return get_scenario_by_id(db, scenario_db_id)


def delete_scenario(db: Session, scenario_db_id: int) -> Scenario:
    scenario = _get_scenario_or_raise(db, scenario_db_id)
    scenario.deleted_at = datetime.now(timezone.utc)
    db.flush()
    return scenario


def reorder_scenarios(db: Session, data: ScenarioReorderRequest) -> List[Scenario]:
    _get_character_or_raise(db, data.character_id)

    scenarios: List[Scenario] = []
    for index, scenario_db_id in enumerate(data.ids):
        scenario = _get_scenario_or_raise(db, scenario_db_id)
        if scenario.character_id != data.character_id:
            raise ScenarioNotFoundError(scenario_db_id)
        scenario.sort_order = index
        scenarios.append(scenario)

    db.flush()
    return [get_scenario_by_id(db, scenario.id) for scenario in sorted(scenarios, key=lambda s: s.sort_order)]
