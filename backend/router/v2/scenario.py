from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.pagination import ALLOWED_PAGE_SIZES, PaginatedResponse
from models.scenario import (
    ScenarioAdminResponse,
    ScenarioCreate,
    ScenarioReorderRequest,
    ScenarioUpdate,
)
from repositories import character as character_repository
from repositories import scenario as scenario_repository
from router.v2.deps import require_content_admin

admin_router = APIRouter(
    prefix="/api/v2/admin/scenarios",
    tags=["Scenario v2 Admin"],
    dependencies=[Depends(require_content_admin)],
)


def _map_scenarios(scenarios) -> List[ScenarioAdminResponse]:
    return [ScenarioAdminResponse.from_orm_row(scenario) for scenario in scenarios]


@admin_router.get("", response_model=PaginatedResponse[ScenarioAdminResponse])
def list_scenarios_admin(
    character_id: Optional[int] = Query(None, ge=1, description="인물 DB id"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
):
    """어드민 — 시나리오 목록."""
    if page_size not in ALLOWED_PAGE_SIZES:
        raise HTTPException(
            status_code=422,
            detail="페이지당 항목 수는 10, 20, 50, 100 중 하나여야 합니다.",
        )

    scenarios, total = scenario_repository.list_scenarios_paginated(
        db,
        character_id=character_id,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[ScenarioAdminResponse](
        items=_map_scenarios(scenarios),
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@admin_router.patch("/reorder", response_model=List[ScenarioAdminResponse])
def reorder_scenarios(
    body: ScenarioReorderRequest,
    db: Session = Depends(get_db),
):
    """어드민 — 인물 내 시나리오 순서 변경."""
    try:
        scenarios = scenario_repository.reorder_scenarios(db, body)
        db.commit()
    except character_repository.CharacterNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except scenario_repository.ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return _map_scenarios(scenarios)


@admin_router.get("/{scenario_id}", response_model=ScenarioAdminResponse)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    """어드민 — 시나리오 상세."""
    try:
        scenario = scenario_repository.get_scenario_by_id(db, scenario_id)
    except scenario_repository.ScenarioNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ScenarioAdminResponse.from_orm_row(scenario)


@admin_router.post("", response_model=ScenarioAdminResponse, status_code=201)
def create_scenario(body: ScenarioCreate, db: Session = Depends(get_db)):
    """어드민 — 시나리오 생성."""
    try:
        scenario = scenario_repository.create_scenario(db, body)
        db.commit()
    except character_repository.CharacterNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ScenarioAdminResponse.from_orm_row(scenario)


@admin_router.patch("/{scenario_id}", response_model=ScenarioAdminResponse)
def update_scenario(
    scenario_id: int,
    body: ScenarioUpdate,
    db: Session = Depends(get_db),
):
    """어드민 — 시나리오 수정."""
    try:
        scenario = scenario_repository.update_scenario(db, scenario_id, body)
        db.commit()
    except character_repository.CharacterNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except scenario_repository.ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ScenarioAdminResponse.from_orm_row(scenario)


@admin_router.delete("/{scenario_id}", response_model=ScenarioAdminResponse)
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    """어드민 — 시나리오 소프트 삭제."""
    try:
        scenario = scenario_repository.delete_scenario(db, scenario_id)
        db.commit()
    except scenario_repository.ScenarioNotFoundError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ScenarioAdminResponse.from_orm_row(scenario)
