import os
import json
import time
from typing import List, Dict, Any, Optional
from collections import Counter
from dotenv import load_dotenv
from openai import OpenAI

# models/character.py에서 분리된 Pydantic 모델을 import
from models.character import MBTIDetails, StatItem, CharacterCard

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))
RAG_DATA_PATH = os.path.join(BASE_DIR, "data", "proceed", "kf_area_rag_data.json")
PROFILES_JSON_PATH = os.path.join(BASE_DIR, "data", "profiles.json")

# OpenAI API 설정
openai_api_key = os.environ.get("OPENAI_API_KEY")
openai_client = None
if openai_api_key:
    openai_client = OpenAI(api_key=openai_api_key)
else:
    print("[WARNING] OPENAI_API_KEY environment variable not found.")

DEFAULT_FALLBACK_PROFILES = {}

# 메모리에 올라가는 전역 캐시 데이터
cached_sido: List[str] = []
cached_sido_sigungu: List[Dict[str, str]] = []
cached_rag_data: List[Dict[str, Any]] = []
cached_profiles: Dict[str, Any] = {}


def get_retrieved_clues(character_name: str) -> List[Dict[str, Any]]:
    """
    RAG 데이터셋에서 캐릭터 이름이 관련 인물(related_person) 혹은 본문에 매칭되는 단서 리스트를 찾아 반환.
    """
    retrieved_clues = []
    for item in cached_rag_data:
        metadata = item.get("metadata", {})
        related_person = metadata.get("related_person") or ""
        text = item.get("text") or ""
        
        if character_name in related_person or character_name in text:
            retrieved_clues.append(item)
    return retrieved_clues


def generate_character_card_via_openai(character_name: str) -> CharacterCard:
    """
    RAG 단서 컨텍스트들을 활용하여 OpenAI API를 통해 특정 인물의 상세 프로필 카드 정보를 JSON 형식으로 생성.
    """
    retrieved_clues = get_retrieved_clues(character_name)
    context_str = ""
    for i, clue in enumerate(retrieved_clues[:50]):
        context_str += f"[단서 {i+1}] {clue['text']}\n\n"
        
    character_card_prompt = f"""
너는 역사 선택형 시뮬레이션 게임 'K-Heroes'의 인물 카드 설계자야.
제공된 RAG 백그라운드 지식을 기반으로 대상 인물에 대한 정보를 추출하여 재미있는 인물 카드 데이터로 생성해 줘.
어려운 한자어는 피하고 초등학생도 쉽게 읽을 수 있는 단어를 써줘.

[대상 인물]
{character_name}

[RAG 데이터 컨텍스트]
{context_str}

[MBTI 부여 원칙 - 매우 중요!]
역사적 인물들의 MBTI가 INFJ, INTJ, INFP 등 특정 유형에 지나치게 편중되지 않도록 16가지 MBTI 유형을 골고루 다양하게 부여해 주세요.
인물의 실제 역사적 행적, 성격, 예술/학문 스타일을 분석하여 다음과 같이 다양하게 차별화된 MBTI를 설정해 주세요:
- 실용적이고 체계적인 학자/정치가/행정가: ISTJ, ESTJ
- 행동력이 강하고 모험적인 의병장/전사/개혁가: ESTP, ISTP, ENTJ
- 감수성이 풍부하고 독창적인 예술가/문학가: ISFP, ENFP, ESFP, INFP
- 논리적이고 사색적인 사상가/이론가/실학자: INTP, ENTP
- 대중과 깊이 소통하며 가르침을 준 교육자/지도자: ENFJ, ESFJ, ISFJ, ESFJ
인물 고유의 개성과 행적이 잘 묻어나도록 MBTI 4글자와 그 닉네임을 독창적이고 차별화되게 설정해 주세요.

반드시 아래 JSON 형식으로만 출력해:
{{
    "name": "인물 이름 (예: 윤봉길 의사, 이순신 장군, 세종대왕)",
    "era": "시대 명칭 (예: 조선 시대(1545-1598), 일제강점기(1908-1932))",
    "era_tag": "시대 태그 (예: 일제강점기, 조선 시대)",
    "role": "직업/역할 명칭 (예: 독립운동가, 삼도수군통제사, 조선 4대 왕)",
    "keywords": ["해시태그 키워드 1", "키워드 2", "키워드 3"],
    "years": "생몰년도 또는 활동기간 (예: 1908-1932, 1545-1598, 1397-1450)",
    "situation": "당시 시대 상황 설명 (쉽게 2~3줄)",
    "one_line_summary": "히어로물 느낌의 직관적인 수식어 한줄 요약",
    "mbti": "인물 성향에 맞는 MBTI 4글자",
    "mbti_nickname": "MBTI에 따른 캐릭터 별명 (예: 선의의 옹호자 / 독립운동계의 철두철미한 계획러)",
    "mbti_details": {{
        "E_I": "외향/내향형 특성 한줄 설명",
        "S_N": "감각/직관형 특성 한줄 설명",
        "T_F": "사고/감정형 특성 한줄 설명",
        "J_P": "판단/인식형 특성 한줄 설명"
    }},
    "stats": [
        {{"name": "스탯 1 이름 (예: 계획과 선택력)", "value": 90, "desc": "설명"}},
        {{"name": "스탯 2 이름 (예: 용기와 결단력)", "value": 95, "desc": "설명"}},
        {{"name": "스탯 3 이름 (예: 사명과 책임감)", "value": 92, "desc": "설명"}}
    ],
    "intro_quote": "인물의 유명한 명언이나 다짐 한 줄",
    "intro_desc": "인물이 이 거사를 치르게 된 계기와 시대 상황 설명 2~3줄"
}}
"""
    if not openai_client:
        raise Exception("OpenAI API Client가 설정되지 않았습니다. (.env에 OPENAI_API_KEY를 확인하세요)")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": character_card_prompt}
                ],
                response_format={"type": "json_object"}
            )
            card_data = json.loads(response.choices[0].message.content)
            return CharacterCard(**card_data)
        except Exception as e:
            err_msg = str(e)
            # 429 Rate Limit (Quota Exceeded) 또는 OpenAI의 RateLimitError 감지 시 대기 후 재시도
            if "429" in err_msg or "rate_limit" in err_msg.lower() or "rate limit" in err_msg.lower() or "RateLimitError" in type(e).__name__:
                if attempt < max_retries - 1:
                    wait_sec = 25 * (attempt + 1)
                    print(f"\n[WARNING] OpenAI 429 Rate Limit 감지. {wait_sec}초 대기 후 재시도합니다... (시도 {attempt+1}/{max_retries})")
                    time.sleep(wait_sec)
                    continue
            raise Exception(f"OpenAI 프로필 생성 API 에러: {err_msg}")


def get_character_card(character_name: str) -> CharacterCard:
    """
    1. 메모리 캐시에서 해당 캐릭터 카드를 먼저 탐색하고,
    2. 없으면 OpenAI API를 통해 프로필 정보를 생성하고 연고 시도(associated_sidos)를 맵핑한 후 profiles.json 및 캐시에 갱신하여 반환.
    """
    # 1. 메모리 캐시에서 조회
    if character_name in cached_profiles:
        return CharacterCard(**cached_profiles[character_name])
        
    # 2. 없으면 OpenAI로 프로필 카드 생성
    card = generate_character_card_via_openai(character_name)
    
    # 3. 이 인물이 출연하는 Sido 목록을 RAG에서 찾아 채워줌 (위/경도가 존재하고 관련 인물 필드 매칭)
    sidos = set()
    for item in cached_rag_data:
        metadata = item.get("metadata", {})
        related_person = metadata.get("related_person") or ""
        if character_name in related_person:
            if metadata.get("latitude") is not None and metadata.get("longitude") is not None:
                sido = metadata.get("region_sido")
                if sido:
                    sidos.add(sido)
    card.associated_sidos = sorted(list(sidos))
    
    # 4. 메모리 캐시에 탑재하고 profiles.json 파일 업데이트
    cached_profiles[character_name] = card.model_dump()
    try:
        # data 디렉토리 존재 확인
        os.makedirs(os.path.dirname(PROFILES_JSON_PATH), exist_ok=True)
        with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(cached_profiles, f, ensure_ascii=False, indent=4)
        print(f"[SUCCESS] {character_name} 프로필 생성 및 통합 캐시({PROFILES_JSON_PATH}) 저장 완료.")
    except Exception as e:
        print(f"[WARNING] 프로필 통합 캐시 파일 저장 실패 ({character_name}): {str(e)}")
        
    return card


def sync_profiles_cache(min_clues: int = 50):
    """
    RAG 데이터를 집계하여 단서가 min_clues개(기본 50개) 이상인 캐릭터 후보 중
    profiles.json 파일에 로드되어 있지 않은 누락된 신규 캐릭터 카드를 OpenAI를 통해 생성하고 동기화.
    """
    global cached_profiles, cached_rag_data
    if not cached_rag_data:
        print("[WARNING] RAG 데이터가 로드되지 않아 동기화를 진행할 수 없습니다.")
        return

    # 1. RAG 데이터에서 related_person별 단서 개수 집계
    counts = Counter()
    for item in cached_rag_data:
        person = item.get("metadata", {}).get("related_person")
        if person:
            counts[person] += 1

    # 2. 단서가 min_clues개 이상인 캐릭터 후보 필터링
    playable_candidates = [person for person, cnt in counts.items() if cnt >= min_clues]
    print(f"[INFO] 단서 {min_clues}개 이상인 인물 후보군: {len(playable_candidates)}명")

    # 3. profiles.json 캐시에 누락된 신규 캐릭터 찾기
    missing_chars = [char for char in playable_candidates if char not in cached_profiles]

    if not missing_chars:
        print("[SUCCESS] profiles.json 캐시가 최신 상태입니다. 추가로 생성할 캐릭터가 없습니다.")
        return

    print(f"[INFO] 누락된 캐릭터 {len(missing_chars)}명 발견: {missing_chars}. OpenAI API를 호출하여 생성을 시작합니다.")

    # 4. 루프를 돌며 신규 프로필 카드 생성 및 저장
    success_count = 0
    for i, char in enumerate(missing_chars):
        print(f"[{i+1}/{len(missing_chars)}] '{char}'의 프로필 카드를 생성 중...")
        try:
            get_character_card(char)
            success_count += 1
            
            # API Rate limit을 피하기 위해 딜레이 추가 (단, 1개 이상 남았을 때만)
            if i < len(missing_chars) - 1:
                time.sleep(3)  # 안전을 위해 3초 대기
        except Exception as e:
            print(f"[ERROR] '{char}' 프로필 생성 실패: {str(e)}")
            continue

    # 1개 이상의 새로운 카드가 완벽히 성공한 경우에만 최종 profiles.json 파일 캐시를 갱신
    if success_count > 0:
        try:
            os.makedirs(os.path.dirname(PROFILES_JSON_PATH), exist_ok=True)
            with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(cached_profiles, f, ensure_ascii=False, indent=4)
            print(f"[SUCCESS] 신규 프로필 {success_count}개 생성 완료로 profiles.json 파일 최종 갱신 완료: {PROFILES_JSON_PATH}")
        except Exception as e:
            print(f"[WARNING] profiles.json 최종 저장 중 실패: {str(e)}")
    else:
        print("[INFO] 신규 캐릭터 생성에 실패했거나 추가된 캐릭터가 없어 profiles.json 쓰기를 건너뛰고 기존 데이터를 안전하게 유지합니다.")


def load_regions_to_memory(force_sync: bool = False):
    """
    서버 초기 기동 또는 데이터 매니저 직접 실행 시 데이터와 캐시를 로딩하는 메인 함수.
    1. profiles.json 캐시를 로딩.
    2. RAG 데이터를 로딩하고 고유 시도 및 시도-시군구 관계 목록을 메모리에 구축.
    3. 캐시가 비어있거나 force_sync=True인 경우 sync_profiles_cache를 작동시켜 누락 프로필을 순차 생성.
    4. 로드된 캐릭터들을 RAG clues를 토대로 연고 지역(associated_sidos)과 실시간 매핑.
    """
    global cached_sido, cached_sido_sigungu, cached_rag_data, cached_profiles
    
    # 1. 프로필 카드 데이터 로드
    if os.path.exists(PROFILES_JSON_PATH):
        try:
            with open(PROFILES_JSON_PATH, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            
            # 파일이 비어있는 {} 인 경우 기본 템플릿으로 채워넣어 복원합니다.
            if not loaded:
                print(f"[WARNING] 프로필 데이터 파일이 비어있습니다. 기본 템플릿({len(DEFAULT_FALLBACK_PROFILES)}명)으로 자가 복원합니다.")
                cached_profiles = dict(DEFAULT_FALLBACK_PROFILES)
                try:
                    with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f_write:
                        json.dump(cached_profiles, f_write, ensure_ascii=False, indent=4)
                    print(f"[SUCCESS] 기본 프로필 템플릿을 {PROFILES_JSON_PATH}에 저장 완료.")
                except Exception as e_write:
                    print(f"[ERROR] 기본 프로필 파일 쓰기 실패: {str(e_write)}")
            else:
                cached_profiles = loaded
                print(f"[SUCCESS] {len(cached_profiles)}개의 캐릭터 프로필을 로드했습니다. ({PROFILES_JSON_PATH})")
        except Exception as e:
            print(f"[WARNING] 프로필 데이터 파일 로드 실패: {str(e)}. 기본 템플릿으로 메모리 및 파일을 복원합니다.")
            cached_profiles = dict(DEFAULT_FALLBACK_PROFILES)
            try:
                os.makedirs(os.path.dirname(PROFILES_JSON_PATH), exist_ok=True)
                with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f_write:
                    json.dump(cached_profiles, f_write, ensure_ascii=False, indent=4)
            except Exception as e_write:
                print(f"[ERROR] 기본 프로필 파일 재생성 실패: {str(e_write)}")
    else:
        print(f"[WARNING] 프로필 데이터 파일이 존재하지 않습니다: {PROFILES_JSON_PATH}. 기본 템플릿으로 복원합니다.")
        cached_profiles = dict(DEFAULT_FALLBACK_PROFILES)
        # profiles.json이 없을 때 기본 프로필 템플릿으로 복원해 생성
        try:
            os.makedirs(os.path.dirname(PROFILES_JSON_PATH), exist_ok=True)
            with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(cached_profiles, f, ensure_ascii=False, indent=4)
            print(f"[SUCCESS] 기본 프로필 템플릿으로 새 캐시 파일({PROFILES_JSON_PATH})을 안전하게 생성했습니다.")
        except Exception as e:
            print(f"[ERROR] 기본 프로필 파일 생성 실패: {str(e)}")

    # 2. RAG 데이터 로드
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
        
        # 3. 캐릭터 프로필 캐시와 RAG 데이터 자동 동기화 (신규 캐릭터 자동 생성)
        # profiles.json 캐시가 비어있거나 force_sync가 True일 때만 동기화 진행
        if not cached_profiles or force_sync:
            print("[INFO] 프로필 캐시가 비어있거나 강제 동기화가 활성화되었습니다. 동기화를 진행합니다...")
            sync_profiles_cache(min_clues=50)
        else:
            print("[INFO] 기존 프로필 캐시가 존재합니다. 동기화를 건너뜁니다.")

        # 4. 캐릭터별 연고 시도(associated_sidos) 자동 매핑
        map_profiles_to_sidos()
    except Exception as e:
        print(f"[ERROR] 데이터 로드 중 오류 발생: {str(e)}")


def map_profiles_to_sidos():
    """
    메모리 프로필 캐시에 탑재된 캐릭터들과 RAG 데이터를 조사하여
    캐릭터가 출연하는 행정구역(Sido) 목록을 associated_sidos에 실시간으로 매핑 및 채워넣어줌.
    (메타데이터의 related_person에 캐릭터명이 매칭되고 위도/경도가 유효한 경우만 수집)
    """
    global cached_profiles, cached_rag_data
    if not cached_profiles or not cached_rag_data:
        return
        
    print("[INFO] 캐릭터와 연고 지역(시도) 자동 매핑 작업 진행 중...")
    mapped_count = 0
    for char_key, profile in cached_profiles.items():
        sidos = set()
        for item in cached_rag_data:
            metadata = item.get("metadata", {})
            related_person = metadata.get("related_person") or ""
            
            if char_key in related_person:
                if metadata.get("latitude") is not None and metadata.get("longitude") is not None:
                    sido = metadata.get("region_sido")
                    if sido:
                        sidos.add(sido)
                    
        profile["associated_sidos"] = sorted(list(sidos))
        mapped_count += 1
        print(f"   - {char_key}: {len(sidos)}개 시도와 매핑됨 ({', '.join(sorted(list(sidos)))[:80]}...)")
        
    # 업데이트된 매핑 내용을 profiles.json 파일에도 반영하여 영구 저장
    try:
        os.makedirs(os.path.dirname(PROFILES_JSON_PATH), exist_ok=True)
        with open(PROFILES_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(cached_profiles, f, ensure_ascii=False, indent=4)
        print(f"[SUCCESS] 업데이트된 연고 지역 매핑 정보를 {PROFILES_JSON_PATH}에 영구 저장했습니다.")
    except Exception as e:
        print(f"[WARNING] profiles.json 저장 중 실패: {str(e)}")

    print(f"[SUCCESS] 총 {mapped_count}개 캐릭터의 연고 지역 매핑 완료.")


if __name__ == "__main__":
    load_regions_to_memory(force_sync=True)
