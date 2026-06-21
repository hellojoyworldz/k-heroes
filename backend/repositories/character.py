from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from db.models import Character, CharacterCategory, CharacterStat
from models.character import CharacterCreate, CharacterReorderRequest, CharacterUpdate, TurnStatWrite
from repositories import character_category
from repositories.character_search import apply_character_search_filters


class CharacterDuplicateError(Exception):
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"Character '{name}' already exists")


class CharacterNotFoundError(Exception):
    def __init__(self, character_id: int):
        self.character_id = character_id
        super().__init__(f"Character id={character_id} not found")


class CharacterReorderError(Exception):
    pass


class TurnStatNotFoundError(Exception):
    def __init__(self, stat_id: int):
        self.stat_id = stat_id
        super().__init__(f"Turn stat id={stat_id} not found")


def _character_admin_query():
    return (
        select(Character)
        .join(Character.character_category)
        .where(Character.deleted_at.is_(None))
        .options(
            selectinload(Character.character_category),
            selectinload(Character.stats),
        )
        .order_by(CharacterCategory.sort_order, Character.sort_order, Character.name)
    )


def _get_character_or_raise(db: Session, character_id: int) -> Character:
    character = db.scalar(
        _character_admin_query().where(Character.id == character_id)
    )
    if not character:
        raise CharacterNotFoundError(character_id)
    return character


def _ensure_unique_name(db: Session, name: str, exclude_id: Optional[int] = None) -> None:
    existing = db.scalar(select(Character).where(Character.name == name))
    if existing and existing.id != exclude_id:
        raise CharacterDuplicateError(name)


def _next_sort_order(db: Session, category_id: int) -> int:
    current_max = db.scalar(
        select(func.max(Character.sort_order)).where(
            Character.category_id == category_id,
            Character.deleted_at.is_(None),
        )
    )
    return (current_max or -1) + 1


def _sync_turn_stats(db: Session, character: Character, items: List[TurnStatWrite]) -> None:
    existing_by_id = {
        stat.id: stat
        for stat in character.stats
        if stat.deleted_at is None
    }
    kept_ids: set[int] = set()

    for index, item in enumerate(items):
        if item.id is not None:
            stat = existing_by_id.get(item.id)
            if not stat or stat.character_id != character.id:
                raise TurnStatNotFoundError(item.id)
            stat.name = item.name
            stat.value = item.value
            stat.sort_order = index
            stat.is_active = True
            kept_ids.add(item.id)
        else:
            db.add(
                CharacterStat(
                    character_id=character.id,
                    name=item.name,
                    value=item.value,
                    desc="",
                    sort_order=index,
                    is_active=True,
                )
            )

    for stat_id, stat in existing_by_id.items():
        if stat_id not in kept_ids:
            stat.deleted_at = datetime.now(timezone.utc)

    db.flush()
    db.refresh(character, attribute_names=["stats"])


def list_characters(
    db: Session,
    *,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    name: Optional[str] = None,
    tag: Optional[str] = None,
) -> List[Character]:
    query = _character_admin_query()
    if category_id is not None:
        query = query.where(Character.category_id == category_id)
    if is_active is not None:
        query = query.where(Character.is_active.is_(is_active))
    query = apply_character_search_filters(query, name=name, tag=tag)
    return list(db.scalars(query))


def get_character_by_id(db: Session, character_id: int) -> Character:
    return _get_character_or_raise(db, character_id)


def create_character(db: Session, data: CharacterCreate) -> Character:
    _ensure_unique_name(db, data.name)
    character_category.get_category_by_id(db, data.category_id)

    sort_order = _next_sort_order(db, data.category_id)

    character = Character(
        name=data.name,
        category_id=data.category_id,
        sort_order=sort_order,
        era=data.era,
        era_tag=data.era_tag,
        role=data.role,
        years=data.years,
        image_url=data.image_url,
        situation=data.situation,
        one_line_summary=data.one_line_summary,
        mbti=data.mbti,
        mbti_nickname=data.mbti_nickname,
        mbti_e_i=data.mbti_e_i,
        mbti_s_n=data.mbti_s_n,
        mbti_t_f=data.mbti_t_f,
        mbti_j_p=data.mbti_j_p,
        intro_quote=data.intro_quote,
        intro_desc=data.intro_desc,
        keywords=data.keywords,
        associated_stories=data.associated_stories,
        is_active=True,
    )
    db.add(character)
    db.flush()

    if data.turn_stats:
        _sync_turn_stats(db, character, data.turn_stats)

    return get_character_by_id(db, character.id)


def update_character(db: Session, character_id: int, data: CharacterUpdate) -> Character:
    character = _get_character_or_raise(db, character_id)
    updates = data.model_dump(exclude_unset=True, exclude={"turn_stats"})

    if "name" in updates:
        _ensure_unique_name(db, updates["name"], exclude_id=character_id)
    if "category_id" in updates:
        character_category.get_category_by_id(db, updates["category_id"])

    for field, value in updates.items():
        setattr(character, field, value)

    if "turn_stats" in data.model_fields_set:
        _sync_turn_stats(db, character, data.turn_stats or [])

    db.flush()
    return get_character_by_id(db, character_id)


def delete_character(db: Session, character_id: int) -> Character:
    character = _get_character_or_raise(db, character_id)
    character.deleted_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(character)
    return character


def reorder_characters(db: Session, data: CharacterReorderRequest) -> List[Character]:
    character_category.get_category_by_id(db, data.category_id)

    updated: List[Character] = []
    for index, character_id in enumerate(data.ids):
        character = _get_character_or_raise(db, character_id)
        if character.category_id != data.category_id:
            raise CharacterReorderError(
                f"Character id={character_id} does not belong to category id={data.category_id}"
            )
        character.sort_order = index
        updated.append(character)

    db.flush()
    for character in updated:
        db.refresh(character)

    return list_characters(db, category_id=data.category_id)
