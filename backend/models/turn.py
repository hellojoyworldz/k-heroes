from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from db.models import Turn
from models.admin_refs import (
    AdminCharacterRef,
    AdminScenarioRef,
    character_ref_from_scenario,
    scenario_ref_from_scenario,
)
from models.character import ChoiceTurnStatItem, TurnStatItem


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


class ChoiceTurnStatAdminItem(BaseModel):
    stat_id: int
    name: str
    delta: int

    model_config = ConfigDict(from_attributes=True)


class ChoiceAdminResponse(BaseModel):
    id: int
    choice_key: str
    title: str
    description: str
    choice_image: str
    turn_stats: List[ChoiceTurnStatAdminItem]
    result_text: str
    is_historical: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TurnAdminResponse(BaseModel):
    id: int
    scenario_id: int
    scenario: AdminScenarioRef
    character: AdminCharacterRef
    character_stats: List[TurnStatItem] = Field(
        default_factory=list,
        description="소속 인물 능력치 목록 (선택지 편집용)",
    )
    sort_order: int
    title: str
    situation: str
    turn_image: str
    tip_title: str
    tip_desc: str
    choices: Dict[str, ChoiceAdminResponse]
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @staticmethod
    def _character_stats(character) -> List[TurnStatItem]:
        active = sorted(
            (stat for stat in character.stats if stat.deleted_at is None),
            key=lambda stat: stat.sort_order,
        )
        return [
            TurnStatItem(id=stat.id, name=stat.name, value=stat.value) for stat in active
        ]

    @staticmethod
    def _choice_turn_stats_admin(choice, character_stats: List[TurnStatItem]) -> List[ChoiceTurnStatAdminItem]:
        delta_by_id = {
            item["stat_id"]: item["delta"] for item in (choice.turn_stats or [])
        }
        return [
            ChoiceTurnStatAdminItem(
                stat_id=stat.id,
                name=stat.name,
                delta=delta_by_id.get(stat.id, 0),
            )
            for stat in character_stats
        ]

    @classmethod
    def _choice_admin_response(cls, choice, character_stats: List[TurnStatItem]) -> ChoiceAdminResponse:
        return ChoiceAdminResponse(
            id=choice.id,
            choice_key=choice.choice_key,
            title=choice.title,
            description=choice.description,
            choice_image=choice.choice_image or "",
            turn_stats=cls._choice_turn_stats_admin(choice, character_stats),
            result_text=choice.result_text,
            is_historical=choice.is_historical,
            deleted_at=choice.deleted_at,
        )

    @classmethod
    def from_orm_row(cls, turn: Turn) -> "TurnAdminResponse":
        scenario = turn.scenario
        character_stats = cls._character_stats(scenario.character)
        choices = {
            choice.choice_key: cls._choice_admin_response(choice, character_stats)
            for choice in turn.choices
            if choice.deleted_at is None
        }
        return cls(
            id=turn.id,
            scenario_id=turn.scenario_id,
            scenario=scenario_ref_from_scenario(scenario),
            character=character_ref_from_scenario(scenario),
            character_stats=character_stats,
            sort_order=turn.sort_order,
            title=turn.title,
            situation=turn.situation,
            turn_image=turn.turn_image or "",
            tip_title=turn.tip_title,
            tip_desc=turn.tip_desc,
            choices=choices,
            deleted_at=turn.deleted_at,
        )

    @model_validator(mode="wrap")
    @classmethod
    def attach_choices(cls, value, handler):
        if isinstance(value, Turn):
            return cls.from_orm_row(value)
        return handler(value)


class TurnReorderRequest(BaseModel):
    scenario_id: int = Field(..., ge=1, description="시나리오 DB id")
    ids: List[int] = Field(..., min_length=1, description="턴 DB id 배열 (index = sort_order)")

    model_config = ConfigDict(extra="forbid")
