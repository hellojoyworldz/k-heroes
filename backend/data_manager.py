import os
import json
import time
import sys
import io
from typing import Dict, Any, List, Optional
import pandas as pd
import requests
from dotenv import load_dotenv
from openai import OpenAI
from google.cloud import storage

from models.character import CharacterCard


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
    openai_client = OpenAI(api_key=openai_api_key)

# 메모리에 적재되는 전역 캐릭터 사전 캐시
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
        
    stories = cached_characters[character_name].get("associated_stories", [])
    clues = []
    for s in stories:
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

# 마스터 CSV 데이터 프레임 전역 캐시
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

# --- characters.json 생성을 위한 데이터 파이프라인 함수들 ---

def get_associated_stories_for_char(df_clean: pd.DataFrame, character_name: str, max_stories: int = 50) -> List[Dict[str, Any]]:
    """
    CSV에서 특정 인물과 관련성이 높은 이야기(스토리) 목록을 추출하여
    프론트엔드 렌더링에 적합한 메타데이터 구조로 가공.
    """
    char_rows = df_clean[df_clean["relate_prsn_nm"].astype(str).str.contains(character_name)].copy()
    char_rows = char_rows.drop_duplicates(subset=["data_title_nm"]).head(max_stories)
    
    stories = []
    for _, row in char_rows.iterrows():
        domain = str(row["data_manage_keyword"]).strip()
        no = int(row["data_manage_no"])
        
        stories.append({
            "id": no,
            "domain": domain,
            "title": row["data_title_nm"],
            "summary": row["sumry_cn"] if pd.notna(row["sumry_cn"]) else "",
            "sido": row["ctprvn_nm"] if pd.notna(row["ctprvn_nm"]) else "",
            "sigungu": row["signgu_nm"] if pd.notna(row["signgu_nm"]) else ""
        })
    return stories

def generate_character_profile_via_openai(character_name: str, stories: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    OpenAI GPT-4o-mini 모델을 사용하여 캐릭터의 역사적 행적 RAG 컨텍스트를 분석하고,
    게임 플레이를 위한 카테고리, MBTI와 캐릭터 스탯 등 상세 정보를 JSON 형식으로 생성.
    """
    if not openai_client:
        raise ValueError("OpenAI API 클라이언트가 존재하지 않아 생성을 진행할 수 없습니다.")
        
    context_str = ""
    for i, s in enumerate(stories[:15]):
        context_str += f"[스토리 {i+1}] 제목: {s['title']}, 요약: {s['summary']}\n\n"

    prompt = f"""
너는 역사 선택형 시뮬레이션 게임 'K-Heroes'의 인물 카드 설계자야.
제공된 RAG 백그라운드 지식을 기반으로 대상 인물에 대한 정보를 추출하여 재미있는 인물 카드 데이터로 생성해 줘.
어려운 한자어는 피하고 초등학생도 쉽게 읽을 수 있는 단어를 써줘.

[대상 인물]
이름: {character_name}

[RAG 데이터 컨텍스트]
{context_str}

[캐릭터 분류 카테고리 판별 원칙 - 매우 중요!]
RAG 데이터 컨텍스트에 담긴 인물의 주된 업적과 행적을 분석하여 다음 4가지 테마 중 하나를 엄격히 부여하세요:
- 정치 / 외교: 왕, 대통령, 재상, 정치가로서 국가 제도 개혁, 외교 협상, 권력 투쟁 등을 주로 펼친 경우.
- 독립 / 호국: 국난 극복, 왜구 방어, 의병 활동, 독립운동, 군사적 전투 등을 주로 이끈 장군, 의사, 열사 등.
- 예술 / 문학: 판소리, 서양화, 풍속화, 무용, 시, 소설, 음악 등 문화예술 창작 활동을 한 예인, 작가, 화가 등.
- 실학 / 학문: 성리학, 실학, 고증학, 과학 기술 연구 및 학술 교육에 헌신한 학자, 사상가 등.

[캐릭터 설계 절대 원칙 - MBTI 자동 판별]
★ [매우 중요] 특정 MBTI를 미리 정해두고 인물의 행적을 억지로 짜맞추지 마세요. 반드시 제공된 [RAG 데이터 컨텍스트]를 먼저 철저히 분석한 뒤, 인물이 역사 속에서 보여준 가장 주된 업적과 성향에 가장 잘 어울리는 MBTI를 16가지 유형 중 하나로 '스스로 판별'하여 부여하세요.
역사적 사실을 다 집어넣으려고 한 문장 안에 반대되는 성향을 섞어 쓰는 순간 너의 임무는 실패입니다. 설정한 MBTI 알파벳 성향 하나에만 100% 집중하여 선명한 캐릭터 카드를 만드세요.

[MBTI 부여 및 작성 원칙 - 매우 중요!]
★ MBTI 알파벳별 역사적 행동 매칭 기준 (오류 방지 이분법 기준):
AI는 인물의 수많은 업적 중, 본인이 판별하여 선택한 알파벳의 '생각과 행동 목적'에 100% 부합하는 사례만 남기고 반대 성향의 사실은 반드시 삭제해야 합니다.

[E vs I : 에너지를 쓰고 결단을 내리는 방식]
- E (외향 - 외부 교류 중심): 여러 사람 앞에 나서서 대중을 이끌거나 외부에 에너지를 쏟은 행적입니다.
  * 키워드: 대중 연설, 적극적인 동료/군사 규합, 격렬한 끝장 토론, 활발한 대외 외교 활동.
- I (내향 - 내부 집중 중심): 남들의 시선에서 벗어나 혼자 사색하거나 소수의 측근과 은밀하게 움직인 행적입니다.
  * 키워드: 독자적인 책/일기 저술, 홀로 밤새 고민함, 밀실 정치, 비밀 편지(어찰)를 통한 고독한 결단.

[S vs N : 정보를 바라보고 목적을 세우는 방식] ★가장 오차가 크니 주의할 것★
- S (감각 - 현실과 과거 중심): "이미 증명된 과거의 기록, 선대의 관습, 눈앞의 실제 데이터와 현장 경험"을 기반으로 움직인 행적입니다.
  * 키워드: 과거 역사 기록 참고, 전통문화와 관습 수호, 지형과 날씨 데이터 활용, 실제 농사/실측 경험 중시.
- N (직관 - 미래와 혁신 중심): "당장 눈앞에 없는 미래의 가능성, 기존 역사를 깨부수는 독창적인 비전과 발명"을 기반으로 움직인 행적입니다.
  * 키워드: 세상에 없던 새로운 문자 창제(한글), 신분제 폐지 구상, 서양의 첨단 신기술/문물 전격 도입, 미래를 내다본 수도 천도.

[T vs F : 판단과 의사결정을 내리는 기준]
- T (사고 - 논리와 실리 중심): 개인적인 감정이나 도덕적 명분보다 "철저한 인과관계 분석과 실리적 이익"을 우선시한 행적입니다.
  * 키워드: 냉철한 정세/리스크 분석, 국가적 실리(이익) 저울질, 법과 원칙에 따른 엄격한 처벌과 집행.
- F (감정 - 인간미와 명분 중심): 이익 계산보다 "사람 중심의 가치, 백성에 대한 사랑, 도덕적 명분과 유대감"을 우선시한 행적입니다.
  * 키워드: 백성을 가엽게 여김(애민정신), 동료들과의 끈끈한 의리, 나라를 향한 뜨거운 충성심, 눈물의 호소.

[J vs P : 목표를 계획하고 실행하는 방식]
- J (판단 - 체계와 통제 중심): 변수를 줄이기 위해 "사전에 치밀한 계획을 세우고 체계적인 시스템"을 정비한 행적입니다.
  * 키워드: 치밀한 사전 계획 수립, 국가 제도 및 법전 완성, 매뉴얼화, 엄격한 군율과 규칙 확립.
- P (인식 - 유연과 기동 중심): 틀에 얽매이지 않고 "상황의 변화에 따라 자유롭고 임기응변식으로 대응"한 행적입니다.
  * 키워드: 예상치 못한 위기에서의 기발한 임기응변, 고정관념에서 벗어난 자유로운 탐색, 신출귀몰한 게릴라 전술(의병 활동).

반드시 아래 JSON 형식으로만 출력해:
{{
    "name": "인물 이름 (예: 고종, 이순신, 세종대왕)",
    "category": "RAG 컨텍스트를 분석하여 부여한 카테고리. 반드시 다음 4가지 문자열 중 하나여야 함: ['정치 / 외교', '독립 / 호국', '예술 / 문학', '실학 / 학문']",
    "era": "시대 명칭 (예: 조선 후기(1863-1907), 조선 시대(1545-1598))",
    "era_tag": "시대 태그 (예: 조선 후기, 조선 시대, 일제강점기, 근대)",
    "role": "대표 직업/역할 (예: 왕, 독립운동가, 서양화가)",
    "keywords": ["대표 해시태그 1", "태그 2", "태그 3"],
    "years": "생몰년도 또는 활동 기간 (예: 1863-1907, 1545-1598)",
    "situation": "당시 시대 상황 설명 (쉽게 2~3줄)",
    "one_line_summary": "히어로물 느낌의 직관적인 수식어 한줄 요약",
    "mbti": "RAG 분석을 통해 인물에게 가장 잘 어울린다고 판별한 MBTI 4글자",
    "mbti_nickname": "부여한 MBTI에 따른 캐릭터 별명",
    "mbti_details": {{
        "E_I": "최종 선택한 글자가 'E'라면 [활발한 대외 활동/토론] 행적을 쓰고, 'I'라면 [혼자 사색/독자적 저술/고독한 결단] 행적만 쓰세요. (두 성향 절대 섞지 말 것)",
        "S_N": "최종 선택한 글자가 'S'라면 [전통 수호/기존 기록 참고]를 적고, 'N'이라면 [첨단 기술 도입/새로운 비전 창조] 행적만 적으세요. (두 성향 절대 섞지 말 것)",
        "T_F": "최종 선택한 글자가 'T'라면 [냉철한 인과 분석/실리 계산] 행적을 쓰고, 'F'라면 [백성을 향한 사랑(애민)/의리와 인간미] 행적만 쓰세요. (두 성향 절대 섞지 말 것)",
        "J_P": "최종 선택한 글자가 'J'라면 [치밀한 사전 계획/체계적 시스템 정비] 행적을 쓰고, 'P'라면 [유연한 임기응변/기동성 있는 전술] 행적만 쓰세요. (두 성향 절대 섞지 말 것)"
    }},
    "stats": [
        {{"name": "스탯 1 이름 (예: 외교력)", "value": 88, "desc": "설명"}},
        {{"name": "스탯 2 이름 (예: 개혁 추진력)", "value": 90, "desc": "설명"}},
        {{"name": "스탯 3 이름 (예: 애민정신)", "value": 85, "desc": "설명"}}
    ],
    "intro_quote": "인물의 유명한 명언이나 다짐 한 줄",
    "intro_desc": "인물이 활약하게 된 주요 계기와 행적 설명 2~3줄"
}}
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    card_data = json.loads(response.choices[0].message.content)
    return card_data

def generate_characters_json():
    """
    kf_area_total_merged.csv 파일로부터 캐릭터 목록을 필터링하고
    OpenAI API를 통해 프로필을 추출한 후 characters.json을 생성하여 저장.
    """
    print(f"[INFO] 마스터 CSV 파일 로드 시도: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"마스터 CSV 파일이 존재하지 않습니다: {CSV_PATH}")
        
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    print(f"[SUCCESS] CSV 로드 완료: {len(df):,}행")
    
    df_clean = df.dropna(subset=["relate_prsn_nm"]).copy()
    df_clean["relate_prsn_nm"] = df_clean["relate_prsn_nm"].astype(str).str.strip()
    df_clean = df_clean[df_clean["relate_prsn_nm"] != ""]
    
    person_counts = df_clean["relate_prsn_nm"].value_counts()
    
    min_stories_threshold = 60
    selected_characters = [name for name, count in person_counts.items() if count >= min_stories_threshold]
    
    # 이순신 예외 추가
    special_characters = ["이순신"]
    for name in special_characters:
        if name not in selected_characters and name in person_counts:
            selected_characters.append(name)
            
    selected_characters = sorted(selected_characters)
    
    print(f"[INFO] 생성 대상 인물 리스트 ({len(selected_characters)}명): {selected_characters}")
    
    character_database = {}
    start_time = time.time()
    
    for idx, char_name in enumerate(selected_characters):
        print(f"\n[{idx+1}/{len(selected_characters)}] '{char_name}' 생성 진행 중...")
        associated_stories = get_associated_stories_for_char(df_clean, char_name)
        
        retries = 3
        for attempt in range(retries):
            try:
                profile_data = generate_character_profile_via_openai(char_name, associated_stories)
                profile_data["associated_stories"] = associated_stories
                profile_data["image_url"] = ""
                character_database[char_name] = profile_data
                print(f" ➔ '{char_name}' 프로필 생성 완료 (카테고리: {profile_data.get('category')}, MBTI: {profile_data.get('mbti')})")

                break
            except Exception as e:
                print(f" ➔ '{char_name}' 생성 시도 {attempt+1} 실패: {e}")
                if attempt < retries - 1:
                    time.sleep(10 * (attempt + 1))
                else:
                    print(f"[CRITICAL] '{char_name}' 생성 최종 실패. 생략합니다.")
                    
        # OpenAI API Rate limit 방지를 위해 딜레이
        time.sleep(2)
        
    os.makedirs(os.path.dirname(CHARACTERS_JSON_PATH), exist_ok=True)
    with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(character_database, f, ensure_ascii=False, indent=4)
        
    end_time = time.time()
    print(f"\n[SUCCESS] {len(character_database)}명의 캐릭터 데이터베이스 저장 완료: {CHARACTERS_JSON_PATH}")
    print(f"총 소요 시간: {end_time - start_time:.2f}초")

def generate_and_upload_character_image(character_name: str) -> str:
    """
    OpenAI DALL-E 3를 이용해 캐릭터 이미지를 생성하고, 
    이를 다운받아 GCP Cloud Storage에 바로 업로드한 뒤 public URL을 반환.
    """
    if not openai_client:
        print("[WARNING] OpenAI API 클라이언트가 존재하지 않아 이미지 생성을 할 수 없습니다.")
        return ""
        
    gcp_project_id = os.environ.get("GCP_PROJECT_ID")
    gcp_bucket_name = os.environ.get("GCP_BUCKET_NAME")
    
    if not gcp_bucket_name:
        print("[WARNING] GCP_BUCKET_NAME 환경변수가 설정되지 않았습니다. .env를 확인하십시오.")
        return ""

    prompt = f"""Heroic portrait of {character_name}.
K-Heroes historical character illustration.
Depict the most iconic and historically recognizable version of the character.
Automatically include historically accurate clothing, hairstyle, symbolic item, and representative historical elements.
Standing confidently in the center.
Traditional Korean watercolor illustration mixed with ink wash painting (sumukhwa).
Character occupies approximately 75% of the composition.
Historical elements appear only as soft watercolor accents behind the character.
No full background scene.
No sky, ground, horizon, or solid backdrop.
Background must fade completely into transparency.
Transparent PNG background.
Clean character cutout.
Museum-quality illustration.
Warm beige, brown, olive green and ivory palette.
Semi-realistic painting style.
High detail.
4:5 portrait composition.
No text, logo, border, frame, or UI."""

    try:
        print(f" ➔ DALL-E 3 이미지 생성 요청 중 ({character_name})...")
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            n=1,
            size="1024x1792",
            quality="standard"
        )

        image_url = response.data[0].url
        print(f" ➔ 이미지 생성 완료. URL 획득.")
        
        # 이미지 파일 다운로드
        img_res = requests.get(image_url)
        if img_res.status_code != 200:
            raise Exception(f"OpenAI에서 이미지를 다운로드하지 못했습니다. 상태 코드: {img_res.status_code}")
            
        # GCS 업로드
        storage_client = storage.Client(project=gcp_project_id)
        bucket = storage_client.bucket(gcp_bucket_name)
        
        blob_name = f"characters/{character_name}.png"
        blob = bucket.blob(blob_name)
        
        print(f" ➔ GCS 업로드 시작: gs://{gcp_bucket_name}/{blob_name}")
        blob.upload_from_string(img_res.content, content_type="image/png")
        
        # GCS public URL 구성
        public_url = f"https://storage.googleapis.com/{gcp_bucket_name}/{blob_name}"
        print(f" [SUCCESS] GCS 업로드 완료: {public_url}")
        return public_url
        
    except Exception as e:
        print(f" [ERROR] '{character_name}' DALL-E/GCS 연동 중 에러 발생: {e}")
        return ""

def update_characters_with_images(target_char: Optional[str] = None):
    """
    기존 characters.json을 읽어와 image_url이 없는 경우 (또는 target_char가 지정된 경우 강제 갱신)
    DALL-E 3로 이미지를 생성하여 GCS에 업로드하고 characters.json에 기록.
    """
    if not os.path.exists(CHARACTERS_JSON_PATH):
        print(f"[ERROR] '{CHARACTERS_JSON_PATH}' 파일이 존재하지 않습니다. 먼저 프로필을 생성하십시오.")
        return
        
    with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
        character_database = json.load(f)
        
    print(f"[INFO] 현재 {len(character_database)}명의 인물 데이터가 로드되었습니다.")
    
    updated_count = 0
    for idx, (char_name, data) in enumerate(character_database.items()):
        # 특정 캐릭터만 타겟팅할 때, 그 캐릭터가 아니면 스킵
        if target_char and char_name != target_char:
            continue
            
        # target_char가 지정되지 않은 상황에서, 이미 image_url이 있고 유효한 링크인 경우 스킵
        if not target_char and data.get("image_url") and data["image_url"].startswith("http"):
            print(f"[{idx+1}/{len(character_database)}] '{char_name}' 이미 존재함. 스킵: {data['image_url']}")
            continue
            
        print(f"\n[{idx+1}/{len(character_database)}] '{char_name}' 이미지 생성 및 업로드 진행 중...")
        gcs_url = generate_and_upload_character_image(char_name)
        
        if gcs_url:
            data["image_url"] = gcs_url
            updated_count += 1
            
            # 진행 상태를 바로 파일에 저장 (안전성 보장)
            with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(character_database, f, ensure_ascii=False, indent=4)
            print(f" ➔ '{char_name}' 업데이트 저장 완료")
            
            if target_char:
                # 특정 캐릭터 지정 시 즉시 루프 종료
                break
                
            # API 호출 한도 방지를 위해 대기
            time.sleep(5)
        else:
            print(f" ➔ [WARNING] '{char_name}' 이미지 생성 실패 (다음 루프에서 재시도 가능)")
            
    print(f"\n[COMPLETE] 총 {updated_count}명의 캐릭터 이미지 링크를 갱신했습니다.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--images":
        target = sys.argv[2] if len(sys.argv) > 2 else None
        update_characters_with_images(target)
    elif len(sys.argv) > 1 and sys.argv[1] == "--profiles":
        generate_characters_json()
    elif len(sys.argv) > 1 and sys.argv[1] == "--all":
        generate_characters_json()
        update_characters_with_images()
    else:
        print("사용법:")
        print("  python data_manager.py --profiles            : CSV를 기반으로 캐릭터 프로필 JSON 생성")
        print("  python data_manager.py --images [캐릭터명]  : characters.json의 이미지 주소 갱신 (특정 캐릭터 지정 가능)")
        print("  python data_manager.py --all                 : 프로필 생성 후 이미지 주소까지 일괄 갱신")


