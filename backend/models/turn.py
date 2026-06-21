from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from models.character import ChoiceTurnStatItem


class ChoiceWrite(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="선택지 제목")
    description: str = Field(..., min_length=1, description="선택지 설명")
    choice_image: str = Field(default="", max_length=500, description="선택지 이미지 URL")
    turn_stats: List[ChoiceTurnStatItem] = Field(default_factory=list, description="능력치 변화")
    result_text: str = Field(..., min_length=1, description="선택 결과 텍스트")
    is_historical: bool = Field(..., description="실제 역사 선택 여부")

    model_config = ConfigDict(extra="forbid")


class ChoicesWrite(BaseModel):
    A: ChoiceWrite
    B: ChoiceWrite

    model_config = ConfigDict(extra="forbid")


class TurnCreate(BaseModel):
    scenario_id: int = Field(..., ge=1, description="시나리오 DB id")
    title: str = Field(..., min_length=1, max_length=200, description="턴 제목")
    situation: str = Field(..., min_length=1, description="상황 설명")
    turn_image: str = Field(default="", max_length=500, description="턴 이미지 URL")
    tip_title: str = Field(..., min_length=1, description="팁 질문")
    tip_desc: str = Field(..., min_length=1, description="팁 답변")
    choices: ChoicesWrite = Field(..., description="선택지 A/B (필수)")

    model_config = ConfigDict(extra="forbid")


class TurnUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="턴 제목")
    situation: Optional[str] = Field(None, min_length=1, description="상황 설명")
    turn_image: Optional[str] = Field(None, max_length=500, description="턴 이미지 URL")
    tip_title: Optional[str] = Field(None, min_length=1, description="팁 질문")
    tip_desc: Optional[str] = Field(None, min_length=1, description="팁 답변")
    choices: Optional[ChoicesWrite] = Field(None, description="선택지 A/B sync")

    model_config = ConfigDict(extra="forbid")


class ChoiceAdminResponse(BaseModel):
    id: int
    choice_key: str
    title: str
    description: str
    choice_image: str
    turn_stats: List[ChoiceTurnStatItem]
    result_text: str
    is_historical: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TurnAdminResponse(BaseModel):
    id: int
    scenario_id: int
    sort_order: int
    title: str
    situation: str
    turn_image: str
    tip_title: str
    tip_desc: str
    choices: Dict[str, ChoiceAdminResponse]
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="wrap")
    @classmethod
    def attach_choices(cls, value, handler):
        if hasattr(value, "choices") and not isinstance(value, dict):
            choices = {
                choice.choice_key: ChoiceAdminResponse.model_validate(choice)
                for choice in value.choices
                if choice.deleted_at is None
            }
            payload = {
                "id": value.id,
                "scenario_id": value.scenario_id,
                "sort_order": value.sort_order,
                "title": value.title,
                "situation": value.situation,
                "turn_image": value.turn_image or "",
                "tip_title": value.tip_title,
                "tip_desc": value.tip_desc,
                "choices": choices,
                "deleted_at": value.deleted_at,
            }
            return handler(payload)
        return handler(value)


class TurnReorderRequest(BaseModel):
    scenario_id: int = Field(..., ge=1, description="시나리오 DB id")
    ids: List[int] = Field(..., min_length=1, description="턴 DB id 배열 (index = sort_order)")

    model_config = ConfigDict(extra="forbid")
