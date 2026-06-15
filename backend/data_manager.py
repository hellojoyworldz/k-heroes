import os
import json
from typing import Dict, Any, List, Optional
import pandas as pd
from dotenv import load_dotenv

from models.character import CharacterCard
from openai import OpenAI

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

CHARACTERS_JSON_PATH = os.path.join(BASE_DIR, "data", "characters.json")
CSV_PATH = os.path.join(BASE_DIR, "data", "proceed", "kf_area_total_merged.csv")

# OpenAI API 클라이언트 초기화
openai_api_key = os.environ.get("OPENAI_API_KEY")
if not openai_api_key:
    print("[WARNING] OPENAI_API_KEY 환경변수가 존재하지 않습니다. .env를 확인하십시오.")
    openai_client = None
else:
    openai_client = OpenAI(api_key=openai_api_key, timeout=180.0)

# 메모리에 적재되는 전역 캐릭터 사전 캐시 (Memory cache for characters)
cached_characters: Dict[str, Any] = {}

def load_regions_to_memory():
    """
    서버 초기 기동 시 데이터와 캐시를 로딩하는 메인 함수.
    characters.json 파일을 읽어서 cached_characters에 적재.
    """
    global cached_characters
    if os.path.exists(CHARACTERS_JSON_PATH):
        try:
            with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
                cached_characters = json.load(f)
            print(f"[SUCCESS] {len(cached_characters)}개의 캐릭터 프로필을 성공적으로 로드했습니다. ({CHARACTERS_JSON_PATH})")
        except Exception as e:
            print(f"[ERROR] 캐릭터 프로필 로드 중 오류 발생: {str(e)}")
    else:
        print(f"[WARNING] 캐릭터 프로필 파일을 찾을 수 없습니다: {CHARACTERS_JSON_PATH}")

def get_character_card(character_name: str) -> CharacterCard:
    """
    메모리에 로드된 캐시에서 특정 캐릭터의 카드를 찾아 Pydantic 모델로 반환.
    """
    if not cached_characters:
        load_regions_to_memory()

    if character_name not in cached_characters:
        raise KeyError(f"Character '{character_name}' not found in profiles.")
    return CharacterCard(**cached_characters[character_name])

def get_retrieved_clues(character_name: str, sido: Optional[str] = None, sigungu: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    캐릭터 카드의 연관 스토리들(associated_stories)을 RAG 단서 리스트 포맷으로 변환하여 반환.
    (simulation.py와의 호환성을 유지하기 위한 헬퍼 함수)
    """
    if not cached_characters:
        # 캐시가 로드되지 않은 경우 강제 로드 시도
        load_regions_to_memory()
        
    if character_name not in cached_characters:
        return []
        
    associated_stories = cached_characters[character_name].get("associated_stories", {})
    clues = []
    
    if isinstance(associated_stories, dict):
        # 새로운 구조: Dict[str, List[int]] 형태 (예: {"prsn": [370, 371]})
        try:
            df = get_master_df()
            for domain, ids in associated_stories.items():
                for story_id in ids:
                    rows = df[(df["data_manage_no"] == story_id) & (df["data_manage_keyword"] == domain)]
                    if rows.empty:
                        continue
                    row = rows.iloc[0]
                    
                    row_sido = row.get("ctprvn_nm") if pd.notna(row.get("ctprvn_nm")) else ""
                    row_sigungu = row.get("signgu_nm") if pd.notna(row.get("signgu_nm")) else ""
                    
                    if sido and row_sido != sido:
                        continue
                    if sigungu and row_sigungu != sigungu:
                        continue
                        
                    clues.append({
                        "text": f"제목: {row.get('data_title_nm', '')}\n요약: {row.get('sumry_cn', '')}",
                        "metadata": {
                            "id": story_id,
                            "domain": domain,
                            "region_sido": row_sido,
                            "region_sigungu": row_sigungu
                        }
                    })
        except Exception as e:
            print(f"[ERROR] get_retrieved_clues dynamically querying CSV failed: {e}")
    else:
        # 기존 구조: List[Dict] 형태
        for s in associated_stories:
            if sido and s.get("sido") != sido:
                continue
            if sigungu and s.get("sigungu") != sigungu:
                continue
                
            clues.append({
                "text": f"제목: {s.get('title', '')}\n요약: {s.get('summary', '')}",
                "metadata": {
                    "id": s.get("id"),
                    "domain": s.get("domain"),
                    "region_sido": s.get("sido"),
                    "region_sigungu": s.get("sigungu")
                }
            })
    return clues

# 마스터 CSV 데이터 프레임 전역 캐시 (Cached Master DataFrame)
_df_master: Optional[pd.DataFrame] = None

def get_master_df() -> pd.DataFrame:
    """
    마스터 CSV 파일을 최초 1회 로드하여 메모리에 캐싱하고 반환.
    """
    global _df_master
    if _df_master is None:
        if not os.path.exists(CSV_PATH):
            raise FileNotFoundError(f"마스터 CSV 파일이 존재하지 않습니다: {CSV_PATH}")
        _df_master = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    return _df_master

def get_story_context(story_id: int, story_domain: str) -> str:
    """
    story_id와 story_domain에 해당하는 특정 RAG 단서 행을 찾아 타이틀과 요약문 반환.
    """
    try:
        df = get_master_df()
        rows = df[(df["data_manage_no"] == story_id) & (df["data_manage_keyword"] == story_domain)]
        if rows.empty:
            return ""
        row = rows.iloc[0]
        title = row.get("data_title_nm", "")
        summary = row.get("sumry_cn", "")
        return f"제목: {title}\n요약: {summary}"
    except Exception as e:
        print(f"[WARNING] 스토리 컨텍스트 조회 중 오류 발생: {e}")
        return ""
