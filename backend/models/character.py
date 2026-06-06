from pydantic import BaseModel
from typing import List

class MBTIDetails(BaseModel):
    E_I: str
    S_N: str
    T_F: str
    J_P: str

class StatItem(BaseModel):
    name: str
    value: int  # e.g., 92, 98
    desc: str

class CharacterCard(BaseModel):
    name: str
    era: str
    era_tag: str         # e.g., "일제강점기", "조선 시대"
    role: str            # e.g., "독립운동가", "조선 4대 왕"
    keywords: List[str]  # e.g., ["독립운동", "3.1운동", "한인애국단"]
    years: str           # e.g., "1908-1932"
    situation: str
    one_line_summary: str
    mbti: str
    mbti_nickname: str
    mbti_details: MBTIDetails
    stats: List[StatItem]
    intro_quote: str
    intro_desc: str
    associated_sidos: List[str] = []
