from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from repositories import character_category as character_category_repository
from db.database import get_db
from models.character_category import (
    CharacterCategoryAdminResponse,
    CharacterCategoryCreate,
    CharacterCategoryPublicItem,
    CharacterCategoryReorderRequest,
    CharacterCategoryUpdate,
)
from models.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from router.v2.deps import require_content_admin

router = APIRouter(prefix="/api/v2/character-categories", tags=["Character Categories v2"])
admin_router = APIRouter(
    prefix="/api/v2/admin/character-categories",
    tags=["Character Categories v2 Admin"],
    dependencies=[Depends(require_content_admin)],
)

@router.get("", response_model=List[CharacterCategoryPublicItem])
def list_character_categories(db: Session = Depends(get_db)):
    """공개 API — 활성 카테고리 목록."""
    return character_category_repository.list_public_categories(db)


@admin_router.get("", response_model=PaginatedResponse[CharacterCategoryAdminResponse])
def list_character_categories_admin(
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 카테고리 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    categories, total = character_category_repository.list_categories(
        db,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[CharacterCategoryAdminResponse](
        items=categories,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@admin_router.patch("/reorder", response_model=List[CharacterCategoryAdminResponse])
def reorder_character_categories(
    body: CharacterCategoryReorderRequest,
    db: Session = Depends(get_db),
):
    """어드민 — 카테고리 순서 변경."""
    try:
        categories = character_category_repository.reorder_categories(db, body)
        db.commit()
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return categories


@admin_router.get("/{category_id}", response_model=CharacterCategoryAdminResponse)
def get_character_category(category_id: int, db: Session = Depends(get_db)):
    """어드민 — 카테고리 상세."""
    try:
        return character_category_repository.get_category_by_id(db, category_id)
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@admin_router.post("", response_model=CharacterCategoryAdminResponse, status_code=201)
def create_character_category(
    body: CharacterCategoryCreate,
    db: Session = Depends(get_db),
):
    """어드민 — 카테고리 생성."""
    try:
        category = character_category_repository.create_category(db, body)
        db.commit()
    except character_category_repository.CharacterCategoryDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return category


@admin_router.patch("/{category_id}", response_model=CharacterCategoryAdminResponse)
def update_character_category(
    category_id: int,
    body: CharacterCategoryUpdate,
    db: Session = Depends(get_db),
):
    """어드민 — 카테고리 수정."""
    try:
        category = character_category_repository.update_category(db, category_id, body)
        db.commit()
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except character_category_repository.CharacterCategoryDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return category


@admin_router.delete("/{category_id}", response_model=CharacterCategoryAdminResponse)
def delete_character_category(category_id: int, db: Session = Depends(get_db)):
    """어드민 — 카테고리 소프트 삭제."""
    try:
        category = character_category_repository.delete_category(db, category_id)
        db.commit()
    except character_category_repository.CharacterCategoryNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return category
