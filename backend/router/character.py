from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
import data_manager
from data_manager import CharacterCard, get_character_card

router = APIRouter(prefix="/api/characters", tags=["Character"])

@router.get("", response_model=List[CharacterCard])
async def get_characters(
    category: Optional[str] = Query(None, description="인물 분류 카테고리 ('정치 / 외교', '독립 / 호국', '예술 / 문학', '실학 / 학문')")
):
    """
    모든 가용 인물 리스트를 반환합니다. category 파라미터가 있으면 필터링을 수행.
    (네트워크 전송량 최적화를 위해 associated_stories는 빈 리스트로 반환.)
    """
    if not data_manager.cached_characters:
        data_manager.load_regions_to_memory()
        
    characters_list = []
    for name, profile_data in data_manager.cached_characters.items():
        try:
            # 리스트 조회 시에는 시나리오 목록과 연관 스토리를 제외하여 경량화
            data_copy = dict(profile_data)
            data_copy["associated_stories"] = {}
            data_copy["scenarios"] = []
            
            card = CharacterCard(**data_copy)
            # category가 제공되었고, '전체' 혹은 'all'이 아닐 때만 해당 카테고리로 필터링
            if category and category not in ("전체", "all") and card.category != category:
                continue
            characters_list.append(card)
        except Exception as e:
            print(f"[WARNING] 캐릭터 파싱 실패 ({name}): {e}")
            continue
            
    return characters_list

@router.get("/{name}", response_model=CharacterCard)
async def get_character_details(name: str):
    """
    특정 인물의 상세 프로필 카드와 연관 시나리오 목록을 반환.
    """
    if not data_manager.cached_characters:
        data_manager.load_regions_to_memory()
        
    try:
        return get_character_card(name)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Character '{name}' not found in profiles.")
