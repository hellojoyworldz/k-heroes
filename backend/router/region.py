import os
import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from pydantic import BaseModel

router = APIRouter(prefix="/api/regions", tags=["Regions"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAG_DATA_PATH = os.path.join(BASE_DIR, "data", "proceed", "kf_area_rag_data.json")

# Pydantic models for responses
class RegionSidoSigungu(BaseModel):
    region_sido: str
    region_sigungu: str

cached_sido: List[str] = []
cached_sido_sigungu: List[Dict[str, str]] = []

def load_regions_to_memory():
    global cached_sido, cached_sido_sigungu
    if not os.path.exists(RAG_DATA_PATH):
        print(f"[WARNING] RAG 데이터 파일을 찾을 수 없습니다: {RAG_DATA_PATH}")
        return

    try:
        with open(RAG_DATA_PATH, "r", encoding="utf-8") as f:
            rag_data = json.load(f)
            
        sido_set = set()
        pair_set = set()
        
        for item in rag_data:
            metadata = item.get("metadata", {})
            sido = metadata.get("region_sido")
            sigungu = metadata.get("region_sigungu")
            
            if sido:
                sido_set.add(sido)
                if sigungu:
                    pair_set.add((sido, sigungu))

        cached_sido = sorted(list(sido_set))
        cached_sido_sigungu = [
            {"region_sido": sido, "region_sigungu": sigungu}
            for sido, sigungu in sorted(list(pair_set))
        ]
        print(f"[SUCCESS] 총 {len(cached_sido)}개의 시도, {len(cached_sido_sigungu)}개의 시도-시군구 데이터.")
    except Exception as e:
        print(f"[ERROR] 지역 데이터 로드 중 오류 발생: {str(e)}")

# --- API Endpoints ---
@router.get("/sido", response_model=List[str])
async def get_sido_list():
    if not cached_sido:
        load_regions_to_memory()
        if not cached_sido:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
    return cached_sido

@router.get("/sido-sigungu", response_model=List[RegionSidoSigungu])
async def get_sido_sigungu_list():
    if not cached_sido_sigungu:
        load_regions_to_memory()
        if not cached_sido_sigungu:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
    return cached_sido_sigungu