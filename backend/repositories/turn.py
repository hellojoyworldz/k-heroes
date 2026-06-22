from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from db.models import Character, Choice, Scenario, Turn
from models.turn import ChoiceWrite, TurnCreate, TurnReorderRequest, TurnUpdate
from repositories.character import CharacterStatNotFoundError, _get_character_or_raise
from repositories.character_turn_stats import active_turn_stats
from repositories.scenario import ScenarioNotFoundError, _get_scenario_or_raise


class TurnNotFoundError(Exception):
    def __init__(self, turn_id: int):
        self.turn_id = turn_id
        super().__init__(f"턴을 찾을 수 없습니다. (ID: {turn_id})")


def _turn_query():
    return select(Turn).options(
        selectinload(Turn.choices),
        selectinload(Turn.scenario)
        .selectinload(Scenario.character)
        .selectinload(Character.character_category),
        selectinload(Turn.scenario)
        .selectinload(Scenario.character)
        .selectinload(Character.turn_stats),
    )


def _get_turn_or_raise(db: Session, turn_id: int) -> Turn:
    turn = db.scalar(
        _turn_query().where(
            Turn.id == turn_id,
            Turn.deleted_at.is_(None),
        )
    )
    if not turn:
        raise TurnNotFoundError(turn_id)
    return turn


def _next_sort_order(db: Session, scenario_id: int) -> int:
    current_max = db.scalar(
        select(func.max(Turn.sort_order)).where(
            Turn.scenario_id == scenario_id,
            Turn.deleted_at.is_(None),
        )
    )
    if current_max is None:
        return 0
    return current_max + 1


def _get_character_for_scenario(db: Session, scenario: Scenario) -> Character:
    return db.scalar(
        select(Character)
        .where(
            Character.id == scenario.character_id,
            Character.deleted_at.is_(None),
        )
        .options(selectinload(Character.turn_stats))
    )


def _validate_turn_stats(character: Character, items: List) -> List[dict]:
    active_ids = {row.id for row in active_turn_stats(character)}
    resolved: List[dict] = []
    for item in items:
        turn_stats_id = (
            item.turn_stats_id if hasattr(item, "turn_stats_id") else item["turn_stats_id"]
        )
        delta = item.delta if hasattr(item, "delta") else item["delta"]
        if not isinstance(turn_stats_id, int) or turn_stats_id not in active_ids:
            raise CharacterStatNotFoundError(int(turn_stats_id))
        resolved.append({"turn_stats_id": turn_stats_id, "delta": delta})
    return resolved


def _apply_choice_fields(choice: Choice, data: ChoiceWrite, turn_stats: List[dict]) -> None:
    choice.title = data.title
    choice.description = data.description
    choice.choice_image = data.choice_image
    choice.result_text = data.result_text
    choice.is_historical = data.is_historical
    choice.turn_stats = turn_stats


def _sync_choices(
    db: Session,
    turn: Turn,
    choices: Dict[str, ChoiceWrite],
    character: Character,
) -> None:
    existing_by_key = {
        choice.choice_key: choice
        for choice in turn.choices
        if choice.deleted_at is None
    }

    for key in ("A", "B"):
        data = choices[key]
        turn_stats = _validate_turn_stats(character, data.turn_stats)
        existing = existing_by_key.get(key)
        if existing:
            _apply_choice_fields(existing, data, turn_stats)
        else:
            db.add(
                Choice(
                    turn_id=turn.id,
                    choice_key=key,
                    title=data.title,
                    description=data.description,
                    choice_image=data.choice_image,
                    result_text=data.result_text,
                    is_historical=data.is_historical,
                    turn_stats=turn_stats,
                )
            )

    for key, choice in existing_by_key.items():
        if key not in ("A", "B"):
            choice.deleted_at = datetime.now(timezone.utc)

    db.flush()
    db.refresh(turn, attribute_names=["choices"])


def _filtered_turn_query(
    *,
    character_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    query = (
        _turn_query()
        .join(Turn.scenario)
        .join(Scenario.character)
        .where(Turn.deleted_at.is_(None))
        .order_by(Character.name, Scenario.sort_order, Turn.sort_order, Turn.id)
    )
    if is_active is not None:
        query = query.where(Turn.is_active.is_(is_active))
    if character_id is not None:
        query = query.where(Scenario.character_id == character_id)
    if scenario_id is not None:
        query = query.where(Turn.scenario_id == scenario_id)
    return query


def list_turns(
    db: Session,
    *,
    character_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> List[Turn]:
    if character_id is not None:
        _get_character_or_raise(db, character_id)
    if scenario_id is not None:
        _get_scenario_or_raise(db, scenario_id)
    return list(
        db.scalars(
            _filtered_turn_query(
                character_id=character_id,
                scenario_id=scenario_id,
                is_active=is_active,
            )
        )
    )


def list_turns_paginated(
    db: Session,
    *,
    character_id: Optional[int] = None,
    scenario_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Turn], int]:
    if character_id is not None:
        _get_character_or_raise(db, character_id)
    if scenario_id is not None:
        _get_scenario_or_raise(db, scenario_id)
    query = _filtered_turn_query(
        character_id=character_id,
        scenario_id=scenario_id,
        is_active=is_active,
    )
    total = db.scalar(
        select(func.count()).select_from(query.order_by(None).subquery())
    ) or 0
    items = list(db.scalars(query.offset((page - 1) * page_size).limit(page_size)))
    return items, total


def get_turn_by_id(db: Session, turn_id: int) -> Turn:
    return _get_turn_or_raise(db, turn_id)


def create_turn(db: Session, data: TurnCreate) -> Turn:
    scenario = _get_scenario_or_raise(db, data.scenario_id)
    character = _get_character_for_scenario(db, scenario)
    if not character:
        raise ScenarioNotFoundError(data.scenario_id)

    turn = Turn(
        scenario_id=data.scenario_id,
        sort_order=_next_sort_order(db, data.scenario_id),
        title=data.title,
        situation=data.situation,
        turn_image=data.turn_image,
        tip_title=data.tip_title,
        tip_desc=data.tip_desc,
        is_active=True,
    )
    db.add(turn)
    db.flush()

    _sync_choices(
        db,
        turn,
        {"A": data.choices.A, "B": data.choices.B},
        character,
    )
    return get_turn_by_id(db, turn.id)


def update_turn(db: Session, turn_id: int, data: TurnUpdate) -> Turn:
    turn = _get_turn_or_raise(db, turn_id)
    updates = data.model_dump(exclude_unset=True, exclude={"choices"})

    if "scenario_id" in updates:
        _get_scenario_or_raise(db, updates["scenario_id"])
        if updates["scenario_id"] != turn.scenario_id:
            updates["sort_order"] = _next_sort_order(db, updates["scenario_id"])

    for field, value in updates.items():
        setattr(turn, field, value)

    scenario = _get_scenario_or_raise(db, turn.scenario_id)
    character = _get_character_for_scenario(db, scenario)
    if not character:
        raise ScenarioNotFoundError(turn.scenario_id)

    if "choices" in data.model_fields_set and data.choices is not None:
        _sync_choices(
            db,
            turn,
            {"A": data.choices.A, "B": data.choices.B},
            character,
        )

    db.flush()
    return get_turn_by_id(db, turn_id)


def delete_turn(db: Session, turn_id: int) -> Turn:
    turn = _get_turn_or_raise(db, turn_id)
    now = datetime.now(timezone.utc)
    turn.deleted_at = now
    for choice in turn.choices:
        if choice.deleted_at is None:
            choice.deleted_at = now
    db.flush()
    return db.scalar(_turn_query().where(Turn.id == turn_id))


def reorder_turns(db: Session, data: TurnReorderRequest) -> List[Turn]:
    scenario_id = data.scenario_id
    _get_scenario_or_raise(db, scenario_id)

    turns: List[Turn] = []
    for turn_id in data.ids:
        turn = _get_turn_or_raise(db, turn_id)
        if turn.scenario_id != scenario_id:
            raise TurnNotFoundError(turn_id)
        turns.append(turn)

    temp_offset = 1_000_000
    for turn in turns:
        turn.sort_order = temp_offset + turn.id
    db.flush()

    for index, turn in enumerate(turns):
        turn.sort_order = index
    db.flush()

    turn_ids = [turn.id for turn in turns]
    reloaded = list(
        db.scalars(
            _turn_query()
            .where(Turn.id.in_(turn_ids))
            .order_by(Turn.sort_order, Turn.id)
        )
    )
    return reloaded
