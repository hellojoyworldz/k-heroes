import os
import json
import time
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional, Any
import data_manager
from data_manager import get_character_card, get_retrieved_clues, get_story_context, openai_client
from models.character import CharacterCard
from models.simulation import (
    SearchResponse,
    StartRequest,
    GameStateStat,
    GameHistoryItem,
    GameState,
    StartResponse,
    ChoiceDetail,
    TurnRequest,
    TurnResponse,
    EndingRequest,
    EndingResponse,
    SummaryItem,
    RecommendedPlace
)

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

# --- API Endpoints ---
@router.post("/start", response_model=StartResponse)
async def start_simulation(payload: StartRequest):
    character_name = payload.character_name
    story_id = payload.story_id
    story_domain = payload.story_domain
    
    try:
        character_card = get_character_card(character_name)
        
        # 초기 스탯 딕셔너리 생성 (카드에 적힌 고유 수치로 초기화)
        initial_stats = {}
        for i, stat in enumerate(character_card.stats):
            initial_stats[f"stat_{i+1}"] = GameStateStat(name=stat.name, value=stat.value)
            
        initial_state = GameState(
            character_name=character_name,
            story_id=story_id,
            story_domain=story_domain,
            history_score=0,
            current_step=1,
            game_stats=initial_stats,
            game_history=[],
            choices_path=[]
        )
        
        return StartResponse(character_card=character_card, initial_state=initial_state)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"시뮬레이션 시작 실패: {str(e)}")

@router.post("/turn", response_model=TurnResponse)
async def play_turn(payload: TurnRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API Client가 설정되지 않았습니다. (.env에 OPENAI_API_KEY를 확인하세요)")
        
    character_name = payload.character_name
    story_id = payload.story_id
    story_domain = payload.story_domain
    current_step = payload.current_step
    
    main_story_context = get_story_context(story_id, story_domain)
    other_clues = get_retrieved_clues(character_name)
    
    context_str = f"[핵심 역사적 사건 단서]\n{main_story_context}\n\n[기타 인물 행적 배경 단서]\n"
    for i, clue in enumerate(other_clues[:10]):
        context_str += f"- {clue['text']}\n"
        
    # 능력치 포맷팅 (stat_1, stat_2, stat_3에 맵핑된 실제 고유 능력치 이름 사용)
    stats_str = {k: f"{v.name}: {v.value}%" for k, v in payload.game_stats.items()}
    
    # 이전 히스토리 포맷팅
    history_str = [
        f"STEP {item.step}: {item.chosen_text} (역사적 여부: {item.is_historical})"
        for item in payload.game_history
    ]
    
    step_prompt = f"""
너는 역사 선택형 시나리오 게임 'K-Heroes'의 실시간 시나리오 출제자야.
제공된 RAG 역사 단서를 바탕으로, 대상 인물이 마주했던 극적인 역사적 상황과 선택지를 디자인해 줘.

[대상 인물]
이름: {character_name}

[RAG 역사 컨텍스트]
{context_str}

[현재 상태]
- 현재 진행할 단계: STEP {current_step}
- 과거 선택 이력: {history_str}
- 현재 유저 캐릭터 능력치 상태: {stats_str}

[디자인 미션 & 할루시네이션(역사적 사실 왜곡/조작) 절대 금지 지침]
1. 실제 역사적 사실(특히 [핵심 역사적 사건 단서])에 엄격하게 부합하는 역사적 정황(연도, 지명, 주위 인물, 핵심 갈등 상황 등)을 디자인해야 하며, 근거 없는 역사적 사실이나 가공의 사건을 허구로 날조해서는 절대 안 됩니다.
2. 만약 제공된 RAG 역사 단서에 특정 연도나 사건의 명칭이 명시되어 있다면, 그것을 그대로 반영하여 title과 situation을 작성하십시오.
3. 가상 분기(is_historical: false)는 주인공이 당시에 선택할 수 있었던 '개연성 있는 가상의 행동 대안'을 의미하는 것일 뿐, 마주한 역사적 배경 상황(situation)이나 역사 팩트 자체가 허구여서는 안 됩니다. 
4. total_steps: 3단계 고정입니다. (STEP 1, STEP 2, STEP 3로 진행)
5. step_label: "STEP {current_step}" 형태로 채울 것.
6. title: 사건의 핵심 명칭과 괄호 안에 연도를 함께 표기할 것. (예: "상하이 망명 (1931년)" 또는 "무기 선택 (1932년 4월)")
7. toggle_question / toggle_answer:
   - "💡 왜 고향을 떠나 상하이에 왔을까요?" 처럼 질문 형태로 구성하고, 그 아래 답변에 친절하고 상세하며 '역사적 사실에 100% 부합하는' 배경지식을 3줄 내외로 설명해 줄 것.
8. choice_a & choice_b:
   - 두 선택지 중 **반드시 하나는 실제 역사적 사실(is_historical: true)**이고, **다른 하나는 그럴듯한 가상의 분기(is_historical: false)**여야 함.
   - title: 행동 위주의 짧고 임팩트 있는 명사/동사형 제목 (예: "목숨을 걸고 비밀 대원이 된다" / "상하이에서 공장을 차린다")
   - description: 구체적인 행동 설명 1줄.
   - stat_effects: 결과에 따른 능력치 변화치. stat_1, stat_2, stat_3 키 값을 유지하며, 선택 결과에 개연성 있게 10~30 범위 내외의 정수 변동(양수/음수)을 줄 것. (예: 실제 역사는 성공 확률 향상, 가상 분기는 독립 자금 확보 등)

반드시 아래 JSON 형식으로만 응답할 것:
{{
    "current_step": {current_step},
    "total_steps": 3, 
    "step_label": "STEP {current_step}",
    "title": "사건 제목 (연도)",
    "situation": "역사 상황 설명 2~3줄",
    "toggle_question": "토글 질문",
    "toggle_answer": "토글 답변 역사 해설",
    "choice_a": {{
        "is_historical": true,
        "title": "선택지 A 제목",
        "description": "선택지 A 상세 설명",
        "stat_effects": {{ "stat_1": -10, "stat_2": 20, "stat_3": 15 }}
    }},
    "choice_b": {{
        "is_historical": false,
        "title": "선택지 B 제목",
        "description": "선택지 B 상세 설명",
        "stat_effects": {{ "stat_1": 30, "stat_2": -10, "stat_3": -15 }}
    }}
}}
"""
    try:
        max_retries = 3
        step_data = None
        for attempt in range(max_retries):
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "user", "content": step_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                step_data = json.loads(response.choices[0].message.content)
                break
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "rate_limit" in err_msg.lower() or "rate limit" in err_msg.lower() or "RateLimitError" in type(e).__name__:
                    if attempt < max_retries - 1:
                        wait_sec = 25 * (attempt + 1)
                        print(f"\n[WARNING] OpenAI 429 Rate Limit 감지 (play_turn). {wait_sec}초 대기 후 재시도합니다... (시도 {attempt+1}/{max_retries})")
                        time.sleep(wait_sec)
                        continue
                raise e

        if not step_data:
            raise Exception("API 응답 데이터를 수신하지 못했습니다.")
        
        # Choice A, B boolean 파싱 안전 처리
        is_hist_a = step_data.get("choice_a", {}).get("is_historical")
        if isinstance(is_hist_a, str):
            is_hist_a = (is_hist_a.lower() == "true")
        elif not isinstance(is_hist_a, bool):
            is_hist_a = False
            
        is_hist_b = step_data.get("choice_b", {}).get("is_historical")
        if isinstance(is_hist_b, str):
            is_hist_b = (is_hist_b.lower() == "true")
        elif not isinstance(is_hist_b, bool):
            is_hist_b = False
            
        return TurnResponse(
            current_step=current_step,
            total_steps=step_data.get("total_steps", 3),
            step_label=step_data.get("step_label", f"STEP {current_step}"),
            title=step_data.get("title", ""),
            situation=step_data.get("situation", ""),
            toggle_question=step_data.get("toggle_question", ""),
            toggle_answer=step_data.get("toggle_answer", ""),
            choice_a=ChoiceDetail(
                is_historical=is_hist_a,
                title=step_data.get("choice_a", {}).get("title", ""),
                description=step_data.get("choice_a", {}).get("description", ""),
                stat_effects=step_data.get("choice_a", {}).get("stat_effects", {})
            ),
            choice_b=ChoiceDetail(
                is_historical=is_hist_b,
                title=step_data.get("choice_b", {}).get("title", ""),
                description=step_data.get("choice_b", {}).get("description", ""),
                stat_effects=step_data.get("choice_b", {}).get("stat_effects", {})
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI 시나리오 생성 실패: {str(e)}")

@router.post("/ending", response_model=EndingResponse)
async def generate_ending(payload: EndingRequest):
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API Client가 설정되지 않았습니다. (.env에 OPENAI_API_KEY를 확인하세요)")
        
    character_name = payload.character_name
    story_id = payload.story_id
    story_domain = payload.story_domain
    history_score = payload.history_score
    choices_path = payload.choices_path
    
    main_story_context = get_story_context(story_id, story_domain)
    other_clues = get_retrieved_clues(character_name)
    
    context_str = f"[핵심 역사적 사건 단서]\n{main_story_context}\n\n[기타 인물 행적 배경 단서]\n"
    for i, clue in enumerate(other_clues[:10]):
        context_str += f"- {clue['text']}\n"
        
    # 지표 능력치 포맷팅
    stats_str = {v.name: f"{v.value}%" for v in payload.game_stats.values()}
    
    # 히스토리 포맷팅
    history_list = [
        f"STEP {item.step}: {item.chosen_text} (역사적 여부: {item.is_historical})"
        for item in payload.game_history
    ]
    
    ending_prompt = f"""
너는 역사 시뮬레이션 게임 'K-Heroes'의 최종 엔딩 연출가야.
유저가 게임 도중 내린 선택 이력과 최종 능력치 스탯을 토대로 최종 감동적인 엔딩을 작성해 줘.

[대상 인물]
이름: {character_name}

[RAG 역사 컨텍스트]
{context_str}

[유저의 플레이 역사]
- 진행 단계: {len(payload.game_history)}단계까지 플레이함 (역사 점수: {history_score}/100점)
- 유저의 선택 이력: {history_list}
- 최종 지표 능력치: {stats_str}

# 제작 가이드라인 & 할루시네이션(역사 정보 왜곡) 절대 금지 지침
1. 실제 역사적 사실과의 비교 (history_fact):
   - 반드시 제공된 [RAG 역사 컨텍스트]를 철저히 검증하여, 유저가 내린 선택이 실제 역사와 어떤 점이 다르고 어떤 역사적 교훈이 있는지 팩트체크 형식으로 정확하고 거짓 없이 상세히 기술해 주세요. 없는 인물이나 날조된 사건을 언급해서는 절대 안 됩니다.
2. 엔딩 유형 (ending_type):
   - 만약 역사 점수가 100점(조기 성공 포함)인 경우: 실제 역사와 100% 일치하는 찬란한 승리인 "True Ending"으로 설정해 주세요.
   - 역사 점수가 100점 미만인 경우: 유저의 선택에 따른 개연성 있는 가상 시나리오 엔딩인 "Alternative Ending"으로 설정해 주세요.
3. 엔딩 타이틀 (title):
   - 엔딩 주제에 맞는 감동적이고 웅장한 타이틀을 지어주세요.
4. 결과 스토리 및 요약:
   - story_headline: 효과음이나 대사로 시작하는 강렬한 헤드라인 1줄 (따옴표 포함)
   - story_contents: 유저의 선택이 만들어낸 최종 서사 결과 2줄 내외
5. 결과 요약 (summary_items):
   - 이번 시나리오의 핵심 교훈이나 유저의 활약을 3개의 요약 항목 리스트(각각 title과 desc로 구성된 객체)로 작성해 주세요.
6. 추천 방문지 (recommended_places):
   - 대상 인물 {character_name}과(와) 직접적인 연관이 있고, 제공된 [RAG 역사 컨텍스트]에 실재하는 지명 및 주소 정보를 바탕으로 한 실제 유적지, 생가, 기념관, 박물관 등 추천 장소 2곳을 정확하게 매칭하여 작성해 주세요. (가공의 장소나 관련 없는 주소를 날조하여 생성하는 할루시네이션은 절대 불가합니다.)
7. 초등학생 눈높이에 맞게 쉽고 웅장한 히어로물 톤을 유지하세요.

반드시 아래 JSON 형식으로 응답할 것:
{{
    "ending_type": "True Ending" 또는 "Alternative Ending",
    "title": "엔딩 타이틀",
    "history_fact": "실제 역사와 비교 및 교훈 해설",
    "story_headline": "강렬한 헤드라인 1줄 (예: \\"轟-!!! 폭음 뒤에 숨겨진 자유의 외침!\\")",
    "story_contents": "유저 선택 기반의 서사 결과 2줄",
    "summary_items": [
        {{"title": "요약 제목 1", "desc": "요약 설명 1"}},
        {{"title": "요약 제목 2", "desc": "요약 설명 2"}},
        {{"title": "요약 제목 3", "desc": "요약 설명 3"}}
    ],
    "recommended_places": [
        {{"name": "장소 이름 1", "address": "주소 1", "description": "장소 설명 1"}},
        {{"name": "장소 이름 2", "address": "주소 2", "description": "장소 설명 2"}}
    ]
}}
"""
    try:
        max_retries = 3
        ending_result = None
        for attempt in range(max_retries):
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "user", "content": ending_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                ending_result = response.choices[0].message.content
                break
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "rate_limit" in err_msg.lower() or "rate limit" in err_msg.lower() or "RateLimitError" in type(e).__name__:
                    if attempt < max_retries - 1:
                        wait_sec = 25 * (attempt + 1)
                        print(f"\n[WARNING] OpenAI 429 Rate Limit 감지 (generate_ending). {wait_sec}초 대기 후 재시도합니다... (시도 {attempt+1}/{max_retries})")
                        time.sleep(wait_sec)
                        continue
                raise e

        if not ending_result:
            raise Exception("API 응답 데이터를 수신하지 못했습니다.")

        ending_data = json.loads(ending_result)
        ending_type = ending_data.get("ending_type", "Alternative Ending")
        title = ending_data.get("title", "")
        history_fact = ending_data.get("history_fact", "")
        story_headline = ending_data.get("story_headline", "")
        story_contents = ending_data.get("story_contents", "")
        summary_items_raw = ending_data.get("summary_items", [])
        recommended_places_raw = ending_data.get("recommended_places", [])

        summary_items = [
            SummaryItem(title=item.get("title", ""), desc=item.get("desc", ""))
            for item in summary_items_raw
        ]

        recommended_places = [
            RecommendedPlace(
                name=place.get("name", ""),
                address=place.get("address", ""),
                description=place.get("description", "")
            )
            for place in recommended_places_raw
        ]

        # 마크다운 텍스트 합성
        emoji = "🔴" if ending_type == "True Ending" else "🔵"
        stats_formatted = [f"{v.name}: {v.value}%" for v in payload.game_stats.values()]
        stats_joined = ", ".join(stats_formatted)

        ending_markdown = f"""### 3. 최종 결과

#### RESULT. [유저의 선택조합: {'-'.join(choices_path)}]
**[상단 타이틀 및 캐릭터 연출]**
- **엔딩 타이틀:** {emoji} {title} ({ending_type})
- **최종 능력치 결과:** {stats_joined}

**[실제 역사적 사실과 비교]**
- **💡 이 엔딩은 실제 역사와 어떤 차이가 있을까요?**
- {history_fact}

**[결과 스토리 및 요약]**
- **📖 내가 만든 이야기 (Story)**
  - **"{story_headline}"**
  - {story_contents}
- **📌 결과 요약 (Summary)**
"""
        for i, item in enumerate(summary_items):
            ending_markdown += f"  - {i+1}. {item.title}: {item.desc}\n"

        ending_markdown += f"\n#### 추천 방문지\n- 💡 {character_name}을(를) 좀 더 알아보고 싶으세요?\n"
        for place in recommended_places:
            ending_markdown += f"- {place.name} ({place.address}): {place.description}\n"

        ending_markdown += f"""
#### Floating Button
- **공유하기:** "내가 만든 역사 엔딩을 친구에게 공유해보세요! 🔗"
- **다음 인물 체험하기**
"""

        # 파일 저장 경로 설정 및 디렉토리 생성
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        OUTPUT_DIR = os.path.join(BASE_DIR, "data", "scenarios")
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        safe_name = character_name.replace(" ", "").replace("/", "_")
        output_file_name = f"04_{safe_name}_user_interactive_simulation.md"
        output_file_path = os.path.join(OUTPUT_DIR, output_file_name)
        
        # 파일 쓰기
        with open(output_file_path, "w", encoding="utf-8") as f:
            f.write(ending_markdown)
            
        return EndingResponse(
            result_code="-".join(choices_path),
            ending_type=ending_type,
            title=title,
            history_fact=history_fact,
            story_headline=story_headline,
            story_contents=story_contents,
            summary_items=summary_items,
            recommended_places=recommended_places,
            ending_markdown=ending_markdown,
            output_file_path=output_file_path
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI 엔딩 생성 실패: {str(e)}")
