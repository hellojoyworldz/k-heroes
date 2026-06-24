"""어드민 인물 목록 검색 필터 (Supabase/PostgreSQL + SQLAlchemy)."""

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
    db = None,
    name: Optional[str] = None,
    tag: Optional[str] = None,
) -> Select:
    """이름 / keywords 태그 부분 일치. 둘 다 주면 AND."""
    normalized_name = _normalize(name)
    normalized_tag = _normalize(tag)

    if normalized_name:
        query = query.where(Character.name.ilike(f"%{normalized_name}%"))

    if normalized_tag:
        is_sqlite = False
        if db is not None and db.bind is not None:
            is_sqlite = db.bind.dialect.name == "sqlite"

        if is_sqlite:
            # SQLite에서는 json_each를 사용하여 유니코드 이스케이프 문자 디코딩 호환 검색
            keyword_elements = func.json_each(Character.keywords).table_valued(
                "value", joins_implicitly=True
            )
            query = query.where(keyword_elements.c.value.ilike(f"%{normalized_tag}%"))
        else:
            # PostgreSQL(Supabase) 등에서는 JSON 컬럼을 문자열로 캐스팅하여 ilike 검색 (유니코드 자동 디코딩됨)
            from sqlalchemy import cast, String
            query = query.where(cast(Character.keywords, String).ilike(f"%{normalized_tag}%"))

    return query
