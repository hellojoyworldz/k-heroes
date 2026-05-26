import os
import json
from fastapi import APIRouter, HTTPException
from typing import Dict, List

router = APIRouter(prefix="/api/regions", tags=["Regions"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAG_DATA_PATH = os.path.join(BASE_DIR, 'data', 'proceed', 'kf_area_rag_data.json')

cached_regions: Dict[str, List[str]] = {}

def load_regions_to_memory():
    global cached_regions
    if not os.path.exists(RAG_DATA_PATH):
        print(f"⚠ [WARNING] RAG 데이터 파일을 찾을 수 없습니다: {RAG_DATA_PATH}")
        return

    try:
        with open(RAG_DATA_PATH, 'r', encoding='utf-8') as f:
            rag_data = json.load(f)
            
        temp_regions = {}
        for item in rag_data:
            metadata = item.get("metadata", {})
            sido = metadata.get("region_sido")
            sigungu = metadata.get("region_sigungu")
            
            if sido:
                if sido not in temp_regions:
                    temp_regions[sido] = set()
                if sigungu:
                    temp_regions[sido].add(sigungu)

        cached_regions = {
            sido: sorted(list(sigungus)) 
            for sido, sigungus in sorted(temp_regions.items())
        }
        print(f"[SUCCESS] 총 {len(cached_regions)}개의 시도 계층 데이터를 메모리에 로드 완료했습니다.")
    except Exception as e:
        print(f"[ERROR] 지역 데이터 로드 중 오류 발생: {str(e)}")

# --- API Endpoints ---
@router.get("/hierarchy", response_model=Dict[str, List[str]])
async def get_region_hierarchy():
    if not cached_regions:
        load_regions_to_memory()
        if not cached_regions:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
    return cached_regions

@router.get("/sido", response_model=List[str])
async def get_sido_list():
    return list(cached_regions.keys())