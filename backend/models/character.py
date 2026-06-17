from pydantic import BaseModel
from typing import List, Dict, Optional

class MBTIDetails(BaseModel):
    E_I: str
    S_N: str
    T_F: str
    J_P: str

class StatItem(BaseModel):
    name: str
    value: int
    desc: str

class ChoiceItem(BaseModel):
    title: str
    description: str
    choice_image: str = ""
    stats: Dict[str, int]  # e.g., {"독립 자금": -5, "팀워크": 5, "성공 확률": -25}
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
    scenario_image: str = ""
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
    name: str
    category: str        # "정치 / 외교", "독립 / 호국", "예술 / 문학", "실학 / 학문"
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




