from datetime import datetime, timezone
from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from db.models import Character, Choice, Scenario, Turn
from models.turn import ChoiceWrite, TurnCreate, TurnReorderRequest, TurnUpdate
from repositories.character import TurnStatNotFoundError
from repositories.scenario import ScenarioNotFoundError, _get_scenario_or_raise


class TurnNotFoundError(Exception):
    def __init__(self, turn_id: int):
        self.turn_id = turn_id
        super().__init__(f"Turn id={turn_id} not found")


def _turn_query():
    return select(Turn).options(
        selectinload(Turn.choices),
        selectinload(Turn.scenario)
        .selectinload(Scenario.character)
        .selectinload(Character.character_category),
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
        select(Character).where(
            Character.id == scenario.character_id,
            Character.deleted_at.is_(None),
        )
    )


def _validate_turn_stats(db: Session, character_id: int, items: List) -> List[dict]:
    from db.models import CharacterStat

    resolved: List[dict] = []
    for item in items:
        stat_id = item.stat_id if hasattr(item, "stat_id") else item["stat_id"]
        delta = item.delta if hasattr(item, "delta") else item["delta"]
        stat_row = db.scalar(
            select(CharacterStat).where(
                CharacterStat.id == stat_id,
                CharacterStat.character_id == character_id,
                CharacterStat.deleted_at.is_(None),
            )
        )
        if not stat_row:
            raise TurnStatNotFoundError(stat_id)
        resolved.append({"stat_id": stat_id, "delta": delta})
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
    character_id: int,
) -> None:
    existing_by_key = {
        choice.choice_key: choice
        for choice in turn.choices
        if choice.deleted_at is None
    }

    for key in ("A", "B"):
        data = choices[key]
        turn_stats = _validate_turn_stats(db, character_id, data.turn_stats)
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


def list_turns(db: Session, *, scenario_id: Optional[int] = None) -> List[Turn]:
    query = (
        _turn_query()
        .join(Turn.scenario)
        .join(Scenario.character)
        .where(Turn.deleted_at.is_(None))
        .order_by(Character.name, Scenario.sort_order, Turn.sort_order, Turn.id)
    )
    if scenario_id is not None:
        _get_scenario_or_raise(db, scenario_id)
        query = query.where(Turn.scenario_id == scenario_id)
    return list(db.scalars(query))


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
    )
    db.add(turn)
    db.flush()

    _sync_choices(
        db,
        turn,
        {"A": data.choices.A, "B": data.choices.B},
        character.id,
    )
    return get_turn_by_id(db, turn.id)


def update_turn(db: Session, turn_id: int, data: TurnUpdate) -> Turn:
    turn = _get_turn_or_raise(db, turn_id)
    scenario = _get_scenario_or_raise(db, turn.scenario_id)
    character = _get_character_for_scenario(db, scenario)
    if not character:
        raise ScenarioNotFoundError(turn.scenario_id)

    updates = data.model_dump(exclude_unset=True, exclude={"choices"})
    for field, value in updates.items():
        setattr(turn, field, value)

    if "choices" in data.model_fields_set and data.choices is not None:
        _sync_choices(
            db,
            turn,
            {"A": data.choices.A, "B": data.choices.B},
            character.id,
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
