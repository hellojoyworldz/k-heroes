from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

class MBTIDetails(BaseModel):
    E_I: str
    S_N: str
    T_F: str
    J_P: str

class StatItem(BaseModel):
    id: int
    name: str
    value: int
    desc: str


class ChoiceTurnStatItem(BaseModel):
    stat_id: int
    delta: int


class ChoiceItem(BaseModel):
    title: str
    description: str
    choice_image: str = ""
    turn_stats: List[ChoiceTurnStatItem] = []
    result_text: str
    is_historical: bool

class TurnItem(BaseModel):
    turn_no: int
    title: str
    situation: str
    turn_image: str = ""
    tip_title: str
    tip_desc: str
    choices: Dict[str, ChoiceItem]  # e.g., {"A": ChoiceItem, "B": ChoiceItem}

class ScenarioItem(BaseModel):
    scenario_id: int
    title: str
    description: str
    historical_facts: str
    source_story_ids: List[int] = []
    turns: List[TurnItem]

class StoryItem(BaseModel):
    id: int
    domain: str
    title: str
    summary: str
    sido: str
    sigungu: str

class CharacterCard(BaseModel):
    id: Optional[int] = None
    name: str
    category: str        # "정치 / 외교", "독립 / 호국", "예술 / 문학", "사상 / 학문"
    era: str
    era_tag: str         # "조선 후기", "일제강점기"
    role: str            # "왕", "독립운동가"
    keywords: List[str]  # ["왕", "개혁", "외교"]
    years: str           # "1863-1907"
    image_url: str = ""  # Located right after 'years'
    situation: str
    one_line_summary: str
    mbti: str
    mbti_nickname: str
    mbti_details: MBTIDetails
    stats: List[StatItem]
    intro_quote: str
    intro_desc: str
    associated_stories: Dict[str, List[int]] = {}
    scenarios: List[ScenarioItem] = []


class TurnStatWrite(BaseModel):
    id: Optional[int] = Field(None, ge=1)
    name: str = Field(..., min_length=1, max_length=100)
    value: int

    model_config = ConfigDict(extra="forbid")


class TurnStatItem(BaseModel):
    id: int
    name: str
    value: int


class CharacterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_id: int = Field(..., ge=1)
    era: str = Field(..., min_length=1, max_length=100)
    era_tag: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=100)
    years: str = Field(..., min_length=1, max_length=50)
    situation: str = Field(..., min_length=1)
    one_line_summary: str = Field(..., min_length=1)
    mbti: str = Field(..., min_length=1, max_length=10)
    mbti_nickname: str = Field(..., min_length=1, max_length=100)
    intro_quote: str = Field(..., min_length=1)
    intro_desc: str = Field(..., min_length=1)
    mbti_e_i: str = ""
    mbti_s_n: str = ""
    mbti_t_f: str = ""
    mbti_j_p: str = ""
    image_url: str = ""
    keywords: List[str] = Field(default_factory=list)
    associated_stories: Dict[str, List[int]] = Field(default_factory=dict)
    turn_stats: List[TurnStatWrite] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class CharacterUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category_id: Optional[int] = Field(None, ge=1)
    era: Optional[str] = Field(None, min_length=1, max_length=100)
    era_tag: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    years: Optional[str] = Field(None, min_length=1, max_length=50)
    situation: Optional[str] = Field(None, min_length=1)
    one_line_summary: Optional[str] = Field(None, min_length=1)
    mbti: Optional[str] = Field(None, min_length=1, max_length=10)
    mbti_nickname: Optional[str] = Field(None, min_length=1, max_length=100)
    intro_quote: Optional[str] = Field(None, min_length=1)
    intro_desc: Optional[str] = Field(None, min_length=1)
    mbti_e_i: Optional[str] = None
    mbti_s_n: Optional[str] = None
    mbti_t_f: Optional[str] = None
    mbti_j_p: Optional[str] = None
    image_url: Optional[str] = None
    keywords: Optional[List[str]] = None
    is_active: Optional[bool] = None
    associated_stories: Optional[Dict[str, List[int]]] = None
    turn_stats: Optional[List[TurnStatWrite]] = None

    model_config = ConfigDict(extra="forbid")


class CharacterReorderRequest(BaseModel):
    category_id: int = Field(..., ge=1)
    ids: List[int] = Field(..., min_length=1)


class CharacterAdminResponse(BaseModel):
    id: int
    name: str
    category_id: int
    category: str
    sort_order: int
    era: str
    era_tag: str
    role: str
    years: str
    image_url: str
    situation: str
    one_line_summary: str
    mbti: str
    mbti_nickname: str
    mbti_e_i: str
    mbti_s_n: str
    mbti_t_f: str
    mbti_j_p: str
    intro_quote: str
    intro_desc: str
    keywords: List[str]
    associated_stories: dict
    turn_stats: List[TurnStatItem] = Field(default_factory=list)
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="wrap")
    @classmethod
    def attach_turn_stats(cls, value, handler):
        if hasattr(value, "stats"):
            result = handler(value)
            active = sorted(
                (s for s in value.stats if s.deleted_at is None),
                key=lambda s: s.sort_order,
            )
            turn_stats = [
                TurnStatItem(id=s.id, name=s.name, value=s.value) for s in active
            ]
            return result.model_copy(update={"turn_stats": turn_stats})
        return handler(value)

