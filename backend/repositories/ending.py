from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from db.models import Character, Ending, Scenario
from models.ending import EndingCreate, EndingUpdate
from repositories.scenario import ScenarioNotFoundError, _get_scenario_or_raise


class EndingNotFoundError(Exception):
    def __init__(self, ending_id: int):
        self.ending_id = ending_id
        super().__init__(f"Ending id={ending_id} not found")


class EndingDuplicateError(Exception):
    def __init__(self, path_key: str):
        self.path_key = path_key
        super().__init__(f"Ending path_key='{path_key}' already exists for this scenario")


def _ending_query():
    return select(Ending).options(
        joinedload(Ending.scenario)
        .joinedload(Scenario.character)
        .joinedload(Character.character_category),
    )


def _get_ending_or_raise(db: Session, ending_id: int) -> Ending:
    ending = db.scalar(
        _ending_query().where(
            Ending.id == ending_id,
            Ending.deleted_at.is_(None),
        )
    )
    if not ending:
        raise EndingNotFoundError(ending_id)
    return ending


def _ensure_unique_path_key(
    db: Session,
    scenario_id: int,
    path_key: str,
    *,
    exclude_id: Optional[int] = None,
) -> None:
    existing = db.scalar(
        select(Ending).where(
            Ending.scenario_id == scenario_id,
            Ending.path_key == path_key,
            Ending.deleted_at.is_(None),
        )
    )
    if existing and existing.id != exclude_id:
        raise EndingDuplicateError(path_key)


def _serialize_summary_items(items: List) -> List[dict]:
    return [item.model_dump() if hasattr(item, "model_dump") else item for item in items]


def _serialize_recommended_places(items: List) -> List[dict]:
    return [item.model_dump() if hasattr(item, "model_dump") else item for item in items]


def list_endings(db: Session, *, scenario_id: Optional[int] = None) -> List[Ending]:
    query = (
        _ending_query()
        .join(Ending.scenario)
        .join(Scenario.character)
        .where(Ending.deleted_at.is_(None))
        .order_by(Character.name, Scenario.sort_order, Ending.path_key, Ending.id)
    )
    if scenario_id is not None:
        _get_scenario_or_raise(db, scenario_id)
        query = query.where(Ending.scenario_id == scenario_id)
    return list(db.scalars(query).unique())


def get_ending_by_id(db: Session, ending_id: int) -> Ending:
    return _get_ending_or_raise(db, ending_id)


def create_ending(db: Session, data: EndingCreate) -> Ending:
    _get_scenario_or_raise(db, data.scenario_id)
    _ensure_unique_path_key(db, data.scenario_id, data.path_key)

    ending = Ending(
        scenario_id=data.scenario_id,
        path_key=data.path_key,
        ending_type=data.ending_type,
        title=data.title,
        history_fact=data.history_fact,
        story_headline=data.story_headline,
        story_contents=data.story_contents,
        factual_contents=data.factual_contents,
        image_url=data.image_url,
        summary_items=_serialize_summary_items(data.summary_items),
        recommended_places=_serialize_recommended_places(data.recommended_places),
    )
    db.add(ending)
    db.flush()
    return get_ending_by_id(db, ending.id)


def update_ending(db: Session, ending_id: int, data: EndingUpdate) -> Ending:
    ending = _get_ending_or_raise(db, ending_id)
    updates = data.model_dump(exclude_unset=True)

    if "path_key" in updates:
        _ensure_unique_path_key(
            db,
            ending.scenario_id,
            updates["path_key"],
            exclude_id=ending_id,
        )
    if "summary_items" in updates:
        updates["summary_items"] = _serialize_summary_items(updates["summary_items"] or [])
    if "recommended_places" in updates:
        updates["recommended_places"] = _serialize_recommended_places(
            updates["recommended_places"] or []
        )

    for field, value in updates.items():
        setattr(ending, field, value)

    db.flush()
    return get_ending_by_id(db, ending_id)


def delete_ending(db: Session, ending_id: int) -> Ending:
    ending = _get_ending_or_raise(db, ending_id)
    ending.deleted_at = datetime.now(timezone.utc)
    db.flush()
    return db.scalar(_ending_query().where(Ending.id == ending_id))
