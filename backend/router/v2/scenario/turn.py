from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.common.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from models.scenario.turn import TurnAdminResponse, TurnCreate, TurnReorderRequest, TurnUpdate
from repositories.scenario import turn as turn_repository
from repositories.character.character import CharacterNotFoundError, CharacterStatNotFoundError
from repositories.scenario.scenario import ScenarioNotFoundError
from router.v2.deps import require_content_admin

admin_router = APIRouter(
    prefix="/api/v2/admin/turns",
    tags=["Turn v2 Admin"],
    dependencies=[Depends(require_content_admin)],
)


def _map_turns(turns) -> List[TurnAdminResponse]:
    return [TurnAdminResponse.from_orm_row(turn) for turn in turns]


@admin_router.get("", response_model=PaginatedResponse[TurnAdminResponse])
def list_turns(
    character_id: Optional[int] = Query(None, ge=1, description="인물 DB id"),
    scenario_id: Optional[int] = Query(None, ge=1, description="시나리오 DB id"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 턴 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    try:
        turns, total = turn_repository.list_turns_paginated(
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

    return PaginatedResponse[TurnAdminResponse](
        items=_map_turns(turns),
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@admin_router.patch("/reorder", response_model=List[TurnAdminResponse])
def reorder_turns(body: TurnReorderRequest, db: Session = Depends(get_db)):
    """어드민 — 시나리오 내 턴 순서 변경."""
    try:
        turns = turn_repository.reorder_turns(db, body)
        db.commit()
    except ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except turn_repository.TurnNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return _map_turns(turns)


@admin_router.get("/{turn_id}", response_model=TurnAdminResponse)
def get_turn(turn_id: int, db: Session = Depends(get_db)):
    """어드민 — 턴 상세."""
    try:
        turn = turn_repository.get_turn_by_id(db, turn_id)
    except turn_repository.TurnNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return TurnAdminResponse.from_orm_row(turn)


@admin_router.post("", response_model=TurnAdminResponse, status_code=201)
def create_turn(body: TurnCreate, db: Session = Depends(get_db)):
    """어드민 — 턴 생성."""
    try:
        turn = turn_repository.create_turn(db, body)
        db.commit()
    except ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CharacterStatNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return TurnAdminResponse.from_orm_row(turn)


@admin_router.patch("/{turn_id}", response_model=TurnAdminResponse)
def update_turn(turn_id: int, body: TurnUpdate, db: Session = Depends(get_db)):
    """어드민 — 턴 수정."""
    try:
        turn = turn_repository.update_turn(db, turn_id, body)
        db.commit()
    except turn_repository.TurnNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CharacterStatNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return TurnAdminResponse.from_orm_row(turn)


@admin_router.delete("/{turn_id}", response_model=TurnAdminResponse)
def delete_turn(turn_id: int, db: Session = Depends(get_db)):
    """어드민 — 턴 소프트 삭제."""
    try:
        turn = turn_repository.delete_turn(db, turn_id)
        db.commit()
    except turn_repository.TurnNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    if not turn:
        raise HTTPException(status_code=404, detail=f"턴을 찾을 수 없습니다. (ID: {turn_id})")

    return TurnAdminResponse.from_orm_row(turn)
