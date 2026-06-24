from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from db.models import Character, Ending, Scenario
from models.scenario.ending import EndingCreate, EndingReorderRequest, EndingUpdate
from repositories.character.character import _get_character_or_raise
from repositories.scenario.scenario import ScenarioNotFoundError, _get_scenario_or_raise


class EndingNotFoundError(Exception):
    def __init__(self, ending_id: int):
        self.ending_id = ending_id
        super().__init__(f"엔딩을 찾을 수 없습니다. (ID: {ending_id})")


class EndingDuplicateError(Exception):
    def __init__(self, path_key: str):
        self.path_key = path_key
        super().__init__(f"이 시나리오에 동일한 경로('{path_key}')의 엔딩이 이미 있습니다.")


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


def _next_sort_order(db: Session, scenario_id: int) -> int:
    current_max = db.scalar(
        select(func.max(Ending.sort_order)).where(
            Ending.scenario_id == scenario_id,
            Ending.deleted_at.is_(None),
        )
    )
    if current_max is None:
        return 0
    return current_max + 1


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


def _filtered_ending_query(
    *,
    character_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    query = (
        _ending_query()
        .join(Ending.scenario)
        .join(Scenario.character)
        .where(Ending.deleted_at.is_(None))
        .order_by(Character.name, Scenario.sort_order, Ending.sort_order, Ending.id)
    )
    if is_active is not None:
        query = query.where(Ending.is_active.is_(is_active))
    if character_id is not None:
        query = query.where(Scenario.character_id == character_id)
    if scenario_id is not None:
        query = query.where(Ending.scenario_id == scenario_id)
    return query


def list_endings(
    db: Session,
    *,
    character_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> List[Ending]:
    if character_id is not None:
        _get_character_or_raise(db, character_id)
    if scenario_id is not None:
        _get_scenario_or_raise(db, scenario_id)
    return list(
        db.scalars(
            _filtered_ending_query(
                character_id=character_id,
                scenario_id=scenario_id,
                is_active=is_active,
            )
        ).unique()
    )


def list_endings_paginated(
    db: Session,
    *,
    character_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Ending], int]:
    if character_id is not None:
        _get_character_or_raise(db, character_id)
    if scenario_id is not None:
        _get_scenario_or_raise(db, scenario_id)
    query = _filtered_ending_query(
        character_id=character_id,
        scenario_id=scenario_id,
        is_active=is_active,
    )
    total = db.scalar(
        select(func.count()).select_from(query.order_by(None).subquery())
    ) or 0
    items = list(db.scalars(query.offset((page - 1) * page_size).limit(page_size)).unique())
    return items, total


def get_ending_by_id(db: Session, ending_id: int) -> Ending:
    return _get_ending_or_raise(db, ending_id)


def create_ending(db: Session, data: EndingCreate) -> Ending:
    _get_scenario_or_raise(db, data.scenario_id)
    _ensure_unique_path_key(db, data.scenario_id, data.path_key)

    ending = Ending(
        scenario_id=data.scenario_id,
        sort_order=_next_sort_order(db, data.scenario_id),
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

    target_scenario_id = updates.get("scenario_id", ending.scenario_id)
    if "scenario_id" in updates:
        _get_scenario_or_raise(db, updates["scenario_id"])
        if updates["scenario_id"] != ending.scenario_id:
            updates["sort_order"] = _next_sort_order(db, updates["scenario_id"])

    path_key = updates.get("path_key", ending.path_key)
    if "path_key" in updates or (
        "scenario_id" in updates and updates["scenario_id"] != ending.scenario_id
    ):
        _ensure_unique_path_key(
            db,
            target_scenario_id,
            path_key,
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


def reorder_endings(db: Session, data: EndingReorderRequest) -> List[Ending]:
    scenario_id = data.scenario_id
    _get_scenario_or_raise(db, scenario_id)

    endings: List[Ending] = []
    for ending_id in data.ids:
        ending = _get_ending_or_raise(db, ending_id)
        if ending.scenario_id != scenario_id:
            raise EndingNotFoundError(ending_id)
        endings.append(ending)

    temp_offset = 1_000_000
    for ending in endings:
        ending.sort_order = temp_offset + ending.id
    db.flush()

    for index, ending in enumerate(endings):
        ending.sort_order = index
    db.flush()

    ending_ids = [ending.id for ending in endings]
    reloaded = list(
        db.scalars(
            _ending_query()
            .where(Ending.id.in_(ending_ids))
            .order_by(Ending.sort_order, Ending.id)
        ).unique()
    )
    return reloaded
