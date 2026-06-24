from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from db.models import Scenario
from models.simulation.admin_refs import AdminCharacterRef, character_ref_from_character


class ScenarioCreate(BaseModel):
    character_id: int = Field(..., ge=1, description="인물 DB id")
    title: str = Field(..., min_length=1, max_length=200, description="시나리오 제목")
    description: str = Field(..., min_length=1, description="시나리오 설명")
    historical_facts: str = Field(..., min_length=1, description="역사적 사실")
    source_story_ids: List[int] = Field(
        default_factory=list,
        description="시나리오 근거 RAG 스토리 ID (선택)",
    )

    model_config = ConfigDict(extra="forbid")


class ScenarioUpdate(BaseModel):
    character_id: Optional[int] = Field(None, ge=1, description="인물 DB id")
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="시나리오 제목")
    description: Optional[str] = Field(None, min_length=1, description="시나리오 설명")
    historical_facts: Optional[str] = Field(None, min_length=1, description="역사적 사실")
    source_story_ids: Optional[List[int]] = Field(None, description="근거 RAG 스토리 ID")
    is_active: Optional[bool] = Field(None, description="true=사용, false=미사용")

    model_config = ConfigDict(extra="forbid")


class ScenarioAdminResponse(BaseModel):
    id: int
    character_id: int
    character: AdminCharacterRef
    sort_order: int
    title: str
    description: str
    historical_facts: str
    source_story_ids: List[int]
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_row(cls, scenario: Scenario) -> "ScenarioAdminResponse":
        return cls(
            id=scenario.id,
            character_id=scenario.character_id,
            character=character_ref_from_character(scenario.character),
            sort_order=scenario.sort_order,
            title=scenario.title,
            description=scenario.description,
            historical_facts=scenario.historical_facts,
            source_story_ids=scenario.source_story_ids or [],
            is_active=scenario.is_active,
            deleted_at=scenario.deleted_at,
        )


class ScenarioReorderRequest(BaseModel):
    character_id: int = Field(..., ge=1, description="인물 DB id")
    ids: List[int] = Field(..., min_length=1, description="시나리오 DB id 배열 (index=sort_order)")
