from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from db.models import Character, Scenario
from models.scenario import ScenarioCreate, ScenarioReorderRequest, ScenarioUpdate
from repositories.character import _get_character_or_raise
from repositories.character_search import apply_character_search_filters


class ScenarioNotFoundError(Exception):
    def __init__(self, scenario_id: int):
        self.scenario_id = scenario_id
        super().__init__(f"Scenario id={scenario_id} not found")


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


def list_scenarios(
    db: Session,
    *,
    name: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Scenario]:
    query = (
        _scenario_query()
        .join(Scenario.character)
        .where(Scenario.deleted_at.is_(None))
        .order_by(Character.name, Scenario.sort_order, Scenario.id)
    )
    if is_active is not None:
        query = query.where(Scenario.is_active.is_(is_active))
    query = apply_character_search_filters(query, name=name)
    return list(db.scalars(query).unique())


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
