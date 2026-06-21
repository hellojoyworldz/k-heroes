from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.turn import TurnAdminResponse, TurnCreate, TurnReorderRequest, TurnUpdate
from repositories import turn as turn_repository
from repositories.character import TurnStatNotFoundError
from repositories.scenario import ScenarioNotFoundError
from router.v2.deps import verify_admin_token

admin_router = APIRouter(
    prefix="/api/v2/admin/turns",
    tags=["Turn v2 Admin"],
    dependencies=[Depends(verify_admin_token)],
)


@admin_router.get("", response_model=List[TurnAdminResponse])
def list_turns(
    scenario_id: Optional[int] = Query(None, description="시나리오 DB id (생략=전체)"),
    db: Session = Depends(get_db),
):
    """어드민 — 턴 목록."""
    try:
        return turn_repository.list_turns(db, scenario_id=scenario_id)
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


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

    return turns


@admin_router.get("/{turn_id}", response_model=TurnAdminResponse)
def get_turn(turn_id: int, db: Session = Depends(get_db)):
    """어드민 — 턴 상세."""
    try:
        return turn_repository.get_turn_by_id(db, turn_id)
    except turn_repository.TurnNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@admin_router.post("", response_model=TurnAdminResponse, status_code=201)
def create_turn(body: TurnCreate, db: Session = Depends(get_db)):
    """어드민 — 턴 생성."""
    try:
        turn = turn_repository.create_turn(db, body)
        db.commit()
    except ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except TurnStatNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return turn


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
    except TurnStatNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return turn


@admin_router.delete("/{turn_id}", response_model=TurnAdminResponse)
def delete_turn(turn_id: int, db: Session = Depends(get_db)):
    """어드민 — 턴 소프트 삭제."""
    try:
        turn = turn_repository.delete_turn(db, turn_id)
        db.commit()
    except turn_repository.TurnNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return turn
