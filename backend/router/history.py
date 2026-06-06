from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import data_manager

router = APIRouter(prefix="/api/history", tags=["History"])

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

@router.get("", response_model=List[ScenarioClue])
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
