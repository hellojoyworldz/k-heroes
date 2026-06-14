from pydantic import BaseModel
from typing import List

class MBTIDetails(BaseModel):
    E_I: str
    S_N: str
    T_F: str
    J_P: str

class StatItem(BaseModel):
    name: str
    value: int  # 92, 98
    desc: str

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
    situation: str
    one_line_summary: str
    mbti: str
    mbti_nickname: str
    mbti_details: MBTIDetails
    stats: List[StatItem]
    intro_quote: str
    intro_desc: str
    image_url: str = ""
    associated_stories: List[StoryItem] = []

