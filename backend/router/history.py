from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict
from pydantic import BaseModel
import data_manager
from data_manager import CharacterCard, get_character_card

router = APIRouter(prefix="/api/history", tags=["History"])

# Global memory cache for clue counts
global_clue_counts: Dict[str, int] = {}

def get_global_clue_counts() -> Dict[str, int]:
    global global_clue_counts
    if not global_clue_counts:
        # Build global count of clues per related_person
        from collections import Counter
        counts = Counter()
        for item in data_manager.cached_rag_data:
            person = item.get("metadata", {}).get("related_person")
            if person:
                counts[person] += 1
        global_clue_counts = dict(counts)
    return global_clue_counts

# Pydantic models for responses
class ScenarioClueMetadata(BaseModel):
    source_id: Optional[int] = None
    domain_type: Optional[str] = None
    theme: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    region_sido: Optional[str] = None
    region_sigungu: Optional[str] = None
    related_person: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ScenarioClue(BaseModel):
    text: str
    metadata: ScenarioClueMetadata

@router.get("/all", response_model=List[ScenarioClue])
async def get_history_clues(
    sido: str = Query(..., description="시/도 이름"),
    sigungu: Optional[str] = Query(None, description="시/군/구 이름")
):
    if not data_manager.cached_rag_data:
        data_manager.load_regions_to_memory()
        if not data_manager.cached_rag_data:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
            
    # sido 필터링
    results = [
        item for item in data_manager.cached_rag_data
        if item.get("metadata", {}).get("region_sido") == sido
    ]
    
    # sigungu가 주어진 경우 추가 필터링 (직접 호출 시 Query 객체가 들어오는 경우 방지)
    if sigungu and isinstance(sigungu, str):
        results = [
            item for item in results
            if item.get("metadata", {}).get("region_sigungu") == sigungu
        ]
        
    return results

@router.get("/playable-characters", response_model=List[CharacterCard])
async def get_playable_characters(
    sido: str = Query(..., description="시/도 이름"),
    sigungu: Optional[str] = Query(None, description="시/군/구 이름"),
    min_clues: int = Query(50, description="최소 단서 개수 기준")
):
    if not data_manager.cached_profiles:
        data_manager.load_regions_to_memory()
        if not data_manager.cached_profiles:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
            
    global_counts = get_global_clue_counts()
    
    playable_cards = []
    for char_key, profile_data in data_manager.cached_profiles.items():
        # 1. Sido 매칭 확인
        associated_sidos = profile_data.get("associated_sidos", [])
        if sido not in associated_sidos:
            continue
            
        # 2. Sigungu 매칭 확인 (전달되었을 경우에만 RAG 데이터를 뒤져서 매칭 확인)
        if sigungu and isinstance(sigungu, str):
            has_sigungu_clue = False
            for item in data_manager.cached_rag_data:
                metadata = item.get("metadata", {})
                related_person = metadata.get("related_person") or ""
                text = item.get("text") or ""
                
                if (char_key in related_person or char_key in text) and \
                   metadata.get("region_sido") == sido and \
                   metadata.get("region_sigungu") == sigungu:
                    has_sigungu_clue = True
                    break
            if not has_sigungu_clue:
                continue
                
        # 3. 글로벌 단서 수 조건 확인
        if global_counts.get(char_key, 0) >= min_clues:
            # Pydantic 모델로 파싱
            playable_cards.append(CharacterCard(**profile_data))
            
    # 글로벌 단서 수 기준 내림차순 정렬
    def get_count(card: CharacterCard):
        for key in global_counts:
            if key in card.name:
                return global_counts[key]
        return 0
        
    playable_cards.sort(key=get_count, reverse=True)
    
    return playable_cards
