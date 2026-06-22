from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.ending import EndingAdminResponse, EndingCreate, EndingReorderRequest, EndingUpdate
from models.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from repositories import ending as ending_repository
from repositories.character import CharacterNotFoundError
from repositories.scenario import ScenarioNotFoundError
from router.v2.deps import require_content_admin

admin_router = APIRouter(
    prefix="/api/v2/admin/endings",
    tags=["Ending v2 Admin"],
    dependencies=[Depends(require_content_admin)],
)


def _map_endings(endings) -> List[EndingAdminResponse]:
    return [EndingAdminResponse.from_orm_row(ending) for ending in endings]


@admin_router.get("", response_model=PaginatedResponse[EndingAdminResponse])
def list_endings(
    character_id: Optional[int] = Query(None, ge=1, description="인물 DB id"),
    scenario_id: Optional[int] = Query(None, ge=1, description="시나리오 DB id"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 엔딩 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    try:
        endings, total = ending_repository.list_endings_paginated(
            db,
            character_id=character_id,
            scenario_id=scenario_id,
            is_active=is_active,
            page=page,
            page_size=page_size,
        )
    except CharacterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return PaginatedResponse[EndingAdminResponse](
        items=_map_endings(endings),
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@admin_router.patch("/reorder", response_model=List[EndingAdminResponse])
def reorder_endings(body: EndingReorderRequest, db: Session = Depends(get_db)):
    """어드민 — 시나리오 내 엔딩 순서 변경."""
    try:
        endings = ending_repository.reorder_endings(db, body)
        db.commit()
    except ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ending_repository.EndingNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return _map_endings(endings)


@admin_router.get("/{ending_id}", response_model=EndingAdminResponse)
def get_ending(ending_id: int, db: Session = Depends(get_db)):
    """어드민 — 엔딩 상세."""
    try:
        ending = ending_repository.get_ending_by_id(db, ending_id)
    except ending_repository.EndingNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return EndingAdminResponse.from_orm_row(ending)


@admin_router.post("", response_model=EndingAdminResponse, status_code=201)
def create_ending(body: EndingCreate, db: Session = Depends(get_db)):
    """어드민 — 엔딩 생성."""
    try:
        ending = ending_repository.create_ending(db, body)
        db.commit()
    except ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ending_repository.EndingDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return EndingAdminResponse.from_orm_row(ending)


@admin_router.patch("/{ending_id}", response_model=EndingAdminResponse)
def update_ending(ending_id: int, body: EndingUpdate, db: Session = Depends(get_db)):
    """어드민 — 엔딩 수정."""
    try:
        ending = ending_repository.update_ending(db, ending_id, body)
        db.commit()
    except ending_repository.EndingNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ending_repository.EndingDuplicateError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return EndingAdminResponse.from_orm_row(ending)


@admin_router.delete("/{ending_id}", response_model=EndingAdminResponse)
def delete_ending(ending_id: int, db: Session = Depends(get_db)):
    """어드민 — 엔딩 소프트 삭제."""
    try:
        ending = ending_repository.delete_ending(db, ending_id)
        db.commit()
    except ending_repository.EndingNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return EndingAdminResponse.from_orm_row(ending)
