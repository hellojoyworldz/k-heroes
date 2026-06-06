from fastapi import APIRouter, HTTPException
from typing import List, Dict
from pydantic import BaseModel
import data_manager

router = APIRouter(prefix="/api/regions", tags=["Regions"])

# Pydantic models for responses
class RegionSidoSigungu(BaseModel):
    region_sido: str
    region_sigungu: str

# --- API Endpoints ---
@router.get("/sido", response_model=List[str])
async def get_sido_list():
    if not data_manager.cached_sido:
        data_manager.load_regions_to_memory()
        if not data_manager.cached_sido:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
    return data_manager.cached_sido

@router.get("/sido-sigungu", response_model=List[RegionSidoSigungu])
async def get_sido_sigungu_list():
    if not data_manager.cached_sido_sigungu:
        data_manager.load_regions_to_memory()
        if not data_manager.cached_sido_sigungu:
            raise HTTPException(status_code=500, detail="지역 데이터가 초기화되지 않았습니다.")
    return data_manager.cached_sido_sigungu