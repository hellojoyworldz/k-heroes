import os
import json
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAG_DATA_PATH = os.path.join(BASE_DIR, "data", "proceed", "kf_area_rag_data.json")

cached_sido: List[str] = []
cached_sido_sigungu: List[Dict[str, str]] = []
cached_rag_data: List[Dict[str, Any]] = []

def load_regions_to_memory():
    global cached_sido, cached_sido_sigungu, cached_rag_data
    if not os.path.exists(RAG_DATA_PATH):
        print(f"[WARNING] RAG 데이터 파일을 찾을 수 없습니다: {RAG_DATA_PATH}")
        return

    try:
        with open(RAG_DATA_PATH, "r", encoding="utf-8") as f:
            rag_data = json.load(f)
            
        cached_rag_data = rag_data
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
        print(f"[SUCCESS] 총 {len(cached_sido)}개의 시도, {len(cached_sido_sigungu)}개의 시도-시군구 데이터, {len(cached_rag_data)}개의 RAG 단서 데이터.")
    except Exception as e:
        print(f"[ERROR] 데이터 로드 중 오류 발생: {str(e)}")
