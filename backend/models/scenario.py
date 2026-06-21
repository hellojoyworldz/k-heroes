from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


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
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="시나리오 제목")
    description: Optional[str] = Field(None, min_length=1, description="시나리오 설명")
    historical_facts: Optional[str] = Field(None, min_length=1, description="역사적 사실")
    source_story_ids: Optional[List[int]] = Field(None, description="근거 RAG 스토리 ID")
    is_active: Optional[bool] = Field(None, description="true=사용, false=미사용")

    model_config = ConfigDict(extra="forbid")


class ScenarioAdminResponse(BaseModel):
    id: int
    character_id: int
    character_name: str = ""
    sort_order: int
    title: str
    description: str
    historical_facts: str
    source_story_ids: List[int]
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="wrap")
    @classmethod
    def attach_character_name(cls, value, handler):
        if hasattr(value, "character"):
            result = handler(value)
            return result.model_copy(update={"character_name": value.character.name})
        return handler(value)


class ScenarioReorderRequest(BaseModel):
    character_id: int = Field(..., ge=1, description="인물 DB id")
    ids: List[int] = Field(..., min_length=1, description="시나리오 DB id 배열 (index=sort_order)")
