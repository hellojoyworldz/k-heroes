"""어드민 인물 목록 검색 필터 (SQLite + SQLAlchemy)."""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.sql import Select

from db.models import Character


def _normalize(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def apply_character_search_filters(
    query: Select,
    *,
    name: Optional[str] = None,
    tag: Optional[str] = None,
) -> Select:
    """이름 / keywords 태그 부분 일치. 둘 다 주면 AND."""
    normalized_name = _normalize(name)
    normalized_tag = _normalize(tag)

    if normalized_name:
        query = query.where(Character.name.ilike(f"%{normalized_name}%"))

    if normalized_tag:
        keyword_elements = func.json_each(Character.keywords).table_valued(
            "value", joins_implicitly=True
        )
        query = query.where(keyword_elements.c.value.ilike(f"%{normalized_tag}%"))

    return query
