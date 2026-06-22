from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from db.models import Character
from models.character import CharacterCreate, CharacterReorderRequest, CharacterUpdate, TurnStatWrite
from repositories import character_category
from repositories.character_search import apply_character_search_filters
from repositories.character_stats import stats_to_storage
from repositories.character_turn_stats import (
    CharacterTurnStatNotFoundError,
    soft_delete_character_turn_stats,
    sync_character_turn_stats,
)


class CharacterDuplicateError(Exception):
    def __init__(self, name: str):
        self.name = name
        super().__init__(f"이미 등록된 인물 이름입니다. ({name})")


class CharacterNotFoundError(Exception):
    def __init__(self, character_id: int):
        self.character_id = character_id
        super().__init__(f"인물을 찾을 수 없습니다. (ID: {character_id})")


class CharacterReorderError(Exception):
    pass


class CharacterStatNotFoundError(CharacterTurnStatNotFoundError):
    """하위 호환 alias (턴 API 예외 처리)."""


def _character_admin_query():
    return (
        select(Character)
        .join(Character.character_category)
        .where(Character.deleted_at.is_(None))
        .options(
            selectinload(Character.character_category),
            selectinload(Character.turn_stats),
        )
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


def _filtered_character_query(
    *,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    name: Optional[str] = None,
    tag: Optional[str] = None,
):
    query = _character_admin_query()
    if category_id is not None:
        query = query.where(Character.category_id == category_id)
    if is_active is not None:
        query = query.where(Character.is_active.is_(is_active))
    query = apply_character_search_filters(query, name=name, tag=tag)
    if category_id is not None:
        return query.order_by(Character.sort_order, Character.id)
    return query.order_by(Character.id)


def list_characters(
    db: Session,
    *,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    name: Optional[str] = None,
    tag: Optional[str] = None,
) -> List[Character]:
    query = _filtered_character_query(
        category_id=category_id,
        is_active=is_active,
        name=name,
        tag=tag,
    )
    return list(db.scalars(query))


def list_characters_paginated(
    db: Session,
    *,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    name: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Character], int]:
    query = _filtered_character_query(
        category_id=category_id,
        is_active=is_active,
        name=name,
        tag=tag,
    )
    total = db.scalar(
        select(func.count()).select_from(query.order_by(None).subquery())
    ) or 0
    items = list(db.scalars(query.offset((page - 1) * page_size).limit(page_size)))
    return items, total


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
        associated_stories=data.associated_stories.to_storage_dict(),
        stats=stats_to_storage(data.stats),
        is_active=True,
    )
    db.add(character)
    db.flush()

    if data.turn_stats:
        sync_character_turn_stats(db, character, data.turn_stats)

    return get_character_by_id(db, character.id)


def update_character(db: Session, character_id: int, data: CharacterUpdate) -> Character:
    character = _get_character_or_raise(db, character_id)
    updates = data.model_dump(exclude_unset=True, exclude={"stats", "turn_stats"})

    if "name" in updates:
        _ensure_unique_name(db, updates["name"], exclude_id=character_id)
    if "category_id" in updates:
        character_category.get_category_by_id(db, updates["category_id"])
        if updates["category_id"] != character.category_id:
            updates["sort_order"] = _next_sort_order(db, updates["category_id"])
    if "associated_stories" in data.model_fields_set and data.associated_stories is not None:
        updates["associated_stories"] = data.associated_stories.to_storage_dict()

    for field, value in updates.items():
        setattr(character, field, value)

    if "stats" in data.model_fields_set:
        character.stats = stats_to_storage(data.stats or [])

    if "turn_stats" in data.model_fields_set:
        sync_character_turn_stats(db, character, data.turn_stats or [])

    db.flush()
    return get_character_by_id(db, character_id)


def delete_character(db: Session, character_id: int) -> Character:
    character = _get_character_or_raise(db, character_id)
    now = datetime.now(timezone.utc)
    character.deleted_at = now
    soft_delete_character_turn_stats(character, deleted_at=now)
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
                f"인물 ID {character_id}은(는) 선택한 카테고리에 속하지 않습니다."
            )
        character.sort_order = index
        updated.append(character)

    db.flush()
    for character in updated:
        db.refresh(character)

    return list_characters(db, category_id=data.category_id)
