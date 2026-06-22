from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from db.models import Ending
from models.admin_refs import (
    AdminCharacterRef,
    AdminScenarioRef,
    character_ref_from_scenario,
    scenario_ref_from_scenario,
)
from models.simulation import RecommendedPlace, SummaryItem


class EndingCreate(BaseModel):
    scenario_id: int = Field(..., ge=1, description="시나리오 DB id")
    path_key: str = Field(..., min_length=1, max_length=50, description="선택 경로 (예: A-A-B)")
    ending_type: str = Field(..., min_length=1, max_length=50, description="엔딩 유형")
    title: str = Field(..., min_length=1, max_length=200, description="엔딩 제목")
    history_fact: str = Field(..., min_length=1, description="역사적 사실")
    story_headline: str = Field(..., min_length=1, description="스토리 헤드라인")
    story_contents: str = Field(..., min_length=1, description="스토리 본문")
    factual_contents: str = Field(default="", description="사실 본문")
    image_url: str = Field(default="", max_length=500, description="엔딩 이미지 URL")
    summary_items: List[SummaryItem] = Field(default_factory=list, description="요약 항목")
    recommended_places: List[RecommendedPlace] = Field(default_factory=list, description="추천 방문지")

    model_config = ConfigDict(extra="forbid")


class EndingUpdate(BaseModel):
    scenario_id: Optional[int] = Field(None, ge=1, description="시나리오 DB id")
    path_key: Optional[str] = Field(None, min_length=1, max_length=50, description="선택 경로")
    ending_type: Optional[str] = Field(None, min_length=1, max_length=50, description="엔딩 유형")
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="엔딩 제목")
    history_fact: Optional[str] = Field(None, min_length=1, description="역사적 사실")
    story_headline: Optional[str] = Field(None, min_length=1, description="스토리 헤드라인")
    story_contents: Optional[str] = Field(None, min_length=1, description="스토리 본문")
    factual_contents: Optional[str] = Field(None, description="사실 본문")
    image_url: Optional[str] = Field(None, max_length=500, description="엔딩 이미지 URL")
    summary_items: Optional[List[SummaryItem]] = Field(None, description="요약 항목")
    recommended_places: Optional[List[RecommendedPlace]] = Field(None, description="추천 방문지")
    is_active: Optional[bool] = Field(None, description="사용 여부")

    model_config = ConfigDict(extra="forbid")


class EndingAdminResponse(BaseModel):
    id: int
    scenario_id: int
    scenario: AdminScenarioRef
    character: AdminCharacterRef
    sort_order: int
    path_key: str
    ending_type: str
    title: str
    history_fact: str
    story_headline: str
    story_contents: str
    factual_contents: str
    image_url: str
    summary_items: List[SummaryItem]
    recommended_places: List[RecommendedPlace]
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_row(cls, ending: Ending) -> "EndingAdminResponse":
        scenario = ending.scenario
        return cls(
            id=ending.id,
            scenario_id=ending.scenario_id,
            scenario=scenario_ref_from_scenario(scenario),
            character=character_ref_from_scenario(scenario),
            sort_order=ending.sort_order,
            path_key=ending.path_key,
            ending_type=ending.ending_type,
            title=ending.title,
            history_fact=ending.history_fact,
            story_headline=ending.story_headline,
            story_contents=ending.story_contents,
            factual_contents=ending.factual_contents or "",
            image_url=ending.image_url or "",
            summary_items=[
                SummaryItem(title=item.get("title", ""), desc=item.get("desc", ""))
                for item in (ending.summary_items or [])
            ],
            recommended_places=[
                RecommendedPlace(
                    address=item.get("address", ""),
                    name=item.get("name", ""),
                    description=item.get("description", ""),
                    link=item.get("link", "") or "",
                    image_url=item.get("image_url", "") or "",
                )
                for item in (ending.recommended_places or [])
            ],
            is_active=ending.is_active,
            deleted_at=ending.deleted_at,
        )


class EndingReorderRequest(BaseModel):
    scenario_id: int = Field(..., ge=1, description="시나리오 DB id")
    ids: List[int] = Field(..., min_length=1, description="엔딩 DB id 배열 (index = sort_order)")

    model_config = ConfigDict(extra="forbid")
