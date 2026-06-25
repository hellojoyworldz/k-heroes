import csv
import os
from functools import lru_cache

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Scenario

router = APIRouter(prefix="/api/v2/landing", tags=["Landing"])

@lru_cache(maxsize=1)
def get_csv_stats():
    """
    CSV 파일을 한 번만 읽고 결과를 메모리에 캐시합니다.
    - region_count: 유니크한 시/도(ctprvn_nm)의 개수
    - history_record_count: 실제 역사 기록의 전체 데이터 개수 (CSV 행 수)
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    csv_path = os.path.join(base_dir, "data", "processed", "kf_area_total_merged.csv")
    
    total_records = 0
    unique_regions = set()
    
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                total_records += 1
                # 시/도명(ctprvn_nm) 기준으로 참여 지역 산정
                if row.get("ctprvn_nm"):
                    unique_regions.add(row["ctprvn_nm"].strip())
    
    return {
        "region_count": len(unique_regions),
        "history_record_count": total_records
    }

@router.get("/stats")
def get_landing_stats(db: Session = Depends(get_db)):
    """
    랜딩 페이지에 표시할 통계 수치를 반환합니다.
    """
    # 1. 역사 시나리오 개수 (활성화된 시나리오만 카운트)
    scenario_count = db.query(Scenario).filter(Scenario.is_active == True).count()
    
    # 2. CSV 기반 통계 (캐싱됨)
    csv_stats = get_csv_stats()
    
    return {
        "scenario_count": scenario_count,
        "region_count": csv_stats["region_count"],
        "history_record_count": csv_stats["history_record_count"]
    }
