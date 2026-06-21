from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from db.models import Character, CharacterCategory
from models.character_category import (
    CharacterCategoryCreate,
    CharacterCategoryPublicItem,
    CharacterCategoryReorderRequest,
    CharacterCategoryUpdate,
)


class CharacterCategoryDuplicateError(Exception):
    def __init__(self, title: str):
        self.title = title
        super().__init__(f"Category '{title}' already exists")


class CharacterCategoryNotFoundError(Exception):
    def __init__(self, category_id: int):
        self.category_id = category_id
        super().__init__(f"Category id={category_id} not found")


def _get_category_or_raise(db: Session, category_id: int) -> CharacterCategory:
    category = db.get(CharacterCategory, category_id)
    if not category or category.deleted_at is not None:
        raise CharacterCategoryNotFoundError(category_id)
    return category


def _ensure_unique_title(db: Session, title: str, exclude_id: Optional[int] = None) -> None:
    existing = db.scalar(
        select(CharacterCategory).where(
            CharacterCategory.title == title,
            CharacterCategory.deleted_at.is_(None),
        )
    )
    if existing and existing.id != exclude_id:
        raise CharacterCategoryDuplicateError(title)


def _next_sort_order(db: Session) -> int:
    current_max = db.scalar(
        select(func.max(CharacterCategory.sort_order)).where(CharacterCategory.deleted_at.is_(None))
    )
    return (current_max or -1) + 1


def _active_character_join():
    return and_(
        Character.category_id == CharacterCategory.id,
        Character.is_active.is_(True),
        Character.deleted_at.is_(None),
    )


def list_public_categories(db: Session) -> List[CharacterCategoryPublicItem]:
    rows = db.execute(
        select(
            CharacterCategory.id,
            CharacterCategory.title,
            CharacterCategory.description,
            func.count(Character.id).label("length"),
        )
        .outerjoin(Character, _active_character_join())
        .where(
            CharacterCategory.is_active.is_(True),
            CharacterCategory.deleted_at.is_(None),
        )
        .group_by(CharacterCategory.id)
        .order_by(CharacterCategory.sort_order, CharacterCategory.id)
    ).all()

    return [
        CharacterCategoryPublicItem(
            id=row.id,
            title=row.title,
            description=row.description,
            length=row.length,
        )
        for row in rows
    ]


def list_categories(db: Session, *, is_active: Optional[bool] = None) -> List[CharacterCategory]:
    query = (
        select(CharacterCategory)
        .where(CharacterCategory.deleted_at.is_(None))
        .order_by(CharacterCategory.sort_order, CharacterCategory.id)
    )
    if is_active is not None:
        query = query.where(CharacterCategory.is_active.is_(is_active))
    return list(db.scalars(query))


def get_category_by_id(db: Session, category_id: int) -> CharacterCategory:
    return _get_category_or_raise(db, category_id)


def get_category_by_title(db: Session, title: str) -> Optional[CharacterCategory]:
    return db.scalar(
        select(CharacterCategory).where(
            CharacterCategory.title == title,
            CharacterCategory.deleted_at.is_(None),
        )
    )


def create_category(db: Session, data: CharacterCategoryCreate) -> CharacterCategory:
    _ensure_unique_title(db, data.title)

    category = CharacterCategory(
        title=data.title,
        description=data.description,
        sort_order=_next_sort_order(db),
        is_active=True,
    )
    db.add(category)
    db.flush()
    db.refresh(category)
    return category


def update_category(
    db: Session, category_id: int, data: CharacterCategoryUpdate
) -> CharacterCategory:
    category = _get_category_or_raise(db, category_id)
    updates = data.model_dump(exclude_unset=True)

    if "title" in updates:
        _ensure_unique_title(db, updates["title"], exclude_id=category_id)

    for field, value in updates.items():
        setattr(category, field, value)

    db.flush()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int) -> CharacterCategory:
    category = _get_category_or_raise(db, category_id)
    category.deleted_at = datetime.now(timezone.utc)
    db.flush()
    db.refresh(category)
    return category


def reorder_categories(db: Session, data: CharacterCategoryReorderRequest) -> List[CharacterCategory]:
    categories: List[CharacterCategory] = []
    for index, category_id in enumerate(data.ids):
        category = _get_category_or_raise(db, category_id)
        category.sort_order = index
        categories.append(category)

    db.flush()
    for category in categories:
        db.refresh(category)

    categories.sort(key=lambda c: c.sort_order)
    return categories
