import os
import json
from typing import Dict, Any, List, Optional
import pandas as pd
from dotenv import load_dotenv

from models.character import CharacterCard
from models.simulation import RecommendedPlace
from repositories.turn_stats import normalize_json_character_profile
from openai import OpenAI

from google.cloud import storage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

CHARACTERS_JSON_PATH = os.path.join(BASE_DIR, "data", "characters.json")
CSV_PATH = os.path.join(BASE_DIR, "data", "processed", "kf_area_total_merged.csv")
GCP_BUCKET_NAME = os.environ.get("GCP_BUCKET_NAME")

def upload_to_gcs(blob_name: str, data: Dict[str, Any]) -> bool:
    if not GCP_BUCKET_NAME:
        return False
    try:
        project_id = os.environ.get("GCP_PROJECT_ID")
        storage_client = storage.Client(project=project_id)
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        blob = bucket.blob(blob_name)
        blob.upload_from_string(
            data=json.dumps(data, ensure_ascii=False),
            content_type="application/json"
        )
        print(f"[SUCCESS] GCS 업로드 완료: gs://{GCP_BUCKET_NAME}/{blob_name}")
        return True
    except Exception as e:
        print(f"[WARNING] GCS 업로드 중 오류 발생 (로컬 fallback 사용): {e}")
        return False


def save_simulation_result(result_id: str, character_name: str, scenario_id: int, data: Dict[str, Any]) -> str:
    import datetime
    date_str = datetime.datetime.now().strftime("%Y%m%d")
    filename = f"{date_str}_{character_name}_{scenario_id}_{result_id}.json"
    blob_name = f"endings/{filename}"
    
    output_path = ""
    if GCP_BUCKET_NAME:
        output_path = f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{blob_name}"
    else:
        local_dir = os.path.join(BASE_DIR, "gcp", "endings")
        output_path = os.path.join(local_dir, filename)
        
    data["output_file_path"] = output_path
    
    # GCS 업로드 시도
    success = upload_to_gcs(blob_name, data)
    if success:
        return output_path
        
    # 2. GCS 실패 시 로컬 파일 저장 fallback
    try:
        local_dir = os.path.join(BASE_DIR, "gcp", "endings")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, filename)
        data["output_file_path"] = local_path
        with open(local_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[SUCCESS] 로컬 파일 백업 저장 완료: {local_path}")
        return local_path
    except Exception as e:
        print(f"[ERROR] 로컬 결과 파일 저장 실패: {e}")
        return output_path

def get_simulation_result(result_id: str) -> Optional[Dict[str, Any]]:
    # 1. GCS 조회 시도
    if GCP_BUCKET_NAME:
        try:
            project_id = os.environ.get("GCP_PROJECT_ID")
            storage_client = storage.Client(project=project_id)
            bucket = storage_client.bucket(GCP_BUCKET_NAME)
            blobs = bucket.list_blobs(prefix="endings/")
            target_blob = None
            for b in blobs:
                if b.name.endswith(f"_{result_id}.json"):
                    target_blob = b
                    break
            if target_blob:
                content = target_blob.download_as_text(encoding="utf-8")
                return json.loads(content)
        except Exception as e:
            print(f"[WARNING] GCS 다운로드 중 오류 발생 (로컬 fallback 사용): {e}")

    # 2. GCS 실패 시 로컬 파일 로드 fallback
    try:
        import glob
        local_dir = os.path.join(BASE_DIR, "gcp", "endings")
        files = glob.glob(os.path.join(local_dir, f"*_{result_id}.json"))
        if files:
            with open(files[0], "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"[ERROR] 로컬 결과 파일 로드 실패: {e}")
    return None



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
    return CharacterCard(**normalize_json_character_profile(cached_characters[character_name]))

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


def is_related_place(row, char_name: str) -> bool:
    relate_prsn = str(row.get('relate_prsn_nm', ''))
    title = str(row.get('data_title_nm', ''))
    
    delimiters = [',', ';', '/', '|']
    for d in delimiters:
        relate_prsn = relate_prsn.replace(d, ' ')
    
    words = relate_prsn.split()
    for word in words:
        if word == char_name:
            return True
        if char_name in ["고종", "정조", "인조", "이황"]:
            if word in [f"{char_name}황제", f"{char_name}대왕", f"퇴계{char_name}"]:
                return True
        else:
            if word.startswith(char_name):
                suffix = word[len(char_name):]
                if suffix in ["", "장군", "의사", "명창", "선생", "옹"]:
                    return True
                    
    title_words = title.split()
    for word in title_words:
        if word == char_name:
            return True
        if char_name in ["고종", "정조", "인조", "이황"]:
            if word in [f"{char_name}황제", f"{char_name}대왕", f"퇴계{char_name}"]:
                return True
            if any(word.startswith(prefix) for prefix in [f"{char_name}의", f"{char_name}과", f"{char_name}를", f"{char_name}을"]):
                return True
        else:
            if word.startswith(char_name):
                suffix = word[len(char_name):]
                if any(suffix.startswith(s) for s in ["", "장군", "의사", "명창", "선생", "옹", "의", "과", "를", "을"]):
                    return True
    return False

def get_recommended_places(character_name: str) -> List[RecommendedPlace]:
    try:
        df = get_master_df()
        
        # Filter valid address rows
        valid_df = df[df['addr'].notna() & (df['addr'].str.strip() != '') & (df['addr'].str.lower() != 'nan')]
        
        # 1. Matches in title
        m_title = valid_df[valid_df['data_title_nm'].str.contains(character_name, na=False)]
        m_title = m_title[m_title.apply(lambda r: is_related_place(r, character_name), axis=1)]
        
        # 2. Matches in relate_prsn_nm
        m_prsn = valid_df[valid_df['relate_prsn_nm'].str.contains(character_name, na=False)]
        m_prsn = m_prsn[m_prsn.apply(lambda r: is_related_place(r, character_name), axis=1)]
        
        # Combine (prioritize title matches first)
        combined = pd.concat([m_title, m_prsn]).drop_duplicates(subset=['data_title_nm'])
        
        results = []
        for _, row in combined.head(5).iterrows():
            desc = str(row['sumry_cn']) if pd.notna(row['sumry_cn']) else ""
            if len(desc) > 150:
                desc = desc[:147] + "..."
            
            thumb_url = str(row['main_thumb_url']) if pd.notna(row.get('main_thumb_url')) else ""
            
            results.append(RecommendedPlace(
                name=row['data_title_nm'],
                address=row['addr'],
                description=desc,
                image_url=thumb_url
            ))
        return results
    except Exception as e:
        print(f"[PLACES] Error getting recommended places: {e}")
        return []

def get_pre_generated_ending(character_name: str, scenario_id: int, choices_path: List[str]) -> Optional[Dict[str, Any]]:
    """
    사전 생성된 엔딩 데이터(data/endings/{character_name}_{scenario_id}.json)가 있는지 확인하고,
    선택한 분기 경로(예: "A-B-A")에 해당하는 엔딩 딕셔너리를 반환합니다.
    """
    try:
        endings_dir = os.path.join(BASE_DIR, "data", "endings")
        filename = f"{character_name}_{scenario_id}.json"
        filepath = os.path.join(endings_dir, filename)
        
        if not os.path.exists(filepath):
            return None
            
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        path_key = "-".join(choices_path)
        return data.get(path_key)
    except Exception as e:
        print(f"[WARNING] 사전 생성된 엔딩 조회 중 오류 발생: {e}")
        return None
