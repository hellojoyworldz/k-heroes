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
    turn_stats_id: int
    delta: int


class ChoiceItem(BaseModel):
    title: str
    description: str
    choice_image: str = ""
    turn_stats: List[ChoiceTurnStatItem] = []
    result_text: str
    is_historical: bool

class TurnItem(BaseModel):
    sort_order: int
    title: str
    situation: str
    turn_image: str = ""
    tip_title: str
    tip_desc: str
    choices: Dict[str, ChoiceItem]  # e.g., {"A": ChoiceItem, "B": ChoiceItem}

class ScenarioItem(BaseModel):
    id: int
    sort_order: int
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


class TurnStatGameItem(BaseModel):
    id: int
    name: str
    value: int = 50


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
    turn_stats: List[TurnStatGameItem] = []
    intro_quote: str
    intro_desc: str
    associated_stories: Dict[str, List[int]] = {}
    scenarios: List[ScenarioItem] = []


class StatCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="강점 이름")
    value: int = Field(..., description="강점 값")
    desc: str = Field(default="", description="강점 설명")

    model_config = ConfigDict(extra="forbid")


class StatWrite(StatCreate):
    """인물 강점 수정 항목."""

    model_config = ConfigDict(extra="forbid")


class TurnStatCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="시뮬 능력치 이름")

    model_config = ConfigDict(extra="forbid")


class TurnStatWrite(TurnStatCreate):
    id: Optional[int] = Field(None, ge=1, description="기존 turn_stats DB id. 수정·유지 시 필수")

    model_config = ConfigDict(extra="forbid")


class TurnStatItem(BaseModel):
    id: int
    name: str


class AssociatedStoriesWrite(BaseModel):
    prsn: List[int] = Field(default_factory=list, description="인물 역사 스토리 ID (RAG data_manage_no)")
    cltur: List[int] = Field(default_factory=list, description="문화/예술 스토리 ID")
    history_textbook: List[int] = Field(
        default_factory=list,
        serialization_alias="국사교과서",
        validation_alias="국사교과서",
        description="국사교과서 스토리 ID",
    )

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    def to_storage_dict(self) -> Dict[str, List[int]]:
        return self.model_dump(by_alias=True, exclude_defaults=True)


class CharacterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="인물 이름")
    category_id: int = Field(..., ge=1, description="카테고리 DB id (GET /api/v2/character-categories)")
    era: str = Field(..., min_length=1, max_length=100, description="활동 시대 (예: 조선)")
    era_tag: str = Field(..., min_length=1, max_length=100, description="시대 태그 (예: 조선 후기)")
    role: str = Field(..., min_length=1, max_length=100, description="역할 (예: 장군, 왕)")
    years: str = Field(..., min_length=1, max_length=50, description="생몰년 (예: 1545-1598)")
    situation: str = Field(..., min_length=1, description="인물 상황 설명")
    one_line_summary: str = Field(..., min_length=1, description="한 줄 요약")
    mbti: str = Field(..., min_length=1, max_length=10, description="MBTI (예: ISTJ)")
    mbti_nickname: str = Field(..., min_length=1, max_length=100, description="MBTI 별명")
    intro_quote: str = Field(..., min_length=1, description="소개 인용문")
    intro_desc: str = Field(..., min_length=1, description="소개 본문")
    mbti_e_i: str = Field(default="", description="MBTI E/I 축 설명 (선택)")
    mbti_s_n: str = Field(default="", description="MBTI S/N 축 설명 (선택)")
    mbti_t_f: str = Field(default="", description="MBTI T/F 축 설명 (선택)")
    mbti_j_p: str = Field(default="", description="MBTI J/P 축 설명 (선택)")
    image_url: str = Field(default="", description="프로필 이미지 URL (선택)")
    keywords: List[str] = Field(default_factory=list, description="키워드 태그 (선택)")
    associated_stories: AssociatedStoriesWrite = Field(
        default_factory=AssociatedStoriesWrite,
        description="연관 역사 스토리 ID (선택)",
    )
    stats: List[StatCreate] = Field(
        default_factory=list,
        description="인물 강점 목록 (선택)",
    )
    turn_stats: List[TurnStatCreate] = Field(
        default_factory=list,
        description="시뮬 능력치 정의 (선택)",
    )

    model_config = ConfigDict(extra="forbid")


class CharacterUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="인물 이름")
    category_id: Optional[int] = Field(None, ge=1, description="카테고리 DB id")
    era: Optional[str] = Field(None, min_length=1, max_length=100, description="활동 시대")
    era_tag: Optional[str] = Field(None, min_length=1, max_length=100, description="시대 태그")
    role: Optional[str] = Field(None, min_length=1, max_length=100, description="역할")
    years: Optional[str] = Field(None, min_length=1, max_length=50, description="생몰년")
    situation: Optional[str] = Field(None, min_length=1, description="인물 상황 설명")
    one_line_summary: Optional[str] = Field(None, min_length=1, description="한 줄 요약")
    mbti: Optional[str] = Field(None, min_length=1, max_length=10, description="MBTI")
    mbti_nickname: Optional[str] = Field(None, min_length=1, max_length=100, description="MBTI 별명")
    intro_quote: Optional[str] = Field(None, min_length=1, description="소개 인용문")
    intro_desc: Optional[str] = Field(None, min_length=1, description="소개 본문")
    mbti_e_i: Optional[str] = Field(None, description="MBTI E/I 축 설명")
    mbti_s_n: Optional[str] = Field(None, description="MBTI S/N 축 설명")
    mbti_t_f: Optional[str] = Field(None, description="MBTI T/F 축 설명")
    mbti_j_p: Optional[str] = Field(None, description="MBTI J/P 축 설명")
    image_url: Optional[str] = Field(None, description="프로필 이미지 URL")
    keywords: Optional[List[str]] = Field(None, description="키워드 태그")
    is_active: Optional[bool] = Field(None, description="true=사용, false=미사용")
    associated_stories: Optional[AssociatedStoriesWrite] = Field(
        None, description="연관 역사 스토리 ID"
    )
    stats: Optional[List[StatWrite]] = Field(
        None,
        description="인물 강점 전체 교체 (배열 순서)",
    )
    turn_stats: Optional[List[TurnStatWrite]] = Field(
        None,
        description="시뮬 능력치 정의 전체 sync",
    )

    model_config = ConfigDict(extra="forbid")


class CharacterReorderRequest(BaseModel):
    category_id: int = Field(..., ge=1, description="카테고리 DB id")
    ids: List[int] = Field(..., min_length=1, description="인물 DB id 배열 (index=sort_order)")


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
    stats: List[StatItem] = Field(default_factory=list)
    turn_stats: List[TurnStatItem] = Field(default_factory=list)
    is_active: bool
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="wrap")
    @classmethod
    def attach_stats(cls, value, handler):
        if hasattr(value, "__table__"):
            from repositories.character_stats import stat_items_from_json

            active_turn_stats = sorted(
                (row for row in value.turn_stats if row.deleted_at is None),
                key=lambda row: row.sort_order,
            )
            prepared = {
                **{
                    column.key: getattr(value, column.key)
                    for column in value.__table__.columns
                    if column.key != "stats"
                },
                "category": value.category,
                "stats": stat_items_from_json(value.stats),
                "turn_stats": [
                    TurnStatItem(id=row.id, name=row.name) for row in active_turn_stats
                ],
            }
            return handler(prepared)
        return handler(value)

