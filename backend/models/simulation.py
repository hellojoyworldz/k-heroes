from typing import List, Dict, Optional
from pydantic import BaseModel
from models.character import CharacterCard

class SearchResponse(BaseModel):
    character_name: str
    clue_count: int

class StartRequest(BaseModel):
    character_name: str
    scenario_id: int

class GameStateStat(BaseModel):
    name: str
    value: int

class GameHistoryItem(BaseModel):
    step: int
    situation: str
    user_choice: str
    chosen_text: str
    is_historical: bool

class GameState(BaseModel):
    character_name: str
    scenario_id: int
    history_score: int
    current_step: int
    game_stats: Dict[str, GameStateStat]
    game_history: List[GameHistoryItem]
    choices_path: List[str]

class StartResponse(BaseModel):
    character_card: CharacterCard
    initial_state: GameState

class ChoiceDetail(BaseModel):
    is_historical: bool
    title: str
    description: str
    stat_effects: Dict[str, int]
    choice_image: Optional[str] = ""

class TurnRequest(BaseModel):
    character_name: str
    scenario_id: int
    current_step: int

class TurnResponse(BaseModel):
    current_step: int
    total_steps: int
    step_label: str
    title: str
    situation: str
    toggle_question: str
    toggle_answer: str
    choice_a: ChoiceDetail
    choice_b: ChoiceDetail
    turn_image: Optional[str] = ""

class SummaryItem(BaseModel):
    title: str
    desc: str

class RecommendedPlace(BaseModel):
    address: str
    name: str
    description: str
    image_url: Optional[str] = ""

class EndingRequest(BaseModel):
    character_name: str
    scenario_id: int
    choices_path: List[str]
    force_eval: Optional[bool] = False

class EndingResponse(BaseModel):
    result_code: str
    ending_type: str
    title: str
    history_fact: str
    story_headline: str
    story_contents: str
    factual_contents: Optional[str] = ""
    summary_items: List[SummaryItem]
    recommended_places: List[RecommendedPlace]
    ending_markdown: str
    output_file_path: str
    ending_image: Optional[str] = ""
    uuid: Optional[str] = ""
