from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from models.scenario import (
    ScenarioAdminResponse,
    ScenarioCreate,
    ScenarioReorderRequest,
    ScenarioUpdate,
)
from repositories import character as character_repository
from repositories import scenario as scenario_repository
from router.v2.deps import verify_admin_token

admin_router = APIRouter(
    prefix="/api/v2/admin/scenarios",
    tags=["Scenario v2 Admin"],
    dependencies=[Depends(verify_admin_token)],
)


def _map_scenarios(scenarios) -> List[ScenarioAdminResponse]:
    return [ScenarioAdminResponse.from_orm_row(scenario) for scenario in scenarios]


@admin_router.get("", response_model=List[ScenarioAdminResponse])
def list_scenarios_admin(
    name: Optional[str] = Query(None, description="인물 이름 부분 일치"),
    is_active: Optional[bool] = Query(None, description="true=활성만, false=비활성만, 생략=전체"),
    db: Session = Depends(get_db),
):
    """어드민 — 시나리오 목록."""
    scenarios = scenario_repository.list_scenarios(db, name=name, is_active=is_active)
    return _map_scenarios(scenarios)


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
