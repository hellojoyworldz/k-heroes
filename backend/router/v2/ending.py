from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.ending import EndingAdminResponse, EndingCreate, EndingUpdate
from repositories import ending as ending_repository
from repositories.scenario import ScenarioNotFoundError
from router.v2.deps import verify_admin_token

admin_router = APIRouter(
    prefix="/api/v2/admin/endings",
    tags=["Ending v2 Admin"],
    dependencies=[Depends(verify_admin_token)],
)


@admin_router.get("", response_model=List[EndingAdminResponse])
def list_endings(
    scenario_id: Optional[int] = Query(None, description="시나리오 DB id (생략=전체)"),
    db: Session = Depends(get_db),
):
    """어드민 — 엔딩 목록."""
    try:
        endings = ending_repository.list_endings(db, scenario_id=scenario_id)
    except ScenarioNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return [EndingAdminResponse.from_orm_row(ending) for ending in endings]


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
