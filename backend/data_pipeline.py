import os
import json
import time
import sys
import io
import base64
from typing import Dict, Any, List, Optional
import pandas as pd
import requests
from dotenv import load_dotenv
from openai import OpenAI
from google.cloud import storage

# Setup project directories
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

# Global variables from .env
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
GCP_BUCKET_NAME = os.environ.get("GCP_BUCKET_NAME")

# --- Helper functions ---
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

# --- OpenAI GPT Generators ---
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

[캐릭터 분류 카테고리 판별 원칙]
RAG 데이터 컨텍스트에 담긴 인물의 주된 업적과 행적을 분석하여 다음 4가지 테마 중 하나를 엄격히 부여하세요:
- 정치 / 외교: 왕, 대통령, 재상, 정치가로서 국가 제도 개혁, 외교 협상, 권력 투쟁 등을 주로 펼친 경우.
- 독립 / 호국: 국난 극복, 왜구 방어, 의병 활동, 독립운동, 군사적 전투 등을 주로 이끈 장군, 의사, 열사 등.
- 예술 / 문학: 판소리, 서양화, 풍속화, 무용, 시, 소설, 음악 등 문화예술 창작 활동을 한 예인, 작가, 화가 등.
- 실학 / 학문: 성리학, 실학, 고증학, 과학 기술 연구 및 학술 교육에 헌신한 학자, 사상가 등.

[캐릭터 설계 절대 원칙 - MBTI 자동 판별]
반드시 제공된 [RAG 데이터 컨텍스트]를 먼저 철저히 분석한 뒤, 인물이 역사 속에서 보여준 가장 주된 업적과 성향에 가장 잘 어울리는 MBTI를 16가지 유형 중 하나로 '스스로 판별'하여 부여하세요.
역사적 사실을 다 집어넣으려고 한 문장 안에 반대되는 성향을 섞어 쓰는 순간 너의 임무는 실패입니다. 설정한 MBTI 알파벳 성향 하나에만 100% 집중하여 선명한 캐릭터 카드를 만드세요.

[MBTI 부여 및 작성 원칙]
- E vs I : E (대중 연설, 적극적 동료 규합, 활발한 대외 외교) / I (독자적 저술, 홀로 사색, 비밀 결단)
- S vs N : S (과거 관습 수호, 현실 및 현장 경험 데이터 활용) / N (한글 창제, 신기술 도입, 신분제 폐지 등 미래적 비전)
- T vs F : T (냉철한 정세 분석, 국가 실리 저울질, 법과 원칙 집행) / F (백성을 가엽게 여김, 동료와의 의리, 충성심)
- J vs P : J (치밀한 계획 수립, 국가 제도/법전 완성) / P (임기응변, 신출귀몰 게릴라 전술)

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
        "E_I": "E 또는 I의 행적 설명",
        "S_N": "S 또는 N의 행적 설명",
        "T_F": "T 또는 F의 행적 설명",
        "J_P": "J 또는 P의 행적 설명"
    }},
    "stats": [
        {{"name": "스탯 1 이름", "value": 88, "desc": "설명"}},
        {{"name": "스탯 2 이름", "value": 90, "desc": "설명"}},
        {{"name": "스탯 3 이름", "value": 85, "desc": "설명"}}
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
    
    return json.loads(response.choices[0].message.content)

def generate_scenarios_via_openai(character_name: str, stories: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not openai_client:
        raise ValueError("OpenAI API 클라이언트가 존재하지 않아 시나리오 생성을 할 수 없습니다.")

    context_str = ""
    for i, s in enumerate(stories[:30]):  # 넉넉하게 30개의 스토리를 전달
        context_str += f"[스토리 ID: {s['id']}] 제목: {s['title']}, 요약: {s['summary']}\n\n"

    prompt = f"""
너는 역사 선택형 시뮬레이션 게임 'K-Heroes'의 시나리오 설계자야.
제공된 역사 단서(RAG)를 바탕으로 대상 인물에 대한 독립된 역사 테마 시나리오(챕터)를 최소 3개에서 최대 5개까지 설계해 줘.
어려운 한자어는 피하고 초등학생도 쉽게 읽을 수 있는 단어를 써줘.

[대상 인물]
이름: {character_name}

[역사 자료]
{context_str}

[설계 원칙]
1. 각 시나리오는 서로 겹치지 않는 독립적인 주요 역사적 에피소드여야 해.
2. 각 시나리오별로 정확히 3개의 턴(turn_no: 1, 2, 3)을 기획해 줘. (1: 사건의 시작, 2: 위기/대립, 3: 승리/결말)
3. 각 턴은 'title' (사건 주제와 연도 정보 포함, 예: "무기 선택 (1932년 4월)"), 'situation' (상황 설명), 'tip_title' (역사 지식을 호기심 있게 유도하는 질문, 예: "💡 왜 하필 도시락과 물통일까요?"), 'tip_desc' (질문에 대한 정확하고 자세한 실제 역사적 설명 2~3줄), 그리고 'choices' (A선택지와 B선택지)를 가져야 해.
4. 'A' 선택지는 역사적 팩트(is_historical: true)에 입각한 결정이어야 하고, 'B' 선택지는 설득력 있는 대체 역사(is_historical: false) 결정이어야 해.
5. 각 선택지는 'title' (행동 위주의 제목, 예: "물통 폭탄과 도시락 폭탄을 챙긴다"), 'description' (구체적인 행동과 예상 설명 1줄, 예: "도시락과 물통 모양으로 위장한 폭탄을 선택해 경비를 통과한다"), 'stats' (딕셔너리 형태의 3가지 스탯 영향도), 그리고 'result_text' (결과 지문 1~2줄)를 포함해야 해.
6. 'stats'는 대상 인물의 성향/카테고리에 가장 어울리는 3가지 수치를 설정하여 개연성 있게 10~30 범위 내외의 정수 변동(예: 10, -10)을 부여해 줘.
   [스탯 키 선택 가이드라인]
   - 독립 / 호국 카테고리인 경우: {{"독립 자금": -10, "팀워크": 10, "성공 확률": 30}} 처럼 독립 자금, 팀워크, 성공 확률 키를 주로 사용.
   - 정치 / 외교 카테고리인 경우: {{"국력": 20, "백성의 지지": 10, "성공 확률": -15}} 처럼 국력, 백성의 지지, 성공 확률 키를 주로 사용.
   - 예술 / 문학 카테고리인 경우: {{"예술성": 15, "백성의 위로": 10, "성공 확률": 20}} 처럼 예술성, 백성의 위로, 성공 확률 키를 주로 사용.
   - 실학 / 학문 카테고리인 경우: {{"학문적 깊이": 20, "실용성": 15, "성공 확률": 10}} 처럼 학문적 깊이, 실용성, 성공 확률 키를 주로 사용.
7. 유저가 A 또는 B 중 무엇을 선택하더라도, 각각 고유의 결과 지문('result_text')을 보여준 후, 다음 턴의 상황('situation')으로 부드럽게 이어질 수 있는 병합형 구조(Converging Choice)로 작성해 줘.
8. 이 시나리오에 영감을 준 원본 역사 자료의 ID 목록('source_story_ids')을 포함해 줘.

반드시 아래 JSON 형식으로만 출력해:
{{
    "scenarios": [
        {{
            "scenario_id": 1,
            "title": "시나리오 대주제 (예: 상하이 홍커우 공원 의거)",
            "description": "이 시나리오가 어떤 국면인지 설명 2~3줄",
            "historical_facts": "RAG에서 발췌한 이 시나리오의 핵심 실제 역사적 팩트 2~3줄",
            "source_story_ids": [102, 105],
            "turns": [
                {{
                    "turn_no": 1,
                    "title": "1턴 사건 명칭과 연도 (예: 무기 선택 (1932년 4월))",
                    "situation": "상황 묘사 2~3줄",
                    "tip_title": "💡 질문 형식의 토글 질문",
                    "tip_desc": "역사적 팩트 기반의 상세 해설 2~3줄",
                    "choices": {{
                        "A": {{
                            "title": "선택지 A 제목",
                            "description": "선택지 A 상세 행동 설명 1줄",
                            "stats": {{ "독립 자금": -10, "팀워크": 10, "성공 확률": 30 }},
                            "result_text": "이 선택을 한 후 보여줄 결과 지문 1~2줄",
                            "is_historical": true
                        }},
                        "B": {{
                            "title": "선택지 B 제목",
                            "description": "선택지 B 상세 행동 설명 1줄",
                            "stats": {{ "독립 자금": 15, "팀워크": -10, "성공 확률": -25 }},
                            "result_text": "이 선택을 한 후 보여줄 결과 지문 1~2줄",
                            "is_historical": false
                        }}
                    }}
                }},
                {{
                    "turn_no": 2,
                    "title": "2턴 사건 명칭과 연도",
                    "situation": "2턴 상황 묘사 (1턴 A/B 결과 이후 자연스럽게 이어지는 병합 상황)",
                    "tip_title": "💡 질문 형식의 토글 질문",
                    "tip_desc": "역사적 해설 2~3줄",
                    "choices": {{
                        "A": {{
                            "title": "선택지 A 제목",
                            "description": "선택지 A 상세 행동 설명 1줄",
                            "stats": {{ "독립 자금": -5, "팀워크": 15, "성공 확률": 20 }},
                            "result_text": "이 선택을 한 후 보여줄 결과 지문 1~2줄",
                            "is_historical": true
                        }},
                        "B": {{
                            "title": "선택지 B 제목",
                            "description": "선택지 B 상세 행동 설명 1줄",
                            "stats": {{ "독립 자금": 10, "팀워크": -15, "성공 확률": -30 }},
                            "result_text": "이 선택을 한 후 보여줄 결과 지문 1~2줄",
                            "is_historical": false
                        }}
                    }}
                }},
                {{
                    "turn_no": 3,
                    "title": "3턴 사건 명칭과 연도",
                    "situation": "3턴 상황 묘사 (2턴 A/B 결과 이후 최종 마무리를 장식하는 연출 상황)",
                    "tip_title": "💡 질문 형식의 토글 질문",
                    "tip_desc": "역사적 해설 2~3줄",
                    "choices": {{
                        "A": {{
                            "title": "선택지 A 제목",
                            "description": "선택지 A 상세 행동 설명 1줄",
                            "stats": {{ "독립 자금": -20, "팀워크": 20, "성공 확률": 40 }},
                            "result_text": "이 선택을 한 후 최종 결말 결과 지문 및 역사적 의의 1~2줄",
                            "is_historical": true
                        }},
                        "B": {{
                            "title": "선택지 B 제목",
                            "description": "선택지 B 상세 행동 설명 1줄",
                            "stats": {{ "독립 자금": 30, "팀워크": -20, "성공 확률": -40 }},
                            "result_text": "이 선택을 한 후 최종 결말 결과 지문 및 역사적 의의 1~2줄",
                            "is_historical": false
                        }}
                    }}
                }}
            ]
        }}
    ]
}}
"""
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    data = json.loads(response.choices[0].message.content)
    return data.get("scenarios", [])

# --- OpenAI Image Generators & GCS Upload ---
def generate_and_upload_character_image(character_name: str) -> str:
    """
    OpenAI gpt-image-2를 이용하여 캐릭터 전신 일러스트를 생성하고 GCS에 업로드.
    """
    if not openai_client:
        print("[WARNING] OpenAI API 클라이언트가 존재하지 않습니다.")
        return ""
    if not GCP_BUCKET_NAME:
        print("[WARNING] GCP_BUCKET_NAME 설정되지 않음.")
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
        print(f" ➔ 전신 이미지 생성 요청 중 ({character_name})...")
        response = openai_client.images.generate(
            model="gpt-image-2",
            prompt=prompt,
            n=1,
            size="1024x1792",
            quality="high"
        )
        
        b64_data = response.data[0].b64_json
        if not b64_data:
            raise Exception("No image data returned from OpenAI API.")
            
        image_bytes = base64.b64decode(b64_data)
        
        storage_client = storage.Client(project=GCP_PROJECT_ID)
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        
        blob_name = f"characters/{character_name}.png"
        blob = bucket.blob(blob_name)
        
        print(f" ➔ GCS 업로드: gs://{GCP_BUCKET_NAME}/{blob_name}")
        blob.upload_from_string(image_bytes, content_type="image/png")
        
        public_url = f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{blob_name}"
        return public_url
    except Exception as e:
        print(f" [ERROR] '{character_name}' 이미지 생성/GCS 실패: {e}")
        return ""

def generate_and_upload_turn_image(character_name: str, turn_situation: str, scenario_id: int, turn_no: int) -> str:
    """
    OpenAI gpt-image-2를 이용하여 상황(턴)별 키아트 일러스트를 생성하고 GCS에 업로드 (16:9 가로).
    """
    if not openai_client:
        print("[WARNING] OpenAI API 클라이언트가 존재하지 않습니다.")
        return ""
    if not GCP_BUCKET_NAME:
        print("[WARNING] GCP_BUCKET_NAME 설정되지 않음.")
        return ""

    prompt = f"""{character_name}

{turn_situation}

K-Heroes historical scenario illustration.
Show {character_name} in the moment of {turn_situation}.
Focus on both the main character and the historical situation.
The scene should clearly communicate the story and decision context of the event.
Historical setting and period-accurate clothing.
Authentic architecture, environment and cultural elements appropriate to the era.
Strong emotional storytelling.
Cinematic composition.
Story-focused illustration.
Main character clearly visible and occupies approximately 40~50% of the composition.
Historical environment and story elements occupy approximately 50~60% of the composition.
One important historical object, landmark, building, weapon, document or symbolic element should subtly stand out through slightly richer color and contrast.
Create a natural visual focal point while maintaining harmony with the overall artwork.
Traditional Korean watercolor illustration mixed with ink wash painting (sumukhwa).
Premium Korean cultural heritage artwork.
Warm ivory paper texture.
Elegant brush strokes.
Soft watercolor edges.
Semi-realistic painting style.
Warm beige, brown, olive green and ivory palette.
Historical atmosphere.
Museum-quality educational game artwork.
No text.
No logo.
No UI.
No border.
No frame.
16:9 composition.
4K quality."""

    try:
        print(f" ➔ gpt-image-2 턴 상황 이미지 생성 요청 중 ({character_name} 시나리오 {scenario_id} 턴 {turn_no})...")
        response = openai_client.images.generate(
            model="gpt-image-2",
            prompt=prompt,
            n=1,
            size="1792x1024",
            quality="high"
        )
        
        b64_data = response.data[0].b64_json
        if not b64_data:
            raise Exception("No image data returned from OpenAI API.")
            
        image_bytes = base64.b64decode(b64_data)
        
        storage_client = storage.Client(project=GCP_PROJECT_ID)
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        
        blob_name = f"scenarios/{character_name}_scenario_{scenario_id}_turn_{turn_no}.png"
        blob = bucket.blob(blob_name)
        
        print(f" ➔ GCS 업로드: gs://{GCP_BUCKET_NAME}/{blob_name}")
        blob.upload_from_string(image_bytes, content_type="image/png")
        
        public_url = f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{blob_name}"
        return public_url
    except Exception as e:
        print(f" [ERROR] '{character_name}' 시나리오 {scenario_id} 턴 {turn_no} 상황 이미지 생성/GCS 실패: {e}")
        return ""

def generate_and_upload_choice_image(character_name: str, choice_text: str, scenario_id: int, turn_no: int, choice_key: str) -> str:
    """
    OpenAI gpt-image-2를 이용하여 선택지(A/B)별 일러스트를 생성하고 GCS에 업로드 (4:3 -> 1:1).
    """
    if not openai_client:
        print("[WARNING] OpenAI API 클라이언트가 존재하지 않습니다.")
        return ""
    if not GCP_BUCKET_NAME:
        print("[WARNING] GCP_BUCKET_NAME 설정되지 않음.")
        return ""

    prompt = f"""{character_name}

{choice_text}

K-Heroes historical decision illustration.
Show {character_name} in the moment of {choice_text}.
Focus on the historical situation, action and environment rather than the character portrait.
The scene should clearly communicate the choice being made.
Historical setting and period-accurate clothing.
Authentic architecture, environment and cultural elements appropriate to the era.
One clear action that represents the decision or event.
Strong emotional storytelling.
Focused composition.
Suitable for a choice card.
Character occupies approximately 20~30% of the composition.
Environment and story occupy approximately 70~80% of the composition.
Traditional Korean watercolor and ink wash painting style.
Warm ivory paper texture.
Semi-realistic painting style.
Mostly muted beige, brown, olive green and ivory palette.
One important object, landmark, flag, weapon, invention, building or symbolic element should be rendered with slightly richer color and contrast to naturally draw the viewer's eye.
Use cinematic visual hierarchy.
Create a clear focal point.
The highlighted object must remain historically accurate and harmonious with the overall palette.
Soft watercolor edges.
Historical atmosphere.
No text.
No logo.
No UI.
No border.
No frame.
4:3 composition.
4K quality."""

    try:
        print(f" ➔ gpt-image-2 선택지 이미지 생성 요청 중 ({character_name} 시나리오 {scenario_id} 턴 {turn_no} 선택지 {choice_key})...")
        response = openai_client.images.generate(
            model="gpt-image-2",
            prompt=prompt,
            n=1,
            size="1024x1024",
            quality="high"
        )
        
        b64_data = response.data[0].b64_json
        if not b64_data:
            raise Exception("No image data returned from OpenAI API.")
            
        image_bytes = base64.b64decode(b64_data)
        
        storage_client = storage.Client(project=GCP_PROJECT_ID)
        bucket = storage_client.bucket(GCP_BUCKET_NAME)
        
        blob_name = f"scenarios/{character_name}_scenario_{scenario_id}_turn_{turn_no}_choice_{choice_key}.png"
        blob = bucket.blob(blob_name)
        
        print(f" ➔ GCS 업로드: gs://{GCP_BUCKET_NAME}/{blob_name}")
        blob.upload_from_string(image_bytes, content_type="image/png")
        
        public_url = f"https://storage.googleapis.com/{GCP_BUCKET_NAME}/{blob_name}"
        return public_url
    except Exception as e:
        print(f" [ERROR] '{character_name}' 시나리오 {scenario_id} 턴 {turn_no} 선택지 {choice_key} 이미지 생성/GCS 실패: {e}")
        return ""


# --- Main Pipeline Builder ---
def run_main_pipeline(target_char: Optional[str] = None):
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
    
    # 이순신 강제 추가
    special_characters = ["이순신"]
    for name in special_characters:
        if name not in selected_characters and name in person_counts:
            selected_characters.append(name)
            
    selected_characters = sorted(selected_characters)
    
    # 만약 특정 캐릭터만 타겟팅했다면 리스트를 해당 캐릭터로 교체
    if target_char:
        if target_char not in selected_characters:
            print(f"[WARNING] '{target_char}'는 RAG 이야기 수가 60개 미만일 수 있습니다. 강제 생성을 시도합니다.")
            selected_characters = [target_char]
        else:
            selected_characters = [target_char]
            
    print(f"[INFO] 생성 대상 인물 리스트 ({len(selected_characters)}명): {selected_characters}")
    
    # 기존 characters.json 로드 (증분 업데이트용)
    character_database = {}
    if os.path.exists(CHARACTERS_JSON_PATH):
        try:
            with open(CHARACTERS_JSON_PATH, "r", encoding="utf-8") as f:
                character_database = json.load(f)
            print(f"[INFO] 기존에 {len(character_database)}명의 캐릭터 데이터가 로드되었습니다.")
        except Exception as e:
            print(f"[WARNING] 기존 JSON 로드 실패, 새로 생성합니다: {e}")
            
    start_time = time.time()
    
    for idx, char_name in enumerate(selected_characters):
        print(f"\n[{idx+1}/{len(selected_characters)}] '{char_name}' 처리 중...")
        
        # 1. 캐릭터가 DB에 없으면 프로필 & 시나리오 기본 틀을 생성
        db_char = character_database.get(char_name, {})
        associated_stories = get_associated_stories_for_char(df_clean, char_name)
        
        # 텍스트 시나리오 및 프로필 생성 여부 체크
        needs_profile = "mbti" not in db_char or not db_char.get("scenarios")
        if not needs_profile:
            # 기존 시나리오가 새 스키마(예: turn 내에 tip_title 이나 choices 내에 stats 가 있는지)를 충족하는지 체크
            scenarios = db_char.get("scenarios", [])
            if not scenarios:
                needs_profile = True
            else:
                first_scenario = scenarios[0]
                turns = first_scenario.get("turns", [])
                if not turns:
                    needs_profile = True
                else:
                    first_turn = turns[0]
                    # tip_title 또는 title 필드가 없는 경우 새로운 프롬프트 구조로 재생성 유도
                    if "tip_title" not in first_turn or "title" not in first_turn:
                        needs_profile = True
        
        # RAG 단서를 도메인별 ID 리스트로 압축 가공 (Dict[str, List[int]])
        stories_dict = {}
        for s in associated_stories:
            domain = s.get("domain")
            story_id = s.get("id")
            if domain and story_id:
                if domain not in stories_dict:
                    stories_dict[domain] = []
                stories_dict[domain].append(story_id)
        
        if needs_profile:
            print(f" ➔ '{char_name}' 프로필 및 시나리오 텍스트가 부족하거나 구버전 스키마입니다. GPT 생성 진행...")
            retries = 3
            success = False
            for attempt in range(retries):
                try:
                    profile_data = generate_character_profile_via_openai(char_name, associated_stories)
                    scenarios = generate_scenarios_via_openai(char_name, associated_stories)
                    
                    # 새 모델 형태 및 키 순서 정의 (image_url을 years 다음에 배치)
                    ordered_profile = {
                        "name": profile_data.get("name"),
                        "category": profile_data.get("category"),
                        "era": profile_data.get("era"),
                        "era_tag": profile_data.get("era_tag"),
                        "role": profile_data.get("role"),
                        "keywords": profile_data.get("keywords"),
                        "years": profile_data.get("years"),
                        "image_url": db_char.get("image_url", ""),
                        "situation": profile_data.get("situation"),
                        "one_line_summary": profile_data.get("one_line_summary"),
                        "mbti": profile_data.get("mbti"),
                        "mbti_nickname": profile_data.get("mbti_nickname"),
                        "mbti_details": profile_data.get("mbti_details"),
                        "stats": profile_data.get("stats"),
                        "intro_quote": profile_data.get("intro_quote"),
                        "intro_desc": profile_data.get("intro_desc"),
                        "associated_stories": stories_dict,
                        "scenarios": scenarios
                    }
                    
                    # 시나리오 내부에 turn_image 및 choices 내부 choice_image 필드 보장
                    for scenario in ordered_profile["scenarios"]:
                        if "scenario_image_url" in scenario:
                            del scenario["scenario_image_url"]
                        for turn in scenario.get("turns", []):
                            if "turn_image" not in turn:
                                turn["turn_image"] = turn.get("turn_image_url", "")
                            if "turn_image_url" in turn:
                                del turn["turn_image_url"]
                            if "tip_title" not in turn:
                                turn["tip_title"] = ""
                            if "tip_desc" not in turn:
                                turn["tip_desc"] = ""
                            if "title" not in turn:
                                turn["title"] = ""
                                
                            choices = turn.get("choices", {})
                            for choice_key, choice_val in choices.items():
                                if isinstance(choice_val, dict):
                                    if "choice_image" not in choice_val:
                                        choice_val["choice_image"] = choice_val.get("image_url", "")
                                    if "image_url" in choice_val:
                                        del choice_val["image_url"]
                                    if "title" not in choice_val:
                                        choice_val["title"] = choice_val.get("text", "")
                                    if "description" not in choice_val:
                                        choice_val["description"] = ""
                                    if "stats" not in choice_val:
                                        choice_val["stats"] = {}
                                    
                    character_database[char_name] = ordered_profile
                    db_char = character_database[char_name]
                    success = True
                    print(f"  [SUCCESS] '{char_name}' 프로필 및 {len(scenarios)}개 시나리오 텍스트 생성 완료")
                    break
                except Exception as e:
                    print(f"  [WARNING] 시도 {attempt+1} 실패: {e}")
                    time.sleep(5)
            if not success:
                print(f"  [CRITICAL] '{char_name}' 텍스트 파이프라인 최종 실패. 다음 인물로 넘어갑니다.")
                continue
                
            # 중간 저장
            with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(character_database, f, ensure_ascii=False, indent=4)
        else:
            print(f" ➔ '{char_name}' 프로필 및 시나리오 텍스트 이미 존재함. 스킵 및 스키마 포맷 마이그레이션 진행...")
            
            # 마이그레이션: 기존 associated_stories가 list인 경우 dict로 변환
            old_stories = db_char.get("associated_stories", [])
            if isinstance(old_stories, list):
                db_char["associated_stories"] = stories_dict
            
            # 마이그레이션: 시나리오별 불필요한 scenario_image_url 제거 및 turn_image/choice_image 보장
            scenarios = db_char.get("scenarios", [])
            for scenario in scenarios:
                if "scenario_image_url" in scenario:
                    del scenario["scenario_image_url"]
                for turn in scenario.get("turns", []):
                    if "turn_image_url" in turn:
                        turn["turn_image"] = turn["turn_image_url"]
                        del turn["turn_image_url"]
                    if "turn_image" not in turn:
                        turn["turn_image"] = ""
                    if "tip_title" not in turn:
                        turn["tip_title"] = ""
                    if "tip_desc" not in turn:
                        turn["tip_desc"] = ""
                    if "title" not in turn:
                        turn["title"] = ""
                        
                    choices = turn.get("choices", {})
                    for choice_key, choice_val in choices.items():
                        if isinstance(choice_val, dict):
                            if "image_url" in choice_val:
                                choice_val["choice_image"] = choice_val["image_url"]
                                del choice_val["image_url"]
                            if "choice_image" not in choice_val:
                                choice_val["choice_image"] = ""
                            if "title" not in choice_val:
                                choice_val["title"] = choice_val.get("text", "")
                            if "description" not in choice_val:
                                choice_val["description"] = ""
                            if "stats" not in choice_val:
                                choice_val["stats"] = {}
            
            # 키 순서 재배치 (image_url을 years 다음으로)
            ordered_profile = {
                "name": db_char.get("name"),
                "category": db_char.get("category"),
                "era": db_char.get("era"),
                "era_tag": db_char.get("era_tag"),
                "role": db_char.get("role"),
                "keywords": db_char.get("keywords"),
                "years": db_char.get("years"),
                "image_url": db_char.get("image_url", ""),
                "situation": db_char.get("situation"),
                "one_line_summary": db_char.get("one_line_summary"),
                "mbti": db_char.get("mbti"),
                "mbti_nickname": db_char.get("mbti_nickname"),
                "mbti_details": db_char.get("mbti_details"),
                "stats": db_char.get("stats"),
                "intro_quote": db_char.get("intro_quote"),
                "intro_desc": db_char.get("intro_desc"),
                "associated_stories": db_char.get("associated_stories", {}),
                "scenarios": scenarios
            }
            character_database[char_name] = ordered_profile
            db_char = character_database[char_name]
            
            # 즉시 저장
            with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(character_database, f, ensure_ascii=False, indent=4)
            
        # 2. 캐릭터 전신 이미지 생성 (GCS)
        if not db_char.get("image_url") or not db_char["image_url"].startswith("http"):
            print(f" ➔ '{char_name}' 전신 이미지가 없습니다. 생성 중...")
            img_url = generate_and_upload_character_image(char_name)
            if img_url:
                db_char["image_url"] = img_url
                with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(character_database, f, ensure_ascii=False, indent=4)
                print(f"  [SUCCESS] 전신 이미지 업데이트 완료: {img_url}")
                time.sleep(5)
        else:
            print(f" ➔ '{char_name}' 전신 이미지 이미 존재함: {db_char['image_url']}")
            
        # 3. 각 시나리오별 상황(턴) 및 선택지 이미지 생성 (GCS)
        scenarios = db_char.get("scenarios", [])
        for scenario in scenarios:
            s_id = scenario.get("scenario_id")
            s_title = scenario.get("title")
            
            for turn in scenario.get("turns", []):
                t_no = turn.get("turn_no")
                # 이미지 생성을 위한 묘사 텍스트. 상황(turn situation)을 기본으로 사용
                t_situation = turn.get("situation", "")
                t_img = turn.get("turn_image", "")
                
                # 상황(턴) 이미지 생성 (16:9)
                if not t_img or not t_img.startswith("http"):
                    print(f" ➔ 시나리오 {s_id} 턴 {t_no} 상황 이미지가 없습니다. 생성 중...")
                    t_img_url = generate_and_upload_turn_image(char_name, t_situation, s_id, t_no)
                    if t_img_url:
                        turn["turn_image"] = t_img_url
                        with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
                            json.dump(character_database, f, ensure_ascii=False, indent=4)
                        print(f"  [SUCCESS] 시나리오 {s_id} 턴 {t_no} 상황 이미지 업데이트 완료: {t_img_url}")
                        time.sleep(5)
                else:
                    print(f" ➔ 시나리오 {s_id} 턴 {t_no} 상황 이미지 이미 존재함: {t_img}")
                
                # 선택지(A/B) 이미지 생성 (4:3 -> 1:1)
                choices = turn.get("choices", {})
                for choice_key in ["A", "B"]:
                    choice_val = choices.get(choice_key)
                    if not choice_val:
                        continue
                    
                    c_text = choice_val.get("title", "")
                    c_img = choice_val.get("choice_image", "")
                    
                    if not c_img or not c_img.startswith("http"):
                        print(f" ➔ 시나리오 {s_id} 턴 {t_no} 선택지 {choice_key} 이미지가 없습니다. 생성 중...")
                        c_img_url = generate_and_upload_choice_image(char_name, c_text, s_id, t_no, choice_key)
                        if c_img_url:
                            choice_val["choice_image"] = c_img_url
                            with open(CHARACTERS_JSON_PATH, "w", encoding="utf-8") as f:
                                json.dump(character_database, f, ensure_ascii=False, indent=4)
                            print(f"  [SUCCESS] 시나리오 {s_id} 턴 {t_no} 선택지 {choice_key} 이미지 업데이트 완료: {c_img_url}")
                            time.sleep(5)
                    else:
                        print(f" ➔ 시나리오 {s_id} 턴 {t_no} 선택지 {choice_key} 이미지 이미 존재함: {c_img}")
                        
    end_time = time.time()
    print(f"\n[SUCCESS] 데이터 파이프라인 가동 완료. 저장 파일: {CHARACTERS_JSON_PATH}")
    print(f"총 소요 시간: {end_time - start_time:.2f}초")

if __name__ == "__main__":
    target = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--images" else None
    # 만약 --images 대신 --char 등으로 특정 인물을 받으려면 인수 확인
    if len(sys.argv) > 1:
        if sys.argv[1] == "--images" or sys.argv[1] == "--all":
            # 인자가 하나 더 있다면 특정 인물 타겟
            target = sys.argv[2] if len(sys.argv) > 2 else None
            run_main_pipeline(target)
        elif sys.argv[1] == "--profiles":
            print("[INFO] 프로필만 생성 시나리오는 파이프라인 통합에 의해 --all로 처리하시거나 target 지정을 하십시오.")
            target = sys.argv[2] if len(sys.argv) > 2 else None
            run_main_pipeline(target)
    else:
        print("사용법:")
        print("  python data_pipeline.py --all [캐릭터명]     : 프로필, 시나리오 턴 구조 생성, GCS 이미지 빌드 일괄 처리 (특정 캐릭터 지정 가능)")
        print("  python data_pipeline.py --images [캐릭터명]  : 이미지 생성 단계만 누락된 부분 채워 넣기 (특정 캐릭터 지정 가능)")
