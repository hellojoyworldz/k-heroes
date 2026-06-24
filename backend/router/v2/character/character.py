from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from repositories.character import character as character_repository
from repositories.character import character_category as character_category_repository
from repositories.simulation.content import (
    CharacterNotFoundError as PublicCharacterNotFoundError,
    get_character_card_by_id,
    list_characters as list_public_characters,
)
from db.database import get_db
from models.character.character import (
    CharacterAdminResponse,
    CharacterCard,
    CharacterCreate,
    CharacterReorderRequest,
    CharacterUpdate,
)
from models.common.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from router.v2.deps import require_content_admin

router = APIRouter(prefix="/api/v2/characters", tags=["Character v2"])
admin_router = APIRouter(
    prefix="/api/v2/admin/characters",
    tags=["Character v2 Admin"],
    dependencies=[Depends(require_content_admin)],
)


@router.get("", response_model=List[CharacterCard])
async def get_characters(
    category_id: Optional[int] = Query(None, description="카테고리 DB id"),
    db: Session = Depends(get_db),
):
    """공개 API — 활성 인물 목록."""
    return list_public_characters(db, category_id=category_id)


@router.get("/{character_id}", response_model=CharacterCard)
async def get_character_details(character_id: int, db: Session = Depends(get_db)):
    """공개 API — DB id로 인물 상세."""
    try:
        return get_character_card_by_id(db, character_id)
    except PublicCharacterNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Character id={character_id} not found in profiles.",
        )


@admin_router.get("", response_model=PaginatedResponse[CharacterAdminResponse])
def list_characters(
    category_id: Optional[int] = Query(None, description="카테고리 DB id"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    name: Optional[str] = Query(None, description="이름 부분 일치"),
    tag: Optional[str] = Query(None, description="keywords 태그 부분 일치"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 인물 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    characters, total = character_repository.list_characters_paginated(
        db,
        category_id=category_id,
        is_active=is_active,
        name=name,
        tag=tag,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[CharacterAdminResponse](
        items=characters,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@admin_router.patch("/reorder", response_model=List[CharacterAdminResponse])
def reorder_characters(
    body: CharacterReorderRequest,
    db: Session = Depends(get_db),
):
    """어드민 — 카테고리 내 인물 순서 변경."""
    try:
        characters = character_repository.reorder_characters(db, body)
        db.commit()
    except character_repository.CharacterNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except character_repository.CharacterReorderError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return characters


@admin_router.get("/{character_id}", response_model=CharacterAdminResponse)
def get_character(character_id: int, db: Session = Depends(get_db)):
    """어드민 — DB id로 인물 상세."""
    try:
        return character_repository.get_character_by_id(db, character_id)
    except character_repository.CharacterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@admin_router.post("", response_model=CharacterAdminResponse, status_code=201)
def create_character(
    body: CharacterCreate,
    db: Session = Depends(get_db),
):
    """어드민 — 인물 생성."""
    try:
        character = character_repository.create_character(db, body)
        db.commit()
    except character_repository.CharacterDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except character_repository.CharacterStatNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return character


@admin_router.patch("/{character_id}", response_model=CharacterAdminResponse)
def update_character(
    character_id: int,
    body: CharacterUpdate,
    db: Session = Depends(get_db),
):
    """어드민 — 인물 수정."""
    try:
        character = character_repository.update_character(db, character_id, body)
        db.commit()
    except character_repository.CharacterNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except character_repository.CharacterStatNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except character_repository.CharacterDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return character


@admin_router.delete("/{character_id}", response_model=CharacterAdminResponse)
def delete_character(character_id: int, db: Session = Depends(get_db)):
    """어드민 — 인물 소프트 삭제."""
    try:
        character = character_repository.delete_character(db, character_id)
        db.commit()
    except character_repository.CharacterNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return character
